/**
 * Security Settings Save API
 * Route: POST /backend/api/settings
 */

import { g } from "utils/global";

const ALLOWED_KEYS = [
  "password_min_length",
  "password_require_uppercase",
  "password_require_lowercase",
  "password_require_number",
  "password_require_special",
  "password_expiry_days",
  "auto_deactivate_days",
];

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
  } catch (e) {
    return null;
  }
};

export const _ = {
  url: "/backend/api/settings",
  raw: true,
  async api(this: { req: Request; _url: URL }) {
    const req = this.req as Request;

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ status: "error", message: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    const cookies = req?.headers?.get("cookie") || "";
    const sidMatch = cookies.match(/sid=([^;]+)/);
    const sessionId = sidMatch?.[1] || "";

    const user = await getSessionUser(sessionId);
    if (!user) {
      return new Response(JSON.stringify({ status: "error", message: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (user.role.name !== "superadmin") {
      return new Response(JSON.stringify({ status: "error", message: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const body = await req.json();
      let updated = 0;

      for (const key of ALLOWED_KEYS) {
        if (body[key] !== undefined) {
          await (g.db as any).$executeRawUnsafe(
            `INSERT INTO site_settings (key, value, updated_at) VALUES ($1, $2, NOW())
             ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
            key,
            String(body[key])
          );
          updated++;
        }
      }

      return new Response(
        JSON.stringify({ status: "ok", message: `${updated} setting(s) updated` }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Settings save error:", error);
      return new Response(
        JSON.stringify({ status: "error", message: error instanceof Error ? error.message : "Unknown error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
};
