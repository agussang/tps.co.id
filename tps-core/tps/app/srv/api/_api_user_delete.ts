/**
 * User Delete API
 * Route: POST /backend/api/user-delete
 *
 * Delete user (superadmin only)
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
  url: "/backend/api/user-delete",
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
      const userId = typeof id === "string" ? parseInt(id) : id;

      if (isNaN(userId)) {
        return new Response(JSON.stringify({ status: "error", message: "Invalid ID format" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Prevent deleting self
      if (userId === sessionUser.id) {
        return new Response(JSON.stringify({ status: "error", message: "Cannot delete your own account" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Check if user exists
      const user = await g.db.user.findFirst({
        where: { id: userId },
      });

      if (!user) {
        return new Response(JSON.stringify({ status: "error", message: "User not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Delete user sessions first
      await g.db.user_session.deleteMany({
        where: { id_user: userId },
      });

      // Delete user
      await g.db.user.delete({
        where: { id: userId },
      });

      return new Response(
        JSON.stringify({
          status: "ok",
          message: "User deleted successfully",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("User delete error:", error);
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
