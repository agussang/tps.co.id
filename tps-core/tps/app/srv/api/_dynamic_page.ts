/**
 * Dynamic Page Handler
 * Renders pages based on structure.url_pattern from database
 * Uses Prasi renderer for consistent header/footer (like karir page)
 */

import { g } from "utils/global";
import {
  findPageByUrl,
  loadSectionContent,
  renderSection,
  type SectionType,
} from "../utils/page-builder";

type CField = { name: string; type: string | null };
type CItem = {
  lang: string | null;
  status: string | null;
  field: CField;
  text: string | null;
  file: any;
  childs: Record<string, CItem>;
};

async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timeoutId: any;
  const timeoutPromise = new Promise<T>((resolve) => {
    timeoutId = setTimeout(() => resolve(fallback), ms);
  });
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId);
    return result;
  } catch (e) {
    clearTimeout(timeoutId);
    return fallback;
  }
}

async function queryPath(path: string, lang = "id", status = "published"): Promise<any[]> {
  if (!g.db) return [];

  try {
    const rawStructures = await withTimeout(
      g.db.structure.findMany({
        where: {
          OR: [{ path: path }, { path: { startsWith: `${path}.` } }],
        },
        select: { id: true, path: true, type: true },
      }),
      3000,
      []
    );

    if (rawStructures.length === 0) return [];

    const structures: Record<string, CField> = {};
    let rootId = "";
    for (const e of rawStructures) {
      if (e.path === path) rootId = e.id;
      if (e.path) structures[e.id] = { name: e.path, type: e.type };
    }

    if (!rootId) return [];

    const source = await withTimeout(
      g.db.content.findMany({
        where: {
          id_structure: { in: Object.keys(structures) },
        },
        select: {
          id: true,
          lang: true,
          status: true,
          id_structure: true,
          text: true,
          file: true,
          id_parent: true,
        },
      }),
      3000,
      []
    );

    const contents: Record<string, CItem> = {};
    const processed = new Set<string>();

    for (const c of source) {
      if (c.id_structure === rootId) {
        if (lang && c.lang !== lang && c.lang !== "inherited") continue;
        if (status && c.status !== status && c.status !== "inherited") continue;

        contents[c.id] = {
          childs: {},
          field: structures[c.id_structure],
          file: c.file,
          text: c.text,
          lang: c.lang,
          status: c.status,
        };
        processed.add(c.id);
      }
    }

    processContents({ processed, source, contents, structures });
    return flattenPathQuery(contents, path);
  } catch (e) {
    console.error("queryPath error:", e);
    return [];
  }
}

function processContents(arg: {
  processed: Set<string>;
  contents: Record<string, CItem>;
  source: any[];
  structures: Record<string, CField>;
}) {
  const { processed, source, contents, structures } = arg;
  for (const c of source) {
    if (processed.has(c.id) || !c.id_parent || !c.id_structure) continue;
    const parent = contents[c.id_parent];
    if (parent) {
      processed.add(c.id);
      parent.childs[c.id] = {
        childs: {},
        field: structures[c.id_structure],
        file: c.file,
        text: c.text,
        lang: c.lang,
        status: c.status,
      };
      processContents({
        processed,
        source,
        contents: parent.childs,
        structures,
      });
    }
  }
}

function flattenChilds(source: Record<string, CItem>, row: any, parentField: string) {
  for (const [_, item] of Object.entries(source)) {
    const key = item.field.name.substring(parentField.length + 1);
    if (Object.keys(item.childs).length > 0) {
      if (typeof row[key] === "object" && row[key]) {
        if (!Array.isArray(row[key])) {
          const first = row[key];
          const last: any = {};
          flattenChilds(item.childs, last, item.field.name);
          row[key] = [first, last];
        } else {
          const last: any = {};
          flattenChilds(item.childs, last, item.field.name);
          row[key] = [...row[key], last];
        }
        row[key] = row[key].filter((e: any) => e);
      } else {
        const single: any = {};
        row[key] = single;
        flattenChilds(item.childs, single, item.field.name);
      }
    } else {
      row[key] = item.text || item.file?.path;
    }
  }
}

