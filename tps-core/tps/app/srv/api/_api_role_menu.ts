/**
 * Role Menu API
 * Route: GET/POST /backend/api/role-menu
 *
 * Get or set role menus (folder access) - superadmin only
 */

import { g } from "utils/global";

interface RoleMenuRequest {
  roleId: number | string;
  folders: string[];
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
  url: "/backend/api/role-menu",
  raw: true,
  async api(this: { req: Request; _url: URL }) {
    const req = this.req as Request;
    const url = this._url || new URL(req?.url || "http://localhost");

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

    if (!g.db) {
      return new Response(JSON.stringify({ status: "error", message: "Database not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      if (req.method === "GET") {
        // Get role menus
        const roleIdParam = url.searchParams.get("roleId");
        if (!roleIdParam) {
          return new Response(JSON.stringify({ status: "error", message: "roleId is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const roleId = parseInt(roleIdParam);
        if (isNaN(roleId)) {
          return new Response(JSON.stringify({ status: "error", message: "Invalid roleId" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const menus = await g.db.role_menu.findMany({
          where: { id_role: roleId },
          select: { id_menu: true },
        });

        return new Response(
          JSON.stringify({
            status: "ok",
            menus: menus.map((m) => m.id_menu),
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      } else if (req.method === "POST") {
        // Set role menus
        const body: RoleMenuRequest = await req.json();
        const { roleId, folders } = body;

        if (!roleId) {
          return new Response(JSON.stringify({ status: "error", message: "roleId is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const parsedRoleId = typeof roleId === "string" ? parseInt(roleId) : roleId;
        if (isNaN(parsedRoleId)) {
          return new Response(JSON.stringify({ status: "error", message: "Invalid roleId" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Check if role exists
        const role = await g.db.role.findFirst({
          where: { id: parsedRoleId },
        });

        if (!role) {
          return new Response(JSON.stringify({ status: "error", message: "Role not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Delete existing menus
        await g.db.role_menu.deleteMany({
          where: { id_role: parsedRoleId },
        });

        // Insert new menus
        if (folders && Array.isArray(folders) && folders.length > 0) {
          await g.db.role_menu.createMany({
            data: folders.map((folderId) => ({
              id_role: parsedRoleId,
              id_menu: folderId,
            })),
          });
        }

        return new Response(
          JSON.stringify({
            status: "ok",
            message: "Role menus updated successfully",
            count: folders?.length || 0,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      } else {
        return new Response(JSON.stringify({ status: "error", message: "Method not allowed" }), {
          status: 405,
          headers: { "Content-Type": "application/json" },
        });
      }
    } catch (error) {
      console.error("Role menu error:", error);
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
