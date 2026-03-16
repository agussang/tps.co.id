/**
 * Admin Security Settings Page - Full SSR
 * Route: /backend/tpsadmin/settings
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

const getSettings = async (): Promise<Record<string, string>> => {
  if (!g.db) return {};
  try {
    const rows = await (g.db as any).site_settings.findMany();
    const map: Record<string, string> = {};
    for (const r of rows) map[r.key] = r.value;
    return map;
  } catch (e) {
    return {};
  }
};

const renderPage = (user: any, settings: Record<string, string>, structures: any[]): string => {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pengaturan Keamanan - TPS Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="icon" href="/_img/tps-logo.png">
</head>
<body class="bg-gray-50">
  <div class="min-h-screen flex">
    ${AdminSidebar({ activePage: "settings", user: { username: user.username, role: user.role }, structures })}

    <main class="flex-1 ml-64">
      <header class="bg-white border-b sticky top-0 z-10">
        <div class="px-6 py-4">
          <h1 class="text-xl font-semibold text-gray-800">Pengaturan Keamanan</h1>
          <p class="text-sm text-gray-500">Konfigurasi password policy dan auto-deactivation</p>
        </div>
      </header>

      <div class="p-6 max-w-2xl">
        <form id="settingsForm" onsubmit="saveSettings(event)" class="space-y-6">

          <!-- Password Policy -->
          <div class="bg-white rounded-xl border p-6">
            <h2 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-[#0475BC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              Password Policy
            </h2>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Minimal Panjang Password</label>
                <input type="number" name="password_min_length" min="4" max="32"
                       value="${escapeHtml(settings.password_min_length || "8")}"
                       class="w-32 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0475BC] focus:border-[#0475BC]">
                <span class="text-sm text-gray-500 ml-2">karakter</span>
              </div>

              <div class="flex items-center gap-3">
                <input type="checkbox" name="password_require_uppercase" id="chk_upper"
                       ${settings.password_require_uppercase === "true" ? "checked" : ""}
                       class="rounded border-gray-300 text-[#0475BC] focus:ring-[#0475BC]">
                <label for="chk_upper" class="text-sm text-gray-700">Wajib huruf besar (A-Z)</label>
              </div>

              <div class="flex items-center gap-3">
                <input type="checkbox" name="password_require_lowercase" id="chk_lower"
                       ${settings.password_require_lowercase === "true" ? "checked" : ""}
                       class="rounded border-gray-300 text-[#0475BC] focus:ring-[#0475BC]">
                <label for="chk_lower" class="text-sm text-gray-700">Wajib huruf kecil (a-z)</label>
              </div>

              <div class="flex items-center gap-3">
                <input type="checkbox" name="password_require_number" id="chk_num"
                       ${settings.password_require_number === "true" ? "checked" : ""}
                       class="rounded border-gray-300 text-[#0475BC] focus:ring-[#0475BC]">
                <label for="chk_num" class="text-sm text-gray-700">Wajib angka (0-9)</label>
              </div>

              <div class="flex items-center gap-3">
                <input type="checkbox" name="password_require_special" id="chk_special"
                       ${settings.password_require_special === "true" ? "checked" : ""}
                       class="rounded border-gray-300 text-[#0475BC] focus:ring-[#0475BC]">
                <label for="chk_special" class="text-sm text-gray-700">Wajib karakter spesial (!@#$%^&*)</label>
              </div>
            </div>
          </div>

          <!-- Password Expiry -->
          <div class="bg-white rounded-xl border p-6">
            <h2 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-[#0475BC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Password Expiry
            </h2>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Ganti password setiap</label>
              <div class="flex items-center gap-2">
                <input type="number" name="password_expiry_days" min="0" max="365"
                       value="${escapeHtml(settings.password_expiry_days || "90")}"
                       class="w-32 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0475BC] focus:border-[#0475BC]">
                <span class="text-sm text-gray-500">hari</span>
              </div>
              <p class="text-xs text-gray-400 mt-1">Set 0 untuk menonaktifkan password expiry</p>
            </div>
          </div>

          <!-- Auto Deactivation -->
          <div class="bg-white rounded-xl border p-6">
            <h2 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-[#0475BC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
              </svg>
              Auto Nonaktifkan User
            </h2>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nonaktifkan otomatis setelah tidak login</label>
              <div class="flex items-center gap-2">
                <input type="number" name="auto_deactivate_days" min="0" max="365"
                       value="${escapeHtml(settings.auto_deactivate_days || "0")}"
                       class="w-32 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0475BC] focus:border-[#0475BC]">
                <span class="text-sm text-gray-500">hari</span>
              </div>
              <p class="text-xs text-gray-400 mt-1">Set 0 untuk menonaktifkan fitur ini</p>
            </div>
          </div>

          <!-- SMTP Settings (for forgot password email) -->
          <div class="bg-white rounded-xl border p-6">
            <h2 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-[#0475BC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              Konfigurasi Email (SMTP)
            </h2>
            <p class="text-sm text-gray-500 mb-4">Untuk fitur lupa password via email</p>
            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
                  <input type="text" name="smtp_host" value="${escapeHtml(settings.smtp_host || "")}"
                         class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0475BC]"
                         placeholder="smtp.gmail.com">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">SMTP Port</label>
                  <input type="number" name="smtp_port" value="${escapeHtml(settings.smtp_port || "587")}"
                         class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0475BC]"
                         placeholder="587">
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">SMTP Username</label>
                  <input type="text" name="smtp_user" value="${escapeHtml(settings.smtp_user || "")}"
                         class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0475BC]"
                         placeholder="user@domain.com">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">SMTP Password</label>
                  <input type="password" name="smtp_pass" value="${escapeHtml(settings.smtp_pass || "")}"
                         class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0475BC]"
                         placeholder="********">
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email Pengirim (From)</label>
                <input type="email" name="smtp_from" value="${escapeHtml(settings.smtp_from || "")}"
                       class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0475BC]"
                       placeholder="noreply@tps.co.id">
              </div>
            </div>
          </div>

          <!-- Save Button -->
          <div class="flex justify-end">
            <button type="submit" id="saveBtn"
                    class="px-6 py-2.5 bg-[#0475BC] text-white rounded-lg hover:bg-[#0366a3] font-medium flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              Simpan Pengaturan
            </button>
          </div>
        </form>
      </div>
    </main>
  </div>

  <script>
    async function saveSettings(e) {
      e.preventDefault();
      var btn = document.getElementById('saveBtn');
      btn.disabled = true;
      btn.textContent = 'Menyimpan...';

      var data = {
        password_min_length: document.querySelector('[name="password_min_length"]').value,
        password_require_uppercase: document.getElementById('chk_upper').checked ? 'true' : 'false',
        password_require_lowercase: document.getElementById('chk_lower').checked ? 'true' : 'false',
        password_require_number: document.getElementById('chk_num').checked ? 'true' : 'false',
        password_require_special: document.getElementById('chk_special').checked ? 'true' : 'false',
        password_expiry_days: document.querySelector('[name="password_expiry_days"]').value,
        auto_deactivate_days: document.querySelector('[name="auto_deactivate_days"]').value,
        smtp_host: document.querySelector('[name="smtp_host"]').value,
        smtp_port: document.querySelector('[name="smtp_port"]').value,
        smtp_user: document.querySelector('[name="smtp_user"]').value,
        smtp_pass: document.querySelector('[name="smtp_pass"]').value,
        smtp_from: document.querySelector('[name="smtp_from"]').value,
      };

      try {
        var res = await fetch('/backend/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(data),
        });
        var result = await res.json();
        if (result.status === 'ok') {
          alert('Pengaturan berhasil disimpan');
        } else {
          alert('Error: ' + (result.message || 'Gagal menyimpan'));
        }
      } catch (err) {
        alert('Error: ' + err.message);
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg> Simpan Pengaturan';
      }
    }
  </script>
</body>
</html>`;
};

export const _ = {
  url: "/backend/tpsadmin/settings",
  raw: true,
  async api(this: { req: Request; _url: URL }) {
    const req = this.req as Request;
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

    const [settings, structures] = await Promise.all([
      getSettings(),
      loadSidebarStructures(),
    ]);

    return new Response(renderPage(user, settings, structures), {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  },
};
