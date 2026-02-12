/**
 * API: Save Dynamic Page
 * POST /backend/api/page-save
 */

import { g } from "utils/global";
import { randomUUID } from "crypto";

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
  url: "/backend/api/page-save",
  raw: true,
  async api(this: { req: Request; _url: URL }) {
    const req = this.req;

    // Get session from cookie
    const cookies = req?.headers?.get("cookie") || "";
    const sidMatch = cookies.match(/sid=([^;]+)/);
    const sessionId = sidMatch?.[1] || "";

    const user = await getSessionUser(sessionId);
    if (!user) {
      return new Response(JSON.stringify({ status: "error", message: "Unauthorized" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!g.db) {
      return new Response(JSON.stringify({ status: "error", message: "Database not available" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse body
    let body: any = {};
    try {
      body = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ status: "error", message: "Invalid JSON body" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id, title, url_pattern, status = "draft", pendingSections } = body;
    // Generate path from title if not provided
    const path = body.path || title?.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "";

    // Define default fields for each section type
    const SECTION_FIELDS: Record<string, Array<{ name: string; title: string; type: string }>> = {
      hero: [
        { name: "title", title: "Title", type: "text" },
        { name: "subtitle", title: "Subtitle", type: "text" },
        { name: "description", title: "Description", type: "richtext" },
        { name: "image", title: "Background Image", type: "file" },
        { name: "cta_text", title: "Button Text", type: "text" },
        { name: "cta_url", title: "Button URL", type: "text" },
      ],
      content: [
        { name: "title", title: "Title", type: "text" },
        { name: "content", title: "Content", type: "richtext" },
      ],
      gallery: [
        { name: "title", title: "Title", type: "text" },
        { name: "subtitle", title: "Subtitle", type: "text" },
      ],
      cards: [
        { name: "title", title: "Title", type: "text" },
        { name: "subtitle", title: "Subtitle", type: "text" },
      ],
      faq: [
        { name: "title", title: "Title", type: "text" },
        { name: "subtitle", title: "Subtitle", type: "text" },
      ],
      cta: [
        { name: "title", title: "Title", type: "text" },
        { name: "description", title: "Description", type: "textarea" },
        { name: "button_text", title: "Button Text", type: "text" },
        { name: "button_url", title: "Button URL", type: "text" },
      ],
      form: [
        { name: "title", title: "Title", type: "text" },
        { name: "subtitle", title: "Subtitle", type: "text" },
        { name: "submit_text", title: "Submit Button Text", type: "text" },
      ],
      video: [
        { name: "title", title: "Title", type: "text" },
        { name: "subtitle", title: "Subtitle", type: "text" },
        { name: "video_url", title: "Video URL (YouTube/Vimeo)", type: "text" },
        { name: "thumbnail", title: "Thumbnail Image", type: "file" },
      ],
      tabs: [
        { name: "title", title: "Title", type: "text" },
        { name: "subtitle", title: "Subtitle", type: "text" },
      ],
    };

    const jsonResponse = (data: any) =>
      new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      });

    if (!title || !url_pattern) {
      return jsonResponse({ status: "error", message: "Title and url_pattern are required" });
    }

    // Validate URL pattern format
    if (!url_pattern.startsWith("/")) {
      return jsonResponse({ status: "error", message: "URL pattern must start with /" });
    }

    try {
      // Build meta with SEO
      const meta = {
        seo: {
          title: body.seo_title || "",
          description: body.seo_description || "",
          keywords: body.seo_keywords || "",
        },
      };

      if (id) {
        // Update existing page
        await g.db.structure.update({
          where: { id },
          data: {
            title,
            url_pattern,
            status,
            meta,
            updated_at: new Date(),
          },
        });

        // Update field content values
        const fieldKeys = Object.keys(body).filter((k) => k.startsWith("field-"));
        for (const key of fieldKeys) {
          // Format: field-{uuid}-{lang} where uuid contains dashes
          // So we need to extract properly: lang is last segment, fieldId is middle
          const withoutPrefix = key.substring(6); // Remove "field-"
          const lastDashIndex = withoutPrefix.lastIndexOf("-");
          if (lastDashIndex === -1) continue;

          const fieldId = withoutPrefix.substring(0, lastDashIndex);
          const lang = withoutPrefix.substring(lastDashIndex + 1);
          let value = body[key];

          // Validate fieldId is a UUID
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (!uuidRegex.test(fieldId)) continue;

          // Ensure value is a string (not object)
          if (value === null || value === undefined) {
            value = "";
          } else if (typeof value === "object") {
            // Skip objects or convert to empty string
            value = "";
          } else {
            value = String(value);
          }

          // Check if content exists
          const existing = await g.db.content.findFirst({
            where: {
              id_structure: fieldId,
              lang,
            },
          });

          if (existing) {
            await g.db.content.update({
              where: { id: existing.id },
              data: {
                text: value,
                updated_at: new Date(),
              },
            });
          } else {
            await g.db.content.create({
              data: {
                id: randomUUID(),
                id_structure: fieldId,
                lang,
                status: "published",
                text: value,
              },
            });
          }
        }

        return jsonResponse({ status: "ok", id, pageId: id });
      } else {
        // Create new page
        const newId = randomUUID();

        // Check if path already exists
        const existing = await g.db.structure.findFirst({
          where: { path },
        });

        if (existing) {
          return jsonResponse({ status: "error", message: "Path already exists" });
        }

        // Check if url_pattern already exists
        const existingUrl = await g.db.structure.findFirst({
          where: { url_pattern },
        });

        if (existingUrl) {
          return jsonResponse({ status: "error", message: "URL pattern already exists" });
        }

        await g.db.structure.create({
          data: {
            id: newId,
            path,
            title,
            url_pattern,
            status,
            type: "page",
            meta,
            visible: true,
            translate: true,
            depth: 0,
            sort_idx: 0,
          },
        });

        // Create pending sections if any
        if (pendingSections && Array.isArray(pendingSections) && pendingSections.length > 0) {
          for (let i = 0; i < pendingSections.length; i++) {
            const section = pendingSections[i];
            const sectionId = randomUUID();
            const sectionPath = `${path}.${section.title.toLowerCase().replace(/\s+/g, "_")}`;

            // Create section structure
            await g.db.structure.create({
              data: {
                id: sectionId,
                path: sectionPath,
                title: section.title,
                type: section.type,
                parent: newId,
                depth: 1,
                sort_idx: i,
                visible: true,
                translate: true,
                status: "published",
              },
            });

            // Create field structures based on section type
            const fields = SECTION_FIELDS[section.type] || [];

            for (let j = 0; j < fields.length; j++) {
              const field = fields[j];
              const fieldId = randomUUID();
              const fieldPath = `${sectionPath}.${field.name}`;

              await g.db.structure.create({
                data: {
                  id: fieldId,
                  path: fieldPath,
                  title: field.title,
                  type: field.type,
                  parent: sectionId,
                  depth: 2,
                  sort_idx: j,
                  visible: true,
                  translate: true,
                  status: "published",
                },
              });
            }
          }
        }

        return jsonResponse({ status: "ok", id: newId, pageId: newId });
      }
    } catch (e: any) {
      console.error("[page-save] Error:", e);
      return jsonResponse({ status: "error", message: e.message || "Failed to save page" });
    }
  },
};
