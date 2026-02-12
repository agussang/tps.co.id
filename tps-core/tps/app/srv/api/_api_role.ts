/**
 * Role CRUD API
 * Route: POST /backend/api/role
 *
 * Create/Update role (superadmin only)
 */

import { g } from "utils/global";

interface RoleRequest {
  id?: number | string | null;
  name?: string;
  parentId?: number | string | null;
  canPublish?: boolean;
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
  url: "/backend/api/role",
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
      const body: RoleRequest = await req.json();
      const { id, name, parentId, canPublish } = body;

      if (!g.db) {
        return new Response(JSON.stringify({ status: "error", message: "Database not available" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Parse IDs
      const roleId = id ? (typeof id === "string" ? parseInt(id) : id) : null;
      const parsedParentId = parentId ? (typeof parentId === "string" ? parseInt(parentId) : parentId) : null;

      if (roleId) {
        // Update existing role
        const updateData: any = {};

        if (name !== undefined) updateData.name = name;
        if (parentId !== undefined) updateData.id_parent = parsedParentId;
        if (canPublish !== undefined) updateData.can_publish = canPublish;

        // Prevent circular parent reference
        if (parsedParentId === roleId) {
          return new Response(JSON.stringify({ status: "error", message: "Role cannot be its own parent" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        await g.db.role.update({
          where: { id: roleId },
          data: updateData,
        });

        return new Response(
          JSON.stringify({
            status: "ok",
            message: "Role updated successfully",
            id: roleId,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      } else {
        // Create new role
        if (!name) {
          return new Response(JSON.stringify({ status: "error", message: "Role name is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Check if role name already exists
        const existing = await g.db.role.findFirst({
          where: { name },
        });

        if (existing) {
          return new Response(JSON.stringify({ status: "error", message: "Role name already exists" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const newRole = await g.db.role.create({
          data: {
            name,
            id_parent: parsedParentId,
            can_publish: canPublish ?? true,
          },
        });

        return new Response(
          JSON.stringify({
            status: "ok",
            message: "Role created successfully",
            id: newRole.id,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    } catch (error) {
      console.error("Role save error:", error);
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
