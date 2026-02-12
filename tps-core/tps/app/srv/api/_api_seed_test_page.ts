/**
 * Seed Test Page API - Creates a test page with all section types
 * POST /backend/api/seed-test-page
 * One-time use endpoint for creating comprehensive test content
 */

import { g } from "utils/global";

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
  video: [
    { name: "title", title: "Title", type: "text" },
    { name: "subtitle", title: "Subtitle", type: "text" },
    { name: "video_url", title: "Video URL", type: "text" },
  ],
  cta: [
    { name: "title", title: "Title", type: "text" },
    { name: "description", title: "Description", type: "textarea" },
    { name: "button_text", title: "Button Text", type: "text" },
    { name: "button_url", title: "Button URL", type: "text" },
  ],
  faq: [
    { name: "title", title: "Title", type: "text" },
    { name: "subtitle", title: "Subtitle", type: "text" },
  ],
  cards: [
    { name: "title", title: "Title", type: "text" },
    { name: "subtitle", title: "Subtitle", type: "text" },
  ],
  tabs: [
    { name: "title", title: "Title", type: "text" },
    { name: "subtitle", title: "Subtitle", type: "text" },
  ],
  gallery: [
    { name: "title", title: "Title", type: "text" },
    { name: "subtitle", title: "Subtitle", type: "text" },
  ],
  form: [
    { name: "title", title: "Title", type: "text" },
    { name: "subtitle", title: "Subtitle", type: "text" },
  ],
};

const TEST_CONTENT: Record<string, Record<string, string>> = {
  hero: {
    title: "Selamat Datang di TPS",
    subtitle: "Halaman Test Komponen",
    description: "<p>Ini adalah halaman pengujian semua tipe section yang tersedia di Dynamic Page System. Setiap section di bawah ini menunjukkan kemampuan rendering yang berbeda.</p>",
    cta_text: "Pelajari Lebih Lanjut",
    cta_url: "#content-section",
  },
  content: {
    title: "Tentang Halaman Test Ini",
    content: `<p>Halaman ini dibuat untuk <strong>menguji semua tipe section</strong> yang tersedia di sistem Dynamic Page. Berikut adalah fitur yang diuji:</p>
<ul>
<li><strong>Hero Section</strong> - Banner utama dengan CTA</li>
<li><strong>Content Section</strong> - Konten richtext (yang sedang Anda baca)</li>
<li><strong>Video Embed</strong> - YouTube/Vimeo player</li>
<li><strong>FAQ</strong> - Accordion pertanyaan</li>
<li><strong>CTA</strong> - Call to Action banner</li>
<li><strong>Cards</strong> - Grid kartu informasi</li>
<li><strong>Tabs</strong> - Konten tab panel</li>
<li><strong>Gallery</strong> - Grid gambar dengan lightbox</li>
<li><strong>Contact Form</strong> - Formulir kontak</li>
</ul>
<p>Semua komponen menggunakan <em>inline styles</em> untuk menghindari konflik CSS dengan Prasi renderer.</p>`,
  },
  video: {
    title: "Video Terminal Petikemas Surabaya",
    subtitle: "Profil Perusahaan",
    video_url: "https://www.youtube.com/watch?v=Ske9Nwk-TmA",
  },
  faq: {
    title: "Pertanyaan yang Sering Diajukan",
    subtitle: "FAQ",
  },
  cta: {
    title: "Hubungi Kami Sekarang",
    description: "Butuh informasi lebih lanjut? Tim kami siap membantu Anda 24/7.",
    button_text: "Hubungi CS",
    button_url: "/contact",
  },
  cards: {
    title: "Layanan Kami",
    subtitle: "Services",
  },
  tabs: {
    title: "Informasi Layanan",
    subtitle: "Detail",
  },
  gallery: {
    title: "Galeri Foto",
    subtitle: "Gallery",
  },
  form: {
    title: "Hubungi Kami",
    subtitle: "Kontak",
  },
};

export const _ = {
  url: "/backend/api/seed-test-page",
  raw: true,
  async api(this: { req: Request; _url: URL }) {
    const req = this.req;
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ status: "error", message: "POST only" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check session
    const cookies = req?.headers?.get("cookie") || "";
    const sidMatch = cookies.match(/sid=([^;]+)/);
    const sessionId = sidMatch?.[1] || "";

    if (!sessionId || !g.db) {
      return new Response(JSON.stringify({ status: "error", message: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const session = await g.db.user_session.findFirst({ where: { id: sessionId } });
      if (!session) {
        return new Response(JSON.stringify({ status: "error", message: "Invalid session" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Check if test page already exists
      const existing = await g.db.structure.findFirst({
        where: { url_pattern: "/test-all-sections" },
      });

      if (existing) {
        return new Response(JSON.stringify({
          status: "error",
          message: "Test page already exists at /test-all-sections. Delete it first.",
        }), { headers: { "Content-Type": "application/json" } });
      }

      // Create page structure
      const page = await g.db.structure.create({
        data: {
          path: "test_all_sections",
          title: "Test Semua Section",
          url_pattern: "/test-all-sections",
          status: "published",
          type: "page",
          depth: 0,
          sort_idx: 0,
          meta: {
            seo: {
              title: "Test Semua Section - TPS",
              description: "Halaman pengujian semua tipe section Dynamic Page",
            },
          },
        },
      });

      console.log("[SEED] Created page:", page.id);

      // Create sections in order
      const sectionOrder = ["hero", "content", "video", "faq", "cta", "cards", "tabs", "gallery", "form"];
      let sortIdx = 0;

      for (const sectionType of sectionOrder) {
        const fields = SECTION_FIELDS[sectionType];
        const content = TEST_CONTENT[sectionType];
        if (!fields) continue;

        // Create section structure
        const section = await g.db.structure.create({
          data: {
            path: `test_all_sections.${sectionType}_section`,
            title: `${sectionType.charAt(0).toUpperCase() + sectionType.slice(1)} Section`,
            type: sectionType,
            parent: page.id,
            depth: 1,
            sort_idx: sortIdx++,
          },
        });

        console.log(`[SEED] Created section: ${sectionType} (${section.id})`);

        // Create field structures and content
        let fieldIdx = 0;
        for (const field of fields) {
          const fieldStructure = await g.db.structure.create({
            data: {
              path: `test_all_sections.${sectionType}_section.${field.name}`,
              title: field.title,
              type: field.type,
              parent: section.id,
              depth: 2,
              sort_idx: fieldIdx++,
            },
          });

          // Create content for this field (ID language)
          const value = content?.[field.name] || "";
          if (value) {
            await g.db.content.create({
              data: {
                id_structure: fieldStructure.id,
                lang: "id",
                status: "published",
                text: value,
              },
            });
          }
        }
      }

      // Clear cache
      try {
        await fetch(`http://localhost:${g.port || 3300}/clear-cache/`);
      } catch (e) {}

      return new Response(JSON.stringify({
        status: "ok",
        message: "Test page created successfully!",
        pageId: page.id,
        url: "/test-all-sections",
        adminUrl: `/backend/tpsadmin/pages/edit/${page.id}`,
      }), { headers: { "Content-Type": "application/json" } });

    } catch (e: any) {
      console.error("[SEED] Error:", e);
      return new Response(JSON.stringify({
        status: "error",
        message: e.message || "Server error",
      }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  },
};
