/**
 * Nested Item API
 * Route: /backend/api/nested-item
 *
 * Handles create and delete operations for nested/repeater items
 */

import { g } from "utils/global";

// Use crypto.randomUUID() which is built into Bun/Node
const generateId = (): string => {
  return crypto.randomUUID();
};

interface NestedItemRequest {
  action: "create" | "delete";
  parentId?: string;
  structureId?: string;
  itemId?: string;
}

const getSessionUser = async (sessionId: string) => {
  if (!sessionId || !g.db) return null;

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(sessionId)) return null;

  try {
    const session = await g.db.user_session.findFirst({
      where: { id: sessionId },
      select: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
    return session?.user || null;
  } catch (e) {
    return null;
  }
};

const jsonResponse = (data: any, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
};

export const _ = {
  url: "/backend/api/nested-item",
  raw: true,
  async api(this: { req: Request; _url: URL }) {
    const req = this.req as Request;

    if (req.method !== "POST") {
      return jsonResponse({ status: "error", message: "Method not allowed" }, 405);
    }

    // Validate session
    const cookies = req?.headers?.get("cookie") || "";
    const sidMatch = cookies.match(/sid=([^;]+)/);
    const sessionId = sidMatch ? sidMatch[1] : "";

    const user = await getSessionUser(sessionId);
    if (!user) {
      return jsonResponse({ status: "error", message: "Unauthorized" }, 401);
    }

    if (!g.db) {
      return jsonResponse({ status: "error", message: "Database not available" }, 500);
    }

    try {
      const body: NestedItemRequest = await req.json();
      const { action, parentId, structureId, itemId } = body;

      if (action === "create") {
        if (!parentId || !structureId) {
          return jsonResponse({ status: "error", message: "Missing parentId or structureId" }, 400);
        }

        // Verify parent exists
        const parent = await g.db.content.findFirst({
          where: { id: parentId },
          select: { id: true },
        });

        if (!parent) {
          return jsonResponse({ status: "error", message: "Parent content not found" }, 404);
        }

        // Verify structure exists
        const structure = await g.db.structure.findFirst({
          where: { id: structureId },
          select: { id: true, path: true, title: true },
        });

        if (!structure) {
          return jsonResponse({ status: "error", message: "Structure not found" }, 404);
        }

        // Create the nested item
        const newId = generateId();
        await g.db.content.create({
          data: {
            id: newId,
            id_parent: parentId,
            id_structure: structureId,
            lang: "id",
            status: "inherited",
          },
        });

        // Get child structures for this repeater
        const childStructures = await g.db.structure.findMany({
          where: {
            path: { startsWith: `${structure.path}.` },
            visible: true,
          },
          select: { id: true, path: true, type: true },
          orderBy: { sort_idx: "asc" },
        });

        // Only direct children (one level deep)
        const pathDepth = (structure.path || "").split(".").length;
        const directChildren = childStructures.filter((s) => {
          const sDepth = (s.path || "").split(".").length;
          return sDepth === pathDepth + 1;
        });

        // Create empty child content for each field
        for (const child of directChildren) {
          await g.db.content.create({
            data: {
              id: generateId(),
              id_parent: newId,
              id_structure: child.id,
              lang: "id",
              status: "inherited",
              text: "",
            },
          });
        }

        // Clear cache
        try {
          await fetch(`http://localhost:${g.port || 3300}/clear-cache/`);
        } catch (cacheError) {
          console.warn("Cache clear warning:", cacheError);
        }

        return jsonResponse({ status: "ok", id: newId });
      }

      if (action === "delete") {
        if (!itemId) {
          return jsonResponse({ status: "error", message: "Missing itemId" }, 400);
        }

        // Verify item exists
        const item = await g.db.content.findFirst({
          where: { id: itemId },
          select: { id: true, id_parent: true },
        });

        if (!item) {
          return jsonResponse({ status: "error", message: "Item not found" }, 404);
        }

        // Delete children first (recursive)
        const deleteChildren = async (parentId: string) => {
          const children = await g.db!.content.findMany({
            where: { id_parent: parentId },
            select: { id: true },
          });

          for (const child of children) {
            await deleteChildren(child.id);
            await g.db!.content.delete({
              where: { id: child.id },
            });
          }
        };

        await deleteChildren(itemId);

        // Delete the item itself
        await g.db.content.delete({
          where: { id: itemId },
        });

        // Clear cache
        try {
          await fetch(`http://localhost:${g.port || 3300}/clear-cache/`);
        } catch (cacheError) {
          console.warn("Cache clear warning:", cacheError);
        }

        return jsonResponse({ status: "ok" });
      }

      return jsonResponse({ status: "error", message: "Invalid action" }, 400);
    } catch (e: any) {
      console.error("Nested item API error:", e);
      return jsonResponse({ status: "error", message: e.message || "Internal error" }, 500);
    }
  },
};
