/**
 * API untuk menyimpan (create/update) folder
 * Route: /backend/api/folder-save
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
  url: "/backend/api/folder-save",
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
      const { id, name, id_parent } = body;

      if (!name || !name.trim()) {
        return new Response(
          JSON.stringify({ status: "error", error: "Nama folder harus diisi" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Validate id_parent if provided
      if (id_parent) {
        const parentExists = await g.db.structure_folder.findFirst({
          where: { id: id_parent },
        });
        if (!parentExists) {
          return new Response(
            JSON.stringify({ status: "error", error: "Parent folder tidak ditemukan" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        // Prevent circular reference (can't set parent to itself or descendants)
        if (id && id === id_parent) {
          return new Response(
            JSON.stringify({ status: "error", error: "Folder tidak bisa menjadi parent dari dirinya sendiri" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
      }

      let result;

      if (id) {
        // Update existing folder
        result = await g.db.structure_folder.update({
          where: { id },
          data: {
            name: name.trim(),
            id_parent: id_parent || null,
          },
        });
      } else {
        // Get max sort_idx
        const maxSortIdx = await g.db.structure_folder.aggregate({
          _max: { sort_idx: true },
          where: { id_parent: id_parent || null },
        });

        // Create new folder
        result = await g.db.structure_folder.create({
          data: {
            name: name.trim(),
            icon: "",
            sort_idx: (maxSortIdx._max.sort_idx || 0) + 1,
            id_parent: id_parent || null,
          },
        });
      }

      return new Response(
        JSON.stringify({ status: "ok", id: result.id }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error: any) {
      console.error("[FOLDER-SAVE] Error:", error);
      return new Response(
        JSON.stringify({ status: "error", error: error.message || "Terjadi kesalahan" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
};