function flattenPathQuery(source: Record<string, CItem>, rootPath: string): any[] {
  const result: any[] = [];
  for (const [k, v] of Object.entries(source)) {
    const row: any = { id: k };
    flattenChilds(v.childs, row, v.field.name);
    if (Object.keys(row).length > 1) {
      row.lang = v.lang;
      row.status = v.status;
      result.push(row);
    }
  }
  return result;
}

function img(path: string): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  if (path.startsWith("/")) return path;
  return `/_img/${path}`;
}

function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function generateHTML(
  bodyContent: any,
  headerContent: any,
  footerContent: any,
  pageBodyHTML: string,
  pageTitle: string,
  pageDescription: string,
  pageUrl: string,
  lang: string = "id"
): string {
  const isEnglish = lang === "en";
  const langPrefix = isEnglish ? "/en" : "";
  const basepath = "/";

  // Encode pageBodyHTML as base64 for safe embedding in script
  // (avoids all escaping issues: single quotes, </script>, special chars, etc.)
  const encodedPageHTML = Buffer.from(pageBodyHTML, 'utf-8').toString('base64');

  return `<!DOCTYPE html>
<html lang="${lang}">

<head>
  <meta charset="UTF-8">
  <meta name="viewport"
    content="width=device-width, initial-scale=1.0, user-scalable=1.0, minimum-scale=1.0, maximum-scale=1.0">
  <link rel="stylesheet" href="/index.css">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600&display=swap');
  </style>
  <link rel="shortcut icon" href="https://tps.co.id/_file/pelindo-ico.ico">
<title>${escapeHtml(pageTitle)} - Terminal Petikemas Surabaya</title>
<meta name="description" content="${escapeHtml(pageDescription)}" />
<meta name="og:url" content="https://www.tps.co.id${pageUrl}" />
<meta name="og:type" content="website" />
<meta name="og:description" content="${escapeHtml(pageDescription)}" />
<meta name="og:image" content="https://www.tps.co.id/_img/layout/header/tps-logo-juara-25.png" />
<meta name="og:image:width" content="124" />
<meta name="og:image:height" content="75" />
<meta name="og:site_name" content="tps" />
<meta name="og:title" content="${escapeHtml(pageTitle)} - Terminal Petikemas Surabaya" />
<script>
  // DYNAMIC PAGE: Store content and set up persistent injection (same approach as karir page)
  console.log('[DYNAMIC_PAGE] Script initialized for ${pageUrl}');

  // Decode base64-encoded page content (safe from escaping issues)
  window.__PAGE_CONTENT__ = decodeURIComponent(escape(atob('${encodedPageHTML}')));
  window.__PAGE_URL__ = '${pageUrl}';

  function isCurrentPage() {
    return location.pathname === '${pageUrl}' || location.pathname === '${langPrefix}${pageUrl}';
  }

  function pageInject() {
    if (!isCurrentPage()) {
      return false;
    }

    var root = document.getElementById('root');
    if (!root || root.innerHTML.length < 100) return false;

    // Check if already injected (our content has specific marker)
    if (root.innerHTML.indexOf('max-width:1100px') > -1 &&
        root.innerHTML.indexOf('__dynamic_page_content__') > -1) {
      return true;
    }

    // Look for contact template content to replace
    // Markers: "kontak kami" / "nomor penting" (Indonesian) or "contact us" / "important numbers" (English)
    var text = root.textContent.toLowerCase();
    var hasSection1 = text.indexOf('kontak kami') > -1 || text.indexOf('contact us') > -1;
    var hasSection2 = text.indexOf('nomor penting') > -1 || text.indexOf('important numbers') > -1;

    if (hasSection1 && hasSection2) {
      console.log('[DYNAMIC_PAGE] Found contact template, looking for body section...');

      // Find the body section between header and footer
      var allDivs = root.querySelectorAll('div');
      var candidates = [];

      for (var i = 0; i < allDivs.length; i++) {
        var div = allDivs[i];
        var divText = (div.textContent || '').toLowerCase();

        // Find div that contains our markers but is not the whole page
        var divHasSection1 = divText.indexOf('kontak kami') > -1 || divText.indexOf('contact us') > -1;
        var divHasSection2 = divText.indexOf('nomor penting') > -1 || divText.indexOf('important numbers') > -1;

        if (divHasSection1 && divHasSection2) {
          if (div === root) continue;

          var len = (div.innerHTML || '').length;
          // Skip very small or very large (likely wrapper)
          if (len > 500 && len < root.innerHTML.length * 0.8) {
            candidates.push({ el: div, len: len });
          }
        }
      }

      // Sort by size (smaller = more specific)
      candidates.sort(function(a, b) { return a.len - b.len; });

      // Use the smallest matching container
      if (candidates.length > 0) {
        var target = candidates[0].el;
        console.log('[DYNAMIC_PAGE] Replacing body section');
        target.innerHTML = '<div class="__dynamic_page_content__">' + window.__PAGE_CONTENT__ + '</div>';

        // Execute embedded scripts (innerHTML doesn't auto-execute <script> tags)
        var scripts = target.querySelectorAll('script');
        for (var s = 0; s < scripts.length; s++) {
          try {
            var newScript = document.createElement('script');
            newScript.textContent = scripts[s].textContent;
            document.body.appendChild(newScript);
          } catch(e) { console.error('[DYNAMIC_PAGE] Script exec error:', e); }
        }

        return true;
      }
    }

    return false;
  }

  // Persistent observer
  (function() {
    var debounceTimer = null;
    var isInjecting = false;

    function debouncedInject() {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function() {
        if (isCurrentPage() && !isInjecting) {
          isInjecting = true;
          pageInject();
          isInjecting = false;
        }
      }, 100);
    }

    if (typeof MutationObserver !== 'undefined') {
      var observer = new MutationObserver(function(mutations) {
        var isPopupChange = mutations.some(function(m) {
          return m.target && m.target.className &&
                 (m.target.className.indexOf('popup') > -1 ||
                  m.target.className.indexOf('modal') > -1 ||
                  m.target.className.indexOf('dropdown') > -1);
        });
        if (isPopupChange) return;
        debouncedInject();
      });

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
          var root = document.getElementById('root');
          if (root) {
            observer.observe(root, { childList: true, subtree: true });
            pageInject();
          }
        });
      } else {
        var root = document.getElementById('root');
        if (root) {
          observer.observe(root, { childList: true, subtree: true });
          pageInject();
        }
      }
    }

    setInterval(function() {
      if (isCurrentPage()) {
        pageInject();
      }
    }, 500);
  })();
</script>
</head>

<body class="flex-col flex-1 w-full min-h-screen flex opacity-0">
  <script id="content_script">
  window.___content = ${JSON.stringify(bodyContent)}
  window.___header = ${JSON.stringify(headerContent)}
  window.___footer = ${JSON.stringify(footerContent)}
/****/</script>
  <div id="root"></div>
  <script>
    window._prasi = {
      basepath: "${basepath}",
      site_id: "tps-standalone",
      page_id: "53512795-1d82-4bbd-9883-b70e884039fe",
    }
  </script>
  <script src="/main.js" type="module"></script>
</body>
</html>`;
}

