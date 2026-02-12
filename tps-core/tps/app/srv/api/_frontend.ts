/**
 * API untuk serve frontend baru (menggunakan Prasi renderer)
 *
 * Route: /new (untuk testing)
 *
 * Ini akan render halaman dengan struktur yang SAMA dengan halaman existing "/"
 * menggunakan Prasi CSS/JS bundles
 */

import { g } from "utils/global";
import { jadwalSandarKapal, jadwalClosingKapal } from "../utils/jadwal-kapal";
import igData from "../data/ig.json";

type CField = { name: string; type: string | null };
type CItem = {
  lang: string | null;
  status: string | null;
  field: CField;
  text: string | null;
  file: any;
  childs: Record<string, CItem>;
};

// Helper: wrap promise with timeout
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

// Query content by path using structure-content relationship
async function queryPath(path: string, lang = "id", status = "published"): Promise<any[]> {
  if (!g.db) return [];

  try {
    // Get all structures for this path with 3 second timeout
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

    // Get all content for these structures with 3 second timeout
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

    // Build content tree
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

    // Process children recursively
    processContents({ processed, source, contents, structures });

    // Flatten to array of objects
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

// Generate HTML menggunakan struktur Prasi (sama dengan halaman existing "/")
function generateHTML(bodyContent: any, headerContent: any, footerContent: any): string {
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
<title>Terminal Petikemas Surabaya</title>
<meta name="description" content="PT Terminal Petikemas Surabaya (TPS) - World Class Performance Terminal Operator" />
<meta name="og:url" content="https://www.tps.co.id/" />
<meta name="og:type" content="website" />
<meta name="og:description" content="PT Terminal Petikemas Surabaya (TPS) - World Class Performance Terminal Operator" />
<meta name="og:image" content="https://www.tps.co.id/_img/layout/header/tps-logo-juara-25.png" />
<meta name="og:image:width" content="124" />
<meta name="og:image:height" content="75" />
<meta name="og:site_name" content="tps" />
<meta name="keywords" content="tps, terminal petikemas surabaya" />
<meta name="og:title" content="Home - Terminal Petikemas Surabaya" />
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
      basepath: "/",
      site_id: "tps-standalone",
      page_id: "46a3cbcd-2764-412d-82ea-994fc4dfe1ae",
    }
  </script>
  <script src="/main.js" type="module"></script>
</body>

</html>`;
}

// Helper functions untuk throughput calculation
function calculateTotalTEUs(data: any[]): number {
  const currentYear = new Date().getFullYear().toString();
  return data
    .filter((d: any) => d.year === currentYear)
    .reduce((sum: number, d: any) => {
      return sum + (parseInt(d.international) || 0) + (parseInt(d.domestics) || 0);
    }, 0);
}

function calculateInternationalTEUs(data: any[]): number {
  const currentYear = new Date().getFullYear().toString();
  return data
    .filter((d: any) => d.year === currentYear)
    .reduce((sum: number, d: any) => sum + (parseInt(d.international) || 0), 0);
}

function calculateDomesticTEUs(data: any[]): number {
  const currentYear = new Date().getFullYear().toString();
  return data
    .filter((d: any) => d.year === currentYear)
    .reduce((sum: number, d: any) => sum + (parseInt(d.domestics) || 0), 0);
}

function formatNumber(num: number): string {
  return num.toLocaleString("id-ID");
}

export const _ = {
  url: "/",
  raw: true,
  async api() {
    try {
      // Fetch semua content yang diperlukan untuk homepage (sama dengan existing)
      let banners: any[] = [];
      let profile: any[] = [];
      let services: any[] = [];
      let annualThroughput: any[] = [];
      let menu: any[] = [];
      let news: any[] = [];
      let footer: any[] = [];
      let shortcutMenu: any[] = [];
      let header: any[] = [];
      let popup: any[] = [];
      let pelanggan: any[] = [];
      let sosmed: any[] = [];

      try {
        [
          banners,
          profile,
          services,
          annualThroughput,
          menu,
          news,
          footer,
          shortcutMenu,
          header,
          popup,
          pelanggan,
          sosmed,
        ] = await Promise.all([
          queryPath("home_banner"),
          queryPath("tentang_kami"),
          queryPath("service"),
          queryPath("annual_throughput"),
          queryPath("menu"),
          queryPath("press_release"),
          queryPath("footer"),
          queryPath("shortcut_menu"),
          queryPath("label"),
          queryPath("popup"),
          queryPath("pelanggan_kami"),
          queryPath("sosmed"),
        ]);
      } catch (e) {
        console.error("Failed to fetch content:", e);
      }

      // Sort by order
      const sortedServices = services.sort((a: any, b: any) => {
        const orderA = parseInt(a.order) || 99;
        const orderB = parseInt(b.order) || 99;
        return orderA - orderB;
      });

      const sortedMenu = menu.sort((a: any, b: any) => {
        const orderA = parseInt(a.order) || 99;
        const orderB = parseInt(b.order) || 99;
        return orderA - orderB;
      });

      // Format throughput sama dengan existing (menggunakan data 2024 karena 2025 belum ada)
      const throughputData = annualThroughput.length > 0 ? [
        {
          icon: "/annualthroughput/o2shi0q7bvuhc3velymk.svg",
          title: `TEUs/2024`,
          value: "1.584.774",
          url: "/throughput"
        },
        {
          icon: "/annualthroughput/b8hr9ba1xgtnbkpy9uip.svg",
          title: `International TEUs/2024`,
          value: "1.508.743",
          url: "/throughput"
        },
        {
          icon: "/annualthroughput/eeuar4iusy84ubstk6a7.svg",
          title: `Domestic TEUs/2024`,
          value: "76.031",
          url: "/throughput"
        }
      ] : [];

      // Format latest_news dengan publish_date yang sudah diformat
      const formattedNews = news.slice(0, 5).map((item: any) => ({
        ...item,
        publish_date: item.publish_date || ""
      }));

      // Build attributes from label (name -> value mapping)
      const attributes: Record<string, string> = {};
      for (const label of header) {
        if (label.name && label.value) {
          attributes[label.name] = label.value;
        }
      }

      // Header content for body (page header info)
      const header_content = {
        title: "",
        banner: "/_file/layout/header/header-default-bg.png",
        tagline: "World class performance",
        heading: "Terminal operator",
        sub_heading: "Terminal Petikemas Surabaya",
      };

      // Fetch jadwal kapal dari WSDL (langsung, tidak dari existing page)
      const [jadwal_sandar_kapal, jadwal_closing_kapal] = await Promise.all([
        jadwalSandarKapal(),
        jadwalClosingKapal(),
      ]);

      // Instagram data dari file lokal
      const ig = igData.data || [];

      // Restructure content untuk body (sama dengan window.___content)
      const bodyContent = {
        attributes,
        header_content,
        popup: popup[0] || null,
        banners: banners,
        profile: profile[0] || null,
        service: sortedServices,
        throughput: throughputData,
        jadwal_sandar_kapal,
        jadwal_closing_kapal,
        latest_news: formattedNews,
        pelanggan: pelanggan,
        sosmed: sosmed,
        ig,
      };

      // Header content (sama dengan window.___header)
      // langs: all language options, lang: unique languages by label (for popup)
      const allLangs = [
        { url: "id-id", label: "ID", value: "id", default: true },
        { url: "id", label: "ID", value: "id", default: false },
        { url: "en", label: "EN", value: "en", default: false },
      ];
      const uniqueLangs: Record<string, any> = {};
      for (const l of allLangs) {
        if (!uniqueLangs[l.label]) uniqueLangs[l.label] = l;
      }

      const headerContent = {
        logo: header[0]?.logo || "layout/header/tps-logo-juara-25.png",
        menu: sortedMenu,
        shortcut: { menu: shortcutMenu },
        langs: allLangs,
        lang: Object.values(uniqueLangs), // Array of unique languages for popup
      };

      // Footer content (sama dengan window.___footer)
      // Footer needs: sitemap, copyright, certificate, contactus
      const footerRaw = footer[0] || {};
      const footerContent = {
        sitemap: sortedMenu.filter((item: any) => item.url !== "/contact"),
        copyright: footerRaw.copyright || "Copyright ©2024 PT Terminal Petikemas Surabaya",
        certificate: footerRaw.certificate || [],
        contactus: {
          title: "Contact Us",
          company: footerRaw.company || [],
          phone: footerRaw.phone || [],
          email: footerRaw.email || [],
        },
      };

      const html = generateHTML(bodyContent, headerContent, footerContent);

      return new Response(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      });
    } catch (e) {
      console.error("API error:", e);
      // Return fallback page with empty content
      const fallbackBody = {
        attributes: {},
        header_content: {
          title: "",
          banner: "/_file/layout/header/header-default-bg.png",
          tagline: "World class performance",
          heading: "Terminal operator",
          sub_heading: "Terminal Petikemas Surabaya",
        },
        popup: null,
        banners: [],
        profile: null,
        service: [],
        throughput: [],
        jadwal_sandar_kapal: [],
        jadwal_closing_kapal: [],
        latest_news: [],
        pelanggan: [],
        sosmed: [],
        ig: [],
      };
      const fallbackLangs = [
        { url: "id-id", label: "ID", value: "id", default: true },
        { url: "id", label: "ID", value: "id", default: false },
        { url: "en", label: "EN", value: "en", default: false },
      ];
      const fallbackHeader = {
        logo: "layout/header/tps-logo-juara-25.png",
        menu: [],
        shortcut: [],
        langs: fallbackLangs,
        lang: [
          { url: "id-id", label: "ID", value: "id", default: true },
          { url: "en", label: "EN", value: "en", default: false },
        ],
      };
      const fallbackFooter = {
        sitemap: [],
        copyright: "Copyright ©2024 PT Terminal Petikemas Surabaya",
        certificate: [],
        contactus: {
          title: "Contact Us",
          company: [],
          phone: [],
          email: [],
        },
      };
      const html = generateHTML(fallbackBody, fallbackHeader, fallbackFooter);
      return new Response(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      });
    }
  },
};


// reload trigger
