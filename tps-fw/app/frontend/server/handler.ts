/**
 * Server-side handler untuk public pages
 *
 * File ini akan di-integrate ke tps-core/tps untuk menggantikan Prasi bundle
 * untuk routing public pages.
 *
 * Cara integrasi:
 * 1. Import handler ini di tps-core/tps/pkgs/server/create.ts
 * 2. Tambahkan route matching sebelum Prasi server
 * 3. Render React component ke HTML string
 */

import { publicRoutes } from '../index';

// Route matcher dengan support untuk dynamic segments (:slug, :id, dll)
export function matchRoute(pathname: string): {
  route: string | null;
  params: Record<string, string>;
} {
  for (const [pattern, _page] of Object.entries(publicRoutes)) {
    const params: Record<string, string> = {};
    const patternParts = pattern.split('/');
    const pathParts = pathname.split('/');

    if (patternParts.length !== pathParts.length) continue;

    let match = true;
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        // Dynamic segment
        params[patternParts[i].slice(1)] = pathParts[i];
      } else if (patternParts[i] !== pathParts[i]) {
        match = false;
        break;
      }
    }

    if (match) {
      return { route: pattern, params };
    }
  }

  return { route: null, params: {} };
}

// Content fetcher - akan mengambil data dari database
export async function fetchPageContent(
  route: string,
  params: Record<string, string>,
  db: any
): Promise<any> {
  // Fetch content berdasarkan route
  const contentMap: Record<string, string[]> = {
    '/': ['home_banner', 'profile', 'service', 'throughput', 'latest_news', 'menu', 'header'],
    '/profil/:slug': ['profile', 'menu', 'header'],
    '/layanan/:slug': ['service', 'menu', 'header'],
    '/berita/:slug': ['press_release', 'menu', 'header'],
    // ... tambahkan mapping lainnya
  };

  const paths = contentMap[route] || ['menu', 'header'];
  const content: Record<string, any> = {};

  // Fetch dari database
  for (const path of paths) {
    try {
      const result = await db.content.findFirst({
        where: { path },
        select: { data: true }
      });
      if (result?.data) {
        content[path] = JSON.parse(result.data);
      }
    } catch (e) {
      console.error(`Error fetching content for ${path}:`, e);
    }
  }

  return content;
}

// HTML template generator
export function generateHTML(options: {
  title: string;
  description?: string;
  content: any;
  cssPath?: string;
  jsPath?: string;
}): string {
  const { title, description, content, cssPath = '/index.css', jsPath = '/frontend.js' } = options;

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Terminal Petikemas Surabaya</title>
  ${description ? `<meta name="description" content="${description}">` : ''}
  <meta property="og:title" content="${title} - Terminal Petikemas Surabaya">
  ${description ? `<meta property="og:description" content="${description}">` : ''}
  <link rel="stylesheet" href="${cssPath}">
  <link rel="shortcut icon" href="/_file/pelindo-ico.ico">
</head>
<body>
  <div id="root"></div>
  <script>
    window.__INITIAL_DATA__ = ${JSON.stringify(content)};
  </script>
  <script src="${jsPath}" type="module"></script>
</body>
</html>`;
}
