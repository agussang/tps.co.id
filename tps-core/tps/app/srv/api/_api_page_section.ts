/**
 * API: Manage Page Sections
 * POST /backend/api/page-section
 */

import { g } from "utils/global";
import { randomUUID } from "crypto";

interface SectionTypeConfig {
  fields: Array<{
    name: string;
    title: string;
    type: string;
  }>;
}

// Define default fields for each section type
const SECTION_FIELDS: Record<string, SectionTypeConfig> = {
  hero: {
    fields: [
      { name: "title", title: "Title", type: "text" },
      { name: "subtitle", title: "Subtitle", type: "text" },
      { name: "description", title: "Description", type: "textarea" },
      { name: "image", title: "Background Image", type: "file" },
      { name: "cta_text", title: "Button Text", type: "text" },
      { name: "cta_url", title: "Button URL", type: "text" },
    ],
  },
  content: {
    fields: [
      { name: "title", title: "Title", type: "text" },
      { name: "content", title: "Content", type: "richtext" },
    ],
  },
  gallery: {
    fields: [
      { name: "title", title: "Title", type: "text" },
      { name: "subtitle", title: "Subtitle", type: "text" },
    ],
  },
  cards: {
    fields: [
      { name: "title", title: "Title", type: "text" },
      { name: "subtitle", title: "Subtitle", type: "text" },
    ],
  },
  faq: {
    fields: [
      { name: "title", title: "Title", type: "text" },
      { name: "subtitle", title: "Subtitle", type: "text" },
    ],
  },
  cta: {
    fields: [
      { name: "title", title: "Title", type: "text" },
      { name: "description", title: "Description", type: "textarea" },
      { name: "button_text", title: "Button Text", type: "text" },
      { name: "button_url", title: "Button URL", type: "text" },
    ],
  },
  form: {
    fields: [
      { name: "title", title: "Title", type: "text" },
      { name: "subtitle", title: "Subtitle", type: "text" },
      { name: "submit_text", title: "Submit Button Text", type: "text" },
    ],
  },
  video: {
    fields: [
      { name: "title", title: "Title", type: "text" },
      { name: "subtitle", title: "Subtitle", type: "text" },
      { name: "video_url", title: "Video URL (YouTube/Vimeo)", type: "text" },
      { name: "thumbnail", title: "Thumbnail Image", type: "file" },
    ],
  },
  tabs: {
    fields: [
      { name: "title", title: "Title", type: "text" },
      { name: "subtitle", title: "Subtitle", type: "text" },
    ],
  },
};

const getSessionUser = async (sessionId: string) => {
  if (!sessionId || !g.db) return null;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(sessionId)) return null;

  try {
    const session = await g.db.user_session.findFirst({
      where: { id: sessionId },
      select: {
        user: {
          select: { id: true, username: true },
        },
      },
    });
    return session?.user || null;
  } catch (e) {
    return null;
  }
};

export const _ = {
  url: "/backend/api/page-section",
  raw: true,
  async api(this: { req: Request; _url: URL }) {
    const req = this.req;

    const jsonResponse = (data: any) =>
      new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      });

    // Get session from cookie
    const cookies = req?.headers?.get("cookie") || "";
    const sidMatch = cookies.match(/sid=([^;]+)/);
    const sessionId = sidMatch?.[1] || "";

    const user = await getSessionUser(sessionId);
    if (!user) {
      return jsonResponse({ status: "error", message: "Unauthorized" });
    }

    if (!g.db) {
      return jsonResponse({ status: "error", message: "Database not available" });
    }

    // Parse body
    let body: any = {};
    try {
      body = await req.json();
    } catch (e) {
      return jsonResponse({ status: "error", message: "Invalid JSON body" });
    }

    const { action, pageId, sectionId, type, title, order } = body;

    try {
      switch (action) {
        case "add": {
          if (!pageId || !type || !title) {
            return jsonResponse({ status: "error", message: "pageId, type, and title are required" });
          }

          // Get page structure
          const page = await g.db.structure.findFirst({
            where: { id: pageId },
          });

          if (!page) {
            return jsonResponse({ status: "error", message: "Page not found" });
          }

          // Get existing sections count for sort order
          const existingSections = await g.db.structure.count({
            where: { parent: pageId },
          });

          // Create section structure
          const newSectionId = randomUUID();
          const sectionPath = `${page.path}.${title.toLowerCase().replace(/\s+/g, "_")}`;

          await g.db.structure.create({
            data: {
              id: newSectionId,
              path: sectionPath,
              title,
              type,
              parent: pageId,
              depth: 1,
              sort_idx: existingSections,
              visible: true,
              translate: true,
              status: "published",
            },
          });

          // Create field structures based on section type
          const config = SECTION_FIELDS[type] || { fields: [] };

          for (let i = 0; i < config.fields.length; i++) {
            const field = config.fields[i];
            const fieldId = randomUUID();
            const fieldPath = `${sectionPath}.${field.name}`;

            await g.db.structure.create({
              data: {
                id: fieldId,
                path: fieldPath,
                title: field.title,
                type: field.type,
                parent: newSectionId,
                depth: 2,
                sort_idx: i,
                visible: true,
                translate: true,
                status: "published",
              },
            });
          }

          return jsonResponse({ status: "ok", sectionId: newSectionId });
        }

        case "delete": {
          if (!sectionId) {
            return jsonResponse({ status: "error", message: "sectionId is required" });
          }

          // Delete all child structures (fields)
          await g.db.structure.deleteMany({
            where: { parent: sectionId },
          });

          // Delete section
          await g.db.structure.delete({
            where: { id: sectionId },
          });

          return jsonResponse({ status: "ok" });
        }

        case "reorder": {
          if (!order || !Array.isArray(order)) {
            return jsonResponse({ status: "error", message: "order array is required" });
          }

          for (let i = 0; i < order.length; i++) {
            await g.db.structure.update({
              where: { id: order[i] },
              data: { sort_idx: i },
            });
          }

          return jsonResponse({ status: "ok" });
        }

        default:
          return jsonResponse({ status: "error", message: "Invalid action" });
      }
    } catch (e: any) {
      console.error("[page-section] Error:", e);
      return jsonResponse({ status: "error", message: e.message || "Failed to manage section" });
    }
  },
};
