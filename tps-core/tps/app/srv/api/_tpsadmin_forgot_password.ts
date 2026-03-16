/**
 * Forgot Password Page - Public SSR
 * Route: /backend/tpsadmin/forgot-password
 */

import { g } from "utils/global";

const escapeHtml = (str: string | null): string => {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
};

export const _ = {
  url: "/backend/tpsadmin/forgot-password",
  raw: true,
  async api(this: { req: Request; _url: URL }) {
    const url = this._url || new URL(this.req?.url || "http://localhost");
    const success = url.searchParams.get("success");
    const error = url.searchParams.get("error");

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lupa Password - TPS Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="icon" href="/_img/tps-logo.png">
</head>
<body class="bg-gray-100 min-h-screen flex items-center justify-center">
  <div class="w-full max-w-md">
    <div class="bg-white rounded-xl shadow-lg p-8">
      <div class="text-center mb-6">
        <img src="/_img/tps-logo.png" alt="TPS" class="h-12 mx-auto mb-4">
        <h1 class="text-xl font-bold text-gray-800">Lupa Password</h1>
        <p class="text-sm text-gray-500 mt-1">Masukkan username dan email Anda untuk menerima link reset password</p>
      </div>

      ${success ? `
        <div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
          Link reset password telah dikirim ke email Anda. Silakan cek inbox atau folder spam.
        </div>
      ` : ""}

      ${error ? `
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          ${escapeHtml(decodeURIComponent(error))}
        </div>
      ` : ""}

      <form id="forgotForm" onsubmit="submitForgot(event)" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input type="text" id="username" name="username" required
                 class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0475BC] focus:border-[#0475BC]"
                 placeholder="Masukkan username">
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" id="email" name="email" required
                 class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0475BC] focus:border-[#0475BC]"
                 placeholder="Masukkan email terdaftar">
        </div>

        <button type="submit" id="submitBtn"
                class="w-full px-4 py-2.5 bg-[#0475BC] text-white rounded-lg hover:bg-[#0366a3] font-medium">
          Kirim Link Reset
        </button>
      </form>

      <div class="mt-4 text-center">
        <a href="/backend/tpsadmin" class="text-sm text-[#0475BC] hover:underline">Kembali ke Login</a>
      </div>
    </div>
  </div>

  <script>
    async function submitForgot(e) {
      e.preventDefault();
      var btn = document.getElementById('submitBtn');
      btn.disabled = true;
      btn.textContent = 'Mengirim...';

      try {
        var res = await fetch('/backend/api/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: document.getElementById('username').value,
            email: document.getElementById('email').value,
          }),
        });
        var result = await res.json();
        if (result.status === 'ok') {
          window.location.href = '/backend/tpsadmin/forgot-password?success=1';
        } else {
          window.location.href = '/backend/tpsadmin/forgot-password?error=' + encodeURIComponent(result.message || 'Terjadi kesalahan');
        }
      } catch (err) {
        window.location.href = '/backend/tpsadmin/forgot-password?error=' + encodeURIComponent('Gagal menghubungi server');
      }
    }
  </script>
</body>
</html>`;

    return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
  },
};
