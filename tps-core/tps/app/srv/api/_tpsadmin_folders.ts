/**
 * Admin Folder Management Page - Full SSR
 * Route: /backend/tpsadmin/folders
 *
 * Manage folder grouping for structures
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

interface FolderItem {
  id: string;
  name: string;
  icon: string;
  sort_idx: number;
  id_parent: string | null;
  structures: StructureItem[];
  subfolders: FolderItem[];
}

interface StructureItem {
  id: string;
  title: string;
  icon: string;
  path: string;
  id_folder: string | null;
  sort_idx: number;
}

const getSessionUser = async (sessionId: string) => {
  if (!sessionId || !g.db) return null;

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
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
    console.error("Session lookup error:", e);
    return null;
  }
};

const getAllFolders = async (): Promise<FolderItem[]> => {
  if (!g.db) return [];

  const folders = await g.db.structure_folder.findMany({
    orderBy: { sort_idx: "asc" },
    select: {
      id: true,
      name: true,
      icon: true,
      sort_idx: true,
      id_parent: true,
    },
  });

  const structures = await g.db.structure.findMany({
    where: {
      parent: null,
    },
    orderBy: { sort_idx: "asc" },
    select: {
      id: true,
      title: true,
      icon: true,
      path: true,
      id_folder: true,
      sort_idx: true,
    },
  });

  const buildTree = (parentId: string | null): FolderItem[] => {
    return folders
      .filter((f) => f.id_parent === parentId)
      .map((folder) => ({
        id: folder.id,
        name: folder.name,
        icon: folder.icon || "",
        sort_idx: folder.sort_idx,
        id_parent: folder.id_parent,
        structures: structures
          .filter((s) => s.id_folder === folder.id)
          .map((s) => ({
            id: s.id,
            title: s.title || "Untitled",
            icon: s.icon || "",
            path: s.path || "",
            id_folder: s.id_folder,
            sort_idx: s.sort_idx || 0,
          })),
        subfolders: buildTree(folder.id),
      }));
  };

  return buildTree(null);
};

const getUngroupedStructures = async (): Promise<StructureItem[]> => {
  if (!g.db) return [];

  const structures = await g.db.structure.findMany({
    where: {
      parent: null,
      status: "published",
      id_folder: null,
    },
    orderBy: { sort_idx: "asc" },
    select: {
      id: true,
      title: true,
      icon: true,
      path: true,
      id_folder: true,
      sort_idx: true,
    },
  });

  return structures.map((s) => ({
    id: s.id,
    title: s.title || "Untitled",
    icon: s.icon || "",
    path: s.path || "",
    id_folder: s.id_folder,
    sort_idx: s.sort_idx || 0,
  }));
};

const getAllFoldersFlat = async (): Promise<
  { id: string; name: string; id_parent: string | null }[]
> => {
  if (!g.db) return [];

  return g.db.structure_folder.findMany({
    orderBy: { sort_idx: "asc" },
    select: { id: true, name: true, id_parent: true },
  });
};

const escapeHtml = (str: string): string => {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const renderFoldersPage = (
  user: { id: number; username: string; role: { id: number; name: string } },
  folders: FolderItem[],
  ungrouped: StructureItem[],
  allFoldersFlat: { id: string; name: string; id_parent: string | null }[],
  structures: ContentStructure[]
): string => {
  const renderFolder = (folder: FolderItem, depth: number = 0): string => {
    const paddingLeft = 16 + depth * 24;

    return `
      <div class="folder-item border-b" data-folder-id="${folder.id}" data-parent-id="${folder.id_parent || ""}">
        <div class="flex items-center py-3 px-4 hover:bg-gray-50 group" style="padding-left: ${paddingLeft}px">
          <button onclick="toggleFolderExpand('${folder.id}')" class="p-1 hover:bg-gray-200 rounded mr-1">
            <svg class="w-4 h-4 text-gray-400 folder-chevron-${folder.id} transition-transform transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
          <svg class="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
          </svg>
          <span class="font-medium text-gray-700 flex-1">${escapeHtml(folder.name)}</span>
          <span class="text-xs text-gray-400 mr-3">${folder.structures.length} struktur</span>
          <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onclick="editFolder('${folder.id}', '${escapeHtml(folder.name)}', '${folder.id_parent || ""}')"
                    class="p-1.5 rounded hover:bg-blue-100 text-blue-600" title="Edit">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </button>
            <button onclick="deleteFolder('${folder.id}', '${escapeHtml(folder.name)}')"
                    class="p-1.5 rounded hover:bg-red-100 text-red-600" title="Hapus">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="folder-content-${folder.id}">
          ${folder.structures
            .map(
              (s) => `
            <div class="flex items-center py-2 px-4 hover:bg-gray-50 border-t border-gray-100 group" style="padding-left: ${paddingLeft + 32}px" data-structure-id="${s.id}">
              <svg class="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <span class="text-sm text-gray-600 flex-1">${escapeHtml(s.title)}</span>
              <button onclick="removeFromFolder('${s.id}', '${escapeHtml(s.title)}')"
                      class="p-1 rounded hover:bg-gray-200 text-gray-400 opacity-0 group-hover:opacity-100" title="Keluarkan dari folder">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          `
            )
            .join("")}
          ${folder.subfolders.map((sf) => renderFolder(sf, depth + 1)).join("")}
        </div>
      </div>
    `;
  };

  const folderOptions = allFoldersFlat
    .map((f) => `<option value="${f.id}">${escapeHtml(f.name)}</option>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kelola Folder - TPS Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="icon" href="/_img/tps-logo.png">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    .folder-collapsed .folder-content { display: none; }
    .folder-collapsed .folder-chevron { transform: rotate(0deg) !important; }
    .modal-overlay { background: rgba(0,0,0,0.5); }
    .toast { position: fixed; bottom: 20px; right: 20px; padding: 12px 20px; border-radius: 8px; color: white; z-index: 1000; animation: slideIn 0.3s ease; }
    .toast-success { background: #22c55e; }
    .toast-error { background: #ef4444; }
    .toast-loading { background: #3b82f6; }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  </style>
</head>
<body class="bg-gray-50">
  <div class="min-h-screen flex">
    ${AdminSidebar({
      activePage: "folders",
      user: { username: user.username, role: { name: user.role.name } },
      structures,
    })}

    <!-- Main Content -->
    <main class="flex-1 ml-64 overflow-auto">
      <!-- Header -->
      <div class="sticky top-0 z-10 bg-white border-b px-6 py-3 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <svg class="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
          </svg>
          <h1 class="text-xl font-semibold text-gray-800">Kelola Folder</h1>
        </div>
        <button onclick="showAddFolderModal()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center font-medium">
          <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Tambah Folder
        </button>
      </div>

      <div class="p-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Folders Tree -->
          <div class="bg-white rounded-lg border shadow-sm overflow-hidden">
            <div class="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
              <h2 class="font-semibold text-gray-700 flex items-center">
                <svg class="w-5 h-5 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                </svg>
                Folder
              </h2>
              <span class="text-sm text-gray-500">${folders.length} folder</span>
            </div>
            <div class="divide-y max-h-[500px] overflow-auto">
              ${folders.length > 0 ? folders.map((f) => renderFolder(f)).join("") : `
                <div class="p-8 text-center text-gray-500">
                  <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                  </svg>
                  <p>Belum ada folder</p>
                  <p class="text-sm mt-1">Klik "Tambah Folder" untuk membuat folder baru</p>
                </div>
              `}
            </div>
          </div>

          <!-- Ungrouped Structures -->
          <div class="bg-white rounded-lg border shadow-sm overflow-hidden">
            <div class="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
              <h2 class="font-semibold text-gray-700 flex items-center">
                <svg class="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                Struktur Tanpa Folder
              </h2>
              <span class="text-sm text-gray-500">${ungrouped.length} struktur</span>
            </div>
            <div class="divide-y max-h-[500px] overflow-auto">
              ${ungrouped.length > 0 ? ungrouped.map((s) => `
                <div class="flex items-center py-3 px-4 hover:bg-gray-50 group" data-structure-id="${s.id}">
                  <svg class="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  <div class="flex-1">
                    <div class="font-medium text-gray-700">${escapeHtml(s.title)}</div>
                    <div class="text-xs text-gray-400">${escapeHtml(s.path)}</div>
                  </div>
                  <button onclick="showAssignModal('${s.id}', '${escapeHtml(s.title)}')"
                          class="px-3 py-1.5 rounded-lg text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                    </svg>
                    Masukkan ke Folder
                  </button>
                </div>
              `).join("") : `
                <div class="p-8 text-center text-gray-500">
                  <svg class="w-12 h-12 mx-auto mb-3 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  <p>Semua struktur sudah dikelompokkan</p>
                </div>
              `}
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>

  <!-- Add/Edit Folder Modal -->
  <div id="folderModal" class="fixed inset-0 z-50 hidden">
    <div class="modal-overlay absolute inset-0" onclick="closeFolderModal()"></div>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl w-full max-w-md">
      <div class="px-6 py-4 border-b flex items-center justify-between">
        <h3 id="folderModalTitle" class="text-lg font-semibold text-gray-800">Tambah Folder</h3>
        <button onclick="closeFolderModal()" class="p-1 hover:bg-gray-100 rounded-lg">
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <form id="folderForm" onsubmit="saveFolder(event)" class="p-6 space-y-4">
        <input type="hidden" id="folderId" value="">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nama Folder <span class="text-red-500">*</span></label>
          <input type="text" id="folderName" required
                 class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                 placeholder="Contoh: Berita & Artikel">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Parent Folder</label>
          <select id="folderParent"
                  class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
            <option value="">-- Tidak ada (Root) --</option>
            ${folderOptions}
          </select>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" onclick="closeFolderModal()" class="px-4 py-2 rounded-lg border hover:bg-gray-50">Batal</button>
          <button type="submit" class="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Simpan</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Assign to Folder Modal -->
  <div id="assignModal" class="fixed inset-0 z-50 hidden">
    <div class="modal-overlay absolute inset-0" onclick="closeAssignModal()"></div>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl w-full max-w-md">
      <div class="px-6 py-4 border-b flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-800">Masukkan ke Folder</h3>
        <button onclick="closeAssignModal()" class="p-1 hover:bg-gray-100 rounded-lg">
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <form id="assignForm" onsubmit="assignToFolder(event)" class="p-6 space-y-4">
        <input type="hidden" id="assignStructureId" value="">
        <p class="text-gray-600">Pilih folder untuk struktur: <strong id="assignStructureName"></strong></p>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Folder Tujuan <span class="text-red-500">*</span></label>
          <select id="assignFolderId" required
                  class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
            <option value="">-- Pilih Folder --</option>
            ${folderOptions}
          </select>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" onclick="closeAssignModal()" class="px-4 py-2 rounded-lg border hover:bg-gray-50">Batal</button>
          <button type="submit" class="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Simpan</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    // Toggle folder expand/collapse
    function toggleFolderExpand(folderId) {
      const folderItem = document.querySelector('[data-folder-id="' + folderId + '"]');
      const chevron = document.querySelector('.folder-chevron-' + folderId);
      const content = document.querySelector('.folder-content-' + folderId);

      if (content.style.display === 'none') {
        content.style.display = 'block';
        chevron.classList.add('rotate-90');
      } else {
        content.style.display = 'none';
        chevron.classList.remove('rotate-90');
      }
    }

    // Add Folder Modal
    function showAddFolderModal() {
      document.getElementById('folderModalTitle').textContent = 'Tambah Folder';
      document.getElementById('folderId').value = '';
      document.getElementById('folderName').value = '';
      document.getElementById('folderParent').value = '';
      document.getElementById('folderModal').classList.remove('hidden');
    }

    // Edit Folder Modal
    function editFolder(id, name, parentId) {
      document.getElementById('folderModalTitle').textContent = 'Edit Folder';
      document.getElementById('folderId').value = id;
      document.getElementById('folderName').value = name;
      document.getElementById('folderParent').value = parentId || '';
      document.getElementById('folderModal').classList.remove('hidden');
    }

    function closeFolderModal() {
      document.getElementById('folderModal').classList.add('hidden');
    }

    // Save folder (create or update)
    async function saveFolder(e) {
      e.preventDefault();

      const id = document.getElementById('folderId').value;
      const name = document.getElementById('folderName').value;
      const id_parent = document.getElementById('folderParent').value || null;

      showToast('Menyimpan...', 'loading');

      try {
        const res = await fetch('/backend/api/folder-save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id, name, id_parent })
        });

        const result = await res.json();

        if (result.status === 'ok') {
          showToast('Folder berhasil disimpan', 'success');
          setTimeout(() => window.location.reload(), 1000);
        } else {
          showToast('Gagal: ' + (result.error || 'Unknown error'), 'error');
        }
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      }
    }

    // Delete folder
    async function deleteFolder(id, name) {
      if (!confirm('Hapus folder "' + name + '"? Struktur di dalamnya akan menjadi tidak tergrup.')) return;

      showToast('Menghapus...', 'loading');

      try {
        const res = await fetch('/backend/api/folder-delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id })
        });

        const result = await res.json();

        if (result.status === 'ok') {
          showToast('Folder berhasil dihapus', 'success');
          setTimeout(() => window.location.reload(), 1000);
        } else {
          showToast('Gagal: ' + (result.error || 'Unknown error'), 'error');
        }
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      }
    }

    // Assign Modal
    function showAssignModal(structureId, structureName) {
      document.getElementById('assignStructureId').value = structureId;
      document.getElementById('assignStructureName').textContent = structureName;
      document.getElementById('assignFolderId').value = '';
      document.getElementById('assignModal').classList.remove('hidden');
    }

    function closeAssignModal() {
      document.getElementById('assignModal').classList.add('hidden');
    }

    // Assign structure to folder
    async function assignToFolder(e) {
      e.preventDefault();

      const structureId = document.getElementById('assignStructureId').value;
      const folderId = document.getElementById('assignFolderId').value;

      showToast('Menyimpan...', 'loading');

      try {
        const res = await fetch('/backend/api/structure-assign-folder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ structureId, folderId })
        });

        const result = await res.json();

        if (result.status === 'ok') {
          showToast('Struktur berhasil dimasukkan ke folder', 'success');
          setTimeout(() => window.location.reload(), 1000);
        } else {
          showToast('Gagal: ' + (result.error || 'Unknown error'), 'error');
        }
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      }
    }

    // Remove structure from folder
    async function removeFromFolder(structureId, structureName) {
      if (!confirm('Keluarkan "' + structureName + '" dari folder?')) return;

      showToast('Menyimpan...', 'loading');

      try {
        const res = await fetch('/backend/api/structure-assign-folder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ structureId, folderId: null })
        });

        const result = await res.json();

        if (result.status === 'ok') {
          showToast('Struktur berhasil dikeluarkan dari folder', 'success');
          setTimeout(() => window.location.reload(), 1000);
        } else {
          showToast('Gagal: ' + (result.error || 'Unknown error'), 'error');
        }
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      }
    }

    // Toast notification
    function showToast(message, type) {
      const existing = document.querySelector('.toast');
      if (existing) existing.remove();

      const toast = document.createElement('div');
      toast.className = 'toast toast-' + type;
      toast.textContent = message;
      document.body.appendChild(toast);

      if (type !== 'loading') {
        setTimeout(() => toast.remove(), 3000);
      }
    }

    // Logout
    function logout() {
      if (confirm('Confirm logout?')) {
        localStorage.removeItem('sid');
        document.cookie = 'sid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        window.location.href = '/backend/tpsadmin';
      }
    }
  </script>
</body>
</html>`;
};

const renderLoginRedirect = (): string => {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Redirecting...</title>
  <script>
    localStorage.removeItem('sid');
    window.location.href = '/backend/tpsadmin';
  </script>
</head>
<body><p>Redirecting to login...</p></body>
</html>`;
};

export const _ = {
  url: "/backend/tpsadmin/folders",
  raw: true,
  async api(this: { req: Request; _url: URL }) {
    const req = this.req as Request;

    // Get session
    const cookies = req?.headers?.get("cookie") || "";
    const sidMatch = cookies.match(/sid=([^;]+)/);
    let sessionId = sidMatch ? sidMatch[1] : "";

    if (!sessionId) {
      return new Response(
        `<!DOCTYPE html>
<html>
<head><title>Loading...</title>
<script>
  const sid = localStorage.getItem('sid');
  if (sid) {
    document.cookie = 'sid=' + sid + '; path=/';
    window.location.reload();
  } else {
    window.location.href = '/backend/tpsadmin';
  }
</script>
</head>
<body><p>Loading...</p></body>
</html>`,
        { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    // Validate session
    const user = await getSessionUser(sessionId);
    if (!user) {
      return new Response(renderLoginRedirect(), {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Get data
    const [folders, ungrouped, allFoldersFlat, structures] = await Promise.all([
      getAllFolders(),
      getUngroupedStructures(),
      getAllFoldersFlat(),
      loadSidebarStructures(),
    ]);

    // Render page
    const html = renderFoldersPage(user, folders, ungrouped, allFoldersFlat, structures);

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Set-Cookie": `sid=${sessionId}; Path=/; HttpOnly; SameSite=Lax`,
      },
    });
  },
};
