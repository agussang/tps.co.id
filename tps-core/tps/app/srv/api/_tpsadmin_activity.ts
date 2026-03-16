/**
 * Admin Activity History Page - Full SSR
 * Route: /backend/tpsadmin/activity
 * Shows login history from user_session table + logs table
 */

import { g } from "utils/global";
import { AdminSidebar, loadSidebarStructures } from "../components/AdminSidebar";

const getSessionUser = async (sessionId: string) => {
  if (!sessionId || !g.db) return null;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(sessionId)) return null;
  try {
    const session = await g.db.user_session.findFirst({
      where: { id: sessionId },
      select: {
        user: {
          select: { id: true, username: true, role: { select: { id: true, name: true } } },
        },
      },
    });
    return session?.user || null;
  } catch (e) {
    return null;
  }
};

const escapeHtml = (str: string | null): string => {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
};

const formatDate = (date: Date | null): string => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
};

export const _ = {
  url: "/backend/tpsadmin/activity",
  raw: true,
  async api(this: { req: Request; _url: URL }) {
    const req = this.req as Request;
    const url = this._url || new URL(req?.url || "http://localhost");

    const cookies = req?.headers?.get("cookie") || "";
    const sidMatch = cookies.match(/sid=([^;]+)/);
    const sessionId = sidMatch?.[1] || "";

    const user = await getSessionUser(sessionId);
    if (!user) {
      return new Response("", { status: 302, headers: { Location: "/backend/tpsadmin" } });
    }
    if (user.role.name !== "superadmin") {
      return new Response("Forbidden - Superadmin only", { status: 403 });
    }

    // Filter by user ID
    const filterUserId = url.searchParams.get("user_id");
    const page = parseInt(url.searchParams.get("page") || "1") || 1;
    const perPage = 50;

    // Get all users for filter dropdown
    const users = await g.db!.user.findMany({
      select: { id: true, username: true, name: true },
      orderBy: { username: "asc" },
    });

    // Build login sessions query
    const sessionWhere: any = {};
    if (filterUserId) sessionWhere.id_user = parseInt(filterUserId);

    const [loginSessions, totalSessions] = await Promise.all([
      g.db!.user_session.findMany({
        where: sessionWhere,
        include: { user: { select: { username: true, name: true } } },
        orderBy: { login_at: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      g.db!.user_session.count({ where: sessionWhere }),
    ]);

    // Get activity logs
    const logWhere: any = {};
    if (filterUserId) {
      const targetUser = users.find((u: any) => u.id === parseInt(filterUserId));
      if (targetUser) logWhere.user = targetUser.username;
    }

    const logs = await g.db!.logs.findMany({
      where: logWhere,
      orderBy: { created_at: "desc" },
      take: 100,
    });

    const totalPages = Math.ceil(totalSessions / perPage);
    const structures = await loadSidebarStructures();

    const filterUserName = filterUserId
      ? users.find((u: any) => u.id === parseInt(filterUserId))?.username || ""
      : "";

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Riwayat Aktivitas - TPS Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="icon" href="/_img/tps-logo.png">
</head>
<body class="bg-gray-50">
  <div class="min-h-screen flex">
    ${AdminSidebar({ activePage: "activity", user: { username: user.username, role: user.role }, structures })}

    <main class="flex-1 ml-64">
      <header class="bg-white border-b sticky top-0 z-10">
        <div class="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 class="text-xl font-semibold text-gray-800">Riwayat Aktivitas</h1>
            <p class="text-sm text-gray-500">${totalSessions} sesi login${filterUserName ? ` untuk ${escapeHtml(filterUserName)}` : ""}</p>
          </div>
          <div class="flex items-center gap-3">
            <select onchange="filterByUser(this.value)"
                    class="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#0475BC]">
              <option value="">Semua User</option>
              ${users.map((u: any) => `
                <option value="${u.id}" ${filterUserId === String(u.id) ? "selected" : ""}>
                  ${escapeHtml(u.username)}${u.name ? ` (${escapeHtml(u.name)})` : ""}
                </option>
              `).join("")}
            </select>
          </div>
        </div>
      </header>

      <div class="p-6 space-y-6">
        <!-- Login Sessions -->
        <div class="bg-white rounded-xl border overflow-hidden">
          <div class="px-4 py-3 border-b bg-gray-50">
            <h2 class="font-semibold text-gray-700">Riwayat Login</h2>
          </div>
          <table class="w-full">
            <thead class="bg-gray-50 border-b">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nama</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Waktu Login</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Session ID</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              ${loginSessions.length === 0
                ? `<tr><td colspan="4" class="px-4 py-8 text-center text-gray-400">Tidak ada data</td></tr>`
                : loginSessions.map((s: any) => `
                  <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3 text-sm font-medium text-gray-800">${escapeHtml(s.user.username)}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">${escapeHtml(s.user.name) || "-"}</td>
                    <td class="px-4 py-3 text-sm text-gray-500">${formatDate(s.login_at)}</td>
                    <td class="px-4 py-3 text-xs text-gray-400 font-mono">${s.id.substring(0, 8)}...</td>
                  </tr>
                `).join("")
              }
            </tbody>
          </table>

          ${totalPages > 1 ? `
            <div class="px-4 py-3 border-t flex items-center justify-between">
              <span class="text-sm text-gray-500">Halaman ${page} dari ${totalPages}</span>
              <div class="flex gap-1">
                ${page > 1 ? `<a href="?${filterUserId ? `user_id=${filterUserId}&` : ""}page=${page - 1}" class="px-3 py-1 border rounded text-sm hover:bg-gray-50">Prev</a>` : ""}
                ${page < totalPages ? `<a href="?${filterUserId ? `user_id=${filterUserId}&` : ""}page=${page + 1}" class="px-3 py-1 border rounded text-sm hover:bg-gray-50">Next</a>` : ""}
              </div>
            </div>
          ` : ""}
        </div>

        <!-- Activity Logs -->
        ${logs.length > 0 ? `
        <div class="bg-white rounded-xl border overflow-hidden">
          <div class="px-4 py-3 border-b bg-gray-50">
            <h2 class="font-semibold text-gray-700">Log Aktivitas</h2>
          </div>
          <table class="w-full">
            <thead class="bg-gray-50 border-b">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Aktivitas</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Waktu</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              ${logs.map((l: any) => `
                <tr class="hover:bg-gray-50">
                  <td class="px-4 py-3 text-sm font-medium text-gray-800">${escapeHtml(l.user)}</td>
                  <td class="px-4 py-3 text-sm text-gray-600">${escapeHtml(l.activity)}</td>
                  <td class="px-4 py-3 text-sm text-gray-500">${formatDate(l.created_at)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
        ` : ""}
      </div>
    </main>
  </div>

  <script>
    function filterByUser(userId) {
      var url = new URL(window.location.href);
      if (userId) {
        url.searchParams.set('user_id', userId);
      } else {
        url.searchParams.delete('user_id');
      }
      url.searchParams.delete('page');
      window.location.href = url.toString();
    }
  </script>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  },
};
