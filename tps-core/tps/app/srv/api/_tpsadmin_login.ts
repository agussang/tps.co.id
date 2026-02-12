/**
 * TPS Admin Login Page (SSR Standalone)
 * Route: /backend/tpsadmin
 */

export const _ = {
  url: "/backend/tpsadmin",
  raw: true,
  async api(this: { req: Request; _url: URL }) {
    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login - TPS Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="icon" href="/_img/tps-logo.png">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
  </style>
</head>
<body class="bg-gray-100 min-h-screen flex items-center justify-center">
  <div class="w-full max-w-md">
    <div class="bg-white rounded-lg shadow-lg p-8">
      <!-- Logo -->
      <div class="text-center mb-8">
        <img src="/_img/tps-logo.png" alt="TPS" class="h-16 mx-auto mb-4">
        <h1 class="text-2xl font-bold text-gray-800">TPS Admin</h1>
        <p class="text-gray-500 text-sm">Silakan login untuk melanjutkan</p>
      </div>

      <!-- Login Form -->
      <form id="loginForm" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input type="text" id="username" name="username" required
                 class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                 placeholder="Masukkan username">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input type="password" id="password" name="password" required
                 class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                 placeholder="Masukkan password">
        </div>
        <div id="errorMsg" class="hidden text-red-600 text-sm bg-red-50 p-3 rounded-lg"></div>
        <button type="submit" id="submitBtn"
                class="w-full bg-[#0475BC] text-white py-2.5 rounded-lg font-medium hover:bg-[#0369a1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          Login
        </button>
      </form>
    </div>
    <p class="text-center text-gray-400 text-xs mt-4">PT Terminal Petikemas Surabaya</p>
  </div>

  <script>
    // Check if already logged in - verify with server
    (async function() {
      const sid = localStorage.getItem('sid');
      if (sid) {
        // Set cookie first so server can verify
        document.cookie = 'sid=' + sid + '; path=/';

        try {
          const res = await fetch('/backend/api/session-check', {
            credentials: 'include'
          });
          const data = await res.json();

          if (data.valid) {
            // Session is valid, redirect to dashboard
            window.location.href = '/backend/tpsadmin/dashboard';
            return;
          }
        } catch (e) {
          console.log('Session check failed:', e);
        }

        // Session is invalid, clear localStorage
        localStorage.removeItem('sid');
        document.cookie = 'sid=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
      }
    })();

    // Handle form submit
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
      e.preventDefault();

      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const errorMsg = document.getElementById('errorMsg');
      const submitBtn = document.getElementById('submitBtn');

      errorMsg.classList.add('hidden');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Loading...';

      try {
        console.log('[LOGIN] Sending request...');
        const res = await fetch('/backend/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ username, password })
        });

        const data = await res.json();
        console.log('[LOGIN] Response:', data);

        if (data.StatusCode === '200' && data.session_id) {
          // Save session
          console.log('[LOGIN] Success! Saving session:', data.session_id);
          localStorage.setItem('sid', data.session_id);
          document.cookie = 'sid=' + data.session_id + '; path=/; SameSite=Lax';

          // Redirect to dashboard
          console.log('[LOGIN] Redirecting to dashboard...');
          window.location.href = '/backend/tpsadmin/dashboard';
        } else {
          console.log('[LOGIN] Failed:', data.message);
          errorMsg.textContent = data.message || 'Login gagal';
          errorMsg.classList.remove('hidden');
        }
      } catch (err) {
        console.error('[LOGIN] Error:', err);
        errorMsg.textContent = 'Terjadi kesalahan: ' + err.message;
        errorMsg.classList.remove('hidden');
      }

      submitBtn.disabled = false;
      submitBtn.textContent = 'Login';
    });
  </script>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  },
};