export const _ = {
  url: "/_page/*",
  raw: true,
  async api(this: { req: Request; _url: URL }) {
    const url = this._url || new URL(this.req?.url || "http://localhost");

    // Extract the actual path (remove /_page prefix)
    let pathname = url.pathname;
    if (pathname.startsWith("/_page")) {
      pathname = pathname.substring(6) || "/";
    }

    // Get language from cookie or query
    let lang = url.searchParams.get("_lang") || "id";
    const cookies = this.req?.headers?.get("cookie") || "";
    const langCookie = cookies.split(";").find((c) => c.trim().startsWith("lang="));
    if (langCookie) {
      lang = langCookie.split("=")[1] || "id";
    }

    const isEnglish = lang === "en";

    try {
      // Find page by URL pattern
      const page = await findPageByUrl(pathname);

      if (!page) {
        return new Response(
          `<!DOCTYPE html>
<html>
<head>
  <title>Not Found</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 flex items-center justify-center min-h-screen">
  <div class="text-center">
    <h1 class="text-4xl font-bold text-gray-800 mb-2">404</h1>
    <p class="text-gray-600 mb-4">Halaman tidak ditemukan</p>
    <a href="/" class="text-blue-600 hover:underline">Kembali ke Beranda</a>
  </div>
</body>
</html>`,
          {
            status: 404,
            headers: { "Content-Type": "text/html; charset=utf-8" },
          }
        );
      }

      // Load shared data (menu, footer, etc.) - same as karir page
      const [menu, footer, shortcutMenu, header, sosmed] = await Promise.all([
        queryPath("menu", lang),
        queryPath("footer", lang),
        queryPath("shortcut_menu", lang),
        queryPath("label", lang),
        queryPath("sosmed", lang),
      ]);

      const sortedMenu = menu.sort((a: any, b: any) =>
        (parseInt(a.order) || 99) - (parseInt(b.order) || 99)
      );

      const footerRaw = footer[0] || {};

      // Build attributes from label
      const attributes: Record<string, string> = {};
      for (const label of header) {
        if (label.name && label.value) {
          attributes[label.name] = label.value;
        }
      }
      // Override labels for dynamic page (needed for contact template markers)
      attributes.contact_us = isEnglish ? "Page Content" : "Kontak Kami";
      attributes.important_numbers = isEnglish ? "More Information" : "Nomor Penting";

      // Get section structures (children of the page structure)
      const sectionStructures = await g.db?.structure.findMany({
        where: { parent: page.id },
        orderBy: { sort_idx: "asc" },
      });

      // Build page body HTML from sections (including hero - we render our own with proper CSS)
      let pageBodyHTML = "";

      if (sectionStructures && sectionStructures.length > 0) {
        for (const section of sectionStructures) {
          const sectionType = section.type as SectionType;

          const sectionData = await loadSectionContent(section.id, lang);

          // Use section title as fallback
          if (!sectionData.title && section.title) {
            sectionData.title = section.title;
          }

          pageBodyHTML += renderSection(sectionType, sectionData);
        }
      }

      // If no content sections, show fallback
      if (!pageBodyHTML.trim()) {
        pageBodyHTML = `
          <div style="max-width:1100px;margin:0 auto;padding:2rem 1rem;">
            <p style="color:#6b7280;text-align:center;">Konten halaman ini sedang dalam pengembangan.</p>
          </div>
        `;
      }

      // Build language options (same structure as karir)
      const allLangs = [
        { url: "id-id", label: "ID", value: "id", default: !isEnglish },
        { url: "id", label: "ID", value: "id", default: false },
        { url: "en", label: "EN", value: "en", default: isEnglish },
      ];
      const uniqueLangs: Record<string, any> = {};
      for (const l of allLangs) {
        if (!uniqueLangs[l.label]) uniqueLangs[l.label] = l;
      }

      // Header content (same structure as karir)
      const headerContent = {
        logo: "layout/header/tps-logo-juara-25.png",
        menu: sortedMenu,
        shortcut: { menu: shortcutMenu },
        langs: allLangs,
        lang: Object.values(uniqueLangs),
      };

      // Footer content (same structure as karir)
      const footerContent = {
        sitemap: sortedMenu,
        copyright: footerRaw.copyright || "Copyright ©2024 PT Terminal Petikemas Surabaya",
        certificate: footerRaw.certificate || [
          { title: "ISPS Code", image: "layout/footer/isps-code.jpg" },
          { title: "TUV Rheinland Certified", image: "layout/footer/tuv-rheinland-certified.jpg" },
        ],
        contactus: {
          title: "Contact Us",
          company: footerRaw.company || [
            { name: "PT Terminal Petikemas Surabaya", address: "Jl. Tanjung Mutiara No. 1, Surabaya 60177 East Java - Indonesia" },
          ],
          phone: footerRaw.phone || [{ value: "031-3202020", label: "Kontak CS" }],
          email: footerRaw.email || [{ label: "Email CS", value: "cs@tps.co.id" }],
        },
      };

      // Body content (for Prasi template)
      // We render our own HeroSection with proper CSS, so Prasi's header_content is minimal
      // This prevents text overflow in Prasi's header banner
      const bodyContent = {
        attributes,
        header_content: {
          title: page.title,
          banner: "/_file/layout/header/header-default-bg.png",
          tagline: "",
          heading: "",
          sub_heading: "",
        },
        footer_content: {
          banner: "/_img/layout/footer/footer-content.jpeg",
        },
        // Kontak template markers (needed for injection to work)
        kontak_kami: [{
          id: "page-content",
          order: "1",
          title: page.title,
          name: "",
          address: "",
          contact: []
        }],
        nomor_penting: [{
          id: "page-info",
          order: "1",
          title: "Info",
          name: "",
          address: "",
          contact: []
        }],
      };

      const html = generateHTML(
        bodyContent,
        headerContent,
        footerContent,
        pageBodyHTML,
        page.seo?.title || page.title,
        page.seo?.description || "",
        pathname,
        lang
      );

      return new Response(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=60",
        },
      });
    } catch (e) {
      console.error("[_dynamic_page] Error:", e);
      return new Response(
        `<!DOCTYPE html>
<html>
<head>
  <title>Error</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 flex items-center justify-center min-h-screen">
  <div class="text-center">
    <h1 class="text-4xl font-bold text-gray-800 mb-2">500</h1>
    <p class="text-gray-600 mb-4">Terjadi kesalahan server</p>
    <a href="/" class="text-blue-600 hover:underline">Kembali ke Beranda</a>
  </div>
</body>
</html>`,
        {
          status: 500,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }
      );
    }
  },
};

