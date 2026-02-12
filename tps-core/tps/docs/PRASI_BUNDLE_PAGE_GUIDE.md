# Panduan Membuat Page dengan Model Prasi Bundle

Panduan ini menjelaskan cara membuat halaman baru yang terintegrasi dengan Prasi CMS renderer sambil tetap memiliki kontrol penuh atas konten body.

## Konsep Dasar

Sistem ini menggunakan pendekatan hybrid:
1. **Header & Footer**: Dirender oleh Prasi menggunakan template page yang sudah ada (misal: contact page)
2. **Body Content**: Dirender secara custom menggunakan JavaScript injection

## Struktur File

```
tps-core/tps/
├── app/
│   ├── db/prisma/schema.prisma  # Database models
│   └── srv/api/
│       └── _namapage.ts          # API endpoint untuk halaman
```

## Langkah-langkah Pembuatan

### 1. Buat Database Models (Opsional)

Jika halaman membutuhkan data dari database, tambahkan model di `schema.prisma`:

```prisma
model nama_content {
  id          String   @id @default(cuid())
  title       String?
  description String?  @db.Text
  image       String?
  // field lainnya sesuai kebutuhan

  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
}
```

Jalankan: `bunx prisma db push`

### 2. Buat API Endpoint

Buat file `app/srv/api/_namapage.ts`:

```typescript
/**
 * API untuk halaman [NamaPage]
 * Route: /namapage
 */

import { g } from "utils/global";

// Type definitions
type CField = { name: string; type: string | null };
type CItem = {
  lang: string | null;
  status: string | null;
  field: CField;
  text: string | null;
  file: any;
  childs: Record<string, CItem>;
};

// Helper: Query with timeout
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

// Query content by path
async function queryPath(path: string, lang = "id", status = "published"): Promise<any[]> {
  // ... (copy dari _karir.ts atau _frontend.ts)
}

// Helper functions
function processContents(arg: {...}) { /* ... */ }
function flattenChilds(source: Record<string, CItem>, row: any, parentField: string) { /* ... */ }
function flattenPathQuery(source: Record<string, CItem>, rootPath: string): any[] { /* ... */ }

function img(path: string): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  if (path.startsWith("/")) return path;
  return `/_img/${path}`;
}

// =============================================
// CUSTOM BODY RENDERER
// =============================================
function renderBody(data: any): string {
  // Render body content sebagai HTML string
  return `
    <div style="max-width:1100px;margin:0 auto;padding:2rem 1rem;">
      <h1>${data.title || 'Judul'}</h1>
      <div>${data.description || ''}</div>
      <!-- Konten lainnya -->
    </div>
  `;
}

// =============================================
// HTML GENERATOR
// =============================================
function generateHTML(
  bodyContent: any,
  headerContent: any,
  footerContent: any,
  customBodyHTML: string
): string {
  // Escape HTML untuk embedding di JavaScript
  const escapedBodyHTML = customBodyHTML
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="/index.css">
  <title>${bodyContent.header_content?.title || 'Page'} - Terminal Petikemas Surabaya</title>

  <!-- INJECTION SCRIPT -->
  <script>
    console.log('[NAMAPAGE] Script initialized');

    window.__CUSTOM_CONTENT__ = '${escapedBodyHTML}';

    function isThisPage() {
      return location.pathname === '/namapage' || location.pathname.endsWith('/namapage');
    }

    function injectContent() {
      if (!isThisPage()) return false;

      var root = document.getElementById('root');
      if (!root || root.innerHTML.length < 100) return false;

      // Check if already injected
      if (root.innerHTML.indexOf('MARKER_UNIK_ANDA') > -1) {
        return true;
      }

      // Find and replace contact template body
      var text = root.textContent.toLowerCase();
      if ((text.indexOf('label1') > -1) && (text.indexOf('label2') > -1)) {

        var allDivs = root.querySelectorAll('div');
        for (var i = 0; i < allDivs.length; i++) {
          var div = allDivs[i];
          var divText = (div.textContent || '').toLowerCase();

          if ((divText.indexOf('label1') > -1) && (divText.indexOf('label2') > -1)) {
            if (div === root) continue;

            var len = (div.innerHTML || '').length;
            if (len > 500 && len < root.innerHTML.length * 0.8) {
              div.innerHTML = window.__CUSTOM_CONTENT__;
              div.style.background = '#f3f4f6';
              div.style.padding = '2rem 0';
              console.log('[NAMAPAGE] Injection success!');
              return true;
            }
          }
        }
      }

      return false;
    }

    // Persistent observer
    (function() {
      if (typeof MutationObserver !== 'undefined') {
        var observer = new MutationObserver(function() {
          if (isThisPage()) injectContent();
        });

        var startObserver = function() {
          var root = document.getElementById('root');
          if (root) {
            observer.observe(root, { childList: true, subtree: true });
            injectContent();
          }
        };

        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', startObserver);
        } else {
          startObserver();
        }
      }

      // Polling backup
      setInterval(function() {
        if (isThisPage()) injectContent();
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
      basepath: "/",
      site_id: "tps-standalone",
      page_id: "53512795-1d82-4bbd-9883-b70e884039fe",  // Contact page ID
    }
  </script>
  <script src="/main.js" type="module"></script>
</body>
</html>`;
}

