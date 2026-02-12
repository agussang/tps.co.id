/**
 * Logout API - Invalidates session on server
 * Route: /backend/api/logout
 */

import { g } from "utils/global";

export const _ = {
  url: "/backend/api/logout",
  raw: true,
  async api(this: { req: Request }) {
    const req = this.req;

    // Get session from cookie
    const cookies = req?.headers?.get("cookie") || "";
    const sidMatch = cookies.match(/sid=([^;]+)/);
    const sessionId = sidMatch ? sidMatch[1] : "";

    if (sessionId && g.db) {
      try {
        // Delete session from database
        await g.db.user_session.delete({
          where: { id: sessionId },
        });
        console.log("[LOGOUT] Session deleted:", sessionId);
      } catch (e) {
        // Session might not exist, ignore error
        console.log("[LOGOUT] Session not found or already deleted");
      }
    }

    // Return success with cookie clearing headers
    return new Response(JSON.stringify({ status: "ok" }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": "sid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax",
      },
    });
  },
};
