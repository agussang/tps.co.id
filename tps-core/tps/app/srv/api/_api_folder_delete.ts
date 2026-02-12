/**
 * API untuk menghapus folder
 * Route: /backend/api/folder-delete
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
  url: "/backend/api/folder-delete",
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
      const { id } = body;

      if (!id) {
        return new Response(
          JSON.stringify({ status: "error", error: "Folder ID harus diisi" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Check if folder exists
      const folder = await g.db.structure_folder.findFirst({
        where: { id },
      });

      if (!folder) {
        return new Response(
          JSON.stringify({ status: "error", error: "Folder tidak ditemukan" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      // Remove folder reference from structures
      await g.db.structure.updateMany({
        where: { id_folder: id },
        data: { id_folder: null },
      });

      // Move subfolders to root (or parent of deleted folder)
      await g.db.structure_folder.updateMany({
        where: { id_parent: id },
        data: { id_parent: folder.id_parent },
      });

      // Delete the folder
      await g.db.structure_folder.delete({
        where: { id },
      });

      return new Response(
        JSON.stringify({ status: "ok" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error: any) {
      console.error("[FOLDER-DELETE] Error:", error);
      return new Response(
        JSON.stringify({ status: "error", error: error.message || "Terjadi kesalahan" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
};
