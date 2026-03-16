/**
 * Admin Visitor Statistics Page - Full SSR
 * Route: /backend/tpsadmin/visitors
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
      select: { user: { select: { id: true, username: true, role: { select: { id: true, name: true } } } } },
    });
    return session?.user || null;
  } catch (e) { return null; }
};

const escapeHtml = (str: string | null): string => {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
};

export const _ = {
  url: "/backend/tpsadmin/visitors",
  raw: true,
  async api(this: { req: Request; _url: URL }) {
    const req = this.req as Request;
    const url = this._url || new URL(req?.url || "http://localhost");
    const cookies = req?.headers?.get("cookie") || "";
    const sidMatch = cookies.match(/sid=([^;]+)/);
    const sessionId = sidMatch?.[1] || "";

    const user = await getSessionUser(sessionId);
    if (!user) return new Response("", { status: 302, headers: { Location: "/backend/tpsadmin" } });
    if (user.role.name !== "superadmin") return new Response("Forbidden", { status: 403 });

    const page = parseInt(url.searchParams.get("page") || "1") || 1;
    const tab = url.searchParams.get("tab") || "summary";
    const perPage = 50;
    const db = g.db as any;

    // Stats
    const [totalAll, todayCount, uniqueIpToday, topPages, topIps, recentVisits, totalFiltered] = await Promise.all([
      db.visitor_log.count(),
      db.$queryRawUnsafe(`SELECT COUNT(*) as c FROM visitor_log WHERE created_at >= CURRENT_DATE`).then((r: any) => Number(r[0]?.c || 0)),
      db.$queryRawUnsafe(`SELECT COUNT(DISTINCT ip) as c FROM visitor_log WHERE created_at >= CURRENT_DATE`).then((r: any) => Number(r[0]?.c || 0)),
      db.$queryRawUnsafe(`SELECT path, COUNT(*) as visits FROM visitor_log WHERE created_at >= CURRENT_DATE - INTERVAL '7 days' GROUP BY path ORDER BY visits DESC LIMIT 20`),
      db.$queryRawUnsafe(`SELECT ip, COUNT(*) as visits, MAX(created_at) as last_visit FROM visitor_log WHERE created_at >= CURRENT_DATE - INTERVAL '7 days' GROUP BY ip ORDER BY visits DESC LIMIT 20`),
      db.visitor_log.findMany({ orderBy: { created_at: "desc" }, skip: (page - 1) * perPage, take: perPage }),
      db.visitor_log.count(),
    ]);

    const totalPages = Math.ceil(totalFiltered / perPage);
    const structures = await loadSidebarStructures();

    const formatDate = (d: Date | null) => {
      if (!d) return "-";
      return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    };

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Statistik Pengunjung - TPS Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="icon" href="/_img/tps-logo.png">
</head>
<body class="bg-gray-50">
  <div class="min-h-screen flex">
    ${AdminSidebar({ activePage: "visitors", user: { username: user.username, role: user.role }, structures })}
    <main class="flex-1 ml-64">
      <header class="bg-white border-b sticky top-0 z-10">
        <div class="px-6 py-4">
          <h1 class="text-xl font-semibold text-gray-800">Statistik Pengunjung Website</h1>
          <p class="text-sm text-gray-500">Total ${totalAll.toLocaleString("id-ID")} kunjungan tercatat</p>
        </div>
      </header>

      <div class="p-6 space-y-6">
        <!-- Stats Cards -->
        <div class="grid grid-cols-3 gap-4">
          <div class="bg-white rounded-xl border p-5">
            <div class="text-sm text-gray-500 mb-1">Pengunjung Hari Ini</div>
            <div class="text-2xl font-bold text-gray-800">${todayCount.toLocaleString("id-ID")}</div>
          </div>
          <div class="bg-white rounded-xl border p-5">
            <div class="text-sm text-gray-500 mb-1">IP Unik Hari Ini</div>
            <div class="text-2xl font-bold text-gray-800">${uniqueIpToday.toLocaleString("id-ID")}</div>
          </div>
          <div class="bg-white rounded-xl border p-5">
            <div class="text-sm text-gray-500 mb-1">Total Semua</div>
            <div class="text-2xl font-bold text-gray-800">${totalAll.toLocaleString("id-ID")}</div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="flex gap-2 border-b">
          <a href="?tab=summary" class="px-4 py-2 text-sm font-medium border-b-2 ${tab === "summary" ? "border-[#0475BC] text-[#0475BC]" : "border-transparent text-gray-500 hover:text-gray-700"}">Halaman Populer</a>
          <a href="?tab=ips" class="px-4 py-2 text-sm font-medium border-b-2 ${tab === "ips" ? "border-[#0475BC] text-[#0475BC]" : "border-transparent text-gray-500 hover:text-gray-700"}">Detail IP</a>
          <a href="?tab=log" class="px-4 py-2 text-sm font-medium border-b-2 ${tab === "log" ? "border-[#0475BC] text-[#0475BC]" : "border-transparent text-gray-500 hover:text-gray-700"}">Log Kunjungan</a>
        </div>

        ${tab === "summary" ? `
        <!-- Top Pages (7 days) -->
        <div class="bg-white rounded-xl border overflow-hidden">
          <div class="px-4 py-3 border-b bg-gray-50">
            <h2 class="font-semibold text-gray-700">Halaman Populer (7 hari terakhir)</h2>
          </div>
          <table class="w-full">
            <thead class="bg-gray-50 border-b">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-12">#</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Halaman</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Kunjungan</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              ${(topPages as any[]).map((p: any, i: number) => `
                <tr class="hover:bg-gray-50">
                  <td class="px-4 py-3 text-sm text-gray-400">${i + 1}</td>
                  <td class="px-4 py-3 text-sm font-medium text-gray-800 font-mono">${escapeHtml(p.path)}</td>
                  <td class="px-4 py-3 text-sm text-right font-bold text-gray-700">${Number(p.visits).toLocaleString("id-ID")}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
        ` : ""}

        ${tab === "ips" ? `
        <!-- Top IPs -->
        <div class="bg-white rounded-xl border overflow-hidden">
          <div class="px-4 py-3 border-b bg-gray-50">
            <h2 class="font-semibold text-gray-700">Detail Pengunjung per IP (7 hari terakhir)</h2>
          </div>
          <table class="w-full">
            <thead class="bg-gray-50 border-b">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-12">#</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">IP Address</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Terakhir</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Kunjungan</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              ${(topIps as any[]).map((ip: any, i: number) => `
                <tr class="hover:bg-gray-50">
                  <td class="px-4 py-3 text-sm text-gray-400">${i + 1}</td>
                  <td class="px-4 py-3 text-sm font-mono text-gray-800">${escapeHtml(ip.ip)}</td>
                  <td class="px-4 py-3 text-sm text-gray-500">${formatDate(ip.last_visit)}</td>
                  <td class="px-4 py-3 text-sm text-right font-bold text-gray-700">${Number(ip.visits).toLocaleString("id-ID")}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
        ` : ""}

        ${tab === "log" ? `
        <!-- Recent Visits -->
        <div class="bg-white rounded-xl border overflow-hidden">
          <div class="px-4 py-3 border-b bg-gray-50">
            <h2 class="font-semibold text-gray-700">Log Kunjungan Terbaru</h2>
          </div>
          <table class="w-full">
            <thead class="bg-gray-50 border-b">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Waktu</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Halaman</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">IP</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User Agent</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              ${recentVisits.map((v: any) => `
                <tr class="hover:bg-gray-50">
                  <td class="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">${formatDate(v.created_at)}</td>
                  <td class="px-4 py-3 text-sm font-mono text-gray-800">${escapeHtml(v.path)}</td>
                  <td class="px-4 py-3 text-xs font-mono text-gray-500">${escapeHtml(v.ip)}</td>
                  <td class="px-4 py-3 text-xs text-gray-400 max-w-xs truncate">${escapeHtml((v.user_agent || "").substring(0, 80))}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          ${totalPages > 1 ? `
            <div class="px-4 py-3 border-t flex items-center justify-between">
              <span class="text-sm text-gray-500">Halaman ${page} dari ${totalPages}</span>
              <div class="flex gap-1">
                ${page > 1 ? `<a href="?tab=log&page=${page - 1}" class="px-3 py-1 border rounded text-sm hover:bg-gray-50">Prev</a>` : ""}
                ${page < totalPages ? `<a href="?tab=log&page=${page + 1}" class="px-3 py-1 border rounded text-sm hover:bg-gray-50">Next</a>` : ""}
              </div>
            </div>
          ` : ""}
        </div>
        ` : ""}
      </div>
    </main>
  </div>
</body>
</html>`;

    return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
  },
};
