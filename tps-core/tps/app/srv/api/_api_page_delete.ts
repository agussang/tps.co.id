/**
 * API: Delete Dynamic Page
 * POST /backend/api/page-delete
 */

import { g } from "utils/global";

const getSessionUser = async (sessionId: string) => {
  if (!sessionId || !g.db) return null;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(sessionId)) return null;

  try {
    const session = await g.db.user_session.findFirst({
      where: { id: sessionId },
      select: {
        user: {
          select: { id: true, username: true },
        },
      },
    });
    return session?.user || null;
  } catch (e) {
    return null;
  }
};

export const _ = {
  url: "/backend/api/page-delete",
  raw: true,
  async api(this: { req: Request; _url: URL }) {
    const req = this.req;

    const jsonResponse = (data: any) =>
      new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      });

    // Get session from cookie
    const cookies = req?.headers?.get("cookie") || "";
    const sidMatch = cookies.match(/sid=([^;]+)/);
    const sessionId = sidMatch?.[1] || "";

    const user = await getSessionUser(sessionId);
    if (!user) {
      return jsonResponse({ status: "error", message: "Unauthorized" });
    }

    if (!g.db) {
      return jsonResponse({ status: "error", message: "Database not available" });
    }

    // Parse body
    let body: any = {};
    try {
      body = await req.json();
    } catch (e) {
      return jsonResponse({ status: "error", message: "Invalid JSON body" });
    }

    const { id } = body;

    if (!id) {
      return jsonResponse({ status: "error", message: "Page ID is required" });
    }

    try {
      // Get all child structures (sections and fields)
      const getAllChildren = async (parentId: string): Promise<string[]> => {
        const children = await g.db!.structure.findMany({
          where: { parent: parentId },
          select: { id: true },
        });

        let allIds: string[] = [];
        for (const child of children) {
          allIds.push(child.id);
          const grandChildren = await getAllChildren(child.id);
          allIds = allIds.concat(grandChildren);
        }
        return allIds;
      };

      const childIds = await getAllChildren(id);

      // Delete all content for these structures
      if (childIds.length > 0) {
        await g.db.content.deleteMany({
          where: {
            id_structure: { in: [...childIds, id] },
          },
        });

        // Delete child structures
        await g.db.structure.deleteMany({
          where: {
            id: { in: childIds },
          },
        });
      }

      // Delete the page structure itself
      await g.db.structure.delete({
        where: { id },
      });

      return jsonResponse({ status: "ok" });
    } catch (e: any) {
      console.error("[page-delete] Error:", e);
      return jsonResponse({ status: "error", message: e.message || "Failed to delete page" });
    }
  },
};
