/**
 * API untuk halaman Karir - menggunakan Prasi renderer seperti contact page
 * Route: /karir, /career
 */

import { g } from "utils/global";

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

function renderKarirBody(karir: any, lowongan: any[], lang: string = "id"): string {
  const isEnglish = lang === "en";

  // Bilingual text
  const t = {
    noJobs: isEnglish ? "No positions available" : "Tidak ada lowongan saat ini",
    checkBack: isEnglish ? "Please check back later" : "Silakan cek kembali nanti",
    position: isEnglish ? "Position" : "Posisi",
    requirements: isEnglish ? "Requirements:" : "Persyaratan:",
    deadline: isEnglish ? "Deadline:" : "Batas Waktu:",
    applyNow: isEnglish ? "Apply Now" : "Lamar Sekarang",
    availablePositions: isEnglish ? "Available Positions" : "Lowongan Tersedia",
  };

  const escHtml = (str: string | null | undefined): string => {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  };

  let lowonganHTML = "";
  if (!lowongan || lowongan.length === 0) {
    lowonganHTML = `
      <div style="text-align:center;padding:3rem;background:white;border-radius:0.5rem;">
        <svg style="width:4rem;height:4rem;margin:0 auto 1rem;color:#9ca3af;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
        </svg>
        <p style="color:#6b7280;font-size:1.125rem;font-weight:500;">${t.noJobs}</p>
        <p style="color:#9ca3af;margin-top:0.5rem;font-size:0.875rem;">${t.checkBack}</p>
      </div>
    `;
  } else {
    lowonganHTML = lowongan.map(job => {
      let tags = "";
      if (job.department) tags += `<span style="display:inline-block;padding:0.25rem 0.75rem;background:#dbeafe;color:#1e40af;font-size:0.75rem;border-radius:9999px;font-weight:500;margin-right:0.5rem;">${escHtml(job.department)}</span>`;
      if (job.location) tags += `<span style="display:inline-block;padding:0.25rem 0.75rem;background:#dcfce7;color:#166534;font-size:0.75rem;border-radius:9999px;font-weight:500;margin-right:0.5rem;">${escHtml(job.location)}</span>`;
      if (job.type) tags += `<span style="display:inline-block;padding:0.25rem 0.75rem;background:#ffedd5;color:#9a3412;font-size:0.75rem;border-radius:9999px;font-weight:500;">${escHtml(job.type)}</span>`;

      return `
        <div style="background:white;border-radius:0.5rem;padding:1.5rem;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <h3 style="font-size:1.125rem;font-weight:700;color:#0475BC;margin-bottom:0.5rem;">${escHtml(job.title || t.position)}</h3>
          ${tags ? `<div style="margin-bottom:0.75rem;">${tags}</div>` : ""}
          ${job.description ? `<div style="color:#4b5563;margin-bottom:0.75rem;font-size:0.875rem;line-height:1.5;">${job.description}</div>` : ""}
          ${job.requirements ? `<div style="margin-bottom:0.75rem;"><p style="font-size:0.875rem;font-weight:600;color:#374151;margin-bottom:0.25rem;">${t.requirements}</p><div style="color:#4b5563;font-size:0.875rem;line-height:1.5;">${job.requirements}</div></div>` : ""}
          ${job.deadline ? `<p style="font-size:0.875rem;color:#6b7280;margin-bottom:0.75rem;"><strong>${t.deadline}</strong> ${escHtml(job.deadline)}</p>` : ""}
          <a href="${escHtml(job.apply_url || "mailto:recruitment@tps.co.id")}" style="display:inline-flex;align-items:center;gap:0.5rem;background:#0475BC;color:white;padding:0.5rem 1.25rem;border-radius:9999px;font-weight:600;font-size:0.875rem;text-decoration:none;">${t.applyNow} <svg style="width:1rem;height:1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg></a>
        </div>
      `;
    }).join("");
  }

  return `
    <div style="max-width:1100px;margin:0 auto;padding:2rem 1rem;">
      ${karir?.description ? `<div style="background:white;border-radius:0.5rem;padding:1.5rem;margin-bottom:2rem;"><div style="color:#4b5563;font-size:1rem;line-height:1.75;">${karir.description}</div></div>` : ""}
      <h2 style="font-size:1.5rem;font-weight:700;color:#1f2937;margin-bottom:1.5rem;">${t.availablePositions}</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:1.5rem;">
        ${lowonganHTML}
      </div>
    </div>
  `;
}

