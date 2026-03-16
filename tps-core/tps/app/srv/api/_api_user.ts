/**
 * User CRUD API
 * Route: POST /backend/api/user
 *
 * Create/Update user (superadmin only)
 */

import { g } from "utils/global";
import { getPasswordPolicy, validatePassword } from "../utils/password-policy";

interface UserRequest {
  id?: number | string | null;
  username?: string;
  name?: string | null;
  password?: string | null;
  roleId?: number;
  active?: boolean;
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

// Simple password hash (for demo - use bcrypt in production)
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

export const _ = {
  url: "/backend/api/user",
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
      const body: UserRequest = await req.json();
      const { id, username, name, password, roleId, active } = body;

      if (!g.db) {
        return new Response(JSON.stringify({ status: "error", message: "Database not available" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Parse ID
      const userId = id ? (typeof id === "string" ? parseInt(id) : id) : null;

      // Load password policy for validation
      const policy = await getPasswordPolicy();

      if (userId) {
        // Update existing user
        const updateData: any = {};

        if (username !== undefined) updateData.username = username;
        if (name !== undefined) updateData.name = name || null;
        if (roleId !== undefined) updateData.id_role = roleId;
        if (active !== undefined) {
          updateData.active = active;
          if (!active) {
            updateData.deactivated_at = new Date();
          } else {
            updateData.deactivated_at = null;
          }
        }
        if (password) {
          const validation = validatePassword(password, policy);
          if (!validation.valid) {
            return new Response(
              JSON.stringify({ status: "error", message: "Password tidak valid: " + validation.errors.join(", ") }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }
          updateData.password = await hashPassword(password);
          updateData.password_changed_at = new Date();
        }

        await g.db.user.update({
          where: { id: userId },
          data: updateData,
        });

        return new Response(
          JSON.stringify({
            status: "ok",
            message: "User updated successfully",
            id: userId,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      } else {
        // Create new user
        if (!username) {
          return new Response(JSON.stringify({ status: "error", message: "Username is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (!password) {
          return new Response(JSON.stringify({ status: "error", message: "Password is required for new user" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Validate password against policy
        const validation = validatePassword(password, policy);
        if (!validation.valid) {
          return new Response(
            JSON.stringify({ status: "error", message: "Password tidak valid: " + validation.errors.join(", ") }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        // Check if username already exists
        const existing = await g.db.user.findFirst({
          where: { username },
        });

        if (existing) {
          return new Response(JSON.stringify({ status: "error", message: "Username already exists" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const newUser = await g.db.user.create({
          data: {
            username,
            name: name || null,
            password: await hashPassword(password),
            id_role: roleId || 4,
            active: active ?? true,
            created_at: new Date(),
            password_changed_at: new Date(),
          },
        });

        return new Response(
          JSON.stringify({
            status: "ok",
            message: "User created successfully",
            id: newUser.id,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    } catch (error) {
      console.error("User save error:", error);
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
