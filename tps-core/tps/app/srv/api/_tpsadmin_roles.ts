/**
 * Admin Role Management Page - Full SSR
 * Route: /backend/tpsadmin/role
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

interface Role {
  id: number;
  name: string;
  id_parent: number | null;
  can_publish: boolean;
  parent?: { id: number; name: string } | null;
  _count: { user: number };
}

interface Folder {
  id: string;
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

const getRoles = async (): Promise<Role[]> => {
  if (!g.db) return [];

  const roles = await g.db.role.findMany({
    select: {
      id: true,
      name: true,
      id_parent: true,
      can_publish: true,
      role: { select: { id: true, name: true } },
      _count: { select: { user: true } },
    },
    orderBy: { id: "asc" },
  });

  return roles.map((r) => ({
    ...r,
    parent: r.role,
  })) as Role[];
};

const getFolders = async (): Promise<Folder[]> => {
  if (!g.db) return [];

  const folders = await g.db.structure_folder.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return folders as Folder[];
};

const getRoleMenus = async (roleId: number): Promise<string[]> => {
  if (!g.db) return [];

  const menus = await g.db.role_menu.findMany({
    where: { id_role: roleId },
    select: { id_menu: true },
  });

  return menus.map((m) => m.id_menu);
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

const renderPage = (
  user: any,
  roles: Role[],
  folders: Folder[],
  structures: ContentStructure[]
): string => {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kelola Role - TPS Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="icon" href="/_img/tps-logo.png">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
  </style>
</head>
<body class="bg-gray-50">
  <div class="min-h-screen flex">
    ${AdminSidebar({
      activePage: "roles",
      user: { username: user.username, role: user.role },
      structures,
    })}

    <!-- Main Content -->
    <main class="flex-1 ml-64">
      <!-- Header -->
      <header class="bg-white border-b sticky top-0 z-10">
        <div class="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 class="text-xl font-semibold text-gray-800">Kelola Role</h1>
            <p class="text-sm text-gray-500">${roles.length} role terdaftar</p>
          </div>
          <div class="flex items-center gap-2">
            <div class="relative" id="exportDropdown">
              <button onclick="document.getElementById('exportMenu').classList.toggle('hidden')" class="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                Export
              </button>
              <div id="exportMenu" class="hidden absolute right-0 mt-1 w-40 bg-white border rounded-lg shadow-lg z-20">
                <a href="/backend/api/export?type=roles&format=csv" class="block px-4 py-2 text-sm hover:bg-gray-50">Export Excel (CSV)</a>
                <a href="/backend/api/export?type=roles&format=pdf" target="_blank" class="block px-4 py-2 text-sm hover:bg-gray-50">Export PDF</a>
              </div>
            </div>
            <button onclick="showAddModal()" class="px-4 py-2 bg-[#0475BC] text-white rounded-lg hover:bg-[#0366a3] flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Tambah Role
            </button>
          </div>
        </div>
      </header>

      <!-- Content -->
      <div class="p-6">
        <div class="bg-white rounded-xl border overflow-hidden">
          <table class="w-full">
            <thead class="bg-gray-50 border-b">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">ID</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nama Role</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Parent</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Can Publish</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User Count</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              ${roles
                .map(
                  (r) => `
                <tr class="hover:bg-gray-50">
                  <td class="px-4 py-3 text-sm text-gray-500">${r.id}</td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <div class="w-8 h-8 ${
                        r.name === "superadmin"
                          ? "bg-purple-500"
                          : r.name.includes("admin")
                          ? "bg-blue-500"
                          : "bg-gray-500"
                      } rounded-full flex items-center justify-center">
                        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                        </svg>
                      </div>
                      <span class="font-medium text-gray-800">${escapeHtml(r.name)}</span>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-600">${
                    r.parent ? escapeHtml(r.parent.name) : "-"
                  }</td>
                  <td class="px-4 py-3">
                    <span class="px-2 py-1 text-xs font-medium rounded-full ${
                      r.can_publish
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }">
                      ${r.can_publish ? "Ya" : "Tidak"}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                      ${r._count.user} user
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <div class="flex items-center justify-end gap-1">
                      <button onclick="showEditModal(${r.id}, '${escapeHtml(r.name)}', ${r.id_parent || "null"}, ${r.can_publish})"
                              class="p-2 rounded-lg text-gray-500 hover:bg-gray-100" title="Edit">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                      </button>
                      <button onclick="showMenuModal(${r.id}, '${escapeHtml(r.name)}')"
                              class="p-2 rounded-lg text-blue-500 hover:bg-blue-50" title="Kelola Menu">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"/>
                        </svg>
                      </button>
                      ${
                        r._count.user === 0
                          ? `
                      <button onclick="deleteRole(${r.id}, '${escapeHtml(r.name)}')"
                              class="p-2 rounded-lg text-red-500 hover:bg-red-50" title="Hapus">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                      `
                          : `
                      <button disabled
                              class="p-2 rounded-lg text-gray-300 cursor-not-allowed" title="Tidak bisa dihapus (memiliki user)">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                      `
                      }
                    </div>
                  </td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  </div>

  <!-- Add/Edit Role Modal -->
  <div id="roleModal" class="fixed inset-0 bg-black/50 hidden items-center justify-center z-50">
    <div class="bg-white rounded-xl w-full max-w-md mx-4 overflow-hidden">
      <div class="px-6 py-4 border-b flex items-center justify-between">
        <h3 id="modalTitle" class="text-lg font-semibold text-gray-800">Tambah Role</h3>
        <button onclick="closeModal()" class="p-1 rounded hover:bg-gray-100">
          <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <form id="roleForm" onsubmit="saveRole(event)" class="p-6 space-y-4">
        <input type="hidden" id="roleId" name="id" value="">

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nama Role</label>
          <input type="text" id="roleName" name="name" required
                 class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0475BC] focus:border-[#0475BC]"
                 placeholder="Nama Role">
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Parent Role</label>
          <select id="parentId" name="parentId"
                  class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0475BC] focus:border-[#0475BC]">
            <option value="">- Tidak ada parent -</option>
            ${roles.map((r) => `<option value="${r.id}">${escapeHtml(r.name)}</option>`).join("")}
          </select>
        </div>

        <div class="flex items-center gap-2">
          <input type="checkbox" id="canPublish" name="canPublish" class="rounded border-gray-300" checked>
          <label for="canPublish" class="text-sm text-gray-700">Bisa Publish</label>
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

  <!-- Role Menu Modal -->
  <div id="menuModal" class="fixed inset-0 bg-black/50 hidden items-center justify-center z-50">
    <div class="bg-white rounded-xl w-full max-w-md mx-4 overflow-hidden">
      <div class="px-6 py-4 border-b flex items-center justify-between">
        <h3 id="menuModalTitle" class="text-lg font-semibold text-gray-800">Kelola Menu</h3>
        <button onclick="closeMenuModal()" class="p-1 rounded hover:bg-gray-100">
          <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <form id="menuForm" onsubmit="saveRoleMenu(event)" class="p-6 space-y-4">
        <input type="hidden" id="menuRoleId" name="roleId" value="">

        <p class="text-sm text-gray-600">Pilih folder yang bisa diakses oleh role ini:</p>

        <div id="folderList" class="space-y-2 max-h-64 overflow-y-auto">
          ${folders
            .map(
              (f) => `
            <label class="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
              <input type="checkbox" name="folders" value="${f.id}" class="rounded border-gray-300">
              <span class="text-sm text-gray-700">${escapeHtml(f.name)}</span>
            </label>
          `
            )
            .join("")}
        </div>

        <div class="flex gap-3 pt-4">
          <button type="button" onclick="closeMenuModal()"
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
      document.getElementById('modalTitle').textContent = 'Tambah Role';
      document.getElementById('roleId').value = '';
      document.getElementById('roleName').value = '';
      document.getElementById('parentId').value = '';
      document.getElementById('canPublish').checked = true;
      document.getElementById('roleModal').classList.remove('hidden');
      document.getElementById('roleModal').classList.add('flex');
    }

    function showEditModal(id, name, parentId, canPublish) {
      document.getElementById('modalTitle').textContent = 'Edit Role';
      document.getElementById('roleId').value = id;
      document.getElementById('roleName').value = name;
      document.getElementById('parentId').value = parentId || '';
      document.getElementById('canPublish').checked = canPublish;
      document.getElementById('roleModal').classList.remove('hidden');
      document.getElementById('roleModal').classList.add('flex');
    }

    function closeModal() {
      document.getElementById('roleModal').classList.add('hidden');
      document.getElementById('roleModal').classList.remove('flex');
    }

    async function saveRole(e) {
      e.preventDefault();
      const data = {
        id: document.getElementById('roleId').value || null,
        name: document.getElementById('roleName').value,
        parentId: document.getElementById('parentId').value || null,
        canPublish: document.getElementById('canPublish').checked,
      };

      try {
        const res = await fetch('/backend/api/role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(data),
        });

        const result = await res.json();
        if (res.ok && result.status === 'ok') {
          window.location.reload();
        } else {
          alert('Error: ' + (result.message || 'Failed to save role'));
        }
      } catch (err) {
        alert('Error: ' + err.message);
      }
    }

    async function deleteRole(id, name) {
      if (!confirm('Yakin ingin menghapus role "' + name + '"?')) return;

      try {
        const res = await fetch('/backend/api/role-delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id }),
        });

        const result = await res.json();
        if (res.ok && result.status === 'ok') {
          window.location.reload();
        } else {
          alert('Error: ' + (result.message || 'Failed to delete role'));
        }
      } catch (err) {
        alert('Error: ' + err.message);
      }
    }

    async function showMenuModal(roleId, roleName) {
      document.getElementById('menuModalTitle').textContent = 'Kelola Menu: ' + roleName;
      document.getElementById('menuRoleId').value = roleId;

      // Reset all checkboxes
      document.querySelectorAll('#folderList input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
      });

      // Load current role menus
      try {
        const res = await fetch('/backend/api/role-menu?roleId=' + roleId, { credentials: 'include' });
        const result = await res.json();
        if (result.status === 'ok' && result.menus) {
          result.menus.forEach(menuId => {
            const cb = document.querySelector('#folderList input[value="' + menuId + '"]');
            if (cb) cb.checked = true;
          });
        }
      } catch (err) {
        console.error('Failed to load role menus:', err);
      }

      document.getElementById('menuModal').classList.remove('hidden');
      document.getElementById('menuModal').classList.add('flex');
    }

    function closeMenuModal() {
      document.getElementById('menuModal').classList.add('hidden');
      document.getElementById('menuModal').classList.remove('flex');
    }

    async function saveRoleMenu(e) {
      e.preventDefault();
      const roleId = document.getElementById('menuRoleId').value;
      const folders = [];
      document.querySelectorAll('#folderList input[type="checkbox"]:checked').forEach(cb => {
        folders.push(cb.value);
      });

      try {
        const res = await fetch('/backend/api/role-menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ roleId, folders }),
        });

        const result = await res.json();
        if (res.ok && result.status === 'ok') {
          closeMenuModal();
          alert('Menu berhasil disimpan');
        } else {
          alert('Error: ' + (result.message || 'Failed to save menu'));
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
  url: "/backend/tpsadmin/role",
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

    const [roles, folders, structures] = await Promise.all([
      getRoles(),
      getFolders(),
      loadSidebarStructures(),
    ]);

    const html = renderPage(user, roles, folders, structures);

    return new Response(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  },
};
