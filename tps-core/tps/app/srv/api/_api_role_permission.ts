/**
 * Role Permission API - Granular structure-level CRUD permissions
 * Route: GET/POST /backend/api/role-permission
 */

import { g } from "utils/global";

const getSessionUser = async (sessionId: string) => {
  if (!sessionId || !g.db) return null;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(sessionId)) return null;
  try {
    const session = await g.db.user_session.findFirst({
      where: { id: sessionId },
      select: { user: { select: { id: true, role: { select: { name: true } } } } },
    });
    return session?.user || null;
  } catch (e) { return null; }
};

export const _ = {
  url: "/backend/api/role-permission",
  raw: true,
  async api(this: { req: Request; _url: URL }) {
    const req = this.req as Request;
    const url = this._url || new URL(req?.url || "http://localhost");
    const cookies = req?.headers?.get("cookie") || "";
    const sidMatch = cookies.match(/sid=([^;]+)/);
    const sessionId = sidMatch?.[1] || "";

    const sessionUser = await getSessionUser(sessionId);
    if (!sessionUser) {
      return new Response(JSON.stringify({ status: "error", message: "Unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json" },
      });
    }
    if (sessionUser.role.name !== "superadmin") {
      return new Response(JSON.stringify({ status: "error", message: "Forbidden" }), {
        status: 403, headers: { "Content-Type": "application/json" },
      });
    }

    const db = g.db as any;

    if (req.method === "GET") {
      const roleId = parseInt(url.searchParams.get("roleId") || "0");
      if (!roleId) {
        return new Response(JSON.stringify({ status: "error", message: "roleId required" }), {
          status: 400, headers: { "Content-Type": "application/json" },
        });
      }

      const permissions = await db.role_permission.findMany({
        where: { id_role: roleId },
      });

      return new Response(JSON.stringify({ status: "ok", permissions }), {
        status: 200, headers: { "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST") {
      try {
        const body = await req.json();
        const { roleId, permissions } = body;
        // permissions: [{ id_structure: "uuid", can_view, can_add, can_edit, can_delete }]

        if (!roleId || !Array.isArray(permissions)) {
          return new Response(JSON.stringify({ status: "error", message: "roleId and permissions array required" }), {
            status: 400, headers: { "Content-Type": "application/json" },
          });
        }

        // Delete existing + insert new in a transaction
        await db.$transaction(async (tx: any) => {
          await tx.role_permission.deleteMany({ where: { id_role: roleId } });

          for (const p of permissions) {
            if (p.can_view || p.can_add || p.can_edit || p.can_delete) {
              await tx.role_permission.create({
                data: {
                  id_role: roleId,
                  id_structure: p.id_structure,
                  can_view: !!p.can_view,
                  can_add: !!p.can_add,
                  can_edit: !!p.can_edit,
                  can_delete: !!p.can_delete,
                },
              });
            }
          }
        });

        return new Response(JSON.stringify({ status: "ok", message: "Permissions updated" }), {
          status: 200, headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        return new Response(JSON.stringify({ status: "error", message: error instanceof Error ? error.message : "Unknown error" }), {
          status: 500, headers: { "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ status: "error", message: "Method not allowed" }), {
      status: 405, headers: { "Content-Type": "application/json" },
    });
  },
};
