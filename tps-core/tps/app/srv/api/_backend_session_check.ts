/**
 * Session Check API - Verifies if current session is valid
 * Route: /backend/api/session-check
 */

import { g } from "utils/global";

export const _ = {
  url: "/backend/api/session-check",
  raw: true,
  async api(this: { req: Request }) {
    const req = this.req;

    // Get session from cookie
    const cookies = req?.headers?.get("cookie") || "";
    const sidMatch = cookies.match(/sid=([^;]+)/);
    const sessionId = sidMatch ? sidMatch[1] : "";

    if (!sessionId || !g.db) {
      return new Response(JSON.stringify({ valid: false }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const session = await g.db.user_session.findFirst({
        where: { id: sessionId },
        include: {
          user: {
            include: { role: true },
          },
        },
      });

      if (session?.user) {
        return new Response(
          JSON.stringify({
            valid: true,
            user: {
              id: session.user.id,
              username: session.user.username,
              name: session.user.name,
              role: session.user.role.name,
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    } catch (e) {
      console.log("[SESSION CHECK] Error:", e);
    }

    return new Response(JSON.stringify({ valid: false }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
};
