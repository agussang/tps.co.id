/**
 * Admin Content Add Page - Full SSR
 * Route: /backend/tpsadmin/add/:structureId
 *
 * Server-side rendered content creator with language selection (ID/EN)
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

interface StructureField {
  id: string;
  path: string;
  title: string;
  type: string;
  required: boolean;
  visible: boolean;
  multiple: boolean;
  sort_idx: number;
  options: any;
  optionsList?: Array<{ value: string; label: string }>;
}

interface StructureInfo {
  id: string;
  title: string;
  path: string;
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

const getStructureFields = async (
  structureId: string,
  structurePath: string
): Promise<StructureField[]> => {
  if (!g.db) return [];

  const structures = await g.db.structure.findMany({
    where: {
      OR: [{ id: structureId }, { path: { startsWith: `${structurePath}.` } }],
      visible: true,
    },
    orderBy: { sort_idx: "asc" },
    select: {
      id: true,
      path: true,
      title: true,
      type: true,
      required: true,
      visible: true,
      multiple: true,
      sort_idx: true,
      options: true,
    },
  });

  const pathDepth = structurePath.split(".").length;

  const fields = structures
    .filter((s) => {
      if (s.id === structureId) return false;
      const fieldPath = s.path || "";
      const fieldDepth = fieldPath.split(".").length;
      return fieldDepth === pathDepth + 1;
    })
    .map((s) => ({
      id: s.id,
      path: s.path || "",
      title: s.title || "",
      type: s.type || "text",
      required: s.required || false,
      visible: s.visible || false,
      multiple: s.multiple || false,
      sort_idx: s.sort_idx || 0,
      options: s.options,
      optionsList: undefined as Array<{ value: string; label: string }> | undefined,
    }));

  // Load options for fields
  for (const field of fields) {
    if (field.options && field.type === "options") {
      const opts = field.options as any;

      if (opts.ref) {
        const masterContents = await g.db.content.findMany({
          where: {
            id_structure: opts.ref,
            id_parent: null,
            status: "published",
          },
          select: {
            id: true,
            text: true,
            other_content: {
              select: {
                text: true,
                structure: { select: { path: true } },
              },
            },
          },
          take: 100,
        });

        field.optionsList = masterContents.map((c) => {
          const titleField = c.other_content.find(
            (oc) =>
              oc.structure?.path?.endsWith(".title") ||
              oc.structure?.path?.endsWith(".name") ||
              oc.structure?.path?.endsWith(".label")
          );
          return {
            value: titleField?.text || c.text || c.id,
            label: titleField?.text || c.text || c.id,
          };
        });
      } else if (Array.isArray(opts)) {
        field.optionsList = opts.map((o: string) => ({ value: o, label: o }));
      } else if (opts.items && Array.isArray(opts.items)) {
        field.optionsList = opts.items.map((o: any) =>
          typeof o === "string"
            ? { value: o, label: o }
            : { value: o.value || o, label: o.label || o.value || o }
        );
      }
    }
  }

  return fields;
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

const renderAddPage = (
  user: { id: number; username: string; role: { id: number; name: string } },
  structure: StructureInfo,
  fields: StructureField[],
  selectedLang: string,
  structures: ContentStructure[]
): string => {
  // Smart field type detection based on field name (for section filtering)
  const getSmartType = (field: StructureField): string => {
    const fieldName = (field.path.split(".").pop() || "").toLowerCase();
    const type = field.type;

    if (["textarea", "file", "options", "date", "number"].includes(type)) {
      return type;
    }

    if (type === "text" || !type) {
      if (/date|tanggal|waktu|time|jadwal|periode|tgl/i.test(fieldName)) return "date";
      if (/description|deskripsi|content|konten|body|text|detail|keterangan|isi|summary|ringkasan|catatan|note/i.test(fieldName)) return "textarea";
      if (/email|mail/i.test(fieldName)) return "email";
      if (/url|link|website|web|href/i.test(fieldName)) return "url";
      if (/phone|telp|telepon|hp|mobile|whatsapp|wa/i.test(fieldName)) return "tel";
      if (/amount|jumlah|total|count|qty|quantity|harga|price|nilai|angka/i.test(fieldName)) return "number";
    }

    return type || "text";
  };

  const basicFields = fields.filter((f) => {
    const smartType = getSmartType(f);
    return ["text", "date", "number", "options", "email", "url", "tel"].includes(smartType) && !f.multiple;
  });
  const contentFields = fields.filter((f) => getSmartType(f) === "textarea");
  const mediaFields = fields.filter((f) => f.type === "file");

  const renderField = (field: StructureField) => {
    const fieldName = field.path.split(".").pop() || "";
    const smartType = getSmartType(field);
    const required = field.required ? "required" : "";
    const requiredStar = field.required
      ? '<span class="text-red-500 ml-0.5">*</span>'
      : "";

    // Special handling for year fields (throughput.year, annual_throughput.year)
    if (field.path === "throughput.year" || field.path === "annual_throughput.year" ||
        (fieldName === "year" && field.path.includes("throughput"))) {
      const currentYear = new Date().getFullYear();
      const years = [];
      for (let y = currentYear + 5; y >= currentYear - 5; y--) {
        years.push(y);
      }
      return `
        <div class="space-y-1.5">
          <label class="flex items-center text-sm font-medium text-gray-700">
            ${escapeHtml(field.title)}${requiredStar}
          </label>
          <select name="${fieldName}" id="input-${fieldName}" ${required}
                  class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
            ${years.map((y) => `<option value="${y}" ${y === currentYear ? "selected" : ""}>${y}</option>`).join("")}
          </select>
        </div>
      `;
    }

    // Special handling for domestics/international fields - format as number with thousand separator
    if ((fieldName === "domestics" || fieldName === "international") &&
        (field.path.includes("throughput") || field.path.includes("annual_throughput"))) {
      return `
        <div class="space-y-1.5">
          <label class="flex items-center text-sm font-medium text-gray-700">
            ${escapeHtml(field.title)}${requiredStar}
          </label>
          <div class="relative">
            <input type="text"
                   id="display-${fieldName}"
                   value=""
                   ${required}
                   class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none number-input"
                   data-field="${fieldName}"
                   oninput="formatNumberInput(this)"
                   placeholder="0">
            <input type="hidden" name="${fieldName}" id="input-${fieldName}" value="">
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">TEUs</span>
          </div>
        </div>
      `;
    }

    // Special handling for throughput.month - Month dropdown
    if (field.path === "throughput.month" || (fieldName === "month" && field.type === "number")) {
      const months = [
        { value: "1", label: "Januari" },
        { value: "2", label: "Februari" },
        { value: "3", label: "Maret" },
        { value: "4", label: "April" },
        { value: "5", label: "Mei" },
        { value: "6", label: "Juni" },
        { value: "7", label: "Juli" },
        { value: "8", label: "Agustus" },
        { value: "9", label: "September" },
        { value: "10", label: "Oktober" },
        { value: "11", label: "November" },
        { value: "12", label: "Desember" },
      ];
      const currentMonth = new Date().getMonth() + 1;
      return `
        <div class="space-y-1.5">
          <label class="flex items-center text-sm font-medium text-gray-700">
            ${escapeHtml(field.title)}${requiredStar}
          </label>
          <select name="${fieldName}" id="input-${fieldName}" ${required}
                  class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
            ${months.map((m) => `<option value="${m.value}" ${parseInt(m.value) === currentMonth ? "selected" : ""}>${m.label}</option>`).join("")}
          </select>
        </div>
      `;
    }

    if (smartType === "textarea") {
      // Check if this is a richtext field (content, description) vs plain textarea (address, etc.)
      const lastPart = (field.path || "").split(".").pop() || "";
      const isRichtext = ["content", "description", "footer_description"].includes(lastPart) ||
        /description|deskripsi|content|konten|body|detail|keterangan|isi/i.test(fieldName);

      if (isRichtext) {
        return `
          <div class="space-y-1.5">
            <label class="flex items-center text-sm font-medium text-gray-700">
              ${escapeHtml(field.title)}${requiredStar}
            </label>
            <div id="editor-${fieldName}" class="quill-editor border rounded-lg overflow-hidden" data-field="${fieldName}">
            </div>
            <input type="hidden" name="${fieldName}" id="input-${fieldName}" value="">
          </div>
        `;
      } else {
        return `
          <div class="space-y-1.5">
            <label class="flex items-center text-sm font-medium text-gray-700">
              ${escapeHtml(field.title)}${requiredStar}
            </label>
            <textarea name="${fieldName}" id="input-${fieldName}" rows="4"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Masukkan ${escapeHtml(field.title).toLowerCase()}..."
            ></textarea>
          </div>
        `;
      }
    }

    if (smartType === "file") {
      return `
        <div class="space-y-1.5">
          <label class="flex items-center text-sm font-medium text-gray-700">
            ${escapeHtml(field.title)}${requiredStar}
          </label>
          <div class="file-upload-area border-2 border-dashed rounded-lg border-gray-300 hover:border-gray-400 transition-all"
               data-field="${fieldName}" data-has-file="false">
            <label class="flex flex-col items-center justify-center py-6 px-4 cursor-pointer hover:bg-gray-50 transition-colors" onclick="triggerFileUpload('${fieldName}')">
              <div class="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-gray-100">
                <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
              </div>
              <span class="text-sm font-medium text-gray-600">Klik untuk upload atau drag & drop</span>
              <span class="text-xs text-gray-400 mt-1">PNG, JPG, PDF hingga 10MB</span>
            </label>
            <input type="file" id="file-${fieldName}" class="hidden" onchange="handleFileUpload('${fieldName}', this)">
            <input type="hidden" name="${fieldName}" id="input-${fieldName}" value="">
          </div>
        </div>
      `;
    }

    if (smartType === "date") {
      return `
        <div class="space-y-1.5">
          <label class="flex items-center text-sm font-medium text-gray-700">
            ${escapeHtml(field.title)}${requiredStar}
          </label>
          <input type="date" name="${fieldName}" id="input-${fieldName}" value="" ${required}
                 class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
        </div>
      `;
    }

    if (smartType === "number") {
      return `
        <div class="space-y-1.5">
          <label class="flex items-center text-sm font-medium text-gray-700">
            ${escapeHtml(field.title)}${requiredStar}
          </label>
          <input type="number" name="${fieldName}" id="input-${fieldName}" value="" ${required}
                 class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
        </div>
      `;
    }

    if (smartType === "email") {
      return `
        <div class="space-y-1.5">
          <label class="flex items-center text-sm font-medium text-gray-700">
            ${escapeHtml(field.title)}${requiredStar}
          </label>
          <input type="email" name="${fieldName}" id="input-${fieldName}" value="" ${required}
                 placeholder="email@example.com"
                 class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
        </div>
      `;
    }

    if (smartType === "url") {
      return `
        <div class="space-y-1.5">
          <label class="flex items-center text-sm font-medium text-gray-700">
            ${escapeHtml(field.title)}${requiredStar}
          </label>
          <input type="url" name="${fieldName}" id="input-${fieldName}" value="" ${required}
                 placeholder="https://"
                 class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
        </div>
      `;
    }

    if (smartType === "tel") {
      return `
        <div class="space-y-1.5">
          <label class="flex items-center text-sm font-medium text-gray-700">
            ${escapeHtml(field.title)}${requiredStar}
          </label>
          <input type="tel" name="${fieldName}" id="input-${fieldName}" value="" ${required}
                 placeholder="+62..."
                 class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
        </div>
      `;
    }

    if (smartType === "options" && field.optionsList && field.optionsList.length > 0) {
      return `
        <div class="space-y-1.5">
          <label class="flex items-center text-sm font-medium text-gray-700">
            ${escapeHtml(field.title)}${requiredStar}
          </label>
          <select name="${fieldName}" id="input-${fieldName}" ${required}
                  class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
            <option value="">-- Pilih ${escapeHtml(field.title)} --</option>
            ${field.optionsList.map((opt) => `<option value="${escapeHtml(opt.value)}">${escapeHtml(opt.label)}</option>`).join("")}
          </select>
        </div>
      `;
    }

    return `
      <div class="space-y-1.5">
        <label class="flex items-center text-sm font-medium text-gray-700">
          ${escapeHtml(field.title)}${requiredStar}
        </label>
        <input type="text" name="${fieldName}" id="input-${fieldName}" value="" ${required}
               class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
      </div>
    `;
  };

  const renderSection = (
    title: string,
    icon: string,
    sectionFields: StructureField[],
    gridCols: number = 1
  ) => {
    if (sectionFields.length === 0) return "";

    const gridClass =
      gridCols === 2 ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-4";

    return `
      <div class="bg-white border rounded-lg overflow-hidden shadow-sm">
        <div class="flex items-center px-4 py-3 border-b bg-gray-50 cursor-pointer select-none" onclick="toggleSection(this)">
          ${icon}
          <h3 class="font-semibold text-gray-700 flex-1 text-sm">${title}</h3>
          <svg class="w-4 h-4 text-gray-400 section-chevron transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
        <div class="p-4 section-content">
          <div class="${gridClass}">
            ${sectionFields.map((f) => renderField(f)).join("")}
          </div>
        </div>
      </div>
    `;
  };

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tambah ${escapeHtml(structure.title)} - TPS Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.quilljs.com/1.3.7/quill.snow.css" rel="stylesheet">
  <script src="https://cdn.quilljs.com/1.3.7/quill.min.js"></script>
  <link rel="icon" href="/_img/tps-logo.png">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    .ql-toolbar { border: none !important; border-bottom: 1px solid #e5e7eb !important; background: #f9fafb; }
    .ql-container { border: none !important; font-size: 14px; }
    .ql-editor { min-height: 150px; max-height: 400px; overflow-y: auto; }
    .ql-editor.ql-blank::before { font-style: normal !important; color: #9ca3af; }
    .section-content { transition: max-height 0.3s ease, opacity 0.3s ease; overflow: hidden; }
    .section-collapsed .section-content { max-height: 0; opacity: 0; padding: 0; }
    .section-collapsed .section-chevron { transform: rotate(-90deg); }
    .toast { position: fixed; bottom: 20px; right: 20px; padding: 12px 20px; border-radius: 8px; color: white; z-index: 1000; animation: slideIn 0.3s ease; }
    .toast-success { background: #22c55e; }
    .toast-error { background: #ef4444; }
    .toast-loading { background: #3b82f6; }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    .lang-btn { transition: all 0.2s; }
    .lang-btn.active-id { background: #dc2626; color: white; border-color: #dc2626; }
    .lang-btn.active-en { background: #2563eb; color: white; border-color: #2563eb; }
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
        <div>
          <div class="flex items-center text-sm text-gray-500">
            <a href="/backend/tpsadmin/list/${structure.id}" class="hover:text-blue-600">${escapeHtml(structure.title)}</a>
            <svg class="w-4 h-4 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            <span>Tambah Baru</span>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <!-- Language Selector -->
          <div class="flex items-center gap-1 border rounded-lg p-1 bg-gray-50">
            <button type="button" id="langIdBtn" onclick="selectLang('id')"
                    class="lang-btn px-3 py-1 rounded text-sm font-medium flex items-center gap-1 ${selectedLang === "id" ? "active-id" : "text-gray-600 hover:bg-gray-100"}">
              <span class="inline-block w-4 h-2.5 rounded-sm bg-red-500"></span>
              ID
            </button>
            <button type="button" id="langEnBtn" onclick="selectLang('en')"
                    class="lang-btn px-3 py-1 rounded text-sm font-medium flex items-center gap-1 ${selectedLang === "en" ? "active-en" : "text-gray-600 hover:bg-gray-100"}">
              <span class="inline-block w-4 h-2.5 rounded-sm bg-blue-500"></span>
              EN
            </button>
          </div>

          <select id="statusSelect" name="status"
                  class="px-3 py-1.5 rounded-lg text-sm font-medium border-2 cursor-pointer outline-none transition-colors bg-yellow-50 border-yellow-200 text-yellow-700">
            <option value="draft" selected>Draft</option>
            <option value="published">Published</option>
          </select>
          <button type="button" onclick="saveContent()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center font-medium">
            <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Simpan
          </button>
        </div>
      </div>

      <!-- Form -->
      <form id="addForm" class="p-6 space-y-6 max-w-4xl mx-auto">
        <input type="hidden" name="structureId" value="${structure.id}">
        <input type="hidden" name="lang" id="inputLang" value="${selectedLang}">

        ${renderSection(
          "Informasi Dasar",
          '<svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>',
          basicFields,
          2
        )}

        ${renderSection(
          "Konten",
          '<svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>',
          contentFields,
          1
        )}

        ${renderSection(
          "Media",
          '<svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>',
          mediaFields,
          2
        )}
      </form>
    </main>
  </div>

  <script>
    const structureId = '${structure.id}';
    const structurePath = '${structure.path}';
    let currentLang = '${selectedLang}';

    // Initialize Quill editors
    const quillEditors = {};
    document.querySelectorAll('.quill-editor').forEach(container => {
      const fieldName = container.dataset.field;

      const quill = new Quill(container, {
        theme: 'snow',
        placeholder: 'Ketik konten di sini...',
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ color: [] }, { background: [] }],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ align: [] }],
            ['link', 'image', 'video'],
            ['blockquote', 'code-block'],
            ['clean']
          ]
        }
      });

      quillEditors[fieldName] = quill;
    });

    // Language selector
    function selectLang(lang) {
      currentLang = lang;
      document.getElementById('inputLang').value = lang;

      const idBtn = document.getElementById('langIdBtn');
      const enBtn = document.getElementById('langEnBtn');

      idBtn.classList.remove('active-id', 'text-gray-600', 'hover:bg-gray-100');
      enBtn.classList.remove('active-en', 'text-gray-600', 'hover:bg-gray-100');

      if (lang === 'id') {
        idBtn.classList.add('active-id');
        enBtn.classList.add('text-gray-600', 'hover:bg-gray-100');
      } else {
        enBtn.classList.add('active-en');
        idBtn.classList.add('text-gray-600', 'hover:bg-gray-100');
      }
    }

    // Toggle section collapse
    function toggleSection(header) {
      const section = header.parentElement;
      section.classList.toggle('section-collapsed');
    }

    // Format number input with thousand separator
    function formatNumberInput(input) {
      const fieldName = input.dataset.field;
      const hiddenInput = document.getElementById('input-' + fieldName);

      // Remove non-digits
      let value = input.value.replace(/[^\\d]/g, '');

      // Store raw value in hidden input
      hiddenInput.value = value;

      // Format with thousand separator for display
      if (value) {
        const num = parseInt(value);
        input.value = num.toLocaleString('id-ID');
      } else {
        input.value = '';
      }
    }

    // File upload functions
    function triggerFileUpload(fieldName) {
      document.getElementById('file-' + fieldName).click();
    }

    async function handleFileUpload(fieldName, input) {
      const file = input.files[0];
      if (!file) return;

      showToast('Mengupload file...', 'loading');

      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/_upload?to=' + fieldName.replace(/\\./g, '/'), {
          method: 'POST',
          body: formData
        });
        const result = await res.json();

        if (result && result[0]) {
          document.getElementById('input-' + fieldName).value = result[0];
          showToast('File berhasil diupload', 'success');

          // Update UI to show uploaded file
          const area = document.querySelector('[data-field="' + fieldName + '"]');
          if (area) {
            const imgUrl = '/_img/' + result[0] + '?h=80';
            area.innerHTML = \`
              <div class="flex items-center p-3 gap-3">
                <div class="flex-shrink-0">
                  <img src="\${imgUrl}" class="w-16 h-16 object-cover rounded-lg border bg-gray-100"
                       onerror="this.parentElement.innerHTML='<div class=\\'w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center\\'><svg class=\\'w-8 h-8 text-gray-400\\' fill=\\'none\\' stroke=\\'currentColor\\' viewBox=\\'0 0 24 24\\'><path stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\' stroke-width=\\'2\\' d=\\'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z\\'></path></svg></div>'">
                </div>
                <div class="flex-1 min-w-0">
                  <span class="text-sm font-medium text-gray-600">File uploaded</span>
                </div>
                <div class="flex items-center gap-1">
                  <button type="button" onclick="triggerFileUpload('\${fieldName}')" class="p-2 rounded-lg text-gray-500 hover:bg-gray-100" title="Ganti file">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                  </button>
                  <button type="button" onclick="removeFile('\${fieldName}')" class="p-2 rounded-lg text-red-500 hover:bg-red-50" title="Hapus file">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>
              </div>
              <input type="file" id="file-\${fieldName}" class="hidden" onchange="handleFileUpload('\${fieldName}', this)">
              <input type="hidden" name="\${fieldName}" id="input-\${fieldName}" value="\${result[0]}">
            \`;
            area.classList.remove('border-dashed', 'border-gray-300', 'hover:border-gray-400');
            area.classList.add('border-solid', 'border-gray-200');
          }
        }
      } catch (e) {
        showToast('Gagal mengupload file', 'error');
      }
    }

    function removeFile(fieldName) {
      document.getElementById('input-' + fieldName).value = '';
      const area = document.querySelector('[data-field="' + fieldName + '"]');
      if (area) {
        area.innerHTML = \`
          <label class="flex flex-col items-center justify-center py-6 px-4 cursor-pointer hover:bg-gray-50 transition-colors" onclick="triggerFileUpload('\${fieldName}')">
            <div class="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-gray-100">
              <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
            </div>
            <span class="text-sm font-medium text-gray-600">Klik untuk upload atau drag & drop</span>
            <span class="text-xs text-gray-400 mt-1">PNG, JPG, PDF hingga 10MB</span>
          </label>
          <input type="file" id="file-\${fieldName}" class="hidden" onchange="handleFileUpload('\${fieldName}', this)">
          <input type="hidden" name="\${fieldName}" id="input-\${fieldName}" value="">
        \`;
        area.classList.remove('border-solid', 'border-gray-200');
        area.classList.add('border-dashed', 'border-gray-300', 'hover:border-gray-400');
      }
    }

    // Save content
    async function saveContent() {
      showToast('Menyimpan...', 'loading');

      const formData = {};
      const form = document.getElementById('addForm');

      // Get regular inputs
      form.querySelectorAll('input[name], select[name]').forEach(input => {
        if (input.type !== 'file') {
          formData[input.name] = input.value;
        }
      });

      // Get Quill editor contents
      for (const [fieldName, quill] of Object.entries(quillEditors)) {
        const html = quill.root.innerHTML;
        formData[fieldName] = html === '<p><br></p>' ? '' : html;
      }

      // Get status from dropdown
      const status = document.getElementById('statusSelect').value;

      try {
        // Use Prasi's save API with correct mode='new'
        const res = await fetch('/backend/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            mode: 'new',  // Correct mode for Prasi API
            id_structure: structureId,
            entry: formData,
            lang: currentLang,
            status: status
          })
        });

        const result = await res.json();

        if (result.status === 'ok' && result.id) {
          // Cache is auto-cleared by API
          showToast('Data tersimpan (status: ' + status + ')', 'success');
          // Redirect to list page
          setTimeout(() => {
            window.location.href = '/backend/tpsadmin/list/' + structureId;
          }, 1000);
        } else {
          // Show specific field errors if available
          var errorMsg = '';
          if (result.errors && typeof result.errors === 'object') {
            var msgs = [];
            for (var key in result.errors) {
              if (Array.isArray(result.errors[key])) {
                msgs.push(result.errors[key].join(', '));
              } else {
                msgs.push(key + ': ' + result.errors[key]);
              }
            }
            errorMsg = msgs.join('; ');
          } else {
            errorMsg = result.message || 'Unknown error';
          }
          showToast('Gagal menyimpan: ' + errorMsg, 'error');
        }
      } catch (e) {
        console.error('Save error:', e);
        showToast('Gagal menyimpan: ' + e.message, 'error');
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
        window.location.href = '/backend/tpsadmin';
      }
    }

    // Store session
    const sid = document.cookie.split('; ').find(row => row.startsWith('sid='));
    if (sid) {
      localStorage.setItem('sid', sid.split('=')[1]);
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
    <p class="text-gray-600 mb-4">Structure tidak ditemukan</p>
    <a href="/backend/tpsadmin" class="text-blue-600 hover:underline">Kembali ke Dashboard</a>
  </div>
</body>
</html>`;
};

export const _ = {
  url: "/backend/tpsadmin/add/:structureId",
  raw: true,
  async api(this: { req: Request; _url: URL }) {
    const req = this.req as Request;

    // Get structure ID from URL
    const url = this._url || new URL(req?.url || "http://localhost");
    const pathParts = url.pathname.split("/");
    const structureId = pathParts[pathParts.length - 1];

    // Get lang from query param (default: id)
    const selectedLang = url.searchParams.get("lang") || "id";

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

    // Get structure fields and sidebar data
    const [fields, structures] = await Promise.all([
      getStructureFields(structure.id, structure.path),
      loadSidebarStructures(),
    ]);

    // Render page
    const html = renderAddPage(user, structure, fields, selectedLang, structures);

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Set-Cookie": `sid=${sessionId}; Path=/; HttpOnly; SameSite=Lax`,
      },
    });
  },
};
