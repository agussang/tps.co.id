/**
 * Role Delete API
 * Route: POST /backend/api/role-delete
 *
 * Delete role (superadmin only)
 */

import { g } from "utils/global";

interface DeleteRequest {
  id: number | string;
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
  url: "/backend/api/role-delete",
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

    const sessionUser = await getSessionUser(sessionId);
    if (!sessionUser) {
      return new Response(JSON.stringify({ status: "error", message: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check superadmin role
    if (sessionUser.role.name !== "superadmin") {
      return new Response(JSON.stringify({ status: "error", message: "Forbidden - Superadmin only" }), {
        status: 403,
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

      // Parse ID
      const roleId = typeof id === "string" ? parseInt(id) : id;

      if (isNaN(roleId)) {
        return new Response(JSON.stringify({ status: "error", message: "Invalid ID format" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Check if role exists
      const role = await g.db.role.findFirst({
        where: { id: roleId },
        include: {
          _count: { select: { user: true } },
        },
      });

      if (!role) {
        return new Response(JSON.stringify({ status: "error", message: "Role not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Check if role has users
      if (role._count.user > 0) {
        return new Response(JSON.stringify({ status: "error", message: "Cannot delete role with assigned users" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Delete role menus first
      await g.db.role_menu.deleteMany({
        where: { id_role: roleId },
      });

      // Delete role
      await g.db.role.delete({
        where: { id: roleId },
      });

      return new Response(
        JSON.stringify({
          status: "ok",
          message: "Role deleted successfully",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Role delete error:", error);
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
