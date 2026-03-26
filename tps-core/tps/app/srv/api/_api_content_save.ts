/**
 * Custom Content Save API
 * Route: POST /backend/api/content-save
 *
 * This API properly updates:
 * 1. Parent content status
 * 2. Child content values (fields)
 * 3. Clears all caches
 */

import { g } from "utils/global";
import { loadRolePermissions, hasPermission } from "../utils/permissions";

interface SaveRequest {
  id: string; // Content ID to update
  status: string; // "draft" | "published"
  entry: Record<string, any>; // Field values
  lang?: string;
}

const getSessionUser = async (sessionId: string) => {
  if (!sessionId || !g.db) return null;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(sessionId)) return null;

  try {
    const session = await g.db.user_session.findFirst({
      where: { id: sessionId },
      select: {
        user: {
          select: { id: true, username: true, role: { select: { id: true, name: true } } },
        },
      },
    });
    return session?.user || null;
  } catch (e) {
    return null;
  }
};

export const _ = {
  url: "/backend/api/content-save",
  raw: true,
  async api(this: { req: Request; _url: URL }) {
    const req = this.req as Request;

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ status: "error", message: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check session authentication
    const cookies = req?.headers?.get("cookie") || "";
    const sidMatch = cookies.match(/sid=([^;]+)/);
    const sessionId = sidMatch?.[1] || "";

    const user = await getSessionUser(sessionId);
    if (!user) {
      return new Response(JSON.stringify({ status: "error", message: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const body: SaveRequest = await req.json();
      const { id, status, entry, lang = "id" } = body;

      if (!id || !g.db) {
        return new Response(JSON.stringify({ status: "error", message: "Invalid request" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Get parent content with structure
      const content = await g.db.content.findFirst({
        where: { id },
        select: {
          id: true,
          status: true,
          id_structure: true,
          structure: { select: { id: true, path: true, title: true } },
        },
      });

      if (!content || !content.structure) {
        return new Response(JSON.stringify({ status: "error", message: "Content not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Check can_edit permission
      const permMap = await loadRolePermissions(user.role.id);
      if (!hasPermission(user.role.name, content.id_structure, "can_edit", permMap)) {
        return new Response(JSON.stringify({ status: "error", message: "Forbidden - no edit permission" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      const structurePath = content.structure.path || "";
      const rootPath = structurePath.split(".")[0];

      // 1. Update parent content status
      await g.db.content.update({
        where: { id },
        data: {
          status: status,
          updated_at: new Date(),
        },
      });

      // 2. Get all child structures (including invisible ones like slug, year, month, day)
      const childStructures = await g.db.structure.findMany({
        where: {
          path: { startsWith: `${structurePath}.` },
        },
        select: { id: true, path: true, type: true },
      });

      // 3. Get existing child content
      const existingChildren = await g.db.content.findMany({
        where: { id_parent: id },
        select: {
          id: true,
          id_structure: true,
          text: true,
          id_file: true,
          structure: { select: { path: true } },
        },
      });

      const existingByStructure: Record<string, any> = {};
      for (const child of existingChildren) {
        if (child.id_structure) {
          existingByStructure[child.id_structure] = child;
        }
      }

      // 4. Update or create child content for each field
      const updates: Promise<any>[] = [];

      for (const struct of childStructures) {
        const fieldName = struct.path?.split(".").pop() || "";
        if (!fieldName || !(fieldName in entry)) continue;

        const newValue = entry[fieldName];
        const existing = existingByStructure[struct.id];

        if (existing) {
          // Update existing child
          if (struct.type === "file") {
            // Handle file field
            let fileId = null;
            if (newValue && typeof newValue === "string") {
              const file = await g.db.file.findFirst({
                where: { path: newValue },
                select: { uuid: true },
              });
              if (file) {
                fileId = file.uuid;
              } else {
                // Create file record
                const newFile = await g.db.file.create({
                  data: { path: newValue, method: "upload" },
                  select: { uuid: true },
                });
                fileId = newFile.uuid;
              }
            }
            if (existing.id_file !== fileId) {
              updates.push(
                g.db.content.update({
                  where: { id: existing.id },
                  data: { id_file: fileId, updated_at: new Date() },
                })
              );
            }
          } else {
            // Update text field
            const textValue = newValue?.toString() || "";
            if (existing.text !== textValue) {
              updates.push(
                g.db.content.update({
                  where: { id: existing.id },
                  data: { text: textValue, updated_at: new Date() },
                })
              );
            }
          }
        } else if (newValue) {
          // Create new child content
          const createData: any = {
            id_parent: id,
            id_structure: struct.id,
            lang: lang,
            status: status,
            created_at: new Date(),
            updated_at: new Date(),
          };

          if (struct.type === "file") {
            if (typeof newValue === "string") {
              const file = await g.db.file.findFirst({
                where: { path: newValue },
                select: { uuid: true },
              });
              if (file) {
                createData.id_file = file.uuid;
              } else {
                const newFile = await g.db.file.create({
                  data: { path: newValue, method: "upload" },
                  select: { uuid: true },
                });
                createData.id_file = newFile.uuid;
              }
            }
          } else {
            createData.text = newValue?.toString() || "";
          }

          updates.push(g.db.content.create({ data: createData }));
        }
      }

      // Auto-generate slug, year, month, day for berita structures
      const beritaPaths = ["press_release", "latest_news"];
      if (beritaPaths.includes(rootPath)) {
        const structByField: Record<string, any> = {};
        for (const struct of childStructures) {
          const fieldName = struct.path?.split(".").pop() || "";
          if (fieldName) structByField[fieldName] = struct;
        }

        const autoFields: Record<string, string> = {};

        // Generate slug from title
        const titleValue = entry.title || existingByStructure[structByField.title?.id]?.text || "";
        if (titleValue && structByField.slug) {
          const slug = titleValue
            .toString()
            .toLowerCase()
            .trim()
            .replace(/[àáâãäå]/g, "a")
            .replace(/[èéêë]/g, "e")
            .replace(/[ìíîï]/g, "i")
            .replace(/[òóôõö]/g, "o")
            .replace(/[ùúûü]/g, "u")
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");
          if (slug) autoFields.slug = slug;
        }

        // Extract year, month, day from publish_date
        const publishDateValue = entry.publish_date || existingByStructure[structByField.publish_date?.id]?.text || "";
        if (publishDateValue) {
          const date = new Date(publishDateValue);
          if (!isNaN(date.getTime())) {
            autoFields.year = date.getFullYear().toString();
            autoFields.month = (date.getMonth() + 1).toString();
            autoFields.day = date.getDate().toString();
          }
        }

        // Save auto-generated fields
        for (const [fieldName, value] of Object.entries(autoFields)) {
          const struct = structByField[fieldName];
          if (!struct) continue;
          const existing = existingByStructure[struct.id];
          if (existing) {
            if (existing.text !== value) {
              updates.push(
                g.db.content.update({
                  where: { id: existing.id },
                  data: { text: value, updated_at: new Date() },
                })
              );
            }
          } else {
            updates.push(
              g.db.content.create({
                data: {
                  id_parent: id,
                  id_structure: struct.id,
                  lang: lang,
                  status: status,
                  text: value,
                  created_at: new Date(),
                  updated_at: new Date(),
                },
              })
            );
          }
        }
      }

      // Execute all updates
      await Promise.all(updates);

      // 5. Auto clear all caches (server-side)
      try {
        // Clear specific path cache
        await fetch(`http://localhost:${g.port || 3300}/clear-cache/${rootPath}`);
        // Clear all cache to ensure consistency
        await fetch(`http://localhost:${g.port || 3300}/clear-cache/`);
      } catch (cacheError) {
        console.warn("Cache clear warning:", cacheError);
      }

      return new Response(
        JSON.stringify({
          status: "ok",
          id: content.id,
          structure: { name: content.structure.title, path: rootPath },
          message: "Content saved successfully",
          cacheCleared: true,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Save error:", error);
      return new Response(
        JSON.stringify({
          status: "error",
          message: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },
};
