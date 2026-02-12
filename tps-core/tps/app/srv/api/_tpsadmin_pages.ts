/**
 * Admin Pages List - Full SSR
 * Route: /backend/tpsadmin/pages
 *
 * Manages dynamic pages with url_pattern
 */

import { g } from "utils/global";
import { AdminSidebar, loadSidebarStructures } from "../components/AdminSidebar";

interface PageItem {
  id: string;
  path: string;
  title: string;
  url_pattern: string;
  status: string;
  updated_at: Date | null;
  content_count: number;
}

const getSessionUser = async (sessionId: string) => {
  if (!sessionId || !g.db) return null;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(sessionId)) return null;

  try {
    const session = await g.db.user_session.findFirst({
      where: { id: sessionId },
      select: {
        user: {
          select: {
            id: true,
            username: true,
            role: { select: { id: true, name: true } },
          },
        },
      },
    });
    return session?.user || null;
  } catch (e) {
    console.error("Session lookup error:", e);
    return null;
  }
};

const getPages = async (): Promise<PageItem[]> => {
  if (!g.db) return [];

  try {
    const pages = await g.db.structure.findMany({
      where: {
        url_pattern: { not: "" },
        parent: null,
      },
      orderBy: { title: "asc" },
      select: {
        id: true,
        path: true,
        title: true,
        url_pattern: true,
        status: true,
        updated_at: true,
        _count: {
          select: { content: true },
        },
      },
    });

    return pages.map((p) => ({
      id: p.id,
      path: p.path,
      title: p.title,
      url_pattern: p.url_pattern,
      status: p.status,
      updated_at: p.updated_at,
      content_count: p._count.content,
    }));
  } catch (e) {
    console.error("Error getting pages:", e);
    return [];
  }
};

