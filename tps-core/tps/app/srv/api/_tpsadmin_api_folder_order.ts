/**
 * API Endpoint: Save Folder Order
 * POST /backend/tpsadmin/api/folder-order
 *
 * Updates the sort_idx of folders for sidebar ordering
 */

import { g } from "utils/global";

interface FolderOrderItem {
  id: string;
  sortIdx: number;
}

interface RequestBody {
  folders: FolderOrderItem[];
}

export const _ = {
  url: "/backend/tpsadmin/api/folder-order",
  raw: true,
  async api(this: { req: Request; _url: URL }) {
    const req = this.req;

    // Only allow POST
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get session from cookie
    const cookies = req.headers.get("cookie") || "";
    const sidMatch = cookies.match(/sid=([^;]+)/);
    const sessionId = sidMatch ? sidMatch[1] : null;

    if (!sessionId || !g.db) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify session
    const session = await g.db.user_session.findFirst({
      where: { id: sessionId },
      include: {
        user: {
          include: { role: true },
        },
      },
    });

    if (!session?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse request body
    let body: RequestBody;
    try {
      body = (await req.json()) as RequestBody;
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!body.folders || !Array.isArray(body.folders)) {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      // Update each folder's sort_idx
      const updates = body.folders.map((folder) =>
        g.db!.structure_folder.update({
          where: { id: folder.id },
          data: { sort_idx: folder.sortIdx },
        })
      );

      await Promise.all(updates);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error updating folder order:", error);
      return new Response(JSON.stringify({ error: "Failed to update order" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
