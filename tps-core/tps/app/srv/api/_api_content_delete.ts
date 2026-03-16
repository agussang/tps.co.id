/**
 * Content Delete API
 * Route: POST /backend/api/content-delete
 *
 * Deletes content and all its children recursively
 */

import { g } from "utils/global";
import { loadRolePermissions, hasPermission } from "../utils/permissions";

interface DeleteRequest {
  id: string; // Content ID to delete
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

// Recursively delete content and all its children
async function deleteContentRecursive(contentId: string): Promise<number> {
  if (!g.db) return 0;

  let deletedCount = 0;

  // First find all children
  const children = await g.db.content.findMany({
    where: { id_parent: contentId },
    select: { id: true },
  });

  // Recursively delete children
  for (const child of children) {
    deletedCount += await deleteContentRecursive(child.id);
  }

  // Delete the content itself
  await g.db.content.delete({
    where: { id: contentId },
  });
  deletedCount++;

  return deletedCount;
}

export const _ = {
  url: "/backend/api/content-delete",
  raw: true,
  async api(this: { req: Request; _url: URL }) {
    const req = this.req as Request;

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ status: "error", message: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check session
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
      const body: DeleteRequest = await req.json();
      const { id } = body;

      if (!id || !g.db) {
        return new Response(JSON.stringify({ status: "error", message: "Invalid request - ID required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Validate ID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        return new Response(JSON.stringify({ status: "error", message: "Invalid ID format" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Get content with structure info for cache clearing
      const content = await g.db.content.findFirst({
        where: { id },
        select: {
          id: true,
          id_structure: true,
          structure: { select: { id: true, path: true, title: true } },
        },
      });

      if (!content) {
        return new Response(JSON.stringify({ status: "error", message: "Content not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Check can_delete permission
      const permMap = await loadRolePermissions(user.role.id);
      if (!hasPermission(user.role.name, content.id_structure, "can_delete", permMap)) {
        return new Response(JSON.stringify({ status: "error", message: "Forbidden - no delete permission" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      const structurePath = content.structure?.path || "";
      const rootPath = structurePath.split(".")[0];

      // Delete content and all children recursively
      const deletedCount = await deleteContentRecursive(id);

      // Clear cache
      try {
        await fetch(`http://localhost:${g.port || 3300}/clear-cache/${rootPath}`);
        await fetch(`http://localhost:${g.port || 3300}/clear-cache/`);
      } catch (cacheError) {
        console.warn("Cache clear warning:", cacheError);
      }

      return new Response(
        JSON.stringify({
          status: "ok",
          message: `Deleted ${deletedCount} content item(s)`,
          deletedCount,
          structure: { name: content.structure?.title, path: rootPath },
          cacheCleared: true,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Delete error:", error);
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
