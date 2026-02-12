/**
 * Admin User Management Page - Full SSR
 * Route: /backend/tpsadmin/user
 */

import { g } from "utils/global";
import { AdminSidebar, loadSidebarStructures } from "../components/AdminSidebar";

interface ContentStructure {
  id: string;
  title: string;
  count: number;
  folderId: string | null;
  folderName: string | null;
}

interface User {
  id: number;
  username: string;
  name: string | null;
  active: boolean;
  last_login: Date | null;
  role: { id: number; name: string };
}

interface Role {
  id: number;
  name: string;
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
    return null;
  }
};

const getUsers = async (): Promise<User[]> => {
  if (!g.db) return [];

  const users = await g.db.user.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      active: true,
      last_login: true,
      role: { select: { id: true, name: true } },
    },
    orderBy: { id: "asc" },
  });

  return users as User[];
};

const getRoles = async (): Promise<Role[]> => {
  if (!g.db) return [];

  const roles = await g.db.role.findMany({
    select: { id: true, name: true },
    orderBy: { id: "asc" },
  });

  return roles as Role[];
};


const escapeHtml = (str: string | null): string => {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const formatDate = (date: Date | null): string => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const renderPage = (user: any, users: User[], roles: Role[], structures: ContentStructure[]): string => {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kelola User - TPS Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="icon" href="/_img/tps-logo.png">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
  </style>
</head>
<body class="bg-gray-50">
  <div class="min-h-screen flex">
    ${AdminSidebar({
      activePage: "users",
      user: { username: user.username, role: user.role },
      structures,
    })}

    <!-- Main Content -->
    <main class="flex-1 ml-64">
      <!-- Header -->
      <header class="bg-white border-b sticky top-0 z-10">
        <div class="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 class="text-xl font-semibold text-gray-800">Kelola User</h1>
            <p class="text-sm text-gray-500">${users.length} user terdaftar</p>
          </div>
          <button onclick="showAddModal()" class="px-4 py-2 bg-[#0475BC] text-white rounded-lg hover:bg-[#0366a3] flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Tambah User
          </button>
        </div>
      </header>

      <!-- Content -->
      <div class="p-6">
        <div class="bg-white rounded-xl border overflow-hidden">
          <table class="w-full">
            <thead class="bg-gray-50 border-b">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">ID</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Username</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nama</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Last Login</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              ${users.map(u => `
                <tr class="hover:bg-gray-50">
                  <td class="px-4 py-3 text-sm text-gray-500">${u.id}</td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <div class="w-8 h-8 bg-[#0475BC] rounded-full flex items-center justify-center">
                        <span class="text-white text-xs font-bold">${escapeHtml(u.username.charAt(0).toUpperCase())}</span>
                      </div>
                      <span class="font-medium text-gray-800">${escapeHtml(u.username)}</span>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-600">${escapeHtml(u.name) || "-"}</td>
                  <td class="px-4 py-3">
                    <span class="px-2 py-1 text-xs font-medium rounded-full ${
                      u.role.name === "superadmin"
                        ? "bg-purple-100 text-purple-700"
                        : u.role.name.includes("admin")
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700"
                    }">
                      ${escapeHtml(u.role.name)}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="px-2 py-1 text-xs font-medium rounded-full ${
                      u.active
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }">
                      ${u.active ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-500">${formatDate(u.last_login)}</td>
                  <td class="px-4 py-3 text-right">
                    <div class="flex items-center justify-end gap-1">
                      <button onclick="showEditModal(${u.id}, '${escapeHtml(u.username)}', '${escapeHtml(u.name || "")}', ${u.role.id}, ${u.active})"
                              class="p-2 rounded-lg text-gray-500 hover:bg-gray-100" title="Edit">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                      </button>
                      <button onclick="toggleActive(${u.id}, ${!u.active})"
                              class="p-2 rounded-lg ${u.active ? "text-orange-500 hover:bg-orange-50" : "text-green-500 hover:bg-green-50"}"
                              title="${u.active ? "Nonaktifkan" : "Aktifkan"}">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          ${u.active
                            ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>'
                            : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>'
                          }
                        </svg>
                      </button>
                      <button onclick="deleteUser(${u.id}, '${escapeHtml(u.username)}')"
                              class="p-2 rounded-lg text-red-500 hover:bg-red-50" title="Hapus">
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
      </div>
    </main>
  </div>

  <!-- Add/Edit Modal -->
  <div id="userModal" class="fixed inset-0 bg-black/50 hidden items-center justify-center z-50">
    <div class="bg-white rounded-xl w-full max-w-md mx-4 overflow-hidden">
      <div class="px-6 py-4 border-b flex items-center justify-between">
        <h3 id="modalTitle" class="text-lg font-semibold text-gray-800">Tambah User</h3>
        <button onclick="closeModal()" class="p-1 rounded hover:bg-gray-100">
          <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <form id="userForm" onsubmit="saveUser(event)" class="p-6 space-y-4">
        <input type="hidden" id="userId" name="id" value="">

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input type="text" id="username" name="username" required
                 class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0475BC] focus:border-[#0475BC]"
                 placeholder="Username">
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
          <input type="text" id="name" name="name"
                 class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0475BC] focus:border-[#0475BC]"
                 placeholder="Nama Lengkap">
        </div>

        <div id="passwordField">
          <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input type="password" id="password" name="password"
                 class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0475BC] focus:border-[#0475BC]"
                 placeholder="Password">
          <p class="text-xs text-gray-500 mt-1" id="passwordHint">Kosongkan jika tidak ingin mengubah password</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select id="roleId" name="roleId" required
                  class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0475BC] focus:border-[#0475BC]">
            ${roles.map(r => `<option value="${r.id}">${escapeHtml(r.name)}</option>`).join("")}
          </select>
        </div>

        <div class="flex items-center gap-2">
          <input type="checkbox" id="active" name="active" class="rounded border-gray-300">
          <label for="active" class="text-sm text-gray-700">Aktif</label>
        </div>

        <div class="flex gap-3 pt-4">
          <button type="button" onclick="closeModal()"
                  class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            Batal
          </button>
          <button type="submit"
                  class="flex-1 px-4 py-2 bg-[#0475BC] text-white rounded-lg hover:bg-[#0366a3]">
            Simpan
          </button>
        </div>
      </form>
    </div>
  </div>

  <script>
    function showAddModal() {
      document.getElementById('modalTitle').textContent = 'Tambah User';
      document.getElementById('userId').value = '';
      document.getElementById('username').value = '';
      document.getElementById('name').value = '';
      document.getElementById('password').value = '';
      document.getElementById('roleId').value = '${roles[0]?.id || 1}';
      document.getElementById('active').checked = true;
      document.getElementById('passwordHint').style.display = 'none';
      document.getElementById('password').required = true;
      document.getElementById('userModal').classList.remove('hidden');
      document.getElementById('userModal').classList.add('flex');
    }

    function showEditModal(id, username, name, roleId, active) {
      document.getElementById('modalTitle').textContent = 'Edit User';
      document.getElementById('userId').value = id;
      document.getElementById('username').value = username;
      document.getElementById('name').value = name;
      document.getElementById('password').value = '';
      document.getElementById('roleId').value = roleId;
      document.getElementById('active').checked = active;
      document.getElementById('passwordHint').style.display = 'block';
      document.getElementById('password').required = false;
      document.getElementById('userModal').classList.remove('hidden');
      document.getElementById('userModal').classList.add('flex');
    }

    function closeModal() {
      document.getElementById('userModal').classList.add('hidden');
      document.getElementById('userModal').classList.remove('flex');
    }

    async function saveUser(e) {
      e.preventDefault();
      const form = document.getElementById('userForm');
      const data = {
        id: document.getElementById('userId').value || null,
        username: document.getElementById('username').value,
        name: document.getElementById('name').value,
        password: document.getElementById('password').value || null,
        roleId: parseInt(document.getElementById('roleId').value),
        active: document.getElementById('active').checked,
      };

      try {
        const res = await fetch('/backend/api/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(data),
        });

        const result = await res.json();
        if (res.ok && result.status === 'ok') {
          window.location.reload();
        } else {
          alert('Error: ' + (result.message || 'Failed to save user'));
        }
      } catch (err) {
        alert('Error: ' + err.message);
      }
    }

    async function toggleActive(id, active) {
      try {
        const res = await fetch('/backend/api/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id, active }),
        });

        const result = await res.json();
        if (res.ok && result.status === 'ok') {
          window.location.reload();
        } else {
          alert('Error: ' + (result.message || 'Failed to update user'));
        }
      } catch (err) {
        alert('Error: ' + err.message);
      }
    }

    async function deleteUser(id, username) {
      if (!confirm('Yakin ingin menghapus user "' + username + '"?')) return;

      try {
        const res = await fetch('/backend/api/user-delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id }),
        });

        const result = await res.json();
        if (res.ok && result.status === 'ok') {
          window.location.reload();
        } else {
          alert('Error: ' + (result.message || 'Failed to delete user'));
        }
      } catch (err) {
        alert('Error: ' + err.message);
      }
    }
  </script>
</body>
</html>`;
};

export const _ = {
  url: "/backend/tpsadmin/user",
  raw: true,
  async api(this: { req: Request; _url: URL }) {
    const req = this.req as Request;

    // Get session from cookie
    const cookies = req?.headers?.get("cookie") || "";
    const sidMatch = cookies.match(/sid=([^;]+)/);
    const sessionId = sidMatch?.[1] || "";

    const user = await getSessionUser(sessionId);

    if (!user) {
      return new Response("", {
        status: 302,
        headers: { Location: "/backend/tpsadmin" },
      });
    }

    // Check superadmin role
    if (user.role.name !== "superadmin") {
      return new Response("Forbidden - Superadmin only", { status: 403 });
    }

    const [users, roles, structures] = await Promise.all([
      getUsers(),
      getRoles(),
      loadSidebarStructures(),
    ]);

    const html = renderPage(user, users, roles, structures);

    return new Response(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  },
};
