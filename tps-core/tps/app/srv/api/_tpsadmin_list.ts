/**
 * Admin Content List Page - Full SSR with Nested Items Support
 * Route: /backend/tpsadmin/list/:structureId
 *
 * Server-side rendered content list that integrates with SSR edit page
 * Supports nested/repeater fields (multiple=true)
 */

import { g } from "utils/global";
import { AdminSidebar, loadSidebarStructures } from "../components/AdminSidebar";

interface ContentItem {
  id: string;
  status: string;
  lang: string;
  created_at: Date | null;
  updated_at: Date | null;
  fields: Record<string, any>;
  nestedCounts: NestedCountGroup[];
}

interface NestedCountGroup {
  structureId: string;
  structureTitle: string;
  structurePath: string;
  count: number;
}

interface StructureInfo {
  id: string;
  title: string;
  path: string;
}

interface FieldDef {
  id: string;
  path: string;
  title: string;
  type: string;
  multiple: boolean;
}

interface ContentStructure {
  id: string;
  title: string;
  count: number;
  folderId: string | null;
  folderName: string | null;
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

const getStructureInfo = async (
  structureId: string
): Promise<StructureInfo | null> => {
  if (!g.db) return null;

  const structure = await g.db.structure.findFirst({
    where: { id: structureId },
    select: { id: true, title: true, path: true },
  });

  return structure
    ? {
        id: structure.id,
        title: structure.title || "Untitled",
        path: structure.path || "",
      }
    : null;
};


const getFieldDefinitions = async (
  structurePath: string
): Promise<FieldDef[]> => {
  if (!g.db) return [];

  const pathDepth = structurePath.split(".").length;

  const fields = await g.db.structure.findMany({
    where: {
      path: { startsWith: `${structurePath}.` },
      visible: true,
    },
    orderBy: { sort_idx: "asc" },
    select: { id: true, path: true, title: true, type: true, multiple: true },
  });

  // Only direct children
  const directFields = fields
    .filter((f) => {
      const fieldDepth = (f.path || "").split(".").length;
      return fieldDepth === pathDepth + 1;
    })
    .map((f) => ({
      id: f.id,
      path: f.path || "",
      title: f.title || "",
      type: f.type || "text",
      multiple: f.multiple || false,
    }));

  // If no fields found, return default columns based on common patterns
  if (directFields.length === 0) {
    const anyChildren = await g.db.structure.findFirst({
      where: { path: { startsWith: `${structurePath}.` } },
      select: { id: true, path: true, title: true, type: true, multiple: true },
    });

    if (anyChildren) {
      return [
        {
          id: anyChildren.id,
          path: anyChildren.path || "",
          title: anyChildren.title || "Title",
          type: anyChildren.type || "text",
          multiple: anyChildren.multiple || false,
        },
      ];
    }
  }

  return directFields;
};

// Get nested item count for a repeater field (optimized - just count, no full load)
const getNestedItemCount = async (
  parentContentId: string,
  repeaterStructureId: string
): Promise<number> => {
  if (!g.db) return 0;

  // Just count - no loading of nested data
  const count = await g.db.content.count({
    where: {
      id_parent: parentContentId,
      id_structure: repeaterStructureId,
    },
  });

  return count;
};

const getContentList = async (
  structureId: string,
  structurePath: string,
  fieldDefs: FieldDef[],
  status: string,
  search: string,
  lang: string,
  page: number,
  limit: number,
  sortBy: string = "updated_at",
  sortDir: string = "desc"
): Promise<{
  items: ContentItem[];
  total: number;
  countId: number;
  countEn: number;
}> => {
  if (!g.db) return { items: [], total: 0, countId: 0, countEn: 0 };

  const baseWhere: any = {
    id_structure: structureId,
    id_parent: null,
  };

  if (status && status !== "all") {
    baseWhere.status = status;
  }

  // Build language filter
  const where: any = { ...baseWhere };
  if (lang === "id") {
    where.OR = [{ lang: "id" }, { lang: null }, { lang: "inherited" }];
  } else if (lang === "en") {
    where.lang = "en";
  }

  // Get counts for each language (for badge display)
  const [countId, countEn] = await Promise.all([
    g.db.content.count({
      where: {
        ...baseWhere,
        OR: [{ lang: "id" }, { lang: null }, { lang: "inherited" }],
      },
    }),
    g.db.content.count({
      where: { ...baseWhere, lang: "en" },
    }),
  ]);

  // Get total count for current filter
  const total = await g.db.content.count({ where });

  // Build orderBy based on sort parameter
  // For content table columns: created_at, updated_at, status
  const validSortColumns = ["updated_at", "created_at", "status"];
  const orderByColumn = validSortColumns.includes(sortBy) ? sortBy : "created_at";
  const orderByDir = sortDir === "asc" ? "asc" : "desc";

  // Get content items - use multiple orderBy for null handling
  const orderBy: any[] = [];
  if (orderByColumn === "updated_at") {
    // Sort by updated_at, then created_at as fallback for nulls
    orderBy.push({ updated_at: { sort: orderByDir, nulls: "last" } });
    orderBy.push({ created_at: orderByDir });
  } else {
    orderBy.push({ [orderByColumn]: orderByDir });
  }

  const contents = await g.db.content.findMany({
    where,
    orderBy,
    skip: (page - 1) * limit,
    take: limit,
    select: {
      id: true,
      status: true,
      lang: true,
      updated_at: true,
      created_at: true,
    },
  });

  // Get repeater fields
  const repeaterFields = fieldDefs.filter((f) => f.multiple);

  // Get field values for each content
  const items: ContentItem[] = [];

  for (const content of contents) {
    const children = await g.db.content.findMany({
      where: { id_parent: content.id },
      select: {
        id: true,
        text: true,
        id_structure: true,
        structure: { select: { path: true, type: true, multiple: true } },
        file: { select: { path: true } },
      },
    });

    const fields: Record<string, any> = {};
    const nestedCounts: NestedCountGroup[] = [];

    for (const child of children) {
      if (child.structure?.path) {
        const fieldName = child.structure.path.split(".").pop() || "";

        // Skip repeater containers - we'll count them separately
        if (child.structure.multiple) {
          continue;
        } else if (child.structure.type === "file" && child.file) {
          fields[fieldName] = child.file.path;
        } else {
          fields[fieldName] = child.text || "";
        }
      }
    }

    // Get counts for repeater fields (optimized - only counts, no full load)
    for (const repeater of repeaterFields) {
      const count = await getNestedItemCount(content.id, repeater.id);
      if (count > 0) {
        nestedCounts.push({
          structureId: repeater.id,
          structureTitle: repeater.title,
          structurePath: repeater.path,
          count,
        });
      }
    }

    // Search filter (only search in direct fields, not nested - for performance)
    if (search) {
      const searchLower = search.toLowerCase();
      const hasMatch = Object.values(fields).some(
        (v) => v && String(v).toLowerCase().includes(searchLower)
      );
      if (!hasMatch) continue;
    }

    // Determine display language
    const displayLang = content.lang === "en" ? "en" : "id";

    items.push({
      id: content.id,
      status: content.status || "draft",
      lang: displayLang,
      created_at: content.created_at,
      updated_at: content.updated_at,
      fields,
      nestedCounts,
    });
  }

  return { items, total, countId, countEn };
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

const stripHtml = (str: string): string => {
  if (!str) return "";
  return String(str).replace(/<[^>]*>/g, "").trim();
};

const formatDate = (date: Date | null): string => {
  if (!date) return "-";
  const d = new Date(date);
  const yy = d.getFullYear().toString().slice(-2);
  const mm = (d.getMonth() + 1).toString().padStart(2, "0");
  const dd = d.getDate().toString().padStart(2, "0");
  const hh = d.getHours().toString().padStart(2, "0");
  const min = d.getMinutes().toString().padStart(2, "0");
  return `${yy}-${mm}-${dd} ${hh}:${min}`;
};

const renderListPage = (
  user: { id: number; username: string; role: { id: number; name: string } },
  structure: StructureInfo,
  structures: ContentStructure[],
  fieldDefs: FieldDef[],
  items: ContentItem[],
  total: number,
  countId: number,
  countEn: number,
  currentStatus: string,
  currentSearch: string,
  currentLang: string,
  currentPage: number,
  limit: number,
  currentSort: string,
  currentSortDir: string
): string => {
  const totalPages = Math.ceil(total / limit);

  // Select which columns to show (max 5, excluding multiple fields)
  const simpleFields = fieldDefs.filter((f) => !f.multiple);
  const displayFields = simpleFields.slice(0, 5);
  const repeaterFields = fieldDefs.filter((f) => f.multiple);
  const hasRepeaters = repeaterFields.length > 0;

  // Month names for display
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const renderCellValue = (field: FieldDef, value: any) => {
    if (!value && value !== 0) return '<span class="text-gray-400">-</span>';

    if (field.type === "file") {
      const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(value);
      if (isImage) {
        return `<img src="/_img/${escapeHtml(value)}?h=40" class="h-10 w-10 object-cover rounded border" onerror="this.outerHTML='<span class=\\'text-gray-400\\'>File</span>'">`;
      }
      return `<a href="/_file/${escapeHtml(value)}" target="_blank" class="text-blue-600 hover:underline text-sm">View File</a>`;
    }

    // Special handling for month field - show month name
    const fieldName = field.path.split(".").pop() || "";
    if (fieldName === "month" && field.type === "number") {
      const monthNum = parseInt(String(value));
      if (monthNum >= 1 && monthNum <= 12) {
        return `<span class="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-sm">${monthNames[monthNum - 1]}</span>`;
      }
    }

    // Special handling for domestics/international fields - format as number
    if ((fieldName === "domestics" || fieldName === "international") &&
        (field.path.includes("throughput") || field.path.includes("annual_throughput"))) {
      const num = parseInt(String(value).replace(/[^\d-]/g, ""));
      if (!isNaN(num)) {
        return `<span class="font-mono text-gray-800">${num.toLocaleString("id-ID")}</span>`;
      }
    }

    // Format numbers with thousand separator
    if (field.type === "number") {
      const num = parseInt(String(value).replace(/[^\d-]/g, ""));
      if (!isNaN(num)) {
        return `<span class="font-mono text-gray-800">${num.toLocaleString("id-ID")}</span>`;
      }
    }

    // Strip HTML and truncate long text
    const text = stripHtml(String(value));
    if (text.length > 50) {
      return `<span title="${escapeHtml(text)}">${escapeHtml(text.substring(0, 50))}...</span>`;
    }
    return escapeHtml(text);
  };

  // Render nested items section (simplified - just shows counts and link to manage)
  const renderNestedCounts = (item: ContentItem) => {
    if (item.nestedCounts.length === 0) return "";

    return item.nestedCounts
      .map(
        (group) => `
      <tr class="nested-row" data-parent="${item.id}">
        <td colspan="${displayFields.length + 6}" class="px-4 py-0 bg-gray-50">
          <div class="py-3 border-l-4 border-blue-400 pl-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
                </svg>
                <span class="font-medium text-gray-700">${escapeHtml(group.structureTitle)}</span>
                <span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">${group.count} items</span>
              </div>
              <a href="/backend/tpsadmin/nested/${item.id}/${group.structureId}"
                 class="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
                Kelola ${escapeHtml(group.structureTitle)}
              </a>
            </div>
          </div>
        </td>
      </tr>
    `
      )
      .join("");
  };

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(structure.title)} - TPS Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="icon" href="/_img/tps-logo.png">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    .table-row:hover { background-color: #f9fafb; }
    .status-badge { font-size: 11px; padding: 2px 8px; border-radius: 9999px; font-weight: 500; }
    .status-published { background: #dcfce7; color: #166534; }
    .status-draft { background: #fef9c3; color: #854d0e; }
    .status-inherited { background: #f3f4f6; color: #6b7280; }
    /* Folder styling */
    .folder-group .folder-content { display: block; }
    .folder-group.collapsed .folder-content { display: none; }
    .folder-group .folder-chevron { transform: rotate(90deg); }
    .folder-group.collapsed .folder-chevron { transform: rotate(0deg); }
    /* Nested items styling */
    .nested-row { display: none; }
    .nested-row.expanded { display: table-row; }
    .expand-btn.expanded svg { transform: rotate(180deg); }
    /* Sort icon rotation */
    .rotate-180 { transform: rotate(180deg); }
  </style>
</head>
<body class="bg-gray-50">
  <div class="min-h-screen flex">
    ${AdminSidebar({
      activePage: "content",
      user: { username: user.username, role: { name: user.role.name } },
      currentStructureId: structure.id,
      structures,
    })}

    <!-- Main Content -->
    <main class="flex-1 ml-64 overflow-auto">
      <!-- Header -->
      <div class="sticky top-0 z-10 bg-white border-b px-6 py-3 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          <h1 class="text-xl font-semibold text-gray-800">${escapeHtml(structure.title)}</h1>
          <span class="text-sm text-gray-400">(${total} items)</span>
          ${
            hasRepeaters
              ? `<span class="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Has nested items</span>`
              : ""
          }
        </div>
        <a href="/backend/tpsadmin/add/${structure.id}" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center font-medium">
          <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Add Content
        </a>
      </div>

      <!-- Filters -->
      <div class="px-6 py-4 bg-white border-b flex items-center gap-4 flex-wrap">
        <!-- Status Filter -->
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-500 uppercase font-semibold">Status:</span>
          <button onclick="filterStatus('all')" class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentStatus === "all" || !currentStatus ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}">All</button>
          <button onclick="filterStatus('published')" class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentStatus === "published" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}">Published</button>
          <button onclick="filterStatus('draft')" class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentStatus === "draft" ? "bg-yellow-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}">Draft</button>
        </div>

        <!-- Separator -->
        <div class="h-6 w-px bg-gray-300"></div>

        <!-- Language Filter -->
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-500 uppercase font-semibold">Bahasa:</span>
          <button onclick="filterLang('all')" class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentLang === "all" || !currentLang ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}">
            All <span class="text-xs opacity-70">(${countId + countEn})</span>
          </button>
          <button onclick="filterLang('id')" class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${currentLang === "id" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}">
            <span class="inline-block w-4 h-2.5 rounded-sm ${currentLang === "id" ? "bg-red-300" : "bg-red-500"}"></span>
            ID <span class="text-xs opacity-70">(${countId})</span>
          </button>
          <button onclick="filterLang('en')" class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${currentLang === "en" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}">
            <span class="inline-block w-4 h-2.5 rounded-sm ${currentLang === "en" ? "bg-blue-300" : "bg-blue-500"}"></span>
            EN <span class="text-xs opacity-70">(${countEn})</span>
          </button>
        </div>

        <div class="flex-1"></div>
        <div class="relative">
          <input type="text" id="searchInput" value="${escapeHtml(currentSearch)}" placeholder="Search..."
                 class="pl-9 pr-4 py-2 border rounded-lg text-sm w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                 onkeydown="if(event.key==='Enter')doSearch()">
          <svg class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </div>
      </div>

      <!-- Table -->
      <div class="p-6">
        <div class="bg-white rounded-lg border shadow-sm overflow-hidden">
          <table class="w-full">
            <thead>
              <tr class="bg-gray-50 border-b">
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">#</th>
                ${hasRepeaters ? `<th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-10"></th>` : ""}
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">Lang</th>
                ${displayFields.map((f) => `<th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">${escapeHtml(f.title)}</th>`).join("")}
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-20 cursor-pointer hover:bg-gray-100 select-none" onclick="doSort('status')">
                  <div class="flex items-center gap-1">
                    Status
                    ${currentSort === "status" ? `<svg class="w-3 h-3 ${currentSortDir === "asc" ? "" : "rotate-180"}" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>` : `<svg class="w-3 h-3 text-gray-300" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>`}
                  </div>
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 cursor-pointer hover:bg-gray-100 select-none" onclick="doSort('created_at')">
                  <div class="flex items-center gap-1">
                    Created
                    ${currentSort === "created_at" ? `<svg class="w-3 h-3 ${currentSortDir === "asc" ? "" : "rotate-180"}" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>` : `<svg class="w-3 h-3 text-gray-300" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>`}
                  </div>
                </th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              ${
                items.length > 0
                  ? items
                      .map(
                        (item, idx) => `
                <tr class="table-row" data-id="${item.id}">
                  <td class="px-4 py-3 text-sm text-gray-500">${(currentPage - 1) * limit + idx + 1}</td>
                  ${
                    hasRepeaters
                      ? `
                  <td class="px-4 py-3 text-center">
                    ${
                      item.nestedCounts.length > 0
                        ? `
                    <button onclick="toggleNested('${item.id}')" class="expand-btn p-1 rounded hover:bg-gray-100" title="Expand nested items">
                      <svg class="w-4 h-4 text-gray-500 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                      </svg>
                    </button>
                    `
                        : '<span class="text-gray-300">-</span>'
                    }
                  </td>
                  `
                      : ""
                  }
                  <td class="px-4 py-3 text-center">
                    <span class="inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-bold ${item.lang === "en" ? "bg-blue-100 text-blue-700 border border-blue-300" : "bg-red-100 text-red-700 border border-red-300"}">
                      ${item.lang.toUpperCase()}
                    </span>
                  </td>
                  ${displayFields
                    .map((f) => {
                      const fieldName = f.path.split(".").pop() || "";
                      return `<td class="px-4 py-3 text-sm">${renderCellValue(f, item.fields[fieldName])}</td>`;
                    })
                    .join("")}
                  <td class="px-4 py-3"><span class="status-badge status-${item.status}">${item.status}</span></td>
                  <td class="px-4 py-3 text-sm text-gray-500">${formatDate(item.created_at)}</td>
                  <td class="px-4 py-3 text-right">
                    <div class="flex items-center justify-end gap-1">
                      <a href="/backend/tpsadmin/edit/${item.id}" class="p-2 rounded-lg text-blue-600 hover:bg-blue-50" title="Edit">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </a>
                      <button onclick="deleteContent('${item.id}')" class="p-2 rounded-lg text-red-600 hover:bg-red-50" title="Delete">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
                ${renderNestedCounts(item)}
              `
                      )
                      .join("")
                  : `
                <tr>
                  <td colspan="${displayFields.length + (hasRepeaters ? 6 : 5)}" class="px-4 py-12 text-center text-gray-500">
                    <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    <p class="font-medium">No content found</p>
                    <p class="text-sm mt-1">Create your first content by clicking "Add Content"</p>
                  </td>
                </tr>
              `
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        ${
          totalPages > 1
            ? `
        <div class="flex items-center justify-between mt-4">
          <div class="text-sm text-gray-500">
            Showing ${(currentPage - 1) * limit + 1} - ${Math.min(currentPage * limit, total)} of ${total}
          </div>
          <div class="flex items-center gap-1">
            ${currentPage > 1 ? `<button onclick="goToPage(${currentPage - 1})" class="px-3 py-1.5 rounded border text-sm hover:bg-gray-50">Previous</button>` : ""}
            ${Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return `<button onclick="goToPage(${pageNum})" class="px-3 py-1.5 rounded text-sm ${pageNum === currentPage ? "bg-blue-600 text-white" : "border hover:bg-gray-50"}">${pageNum}</button>`;
            }).join("")}
            ${currentPage < totalPages ? `<button onclick="goToPage(${currentPage + 1})" class="px-3 py-1.5 rounded border text-sm hover:bg-gray-50">Next</button>` : ""}
          </div>
        </div>
        `
            : ""
        }
      </div>
    </main>
  </div>

  <script>
    const structureId = '${structure.id}';
    const currentStatus = '${currentStatus}';
    const currentSearch = '${escapeHtml(currentSearch)}';
    const currentLang = '${currentLang}';
    const currentPage = ${currentPage};
    const currentSort = '${currentSort}';
    const currentSortDir = '${currentSortDir}';

    function buildUrl(params = {}) {
      const url = new URL(window.location.href);
      for (const [key, value] of Object.entries(params)) {
        if (value) {
          url.searchParams.set(key, value);
        } else {
          url.searchParams.delete(key);
        }
      }
      return url.toString();
    }

    function filterStatus(status) {
      window.location.href = buildUrl({ status: status === 'all' ? '' : status, page: '' });
    }

    function filterLang(lang) {
      window.location.href = buildUrl({ lang: lang === 'all' ? '' : lang, page: '' });
    }

    function doSearch() {
      const search = document.getElementById('searchInput').value;
      window.location.href = buildUrl({ search, page: '' });
    }

    function goToPage(page) {
      window.location.href = buildUrl({ page });
    }

    function doSort(column) {
      let newDir = 'desc';
      // If clicking same column, toggle direction
      if (currentSort === column) {
        newDir = currentSortDir === 'desc' ? 'asc' : 'desc';
      }
      window.location.href = buildUrl({ sort: column, dir: newDir, page: '' });
    }

    function toggleNested(parentId) {
      const rows = document.querySelectorAll('.nested-row[data-parent="' + parentId + '"]');
      const btn = document.querySelector('tr[data-id="' + parentId + '"] .expand-btn');

      rows.forEach(row => {
        row.classList.toggle('expanded');
      });

      if (btn) {
        btn.classList.toggle('expanded');
      }
    }

    async function deleteContent(id) {
      if (!confirm('Are you sure you want to delete this content?')) return;

      try {
        const res = await fetch('/backend/api/content-delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id })
        });

        const data = await res.json();

        if (res.ok && data.status === 'ok') {
          window.location.reload();
        } else {
          alert('Failed to delete: ' + (data.message || 'Unknown error'));
        }
      } catch (e) {
        alert('Error: ' + e.message);
      }
    }

    function logout() {
      if (confirm('Confirm logout?')) {
        localStorage.removeItem('sid');
        document.cookie = 'sid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        window.location.href = '/backend/tpsadmin';
      }
    }

    function toggleFolder(folderId) {
      const folder = document.querySelector('.folder-group[data-folder="' + folderId + '"]');
      if (folder) {
        folder.classList.toggle('collapsed');
        // Save state to localStorage
        const collapsed = JSON.parse(localStorage.getItem('tpsadmin_collapsed_folders') || '[]');
        if (folder.classList.contains('collapsed')) {
          if (!collapsed.includes(folderId)) collapsed.push(folderId);
        } else {
          const idx = collapsed.indexOf(folderId);
          if (idx > -1) collapsed.splice(idx, 1);
        }
        localStorage.setItem('tpsadmin_collapsed_folders', JSON.stringify(collapsed));
      }
    }

    // Restore folder collapse state on load
    document.addEventListener('DOMContentLoaded', function() {
      const collapsed = JSON.parse(localStorage.getItem('tpsadmin_collapsed_folders') || '[]');
      collapsed.forEach(function(folderId) {
        const folder = document.querySelector('.folder-group[data-folder="' + folderId + '"]');
        if (folder) folder.classList.add('collapsed');
      });
    });
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
<body>
  <p>Redirecting to login...</p>
</body>
</html>`;
};

const renderNotFound = (): string => {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Not Found</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 flex items-center justify-center min-h-screen">
  <div class="text-center">
    <h1 class="text-4xl font-bold text-gray-800 mb-2">404</h1>
    <p class="text-gray-600 mb-4">Structure not found</p>
    <a href="/backend/tpsadmin/dashboard" class="text-blue-600 hover:underline">Back to Dashboard</a>
  </div>
</body>
</html>`;
};

export const _ = {
  url: "/backend/tpsadmin/list/:structureId",
  raw: true,
  async api(this: { req: Request; _url: URL }) {
    const req = this.req as Request;
    const url = this._url || new URL(req?.url || "http://localhost");

    // Get structure ID from URL path
    const pathParts = url.pathname.split("/");
    const structureId = pathParts[pathParts.length - 1];

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

    // Get structure info
    const structure = await getStructureInfo(structureId);
    if (!structure) {
      return new Response(renderNotFound(), {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Get query params
    const status = url.searchParams.get("status") || "all";
    const search = url.searchParams.get("search") || "";
    const lang = url.searchParams.get("lang") || "all";
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = 20;
    const sortBy = url.searchParams.get("sort") || "created_at";
    const sortDir = url.searchParams.get("dir") || "desc";

    // Get field definitions first
    const fieldDefs = await getFieldDefinitions(structure.path);

    // Get sidebar data and content
    const [structures, contentResult] = await Promise.all([
      loadSidebarStructures(),
      getContentList(
        structureId,
        structure.path,
        fieldDefs,
        status,
        search,
        lang,
        page,
        limit,
        sortBy,
        sortDir
      ),
    ]);
    const { items, total, countId, countEn } = contentResult;

    // Render page
    const html = renderListPage(
      user,
      structure,
      structures,
      fieldDefs,
      items,
      total,
      countId,
      countEn,
      status,
      search,
      lang,
      page,
      limit,
      sortBy,
      sortDir
    );

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Set-Cookie": `sid=${sessionId}; Path=/; HttpOnly; SameSite=Lax`,
      },
    });
  },
};
