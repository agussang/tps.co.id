/**
 * Admin Sidebar Component
 * Shared sidebar for all TPS Admin pages
 *
 * Features:
 * - Consistent navigation like WordPress CMS
 * - Collapsible folders
 * - Drag-and-drop reordering
 * - All content structures visible
 */

import { g } from "utils/global";

interface ContentStructure {
  id: string;
  title: string;
  path: string;
  count: number;
  sortIdx: number;
  folderId: string | null;
  folderName: string | null;
  folderSortIdx: number;
}

interface FolderGroup {
  id: string;
  name: string;
  sortIdx: number;
  structures: ContentStructure[];
}

interface SidebarProps {
  activePage: "dashboard" | "content" | "pages" | "folders" | "users" | "roles";
  user: {
    username: string;
    role: { name: string };
  };
  currentStructureId?: string;
  structures?: ContentStructure[];
}

const escapeHtml = (str: string): string => {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/**
 * Load all content structures grouped by folder
 * This should be called once and passed to AdminSidebar
 */
export async function loadSidebarStructures(): Promise<ContentStructure[]> {
  if (!g.db) return [];

  const structures = await g.db.structure.findMany({
    where: {
      parent: null,
      status: "published",
      // Remove visible filter to show ALL structures
    },
    select: {
      id: true,
      path: true,
      title: true,
      sort_idx: true,
      id_folder: true,
      structure_folder: {
        select: { id: true, name: true, sort_idx: true },
      },
      _count: {
        select: {
          content: { where: { id_parent: null } },
        },
      },
    },
    orderBy: [
      { structure_folder: { sort_idx: "asc" } },
      { sort_idx: "asc" },
    ],
  });

  return structures.map((s) => ({
    id: s.id,
    path: s.path || "",
    title: s.title || "Untitled",
    count: s._count.content,
    sortIdx: s.sort_idx || 0,
    folderId: s.id_folder,
    folderName: s.structure_folder?.name || null,
    folderSortIdx: s.structure_folder?.sort_idx ?? 999,
  }));
}

export function AdminSidebar({
  activePage,
  user,
  currentStructureId,
  structures = [],
}: SidebarProps): string {
  const isActive = (page: string) => activePage === page;
  const activeClass = "bg-[#0475BC] text-white";
  const inactiveClass = "text-gray-700 hover:bg-gray-100";
  const isSuperAdmin = user.role.name === "superadmin";

  // Group structures by folder with proper ordering
  const folderGroups: FolderGroup[] = [];
  const noFolderStructures: ContentStructure[] = [];
  const folderMap: Map<string, FolderGroup> = new Map();

  structures.forEach((s) => {
    if (s.folderName && s.folderId) {
      if (!folderMap.has(s.folderId)) {
        const group: FolderGroup = {
          id: s.folderId,
          name: s.folderName,
          sortIdx: s.folderSortIdx,
          structures: [],
        };
        folderMap.set(s.folderId, group);
        folderGroups.push(group);
      }
      folderMap.get(s.folderId)!.structures.push(s);
    } else {
      noFolderStructures.push(s);
    }
  });

  // Sort folders by sortIdx
  folderGroups.sort((a, b) => a.sortIdx - b.sortIdx);

  // Sort structures within each folder
  folderGroups.forEach((group) => {
    group.structures.sort((a, b) => a.sortIdx - b.sortIdx);
  });

  // Sort no-folder structures
  noFolderStructures.sort((a, b) => a.sortIdx - b.sortIdx);

  // Check if current structure is in content section
  const isContentActive = activePage === "content" || currentStructureId;

  // Get folder icons based on category
  const getFolderIcon = (folderName: string): string => {
    const icons: Record<string, string> = {
      "Home": `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>`,
      "Berita": `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>`,
      "Karir": `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>`,
      "Fasilitas & Layanan": `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>`,
      "Throughputs": `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>`,
      "Kontak": `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>`,
      "Menu & Navigasi": `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>`,
      "CSR": `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>`,
      "Profil": `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>`,
      "Management": `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>`,
      "SMI": `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>`,
      "Tentang Kami": `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>`,
      "Unduh Dokumen": `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>`,
      "Lain-Lain": `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"/>`,
    };
    return icons[folderName] || `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>`;
  };

  // Generate collapsed state key for localStorage
  const getCollapseKey = (folderId: string) => `sidebar_folder_${folderId}`;

  return `
    <aside class="w-64 bg-white border-r fixed h-full overflow-y-auto flex flex-col z-20" id="admin-sidebar">
      <!-- Logo -->
      <div class="p-4 border-b flex-shrink-0">
        <a href="/backend/tpsadmin/dashboard" class="flex items-center gap-2">
          <img src="/_img/tps-logo.png" alt="TPS" class="h-8">
          <span class="font-bold text-gray-800">TPS Admin</span>
        </a>
      </div>

      <!-- Main Navigation -->
      <nav class="flex-1 overflow-y-auto">
        <div class="p-3">
          <!-- Dashboard -->
          <a href="/backend/tpsadmin/dashboard"
             ${isActive("dashboard") ? 'data-sidebar-active' : ''}
             class="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 ${isActive("dashboard") ? activeClass : inactiveClass}">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
            </svg>
            <span class="font-medium">Dashboard</span>
          </a>

          <!-- Content Section Header -->
          <div class="flex items-center justify-between mt-4 mb-2 px-3">
            <span class="text-xs font-semibold text-gray-400 uppercase">Kelola Konten</span>
            <span class="text-xs text-gray-400">${structures.length} item</span>
          </div>

          <!-- Content by Folder (Sortable) -->
          <div id="folder-list" class="sidebar-sortable">
            ${folderGroups.map(folder => {
              const isFolderActive = folder.structures.some(s => s.id === currentStructureId);
              const totalCount = folder.structures.reduce((sum, s) => sum + s.count, 0);
              return `
                <div class="folder-group mb-1" data-folder-id="${folder.id}" data-sort-idx="${folder.sortIdx}">
                  <button type="button"
                          data-toggle-folder="${folder.id}"
                          class="folder-toggle-btn w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isFolderActive ? 'bg-blue-50 text-[#0475BC]' : 'text-gray-700 hover:bg-gray-50'}">
                    <div class="flex items-center gap-2">
                      <svg class="w-4 h-4 drag-handle cursor-grab opacity-0 group-hover:opacity-100 hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"/>
                      </svg>
                      <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        ${getFolderIcon(folder.name)}
                      </svg>
                      <span class="truncate">${escapeHtml(folder.name)}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-xs ${isFolderActive ? 'text-[#0475BC]' : 'text-gray-400'}">${totalCount}</span>
                      <svg class="w-4 h-4 transition-transform folder-chevron" id="chevron-${folder.id}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                      </svg>
                    </div>
                  </button>
                  <div class="folder-content ml-4 border-l border-gray-200 pl-2 mt-1" id="folder-content-${folder.id}" data-collapsed="false">
                    ${folder.structures.map(s => `
                      <a href="/backend/tpsadmin/list/${s.id}"
                         class="structure-item flex items-center justify-between px-3 py-1.5 rounded text-sm transition-colors ${
                           currentStructureId === s.id
                             ? "bg-blue-100 text-[#0475BC] font-medium"
                             : "text-gray-600 hover:bg-gray-50"
                         }"
                         ${currentStructureId === s.id ? 'data-sidebar-active' : ''}
                         data-structure-id="${s.id}"
                         data-sort-idx="${s.sortIdx}">
                        <span class="truncate">${escapeHtml(s.title)}</span>
                        <span class="text-xs ${currentStructureId === s.id ? "text-[#0475BC]" : "text-gray-400"}">${s.count}</span>
                      </a>
                    `).join("")}
                  </div>
                </div>
              `;
            }).join("")}

            <!-- Structures without folder -->
            ${noFolderStructures.length > 0 ? `
              <div class="no-folder-group mt-2 pt-2 border-t border-gray-100">
                <div class="text-xs text-gray-400 px-3 mb-1">Tanpa Folder</div>
                ${noFolderStructures.map(s => `
                  <a href="/backend/tpsadmin/list/${s.id}"
                     class="structure-item flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                       currentStructureId === s.id
                         ? "bg-blue-100 text-[#0475BC] font-medium"
                         : "text-gray-600 hover:bg-gray-50"
                     }"
                     ${currentStructureId === s.id ? 'data-sidebar-active' : ''}
                     data-structure-id="${s.id}"
                     data-sort-idx="${s.sortIdx}">
                    <div class="flex items-center gap-2">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                      <span class="truncate">${escapeHtml(s.title)}</span>
                    </div>
                    <span class="text-xs ${currentStructureId === s.id ? "text-[#0475BC]" : "text-gray-400"}">${s.count}</span>
                  </a>
                `).join("")}
              </div>
            ` : ""}
          </div>

          <!-- Pengaturan Section -->
          <div class="text-xs font-semibold text-gray-400 uppercase mt-6 mb-2 px-3">Pengaturan</div>

          <!-- Dynamic Pages -->
          <a href="/backend/tpsadmin/pages"
             ${isActive("pages") ? 'data-sidebar-active' : ''}
             class="flex items-center gap-3 px-3 py-2 rounded-lg mb-1 ${isActive("pages") ? activeClass : inactiveClass}">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
            <span class="font-medium">Dynamic Pages</span>
          </a>

          <!-- Folders -->
          <a href="/backend/tpsadmin/folders"
             ${isActive("folders") ? 'data-sidebar-active' : ''}
             class="flex items-center gap-3 px-3 py-2 rounded-lg mb-1 ${isActive("folders") ? activeClass : inactiveClass}">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
            </svg>
            <span class="font-medium">Kelola Folder</span>
          </a>

          <!-- Admin Section (Superadmin only) -->
          ${isSuperAdmin ? `
            <div class="text-xs font-semibold text-gray-400 uppercase mt-6 mb-2 px-3">Administrasi</div>
            <a href="/backend/tpsadmin/user"
               ${isActive("users") ? 'data-sidebar-active' : ''}
               class="flex items-center gap-3 px-3 py-2 rounded-lg mb-1 ${isActive("users") ? activeClass : inactiveClass}">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
              </svg>
              <span class="font-medium">Kelola User</span>
            </a>
            <a href="/backend/tpsadmin/role"
               ${isActive("roles") ? 'data-sidebar-active' : ''}
               class="flex items-center gap-3 px-3 py-2 rounded-lg mb-1 ${isActive("roles") ? activeClass : inactiveClass}">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
              <span class="font-medium">Kelola Role</span>
            </a>
            <a href="/backend/tpsadmin/activity"
               ${isActive("activity") ? 'data-sidebar-active' : ''}
               class="flex items-center gap-3 px-3 py-2 rounded-lg mb-1 ${isActive("activity") ? activeClass : inactiveClass}">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span class="font-medium">Riwayat Aktivitas</span>
            </a>
            <a href="/backend/tpsadmin/settings"
               ${isActive("settings") ? 'data-sidebar-active' : ''}
               class="flex items-center gap-3 px-3 py-2 rounded-lg mb-1 ${isActive("settings") ? activeClass : inactiveClass}">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <span class="font-medium">Pengaturan</span>
            </a>
          ` : ""}
        </div>
      </nav>

      <!-- User Info -->
      <div class="p-3 border-t bg-gray-50 flex-shrink-0">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-[#0475BC] rounded-full flex items-center justify-center">
              <span class="text-white text-sm font-bold">${escapeHtml(user.username.charAt(0).toUpperCase())}</span>
            </div>
            <div>
              <div class="text-sm font-medium text-gray-800">${escapeHtml(user.username)}</div>
              <div class="text-xs text-gray-500">${escapeHtml(user.role.name)}</div>
            </div>
          </div>
          <button onclick="if(confirm('Yakin ingin logout?')){fetch('/backend/api/logout',{method:'POST',credentials:'include'}).finally(()=>{localStorage.removeItem('sid');window.location.href='/backend/tpsadmin';});}"
                  class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Logout">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>

    <!-- Sidebar JavaScript for collapsible folders and drag-drop -->
    <script>
      // Sidebar initialization - using event delegation for reliability
      (function() {
        // Clear old/corrupted localStorage data (one-time cleanup)
        var cleanupDone = localStorage.getItem('sidebar_cleanup_v3');
        if (!cleanupDone) {
          Object.keys(localStorage).filter(function(k) {
            return k.startsWith('sidebar_folder_');
          }).forEach(function(k) {
            localStorage.removeItem(k);
          });
          localStorage.setItem('sidebar_cleanup_v3', 'done');
        }

        // Toggle folder function
        function toggleFolder(folderId) {
          var content = document.getElementById('folder-content-' + folderId);
          var chevron = document.getElementById('chevron-' + folderId);

          if (!content) {
            console.error('Sidebar: Content not found for folder:', folderId);
            return;
          }

          var isCollapsed = content.dataset.collapsed === 'true';

          if (isCollapsed) {
            content.style.display = 'block';
            content.dataset.collapsed = 'false';
            if (chevron) chevron.style.transform = 'rotate(0deg)';
            localStorage.removeItem('sidebar_folder_' + folderId);
          } else {
            content.style.display = 'none';
            content.dataset.collapsed = 'true';
            if (chevron) chevron.style.transform = 'rotate(-90deg)';
            localStorage.setItem('sidebar_folder_' + folderId, 'collapsed');
          }
        }

        // Initialize folder states from localStorage
        function initFolderStates() {
          var folders = document.querySelectorAll('.folder-group');
          folders.forEach(function(folder) {
            var folderId = folder.dataset.folderId;
            if (!folderId) return;

            var content = document.getElementById('folder-content-' + folderId);
            var chevron = document.getElementById('chevron-' + folderId);
            var isCollapsed = localStorage.getItem('sidebar_folder_' + folderId) === 'collapsed';

            if (content) {
              if (isCollapsed) {
                content.style.display = 'none';
                content.dataset.collapsed = 'true';
                if (chevron) chevron.style.transform = 'rotate(-90deg)';
              } else {
                content.style.display = 'block';
                content.dataset.collapsed = 'false';
                if (chevron) chevron.style.transform = 'rotate(0deg)';
              }
            }
          });
        }

        // Event delegation for folder toggle buttons
        function setupFolderToggleListeners() {
          var folderList = document.getElementById('folder-list');
          if (!folderList) {
            console.error('[Sidebar] folder-list not found');
            return;
          }

          console.log('[Sidebar] Setting up click listeners on folder-list');

          folderList.addEventListener('click', function(e) {
            // Find the button that was clicked (or its parent button)
            var btn = e.target.closest('.folder-toggle-btn');
            if (!btn) {
              console.log('[Sidebar] Click not on folder button');
              return;
            }

            var folderId = btn.dataset.toggleFolder;
            console.log('[Sidebar] Folder button clicked:', folderId);

            if (!folderId) {
              console.error('[Sidebar] No folder ID found');
              return;
            }

            e.preventDefault();
            e.stopPropagation();
            toggleFolder(folderId);
          });
        }

        // Scroll sidebar to show active item
        function scrollToActiveItem() {
          var activeItem = document.querySelector('[data-sidebar-active]');
          if (activeItem) {
            var nav = document.querySelector('#admin-sidebar nav');
            if (nav) {
              var itemTop = activeItem.getBoundingClientRect().top;
              var navRect = nav.getBoundingClientRect();
              if (itemTop > navRect.bottom || itemTop < navRect.top) {
                activeItem.scrollIntoView({ block: 'center', behavior: 'smooth' });
              }
            }
          }
        }

        // Initialize everything
        function init() {
          initFolderStates();
          setupFolderToggleListeners();
          setTimeout(scrollToActiveItem, 100);
        }

        // Run init when DOM is ready
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', init);
        } else {
          // Small delay to ensure DOM is fully parsed
          setTimeout(init, 0);
        }

        // Also expose toggleFolder globally for debugging
        window.toggleFolder = toggleFolder;
      })();

      // Drag and Drop functionality - attached to window
      window.initFolderDragDrop = function() {
        const folderList = document.getElementById('folder-list');
        if (!folderList) return;

        let draggedItem = null;
        let draggedType = null;

        // Add drag events to folder groups (but not buttons)
        document.querySelectorAll('.folder-group').forEach(folder => {
          // Only make the drag-handle draggable, not the whole folder
          const dragHandle = folder.querySelector('.drag-handle');
          if (dragHandle) {
            dragHandle.addEventListener('mousedown', () => {
              folder.setAttribute('draggable', 'true');
            });
            dragHandle.addEventListener('mouseup', () => {
              folder.setAttribute('draggable', 'false');
            });
          }

          folder.classList.add('group');

          folder.addEventListener('dragstart', (e) => {
            draggedItem = folder;
            draggedType = 'folder';
            folder.classList.add('opacity-50');
            e.dataTransfer.effectAllowed = 'move';
          });

          folder.addEventListener('dragend', () => {
            folder.classList.remove('opacity-50');
            folder.setAttribute('draggable', 'false');
            draggedItem = null;
            draggedType = null;
            // Remove all drop indicators
            document.querySelectorAll('.drop-indicator').forEach(el => el.remove());
          });

          folder.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (draggedType !== 'folder' || draggedItem === folder) return;

            const rect = folder.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;

            // Remove existing indicators
            document.querySelectorAll('.drop-indicator').forEach(el => el.remove());

            // Add indicator
            const indicator = document.createElement('div');
            indicator.className = 'drop-indicator h-0.5 bg-blue-500 rounded-full mx-2';

            if (e.clientY < midY) {
              folder.parentNode.insertBefore(indicator, folder);
            } else {
              folder.parentNode.insertBefore(indicator, folder.nextSibling);
            }
          });

          folder.addEventListener('drop', async (e) => {
            e.preventDefault();
            if (draggedType !== 'folder' || draggedItem === folder) return;

            const rect = folder.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;

            if (e.clientY < midY) {
              folder.parentNode.insertBefore(draggedItem, folder);
            } else {
              folder.parentNode.insertBefore(draggedItem, folder.nextSibling);
            }

            // Save new order
            await window.saveFolderOrder();
          });
        });
      }

      // Save folder order to server
      window.saveFolderOrder = async function() {
        const folders = document.querySelectorAll('.folder-group');
        const order = [];

        folders.forEach((folder, index) => {
          order.push({
            id: folder.dataset.folderId,
            sortIdx: index
          });
        });

        try {
          const response = await fetch('/backend/tpsadmin/api/folder-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ folders: order })
          });

          if (!response.ok) {
            console.error('Failed to save folder order');
          }
        } catch (err) {
          console.error('Error saving folder order:', err);
        }
      };

      // Initialize drag-and-drop after DOM ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', window.initFolderDragDrop);
      } else {
        window.initFolderDragDrop();
      }
    </script>
  `;
}