const renderPage = (user: any, pages: PageItem[], statusFilter: string, structures: any[]): string => {
  const filteredPages = statusFilter === "all"
    ? pages
    : pages.filter((p) => p.status === statusFilter);

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dynamic Pages - TPS Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="icon" href="/_img/tps-logo.png">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    .table-row:hover { background-color: #f9fafb; }
  </style>
</head>
<body class="bg-gray-50">
  <div class="min-h-screen flex">
    ${AdminSidebar({
      activePage: "pages",
      user: { username: user?.username || "Admin", role: { name: user?.role?.name || "admin" } },
      structures,
    })}

    <!-- Main Content -->
    <main class="flex-1 ml-64">
      <!-- Header -->
      <header class="bg-white border-b sticky top-0 z-10">
        <div class="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 class="text-xl font-semibold text-gray-800">Dynamic Pages</h1>
            <p class="text-sm text-gray-500">Kelola halaman dinamis dengan URL pattern</p>
          </div>
          <div class="flex items-center gap-4">
            <a href="/backend/tpsadmin/pages/add" class="px-4 py-2 bg-[#0475BC] text-white rounded-lg hover:bg-[#0366a3] flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Tambah Halaman
            </a>
          </div>
        </div>

        <!-- Filters -->
        <div class="px-6 py-3 border-t bg-gray-50 flex items-center gap-4">
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600">Status:</span>
            <select id="status-filter" onchange="filterByStatus()" class="text-sm border rounded-lg px-3 py-1.5">
              <option value="all" ${statusFilter === "all" ? "selected" : ""}>Semua</option>
              <option value="published" ${statusFilter === "published" ? "selected" : ""}>Published</option>
              <option value="draft" ${statusFilter === "draft" ? "selected" : ""}>Draft</option>
            </select>
          </div>
          <div class="text-sm text-gray-500">
            ${filteredPages.length} halaman
          </div>
        </div>
      </header>

      <!-- Content -->
      <div class="p-6">
        ${filteredPages.length === 0 ? `
          <div class="bg-white rounded-lg border p-12 text-center">
            <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
            <h3 class="text-lg font-medium text-gray-700 mb-2">Belum ada halaman dinamis</h3>
            <p class="text-gray-500 mb-4">Buat halaman pertama Anda dengan mengklik tombol "Tambah Halaman"</p>
            <a href="/backend/tpsadmin/pages/add" class="inline-flex items-center gap-2 px-4 py-2 bg-[#0475BC] text-white rounded-lg hover:bg-[#0366a3]">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Tambah Halaman
            </a>
          </div>
        ` : `
          <div class="bg-white rounded-lg border shadow-sm overflow-hidden">
            <table class="w-full">
              <thead>
                <tr class="bg-gray-50 border-b">
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Halaman</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">URL</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Terakhir Update</th>
                  <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                ${filteredPages.map((page) => `
                  <tr class="table-row" data-id="${page.id}">
                    <td class="px-4 py-4">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-[#0475BC]/10 rounded-lg flex items-center justify-center">
                          <svg class="w-5 h-5 text-[#0475BC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                          </svg>
                        </div>
                        <div>
                          <a href="/backend/tpsadmin/pages/edit/${page.id}" class="font-medium text-gray-900 hover:text-[#0475BC]">
                            ${page.title}
                          </a>
                          <div class="text-xs text-gray-500">path: ${page.path}</div>
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-4">
                      <a href="${page.url_pattern}" target="_blank" class="inline-flex items-center gap-1 text-sm text-[#0475BC] hover:underline">
                        ${page.url_pattern}
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                        </svg>
                      </a>
                    </td>
                    <td class="px-4 py-4">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        page.status === "published"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }">
                        ${page.status === "published" ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td class="px-4 py-4 text-sm text-gray-500">
                      ${page.updated_at ? new Date(page.updated_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                    </td>
                    <td class="px-4 py-4 text-right">
                      <div class="flex items-center justify-end gap-2">
                        <a href="/backend/tpsadmin/pages/edit/${page.id}" class="p-2 text-gray-500 hover:text-[#0475BC] hover:bg-gray-100 rounded-lg" title="Edit">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                          </svg>
                        </a>
                        <a href="${page.url_pattern}" target="_blank" class="p-2 text-gray-500 hover:text-[#0475BC] hover:bg-gray-100 rounded-lg" title="Preview">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                          </svg>
                        </a>
                        <button onclick="deletePage('${page.id}')" class="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        `}
      </div>
    </main>
  </div>

  <script>
    function filterByStatus() {
      const status = document.getElementById('status-filter').value;
      window.location.href = '/backend/tpsadmin/pages?status=' + status;
    }

    async function deletePage(id) {
      if (!confirm('Yakin ingin menghapus halaman ini?')) return;

      try {
        const res = await fetch('/backend/api/page-delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id })
        });
        const result = await res.json();
        if (result.status === 'ok') {
          window.location.reload();
        } else {
          alert('Gagal menghapus: ' + result.message);
        }
      } catch (e) {
        alert('Error: ' + e.message);
      }
    }
  </script>
</body>
</html>`;
};

export const _ = {
  url: "/backend/tpsadmin/pages",
  raw: true,
  async api(this: { req: Request; _url: URL }) {
    const req = this.req;
    const url = this._url || new URL(req?.url || "http://localhost");

    // Get session from cookie
    const cookies = req?.headers?.get("cookie") || "";
    const sidMatch = cookies.match(/sid=([^;]+)/);
    const sessionId = sidMatch?.[1] || "";

    // Validate session
    const user = await getSessionUser(sessionId);

    if (!user) {
      return new Response(
        `<!DOCTYPE html>
<html>
<head>
  <title>Redirecting...</title>
  <script>
    if (!localStorage.getItem('session_id')) {
      window.location.href = '/backend/login';
    } else {
      document.cookie = 'sid=' + localStorage.getItem('session_id') + ';path=/';
      window.location.reload();
    }
  </script>
</head>
<body>Redirecting...</body>
</html>`,
        { headers: { "Content-Type": "text/html" } }
      );
    }

    const statusFilter = url.searchParams.get("status") || "all";
    const [pages, structures] = await Promise.all([
      getPages(),
      loadSidebarStructures(),
    ]);

    return new Response(renderPage(user, pages, statusFilter, structures), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  },
};
