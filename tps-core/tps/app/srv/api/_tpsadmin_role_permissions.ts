/**
 * Admin Role Permissions Page - Full SSR
 * Route: /backend/tpsadmin/role-permissions
 *
 * Granular structure-level CRUD permissions per role
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
  url: "/backend/tpsadmin/role-permissions",
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

    const db = g.db as any;
    const selectedRoleId = parseInt(url.searchParams.get("roleId") || "0");

    // Load roles
    const roles = await db.role.findMany({
      select: { id: true, name: true },
      orderBy: { id: "asc" },
    });

    // Load all structures grouped by folder
    const allStructures = await db.structure.findMany({
      where: { parent: null, status: "published" },
      select: {
        id: true, path: true, title: true, sort_idx: true, id_folder: true,
        structure_folder: { select: { id: true, name: true, sort_idx: true } },
      },
      orderBy: [{ structure_folder: { sort_idx: "asc" } }, { sort_idx: "asc" }],
    });

    // Load existing permissions for selected role
    let permissions: any[] = [];
    if (selectedRoleId) {
      permissions = await db.role_permission.findMany({
        where: { id_role: selectedRoleId },
      });
    }

    // Group structures by folder
    const folderMap = new Map<string, { name: string; sortIdx: number; structures: any[] }>();
    const noFolder: any[] = [];

    for (const s of allStructures) {
      if (s.structure_folder) {
        const fid = s.structure_folder.id;
        if (!folderMap.has(fid)) {
          folderMap.set(fid, { name: s.structure_folder.name, sortIdx: s.structure_folder.sort_idx, structures: [] });
        }
        folderMap.get(fid)!.structures.push(s);
      } else {
        noFolder.push(s);
      }
    }

    const folders = Array.from(folderMap.entries()).sort((a, b) => a[1].sortIdx - b[1].sortIdx);

    // Build permission map
    const permMap = new Map<string, any>();
    for (const p of permissions) {
      permMap.set(p.id_structure, p);
    }

    const structures = await loadSidebarStructures();

    const renderStructureRow = (s: any) => {
      const perm = permMap.get(s.id) || { can_view: false, can_add: false, can_edit: false, can_delete: false };
      return `
        <tr class="hover:bg-gray-50">
          <td class="px-4 py-2 text-sm text-gray-800">${escapeHtml(s.title)}</td>
          <td class="px-4 py-2 text-center">
            <input type="checkbox" name="perm_${s.id}_view" ${perm.can_view ? "checked" : ""}
                   class="perm-cb rounded border-gray-300" data-sid="${s.id}" data-type="view"
                   onchange="toggleRow(this)">
          </td>
          <td class="px-4 py-2 text-center">
            <input type="checkbox" name="perm_${s.id}_add" ${perm.can_add ? "checked" : ""}
                   class="perm-cb rounded border-gray-300" data-sid="${s.id}" data-type="add">
          </td>
          <td class="px-4 py-2 text-center">
            <input type="checkbox" name="perm_${s.id}_edit" ${perm.can_edit ? "checked" : ""}
                   class="perm-cb rounded border-gray-300" data-sid="${s.id}" data-type="edit">
          </td>
          <td class="px-4 py-2 text-center">
            <input type="checkbox" name="perm_${s.id}_delete" ${perm.can_delete ? "checked" : ""}
                   class="perm-cb rounded border-gray-300" data-sid="${s.id}" data-type="delete">
          </td>
        </tr>`;
    };

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hak Akses Role - TPS Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="icon" href="/_img/tps-logo.png">
</head>
<body class="bg-gray-50">
  <div class="min-h-screen flex">
    ${AdminSidebar({ activePage: "permissions", user: { username: user.username, role: user.role }, structures })}
    <main class="flex-1 ml-64">
      <header class="bg-white border-b sticky top-0 z-10">
        <div class="px-6 py-4">
          <h1 class="text-xl font-semibold text-gray-800">Hak Akses Role (Permissions)</h1>
          <p class="text-sm text-gray-500">Atur hak akses CRUD per struktur konten untuk setiap role</p>
        </div>
      </header>

      <div class="p-6 space-y-6">
        <!-- Role Selector -->
        <div class="bg-white rounded-xl border p-4">
          <div class="flex items-center gap-4">
            <label class="text-sm font-medium text-gray-700">Pilih Role:</label>
            <select id="roleSelector" onchange="window.location.href='?roleId='+this.value"
                    class="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0475BC] min-w-[200px]">
              <option value="">-- Pilih Role --</option>
              ${roles.map((r: any) => `
                <option value="${r.id}" ${r.id === selectedRoleId ? "selected" : ""}>${escapeHtml(r.name)}</option>
              `).join("")}
            </select>
            ${selectedRoleId ? `
              <div class="flex items-center gap-2 ml-auto">
                <button onclick="selectAll(true)" class="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50">Pilih Semua</button>
                <button onclick="selectAll(false)" class="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50">Hapus Semua</button>
                <button onclick="savePermissions()" class="px-4 py-2 bg-[#0475BC] text-white rounded-lg hover:bg-[#0366a3] text-sm font-medium">
                  Simpan Permissions
                </button>
              </div>
            ` : ""}
          </div>
        </div>

        ${selectedRoleId ? `
        <!-- Permissions Table -->
        <div class="bg-white rounded-xl border overflow-hidden">
          <table class="w-full">
            <thead class="bg-gray-50 border-b">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Struktur Konten</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase w-24">View</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase w-24">Add</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase w-24">Edit</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase w-24">Delete</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              ${folders.map(([fid, folder]) => `
                <tr class="bg-gray-100">
                  <td colspan="5" class="px-4 py-2">
                    <div class="flex items-center justify-between">
                      <span class="text-sm font-semibold text-gray-700">${escapeHtml(folder.name)}</span>
                      <div class="flex items-center gap-3">
                        <label class="text-xs text-gray-500 flex items-center gap-1 cursor-pointer">
                          <input type="checkbox" class="rounded border-gray-300" onchange="toggleFolder('${fid}', this.checked)"> Semua
                        </label>
                      </div>
                    </div>
                  </td>
                </tr>
                ${folder.structures.map(renderStructureRow).join("")}
              `).join("")}
              ${noFolder.length > 0 ? `
                <tr class="bg-gray-100">
                  <td colspan="5" class="px-4 py-2">
                    <span class="text-sm font-semibold text-gray-700">Tanpa Folder</span>
                  </td>
                </tr>
                ${noFolder.map(renderStructureRow).join("")}
              ` : ""}
            </tbody>
          </table>
        </div>

        <div class="flex justify-end">
          <button onclick="savePermissions()" class="px-6 py-2.5 bg-[#0475BC] text-white rounded-lg hover:bg-[#0366a3] font-medium">
            Simpan Permissions
          </button>
        </div>
        ` : `
        <div class="bg-white rounded-xl border p-12 text-center">
          <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
          </svg>
          <p class="text-gray-500">Pilih role terlebih dahulu untuk mengatur hak akses</p>
        </div>
        `}
      </div>
    </main>
  </div>

  <script>
    function toggleRow(viewCb) {
      // When view is unchecked, uncheck add/edit/delete too
      if (!viewCb.checked) {
        var sid = viewCb.dataset.sid;
        document.querySelectorAll('.perm-cb[data-sid="'+sid+'"]').forEach(function(cb) {
          cb.checked = false;
        });
      }
    }

    function toggleFolder(folderId, checked) {
      // Find the folder header row, then toggle all rows until next folder header
      var rows = document.querySelectorAll('tbody tr');
      var inFolder = false;
      rows.forEach(function(row) {
        if (row.classList.contains('bg-gray-100')) {
          // Check if this is the target folder
          var cb = row.querySelector('input[type="checkbox"]');
          if (cb && cb.getAttribute('onchange') && cb.getAttribute('onchange').indexOf(folderId) !== -1) {
            inFolder = true;
            return;
          } else {
            inFolder = false;
          }
        }
        if (inFolder) {
          row.querySelectorAll('.perm-cb').forEach(function(cb) {
            cb.checked = checked;
          });
        }
      });
    }

    function selectAll(checked) {
      document.querySelectorAll('.perm-cb').forEach(function(cb) {
        cb.checked = checked;
      });
    }

    async function savePermissions() {
      var roleId = ${selectedRoleId};
      var permissions = [];
      var processed = new Set();

      document.querySelectorAll('.perm-cb').forEach(function(cb) {
        var sid = cb.dataset.sid;
        if (processed.has(sid)) return;
        processed.add(sid);

        var view = document.querySelector('.perm-cb[data-sid="'+sid+'"][data-type="view"]');
        var add = document.querySelector('.perm-cb[data-sid="'+sid+'"][data-type="add"]');
        var edit = document.querySelector('.perm-cb[data-sid="'+sid+'"][data-type="edit"]');
        var del = document.querySelector('.perm-cb[data-sid="'+sid+'"][data-type="delete"]');

        permissions.push({
          id_structure: sid,
          can_view: view ? view.checked : false,
          can_add: add ? add.checked : false,
          can_edit: edit ? edit.checked : false,
          can_delete: del ? del.checked : false,
        });
      });

      try {
        var res = await fetch('/backend/api/role-permission', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ roleId: roleId, permissions: permissions }),
        });
        var result = await res.json();
        if (result.status === 'ok') {
          alert('Permissions berhasil disimpan!');
        } else {
          alert('Error: ' + (result.message || 'Gagal menyimpan'));
        }
      } catch (err) {
        alert('Error: ' + err.message);
      }
    }
  </script>
</body>
</html>`;

    return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
  },
};
