/**
 * API untuk assign/unassign struktur ke folder
 * Route: /backend/api/structure-assign-folder
 */

import { g } from "utils/global";

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
            role: { select: { id: true, name: true } },
          },
        },
      },
    });
    return session?.user || null;
  } catch (e) {
    return null;
  }
};

export const _ = {
  url: "/backend/api/structure-assign-folder",
  raw: true,
  async api() {
    // @ts-ignore
    const req = this.req as Request;

    try {
      // Get session from cookie
      const cookies = req?.headers?.get("cookie") || "";
      const sidMatch = cookies.match(/sid=([^;]+)/);
      const sessionId = sidMatch ? sidMatch[1] : "";

      const user = await getSessionUser(sessionId);
      if (!user) {
        return new Response(
          JSON.stringify({ status: "error", error: "Unauthorized" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }

      if (!g.db) {
        return new Response(
          JSON.stringify({ status: "error", error: "Database tidak tersedia" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      const body = await req.json();
      const { structureId, folderId } = body;

      if (!structureId) {
        return new Response(
          JSON.stringify({ status: "error", error: "Structure ID harus diisi" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Check if structure exists
      const structure = await g.db.structure.findFirst({
        where: { id: structureId },
      });

      if (!structure) {
        return new Response(
          JSON.stringify({ status: "error", error: "Struktur tidak ditemukan" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      // If folderId provided, validate it exists
      if (folderId) {
        const folder = await g.db.structure_folder.findFirst({
          where: { id: folderId },
        });

        if (!folder) {
          return new Response(
            JSON.stringify({ status: "error", error: "Folder tidak ditemukan" }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }
      }

      // Update structure's folder assignment
      await g.db.structure.update({
        where: { id: structureId },
        data: { id_folder: folderId || null },
      });

      return new Response(
        JSON.stringify({ status: "ok" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error: any) {
      console.error("[STRUCTURE-ASSIGN-FOLDER] Error:", error);
      return new Response(
        JSON.stringify({ status: "error", error: error.message || "Terjadi kesalahan" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
};