/**
 * Standalone function to check if a URL is a dynamic page
 * Called from create.ts before the main handler
 */
export async function serveDynamicPage(
  url: URL,
  req: Request
): Promise<Response | null> {
  if (!g.db) return null;

  const pathname = url.pathname;

  // Skip internal routes
  if (
    pathname.startsWith("/_") ||
    pathname.startsWith("/backend") ||
    pathname.startsWith("/api")
  ) {
    return null;
  }

  try {
    // Check if this URL matches a dynamic page
    const page = await g.db.structure.findFirst({
      where: {
        url_pattern: pathname,
        status: "published",
      },
    });

    if (!page) return null;

    // Found a matching page - redirect to the handler
    const handlerUrl = new URL(url.toString());
    handlerUrl.pathname = `/_page${pathname}`;

    // Get language from cookie
    let lang = "id";
    const cookies = req.headers.get("cookie") || "";
    const langCookie = cookies.split(";").find((c) => c.trim().startsWith("lang="));
    if (langCookie) {
      lang = langCookie.split("=")[1] || "id";
    }
    handlerUrl.searchParams.set("_lang", lang);

    // Call the API handler directly
    const context = { req, _url: handlerUrl };
    return await _.api.call(context);
  } catch (e) {
    console.error("[serveDynamicPage] Error:", e);
    return null;
  }
}