function generateHTML(
  bodyContent: any,
  headerContent: any,
  footerContent: any,
  karirBodyHTML: string,
  lang: string = "id"
): string {
  const isEnglish = lang === "en";
  const langPrefix = isEnglish ? "/en" : "";
  const basepath = "/"; // Keep basepath as / to not break static resource loading
  const karirPath = isEnglish ? "/career" : "/karir";
  // Escape karirBodyHTML for safe embedding in script
  const escapedKarirHTML = karirBodyHTML
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');

  return `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport"
    content="width=device-width, initial-scale=1.0, user-scalable=1.0, minimum-scale=1.0, maximum-scale=1.0">
  <link rel="stylesheet" href="/index.css">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600&display=swap');
  </style>
  <link rel="shortcut icon" href=https://tps.co.id/_file/pelindo-ico.ico>
<title>Karir - Terminal Petikemas Surabaya</title>
<meta name="description" content="Bergabunglah dengan PT Terminal Petikemas Surabaya - Temukan karir impian Anda" />
<meta name="og:url" content="https://www.tps.co.id/karir" />
<meta name="og:type" content="website" />
<meta name="og:description" content="Bergabunglah dengan PT Terminal Petikemas Surabaya - Temukan karir impian Anda" />
<meta name="og:image" content="https://www.tps.co.id/_img/layout/header/tps-logo-juara-25.png" />
<meta name="og:image:width" content="124" />
<meta name="og:image:height" content="75" />
<meta name="og:site_name" content="tps" />
<meta name="keywords" content="tps, terminal petikemas surabaya, karir, lowongan kerja" />
<meta name="og:title" content="Karir - Terminal Petikemas Surabaya" />
<script>
  // KARIR PAGE: Store content and set up persistent injection
  console.log('[KARIR] Script initialized');

  // Store karir content globally
  window.__KARIR_CONTENT__ = '${escapedKarirHTML}';
  window.__KARIR_LAST_URL__ = location.pathname;

  function isKarirPage() {
    return location.pathname === '/karir' || location.pathname === '/career' ||
           location.pathname.endsWith('/karir') || location.pathname.endsWith('/career');
  }

  function karirInject() {
    // Only inject on karir page
    if (!isKarirPage()) {
      return false;
    }

    var root = document.getElementById('root');
    if (!root || root.innerHTML.length < 100) return false;

    // Check if already injected (our content has specific marker)
    if (root.innerHTML.indexOf('max-width:1100px') > -1 &&
        (root.innerHTML.indexOf('Lamar Sekarang') > -1 || root.innerHTML.indexOf('Apply Now') > -1)) {
      return true; // Already injected
    }

    // Look for contact template content to replace
    // Markers: Indonesian (tentang karir, lowongan tersedia) or English (about career, available positions)
    var text = root.textContent.toLowerCase();
    var hasSection1 = text.indexOf('tentang karir') > -1 || text.indexOf('kontak kami') > -1 ||
                      text.indexOf('about career') > -1 || text.indexOf('contact us') > -1;
    var hasSection2 = text.indexOf('lowongan tersedia') > -1 || text.indexOf('nomor penting') > -1 ||
                      text.indexOf('available positions') > -1 || text.indexOf('important numbers') > -1;

    if (hasSection1 && hasSection2) {

      console.log('[KARIR] Found contact template, looking for body section...');

      // Find the body section between header and footer
      var allDivs = root.querySelectorAll('div');
      var candidates = [];

      for (var i = 0; i < allDivs.length; i++) {
        var div = allDivs[i];
        var divText = (div.textContent || '').toLowerCase();

        // Find div that contains our markers but is not the whole page (both ID and EN)
        var divHasSection1 = divText.indexOf('tentang karir') > -1 || divText.indexOf('kontak kami') > -1 ||
                             divText.indexOf('about career') > -1 || divText.indexOf('contact us') > -1;
        var divHasSection2 = divText.indexOf('lowongan tersedia') > -1 || divText.indexOf('nomor penting') > -1 ||
                             divText.indexOf('available positions') > -1 || divText.indexOf('important numbers') > -1;

        if (divHasSection1 && divHasSection2) {

          if (div === root) continue;

          var len = (div.innerHTML || '').length;
          // Skip very small or very large (likely wrapper)
          if (len > 500 && len < root.innerHTML.length * 0.8) {
            candidates.push({ el: div, len: len });
          }
        }
      }

      if (candidates.length > 0) {
        // Sort by size, pick smallest appropriate one
        candidates.sort(function(a, b) { return a.len - b.len; });
        var target = candidates[0].el;

        console.log('[KARIR] Replacing content in div, len:', candidates[0].len);
        target.innerHTML = window.__KARIR_CONTENT__;
        target.style.background = '#f3f4f6';
        target.style.padding = '2rem 0';
        console.log('[KARIR] Injection success!');
        return true;
      }
    }

    return false;
  }

  // Persistent observer that watches for URL changes and re-injects
  (function() {
    var lastPath = location.pathname;
    var debounceTimer = null;
    var isInjecting = false;

    // Debounced injection to prevent interference with popups
    function debouncedInject() {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function() {
        if (isKarirPage() && !isInjecting) {
          isInjecting = true;
          karirInject();
          isInjecting = false;
        }
      }, 100);
    }

    // Watch for DOM changes
    if (typeof MutationObserver !== 'undefined') {
      var observer = new MutationObserver(function(mutations) {
        // Skip if popup-related (language selector, etc)
        var isPopupChange = mutations.some(function(m) {
          return m.target && m.target.className &&
                 (m.target.className.indexOf('popup') > -1 ||
                  m.target.className.indexOf('modal') > -1 ||
                  m.target.className.indexOf('dropdown') > -1);
        });
        if (isPopupChange) return;

        // Check if URL changed
        if (location.pathname !== lastPath) {
          lastPath = location.pathname;
          console.log('[KARIR] URL changed to:', lastPath);
        }

        debouncedInject();
      });

      // Start observing when DOM ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
          var root = document.getElementById('root');
          if (root) {
            observer.observe(root, { childList: true, subtree: true });
            console.log('[KARIR] Observer started');
            karirInject();
          }
        });
      } else {
        var root = document.getElementById('root');
        if (root) {
          observer.observe(root, { childList: true, subtree: true });
          console.log('[KARIR] Observer started');
          karirInject();
        }
      }
    }

    // Also poll periodically as backup (less frequent)
    setInterval(function() {
      if (isKarirPage()) {
        karirInject();
      }
    }, 500);
  })();
</script>
</head>

<body class="flex-col flex-1 w-full min-h-screen flex opacity-0">
  <script id="content_script">
  // Detect client-side navigation and force reload
  (function() {
    var realWindow = (typeof globalThis !== 'undefined') ? globalThis : (typeof self !== 'undefined') ? self : null;
    if (realWindow && realWindow.prasiContext && window !== realWindow) {
      realWindow.location.href = '${langPrefix}${karirPath}';
      throw new Error('Redirecting to karir');
    }
  })();
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
  url: "/karir",
  raw: true,
  async api(this: { req: Request; _url: URL }) {
    // Get language from query param (set by create.ts for bilingual routes)
    const lang = this._url?.searchParams?.get("_lang") || "id";

    try {
      const [karir, lowongan, menu, footer, shortcutMenu, header, sosmed] = await Promise.all([
        queryPath("karir", lang),
        queryPath("lowongan", lang),
        queryPath("menu", lang),
        queryPath("footer", lang),
        queryPath("shortcut_menu", lang),
        queryPath("label", lang),
        queryPath("sosmed", lang),
      ]);

      const isEnglish = lang === "en";
      const langPrefix = isEnglish ? "/en" : "";

      // Don't modify menu items - let Prasi handle navigation with language prefixes
      // The init.ts in tps-fw already handles adding language prefix to menu URLs during navigation
      const sortedMenu = menu.sort((a: any, b: any) => (parseInt(a.order) || 99) - (parseInt(b.order) || 99));

      const sortedLowongan = lowongan.sort((a: any, b: any) => (parseInt(a.order) || 99) - (parseInt(b.order) || 99));

      const karirData = karir[0] || {};
      const footerRaw = footer[0] || {};

      // Build attributes from label (same as contact page)
      const attributes: Record<string, string> = {};
      for (const label of header) {
        if (label.name && label.value) {
          attributes[label.name] = label.value;
        }
      }
      // Override labels for karir page (bilingual)
      attributes.contact_us = isEnglish ? "About Career" : "Tentang Karir";
      attributes.important_numbers = isEnglish ? "Available Positions" : "Lowongan Tersedia";

      // Build kontak_kami content (karir description)
      const karirDescription = karirData.description || "<p>PT Terminal Petikemas Surabaya membuka kesempatan bagi profesional yang berdedikasi untuk bergabung dengan tim kami.</p>";

      // Build nomor_penting content (lowongan list as HTML)
      let lowonganHTML = "";
      if (sortedLowongan.length === 0) {
        lowonganHTML = `<div style="text-align:center;padding:2rem;"><p style="color:#6b7280;">Tidak ada lowongan saat ini. Silakan cek kembali nanti.</p></div>`;
      } else {
        lowonganHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1.5rem;">`;
        for (const job of sortedLowongan) {
          const tags = [];
          if (job.department) tags.push(`<span style="display:inline-block;padding:0.25rem 0.75rem;background:#dbeafe;color:#1e40af;font-size:0.75rem;border-radius:9999px;font-weight:500;margin-right:0.5rem;">${job.department}</span>`);
          if (job.location) tags.push(`<span style="display:inline-block;padding:0.25rem 0.75rem;background:#dcfce7;color:#166534;font-size:0.75rem;border-radius:9999px;font-weight:500;margin-right:0.5rem;">${job.location}</span>`);
          if (job.type) tags.push(`<span style="display:inline-block;padding:0.25rem 0.75rem;background:#ffedd5;color:#9a3412;font-size:0.75rem;border-radius:9999px;font-weight:500;">${job.type}</span>`);

          lowonganHTML += `
            <div style="background:white;border-radius:0.5rem;padding:1.5rem;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
              <h3 style="font-size:1.125rem;font-weight:700;color:#0475BC;margin-bottom:0.5rem;">${job.title || "Posisi"}</h3>
              ${tags.length > 0 ? `<div style="margin-bottom:0.75rem;">${tags.join("")}</div>` : ""}
              ${job.description ? `<div style="color:#4b5563;margin-bottom:0.75rem;font-size:0.875rem;line-height:1.5;">${job.description}</div>` : ""}
              ${job.requirements ? `<div style="margin-bottom:0.75rem;"><p style="font-size:0.875rem;font-weight:600;color:#374151;margin-bottom:0.25rem;">Persyaratan:</p><div style="color:#4b5563;font-size:0.875rem;line-height:1.5;">${job.requirements}</div></div>` : ""}
              ${job.deadline ? `<p style="font-size:0.875rem;color:#6b7280;margin-bottom:0.75rem;"><strong>Batas Waktu:</strong> ${job.deadline}</p>` : ""}
              <a href="${job.apply_url || "mailto:recruitment@tps.co.id"}" style="display:inline-flex;align-items:center;gap:0.5rem;background:#0475BC;color:white;padding:0.5rem 1.25rem;border-radius:9999px;font-weight:600;font-size:0.875rem;text-decoration:none;">Lamar Sekarang</a>
            </div>
          `;
        }
        lowonganHTML += `</div>`;
      }

      // Build karir body HTML for injection (full page load)
      const karirBodyHTML = renderKarirBody(karirData, sortedLowongan, lang);

      // Structure kontak_kami as contact template expects (for client-side nav)
      const kontakKamiData = [{
        id: "karir-description",
        order: "1",
        title: karirData.title || "Bergabunglah Bersama Kami",
        name: "PT Terminal Petikemas Surabaya",
        address: karirData.description ? karirData.description.replace(/<[^>]*>/g, '') : "Kami membuka kesempatan bagi profesional yang berdedikasi untuk bergabung dengan tim kami.",
        contact: []
      }];

      // Structure nomor_penting as lowongan list (for client-side nav)
      const nomorPentingData = sortedLowongan.map((job: any, i: number) => ({
        id: job.id || `job-${i}`,
        order: String(i + 1),
        title: job.title || "Posisi Tersedia",
        name: job.department || "",
        address: job.description ? job.description.replace(/<[^>]*>/g, '') : "",
        contact: [
          ...(job.location ? [{ label: "Lokasi", value: job.location, type: "text" }] : []),
          ...(job.type ? [{ label: "Tipe", value: job.type, type: "text" }] : []),
          ...(job.deadline ? [{ label: "Batas Waktu", value: job.deadline, type: "text" }] : []),
          ...(job.apply_url ? [{ label: "Lamar", value: job.apply_url, type: "email" }] : [{ label: "Lamar", value: "mailto:recruitment@tps.co.id", type: "email" }])
        ]
      }));

      // Body content - structured for contact template
      const bodyContent = {
        // Karir data
        karir: [karirData],
        lowongan: sortedLowongan,
        // Store karir HTML for injection on full page load
        __karir_html__: karirBodyHTML,
        // Structured data for contact template (client-side nav)
        kontak_kami: kontakKamiData,
        nomor_penting: nomorPentingData,
        // Attributes dengan label yang sudah dioverride
        attributes,
        // Header content untuk page header
        header_content: {
          title: karirData.title || "Karir",
          banner: karirData.image ? img(karirData.image) : "/_file/layout/header/header-default-bg.png",
          tagline: karirData.subtitle || "Bergabunglah Bersama Kami",
          heading: "Karir",
          sub_heading: "Terminal Petikemas Surabaya",
        },
        // Footer content
        footer_content: {
          banner: "/_img/layout/footer/footer-content.jpeg",
        },
      };

      // Header content (sama dengan contact page)
      // langs: all language options, lang: unique languages by label (for popup)
      const allLangs = [
        { url: "id-id", label: "ID", value: "id", default: !isEnglish },
        { url: "id", label: "ID", value: "id", default: false },
        { url: "en", label: "EN", value: "en", default: isEnglish },
      ];
      // Get unique languages by label (for language popup)
      const uniqueLangs: Record<string, any> = {};
      for (const l of allLangs) {
        if (!uniqueLangs[l.label]) uniqueLangs[l.label] = l;
      }

      const headerContent = {
        logo: "layout/header/tps-logo-juara-25.png",
        menu: sortedMenu,
        shortcut: { menu: shortcutMenu },
        langs: allLangs,
        lang: Object.values(uniqueLangs), // Array of unique languages for popup
      };

      // Footer content (sama dengan contact page)
      const footerContent = {
        sitemap: sortedMenu.filter((item: any) => !item.url?.endsWith("/contact")),
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

      const html = generateHTML(bodyContent, headerContent, footerContent, karirBodyHTML, lang);

      return new Response(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      });
    } catch (e) {
      console.error("Karir page error:", e);
      return new Response("Error loading page", { status: 500 });
    }
  },
};
