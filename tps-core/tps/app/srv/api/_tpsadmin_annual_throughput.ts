/**
 * Admin Annual Throughput Summary Page - Full SSR (Read-Only)
 * Route: /backend/tpsadmin/annual-throughput
 * Shows annual throughput auto-calculated from monthly throughput data
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

const formatNumber = (num: number): string => {
  return num.toLocaleString("id-ID");
};

export const _ = {
  url: "/backend/tpsadmin/annual-throughput",
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

    // Get throughput structure
    const throughputStruct = await g.db!.structure.findFirst({
      where: { path: "throughput" },
      select: { id: true },
    });

    if (!throughputStruct) {
      return new Response("Throughput structure not found", { status: 404 });
    }

    // Get all published throughput entries (use ID lang as primary)
    const throughputParents = await g.db!.content.findMany({
      where: {
        id_structure: throughputStruct.id,
        id_parent: null,
        status: "published",
        OR: [{ lang: "id" }, { lang: "inherited" }],
      },
      select: {
        id: true,
        other_content: {
          select: { text: true, structure: { select: { path: true } } },
        },
      },
    });

    // Aggregate by year
    const yearData: Record<string, { domestics: number; international: number; months: number }> = {};

    for (const p of throughputParents) {
      const year = p.other_content.find((c: any) => c.structure?.path?.endsWith(".year"))?.text || "";
      const dom = p.other_content.find((c: any) => c.structure?.path?.endsWith(".domestics"))?.text || "0";
      const intl = p.other_content.find((c: any) => c.structure?.path?.endsWith(".international"))?.text || "0";

      if (!year) continue;

      if (!yearData[year]) {
        yearData[year] = { domestics: 0, international: 0, months: 0 };
      }
      yearData[year].domestics += parseInt(dom.replace(/[^\d]/g, "")) || 0;
      yearData[year].international += parseInt(intl.replace(/[^\d]/g, "")) || 0;
      yearData[year].months += 1;
    }

    // Sort by year descending
    const sortedYears = Object.keys(yearData).sort((a, b) => parseInt(b) - parseInt(a));

    const structures = await loadSidebarStructures();

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Annual Throughput - TPS Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="icon" href="/_img/tps-logo.png">
</head>
<body class="bg-gray-50">
  <div class="min-h-screen flex">
    ${AdminSidebar({ activePage: "annual-throughput", user: { username: user.username, role: user.role }, structures })}

    <main class="flex-1 ml-64">
      <header class="bg-white border-b sticky top-0 z-10">
        <div class="px-6 py-4">
          <h1 class="text-xl font-semibold text-gray-800">Annual Throughput</h1>
          <p class="text-sm text-gray-500">Ringkasan otomatis dari data throughput bulanan (read-only)</p>
        </div>
      </header>

      <div class="p-6 space-y-6">
        <!-- Info Banner -->
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <svg class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div class="text-sm text-blue-700">
            <p class="font-medium">Data dihitung otomatis</p>
            <p>Annual throughput dihitung dari total data throughput bulanan per tahun. Untuk mengubah data, edit melalui menu <strong>Throughput</strong> di sidebar. Perubahan akan otomatis diperbarui di sini dan di halaman website.</p>
          </div>
        </div>

        <!-- Summary Table -->
        <div class="bg-white rounded-xl border overflow-hidden">
          <table class="w-full">
            <thead class="bg-gray-50 border-b">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-24">Tahun</th>
                <th class="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Domestics (TEUs)</th>
                <th class="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">International (TEUs)</th>
                <th class="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total (TEUs)</th>
                <th class="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase w-24">Bulan</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              ${sortedYears.length === 0
                ? `<tr><td colspan="5" class="px-6 py-8 text-center text-gray-400">Belum ada data throughput</td></tr>`
                : sortedYears.map((year) => {
                    const d = yearData[year];
                    const total = d.domestics + d.international;
                    return `
                      <tr class="hover:bg-gray-50">
                        <td class="px-6 py-4 font-semibold text-gray-800">${escapeHtml(year)}</td>
                        <td class="px-6 py-4 text-right font-mono text-gray-700">${formatNumber(d.domestics)}</td>
                        <td class="px-6 py-4 text-right font-mono text-gray-700">${formatNumber(d.international)}</td>
                        <td class="px-6 py-4 text-right font-mono font-semibold text-blue-700">${formatNumber(total)}</td>
                        <td class="px-6 py-4 text-center">
                          <span class="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-sm">${d.months} bulan</span>
                        </td>
                      </tr>
                    `;
                  }).join("")
              }
            </tbody>
            ${sortedYears.length > 0 ? `
            <tfoot class="bg-gray-50 border-t-2">
              <tr>
                <td class="px-6 py-3 font-semibold text-gray-700">Grand Total</td>
                <td class="px-6 py-3 text-right font-mono font-semibold text-gray-700">${formatNumber(sortedYears.reduce((sum, y) => sum + yearData[y].domestics, 0))}</td>
                <td class="px-6 py-3 text-right font-mono font-semibold text-gray-700">${formatNumber(sortedYears.reduce((sum, y) => sum + yearData[y].international, 0))}</td>
                <td class="px-6 py-3 text-right font-mono font-semibold text-blue-700">${formatNumber(sortedYears.reduce((sum, y) => sum + yearData[y].domestics + yearData[y].international, 0))}</td>
                <td class="px-6 py-3 text-center text-sm text-gray-500">${sortedYears.length} tahun</td>
              </tr>
            </tfoot>
            ` : ""}
          </table>
        </div>

        <!-- Monthly Breakdown per Year -->
        ${sortedYears.map((year) => {
          // We'll load monthly data inline
          return `
          <div class="bg-white rounded-xl border overflow-hidden" id="year-${year}">
            <div class="px-4 py-3 border-b bg-gray-50 flex items-center justify-between cursor-pointer" onclick="toggleYear('${year}')">
              <h2 class="font-semibold text-gray-700">Detail Bulanan ${year}</h2>
              <svg id="chevron-${year}" class="w-5 h-5 text-gray-400 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </div>
            <div id="detail-${year}" style="display:none;">
              <div class="p-4 text-center text-gray-400 text-sm">Memuat data...</div>
            </div>
          </div>
          `;
        }).join("")}
      </div>
    </main>
  </div>

  <script>
    var monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    var loadedYears = {};

    function toggleYear(year) {
      var detail = document.getElementById('detail-' + year);
      var chevron = document.getElementById('chevron-' + year);
      if (detail.style.display === 'none') {
        detail.style.display = 'block';
        chevron.style.transform = 'rotate(180deg)';
        if (!loadedYears[year]) {
          loadMonthlyData(year);
        }
      } else {
        detail.style.display = 'none';
        chevron.style.transform = '';
      }
    }

    async function loadMonthlyData(year) {
      try {
        var res = await fetch('/backend/api/throughput-monthly?year=' + year, { credentials: 'include' });
        var data = await res.json();
        if (data.status === 'ok') {
          loadedYears[year] = true;
          var detail = document.getElementById('detail-' + year);
          var html = '<table class="w-full"><thead class="bg-gray-50 border-b"><tr>';
          html += '<th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Bulan</th>';
          html += '<th class="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Domestics</th>';
          html += '<th class="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">International</th>';
          html += '<th class="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>';
          html += '</tr></thead><tbody class="divide-y">';
          if (data.months.length === 0) {
            html += '<tr><td colspan="4" class="px-4 py-4 text-center text-gray-400">Tidak ada data</td></tr>';
          } else {
            data.months.forEach(function(m) {
              var monthIdx = parseInt(m.month) - 1;
              var monthName = monthIdx >= 0 && monthIdx < 12 ? monthNames[monthIdx] : m.month;
              var total = m.domestics + m.international;
              html += '<tr class="hover:bg-gray-50">';
              html += '<td class="px-4 py-2 text-sm text-gray-700">' + monthName + '</td>';
              html += '<td class="px-4 py-2 text-right font-mono text-sm">' + m.domestics.toLocaleString('id-ID') + '</td>';
              html += '<td class="px-4 py-2 text-right font-mono text-sm">' + m.international.toLocaleString('id-ID') + '</td>';
              html += '<td class="px-4 py-2 text-right font-mono text-sm font-semibold">' + total.toLocaleString('id-ID') + '</td>';
              html += '</tr>';
            });
          }
          html += '</tbody></table>';
          detail.innerHTML = html;
        }
      } catch (e) {
        document.getElementById('detail-' + year).innerHTML = '<div class="p-4 text-center text-red-400">Gagal memuat data</div>';
      }
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