// =============================================
// EXPORT API
// =============================================
export const _ = {
  url: "/namapage",  // URL route
  raw: true,         // Return raw Response
  async api() {
    const lang = "id";

    try {
      // Fetch data
      const [mainData, menu, footer, shortcutMenu, header] = await Promise.all([
        queryPath("nama_content", lang),
        queryPath("menu", lang),
        queryPath("footer", lang),
        queryPath("shortcut_menu", lang),
        queryPath("label", lang),
      ]);

      const sortedMenu = menu.sort((a: any, b: any) =>
        (parseInt(a.order) || 99) - (parseInt(b.order) || 99)
      );

      const data = mainData[0] || {};
      const footerRaw = footer[0] || {};

      // Build attributes
      const attributes: Record<string, string> = {};
      for (const label of header) {
        if (label.name && label.value) {
          attributes[label.name] = label.value;
        }
      }
      // Override labels for this page
      attributes.contact_us = "Section 1 Title";
      attributes.important_numbers = "Section 2 Title";

      // Render custom body HTML
      const customBodyHTML = renderBody(data);

      // Body content (structured for Prasi contact template)
      const bodyContent = {
        // Data asli
        data: [data],
        // Structured data untuk contact template fallback
        kontak_kami: [{
          id: "section-1",
          order: "1",
          title: "Section 1",
          name: "Content Name",
          address: "Content description",
          contact: []
        }],
        nomor_penting: [{
          id: "section-2",
          order: "1",
          title: "Section 2",
          name: "",
          address: "",
          contact: []
        }],
        attributes,
        header_content: {
          title: data.title || "Page Title",
          banner: data.image ? img(data.image) : "/_file/layout/header/header-default-bg.png",
          tagline: data.subtitle || "Tagline",
          heading: "Heading",
          sub_heading: "Terminal Petikemas Surabaya",
        },
        footer_content: {
          banner: "/_img/layout/footer/footer-content.jpeg",
        },
      };

      // Header content
      const headerContent = {
        logo: "layout/header/tps-logo-juara-25.png",
        menu: sortedMenu,
        shortcut: { menu: shortcutMenu },
        langs: [
          { url: "id-id", label: "ID", value: "id", default: true },
          { url: "en", label: "EN", value: "en", default: false },
        ],
        lang: [
          { url: "id-id", label: "ID", value: "id", default: true },
          { url: "en", label: "EN", value: "en", default: false },
        ],
      };

      // Footer content
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

      const html = generateHTML(bodyContent, headerContent, footerContent, customBodyHTML);

      return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    } catch (e) {
      console.error("Page error:", e);
      return new Response("Error loading page", { status: 500 });
    }
  },
};
```

### 3. Tambahkan Menu (via CMS)

Tambahkan menu item baru di database/CMS dengan:
- `label`: "Nama Menu"
- `url`: "/namapage"

## Cara Kerja

### Full Page Load (Refresh)
1. Browser request ke `/namapage`
2. Server return HTML dengan:
   - `<head>` berisi injection script
   - `<body>` berisi content_script + Prasi setup
3. Prasi render header/footer dari template
4. Injection script detect dan replace body section dengan custom HTML

### Client-side Navigation (Menu Click)
1. Prasi fetch HTML dari `/namapage`
2. Extract `content_script` dan update `window.___content`
3. Prasi render dengan cached template (menampilkan contact layout)
4. MutationObserver detect perubahan dan inject custom HTML

## Penting

### Delimiter `/****/</script>`
Content script HARUS diakhiri dengan `/****/</script>` - ini adalah delimiter yang digunakan oleh Prasi untuk parsing.

### Page ID
Gunakan page_id dari template yang ada:
- Contact page: `53512795-1d82-4bbd-9883-b70e884039fe`
- Homepage: `46a3cbcd-2764-412d-82ea-994fc4dfe1ae` (membutuhkan data struktur berbeda)

### Structured Data Fallback
Selalu sediakan `kontak_kami` dan `nomor_penting` dalam format array objects untuk fallback saat client-side navigation sebelum injection terjadi.

### Injection Markers
Gunakan marker unik di custom HTML anda (contoh: inline style atau text unik) untuk mendeteksi apakah content sudah di-inject.

## Contoh Implementasi

Lihat file referensi:
- `/app/srv/api/_karir.ts` - Implementasi lengkap halaman Karir
- `/app/srv/api/_frontend.ts` - Halaman homepage dengan struktur berbeda

## Troubleshooting

### Content tidak muncul setelah navigasi menu
- Pastikan MutationObserver berjalan
- Check console untuk log `[NAMAPAGE]`
- Pastikan marker detection sesuai dengan content yang dirender

### Header/footer tidak muncul
- Pastikan `page_id` valid
- Check `window.___header` dan `window.___footer` di console

### Error "Invalid regular expression"
- Pastikan delimiter `/****/</script>` ada di akhir content_script
