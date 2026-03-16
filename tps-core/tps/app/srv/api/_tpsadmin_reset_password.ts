/**
 * Reset Password Page - Public SSR
 * Route: /backend/tpsadmin/reset-password
 *
 * User arrives here via email link with ?token=xxx
 */

import { g } from "utils/global";

const escapeHtml = (str: string | null): string => {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
};

export const _ = {
  url: "/backend/tpsadmin/reset-password",
  raw: true,
  async api(this: { req: Request; _url: URL }) {
    const url = this._url || new URL(this.req?.url || "http://localhost");
    const token = url.searchParams.get("token") || "";
    const success = url.searchParams.get("success");
    const error = url.searchParams.get("error");

    // Validate token exists
    let tokenValid = false;
    let tokenExpired = false;
    if (token && g.db) {
      try {
        const reset = await (g.db as any).password_reset.findFirst({
          where: { token, used: false },
        });
        if (reset) {
          if (new Date(reset.expires_at) > new Date()) {
            tokenValid = true;
          } else {
            tokenExpired = true;
          }
        }
      } catch (e) {}
    }

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password - TPS Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="icon" href="/_img/tps-logo.png">
</head>
<body class="bg-gray-100 min-h-screen flex items-center justify-center">
  <div class="w-full max-w-md">
    <div class="bg-white rounded-xl shadow-lg p-8">
      <div class="text-center mb-6">
        <img src="/_img/tps-logo.png" alt="TPS" class="h-12 mx-auto mb-4">
        <h1 class="text-xl font-bold text-gray-800">Reset Password</h1>
      </div>

      ${success ? `
        <div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
          Password berhasil direset. Silakan login dengan password baru.
        </div>
        <div class="text-center mt-4">
          <a href="/backend/tpsadmin" class="px-4 py-2 bg-[#0475BC] text-white rounded-lg hover:bg-[#0366a3] inline-block">
            Login Sekarang
          </a>
        </div>
      ` : tokenExpired ? `
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          Link reset password sudah kedaluwarsa. Silakan request ulang.
        </div>
        <div class="text-center mt-4">
          <a href="/backend/tpsadmin/forgot-password" class="text-sm text-[#0475BC] hover:underline">Request Reset Ulang</a>
        </div>
      ` : !token || !tokenValid ? `
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          Link reset password tidak valid atau sudah digunakan.
        </div>
        <div class="text-center mt-4">
          <a href="/backend/tpsadmin/forgot-password" class="text-sm text-[#0475BC] hover:underline">Request Reset Ulang</a>
        </div>
      ` : `
        ${error ? `
          <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            ${escapeHtml(decodeURIComponent(error))}
          </div>
        ` : ""}

        <form id="resetForm" onsubmit="submitReset(event)" class="space-y-4">
          <input type="hidden" id="token" value="${escapeHtml(token)}">

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
            <input type="password" id="password" required minlength="6"
                   class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0475BC] focus:border-[#0475BC]"
                   placeholder="Masukkan password baru">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password</label>
            <input type="password" id="confirmPassword" required minlength="6"
                   class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0475BC] focus:border-[#0475BC]"
                   placeholder="Ulangi password baru">
          </div>

          <button type="submit" id="submitBtn"
                  class="w-full px-4 py-2.5 bg-[#0475BC] text-white rounded-lg hover:bg-[#0366a3] font-medium">
            Reset Password
          </button>
        </form>
      `}

      <div class="mt-4 text-center">
        <a href="/backend/tpsadmin" class="text-sm text-[#0475BC] hover:underline">Kembali ke Login</a>
      </div>
    </div>
  </div>

  <script>
    async function submitReset(e) {
      e.preventDefault();
      var pw = document.getElementById('password').value;
      var cpw = document.getElementById('confirmPassword').value;
      if (pw !== cpw) {
        alert('Password dan konfirmasi tidak sama!');
        return;
      }
      var btn = document.getElementById('submitBtn');
      btn.disabled = true;
      btn.textContent = 'Memproses...';

      try {
        var res = await fetch('/backend/api/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: document.getElementById('token').value,
            password: pw,
          }),
        });
        var result = await res.json();
        if (result.status === 'ok') {
          window.location.href = '/backend/tpsadmin/reset-password?success=1';
        } else {
          window.location.href = '/backend/tpsadmin/reset-password?token=' + document.getElementById('token').value + '&error=' + encodeURIComponent(result.message || 'Gagal reset password');
        }
      } catch (err) {
        btn.disabled = false;
        btn.textContent = 'Reset Password';
        alert('Error: ' + err.message);
      }
    }
  </script>
</body>
</html>`;

    return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
  },
};
