/**
 * Admin Page Editor - Full SSR with Preview
 * Routes: /backend/tpsadmin/pages/edit/:id, /backend/tpsadmin/pages/add
 */

import { g } from "utils/global";
import { SECTION_TYPES, type SectionType } from "../components/sections";

interface PageData {
  id: string;
  path: string;
  title: string;
  url_pattern: string;
  status: string;
  meta: any;
  sections: SectionData[];
}

interface SectionData {
  id: string;
  path: string;
  title: string;
  type: string;
  sort_idx: number;
  fields: FieldData[];
}

interface FieldData {
  id: string;
  path: string;
  title: string;
  type: string;
  value: string;
  value_id?: string;
  value_en?: string;
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

const getPageData = async (pageId: string): Promise<PageData | null> => {
  if (!g.db) return null;

  try {
    const page = await g.db.structure.findFirst({
      where: { id: pageId },
    });

    if (!page) return null;

    // Get sections (child structures)
    const sectionStructures = await g.db.structure.findMany({
      where: {
        parent: pageId,
      },
      orderBy: { sort_idx: "asc" },
    });

    const sections: SectionData[] = [];

    for (const section of sectionStructures) {
      // Get fields for this section
      const fieldStructures = await g.db.structure.findMany({
        where: {
          parent: section.id,
        },
        orderBy: { sort_idx: "asc" },
      });

      const fields: FieldData[] = [];

      for (const field of fieldStructures) {
        // Get content values for ID and EN
        const contentId = await g.db.content.findFirst({
          where: {
            id_structure: field.id,
            lang: "id",
          },
        });

        const contentEn = await g.db.content.findFirst({
          where: {
            id_structure: field.id,
            lang: "en",
          },
        });

        fields.push({
          id: field.id,
          path: field.path,
          title: field.title,
          type: field.type,
          value: contentId?.text || "",
          value_id: contentId?.text || "",
          value_en: contentEn?.text || "",
        });
      }

      sections.push({
        id: section.id,
        path: section.path,
        title: section.title,
        type: section.type,
        sort_idx: section.sort_idx,
        fields,
      });
    }

    return {
      id: page.id,
      path: page.path,
      title: page.title,
      url_pattern: page.url_pattern,
      status: page.status,
      meta: page.meta || {},
      sections,
    };
  } catch (e) {
    console.error("Error getting page data:", e);
    return null;
  }
};

const renderSectionEditor = (section: SectionData, lang: string): string => {
  return `
    <div class="section-editor bg-white border rounded-lg mb-4" data-section-id="${section.id}">
      <div class="section-header flex items-center justify-between px-4 py-3 border-b bg-gray-50 rounded-t-lg cursor-move">
        <div class="flex items-center gap-3">
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"/>
          </svg>
          <span class="font-medium text-gray-700">${section.title}</span>
          <span class="px-2 py-0.5 text-xs bg-[#0475BC]/10 text-[#0475BC] rounded">${section.type}</span>
        </div>
        <button onclick="toggleSection('${section.id}')" class="p-1 hover:bg-gray-200 rounded">
          <svg id="section-arrow-${section.id}" class="w-4 h-4 text-gray-500 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
      </div>
      <div id="section-content-${section.id}" class="section-content p-4 space-y-4">
        ${section.fields.map((field) => renderFieldEditor(field, section.id, lang)).join("")}
      </div>
    </div>
  `;
};

const renderFieldEditor = (field: FieldData, sectionId: string, lang: string): string => {
  const value = lang === "en" ? field.value_en : field.value_id;
  const inputId = `field-${field.id}-${lang}`;

  switch (field.type) {
    case "richtext":
      return `
        <div class="field-group">
          <label class="block text-sm font-medium text-gray-700 mb-2">${field.title}</label>
          <div id="editor-${inputId}" class="quill-editor border rounded-lg" style="min-height: 200px;"></div>
          <input type="hidden" name="${inputId}" id="input-${inputId}" value="${escapeHtml(value || "")}">
        </div>
      `;
    case "file":
      return `
        <div class="field-group" data-field="${inputId}">
          <label class="block text-sm font-medium text-gray-700 mb-2">${field.title}</label>
          <div class="flex items-center gap-3" id="preview-${inputId}">
            ${value ? `<img src="/_img/${value}" class="w-20 h-20 object-cover rounded border">
            <span class="text-sm text-gray-500">${escapeHtml(value)}</span>` : `<span class="text-sm text-gray-400">Belum ada file</span>`}
          </div>
          <div class="mt-2">
            <input type="file" accept="image/*" onchange="handlePageFileUpload('${inputId}', this)"
              class="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#0475BC]/10 file:text-[#0475BC] hover:file:bg-[#0475BC]/20">
          </div>
          <input type="hidden" name="${inputId}" id="input-${inputId}" value="${escapeHtml(value || "")}">
        </div>
      `;
    case "textarea":
      return `
        <div class="field-group">
          <label class="block text-sm font-medium text-gray-700 mb-2">${field.title}</label>
          <textarea name="${inputId}" rows="4" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0475BC] focus:border-[#0475BC]">${escapeHtml(value || "")}</textarea>
        </div>
      `;
    default:
      return `
        <div class="field-group">
          <label class="block text-sm font-medium text-gray-700 mb-2">${field.title}</label>
          <input type="text" name="${inputId}" value="${escapeHtml(value || "")}" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0475BC] focus:border-[#0475BC]">
        </div>
      `;
  }
};

const escapeHtml = (str: string): string => {
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
  pageData: PageData | null,
  isNew: boolean,
  activeTab: string,
  activeLang: string
): string => {
  const sectionTypes = Object.entries(SECTION_TYPES).map(([key, value]) => ({
    value: key,
    label: value,
  }));

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isNew ? "Tambah" : "Edit"} Halaman - TPS Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.quilljs.com/1.3.7/quill.snow.css" rel="stylesheet">
  <script src="https://cdn.quilljs.com/1.3.7/quill.min.js"></script>
  <link rel="icon" href="/_img/tps-logo.png">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    .ql-editor { min-height: 150px; }
    .tab-active { border-bottom: 2px solid #0475BC; color: #0475BC; }
    .preview-frame { border: 1px solid #e5e7eb; border-radius: 0.5rem; }
  </style>
</head>
<body class="bg-gray-50">
  <div class="min-h-screen">
    <!-- Header -->
    <header class="bg-white border-b sticky top-0 z-20">
      <div class="px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <a href="/backend/tpsadmin/pages" class="p-2 rounded-lg hover:bg-gray-100" title="Back">
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
          </a>
          <div>
            <h1 class="text-xl font-semibold text-gray-800">${isNew ? "Tambah Halaman Baru" : `Edit: ${pageData?.title || ""}`}</h1>
            ${!isNew && pageData ? `<span class="text-sm text-gray-500">${pageData.url_pattern}</span>` : ""}
          </div>
        </div>
        <div class="flex items-center gap-3">
          ${!isNew && pageData ? `
            <a href="${pageData.url_pattern}" target="_blank" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
              Preview
            </a>
          ` : ""}
          <button onclick="savePage()" class="px-4 py-2 bg-[#0475BC] text-white rounded-lg hover:bg-[#0366a3] flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            Simpan
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="px-6 flex items-center gap-6 border-t">
        <button onclick="switchTab('edit')" class="py-3 px-1 text-sm font-medium ${activeTab === "edit" ? "tab-active" : "text-gray-500 hover:text-gray-700"}">
          Edit Content
        </button>
        <button onclick="switchTab('settings')" class="py-3 px-1 text-sm font-medium ${activeTab === "settings" ? "tab-active" : "text-gray-500 hover:text-gray-700"}">
          Settings
        </button>
        <button onclick="switchTab('preview')" class="py-3 px-1 text-sm font-medium ${activeTab === "preview" ? "tab-active" : "text-gray-500 hover:text-gray-700"}">
          Preview
        </button>
      </div>
    </header>

    <!-- Content -->
    <main class="p-6">
      <form id="page-form">
        <input type="hidden" name="id" value="${pageData?.id || ""}">

        <!-- Edit Tab -->
        <div id="tab-edit" class="${activeTab === "edit" ? "" : "hidden"}">
          <!-- Language Selector -->
          <div class="mb-4 flex items-center gap-4">
            <span class="text-sm text-gray-600">Bahasa:</span>
            <button type="button" onclick="switchLang('id')" class="px-3 py-1.5 rounded-lg text-sm font-medium ${activeLang === "id" ? "bg-[#0475BC] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}">
              Indonesia
            </button>
            <button type="button" onclick="switchLang('en')" class="px-3 py-1.5 rounded-lg text-sm font-medium ${activeLang === "en" ? "bg-[#0475BC] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}">
              English
            </button>
          </div>

          <div id="sections-container">
            ${pageData?.sections && pageData.sections.length > 0 ?
              pageData.sections.map((s) => renderSectionEditor(s, activeLang)).join("") : ""
            }
          </div>
          ${!pageData?.sections || pageData.sections.length === 0 ? `
            <div id="empty-sections-state" class="bg-white border rounded-lg p-12 text-center">
              <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
              </svg>
              <h3 class="text-lg font-medium text-gray-700 mb-2">Belum ada section</h3>
              <p class="text-gray-500 mb-4">Tambahkan section untuk mulai membangun halaman</p>
              <button type="button" onclick="addSection()" class="inline-flex items-center gap-2 px-4 py-2 bg-[#0475BC] text-white rounded-lg hover:bg-[#0366a3]">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                Tambah Section
              </button>
            </div>
          ` : ""}

          ${pageData?.sections && pageData.sections.length > 0 ? `
            <button type="button" onclick="addSection()" class="mt-4 w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-[#0475BC] hover:text-[#0475BC] flex items-center justify-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Tambah Section
            </button>
          ` : ""}
        </div>

        <!-- Settings Tab -->
        <div id="tab-settings" class="${activeTab === "settings" ? "" : "hidden"}">
          <div class="bg-white border rounded-lg p-6 space-y-6">
            <h3 class="font-semibold text-gray-800 border-b pb-3">Pengaturan Halaman</h3>

            <div class="grid grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Judul Halaman *</label>
                <input type="text" name="title" value="${escapeHtml(pageData?.title || "")}" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0475BC] focus:border-[#0475BC]" required>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">URL Pattern *</label>
                <div class="flex items-center">
                  <span class="px-3 py-2 bg-gray-100 border border-r-0 rounded-l-lg text-gray-500 text-sm">tps.co.id</span>
                  <input type="text" name="url_pattern" value="${escapeHtml(pageData?.url_pattern || "")}" placeholder="/about" class="flex-1 px-3 py-2 border rounded-r-lg focus:ring-2 focus:ring-[#0475BC] focus:border-[#0475BC]" required>
                </div>
                <p class="text-xs text-gray-500 mt-1">Contoh: /about, /contact, /services/shipping</p>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Path (untuk struktur) *</label>
              <input type="text" name="path" value="${escapeHtml(pageData?.path || "")}" placeholder="about" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0475BC] focus:border-[#0475BC]" ${!isNew ? "readonly" : ""} required>
              <p class="text-xs text-gray-500 mt-1">Gunakan snake_case, contoh: tentang_kami, layanan_kami</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select name="status" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0475BC] focus:border-[#0475BC]">
                <option value="draft" ${pageData?.status === "draft" ? "selected" : ""}>Draft</option>
                <option value="published" ${pageData?.status === "published" ? "selected" : ""}>Published</option>
              </select>
            </div>

            <h3 class="font-semibold text-gray-800 border-b pb-3 pt-4">SEO Settings</h3>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Meta Title</label>
              <input type="text" name="seo_title" value="${escapeHtml(pageData?.meta?.seo?.title || "")}" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0475BC] focus:border-[#0475BC]">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Meta Description</label>
              <textarea name="seo_description" rows="3" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0475BC] focus:border-[#0475BC]">${escapeHtml(pageData?.meta?.seo?.description || "")}</textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Keywords</label>
              <input type="text" name="seo_keywords" value="${escapeHtml(pageData?.meta?.seo?.keywords || "")}" placeholder="keyword1, keyword2, keyword3" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0475BC] focus:border-[#0475BC]">
            </div>
          </div>
        </div>

        <!-- Preview Tab -->
        <div id="tab-preview" class="${activeTab === "preview" ? "" : "hidden"}">
          <div class="bg-white border rounded-lg overflow-hidden">
            <div class="px-4 py-3 border-b bg-gray-50 flex items-center gap-4">
              <span class="text-sm text-gray-600">Preview URL:</span>
              <input type="text" id="preview-url" value="${pageData?.url_pattern || "/"}" class="flex-1 px-3 py-1.5 text-sm border rounded-lg" readonly>
              <button type="button" onclick="refreshPreview()" class="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
                Refresh
              </button>
            </div>
            <iframe id="preview-frame" src="${pageData?.url_pattern || "about:blank"}" class="w-full h-[600px] preview-frame"></iframe>
          </div>
        </div>
      </form>
    </main>
  </div>

  <!-- Add Section Modal -->
  <div id="add-section-modal" class="fixed inset-0 bg-black/50 hidden items-center justify-center z-50">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
      <div class="px-6 py-4 border-b flex items-center justify-between">
        <h3 class="font-semibold text-gray-800">Tambah Section</h3>
        <button onclick="closeAddSectionModal()" class="p-1 hover:bg-gray-100 rounded">
          <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div class="p-6 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Tipe Section</label>
          <select id="new-section-type" class="w-full px-3 py-2 border rounded-lg">
            ${sectionTypes.map((t) => `<option value="${t.value}">${t.label}</option>`).join("")}
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Judul Section</label>
          <input type="text" id="new-section-title" class="w-full px-3 py-2 border rounded-lg" placeholder="Hero Banner">
        </div>
      </div>
      <div class="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
        <button onclick="closeAddSectionModal()" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
          Batal
        </button>
        <button onclick="confirmAddSection()" class="px-4 py-2 bg-[#0475BC] text-white rounded-lg hover:bg-[#0366a3]">
          Tambah
        </button>
      </div>
    </div>
  </div>

  <script>
    const pageId = '${pageData?.id || ""}';
    const isNew = ${isNew};
    let currentLang = '${activeLang}';
    let quillEditors = {};

    // Store pending sections for new pages (not yet saved to DB)
    let pendingSections = [];
    let pendingSectionCounter = 0;

    // Initialize Quill editors
    document.querySelectorAll('.quill-editor').forEach(el => {
      const id = el.id;
      const inputId = id.replace('editor-', 'input-');
      const input = document.getElementById(inputId);

      const quill = new Quill('#' + id, {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['link', 'image'],
            ['clean']
          ]
        }
      });

      if (input && input.value) {
        quill.root.innerHTML = input.value;
      }

      quillEditors[id] = quill;
    });

    function switchTab(tab) {
      document.querySelectorAll('[id^="tab-"]').forEach(el => el.classList.add('hidden'));
      document.getElementById('tab-' + tab).classList.remove('hidden');
      // Update URL
      history.replaceState(null, '', '?tab=' + tab + '&lang=' + currentLang);
    }

    function switchLang(lang) {
      currentLang = lang;
      // Reload with new language
      const url = new URL(window.location.href);
      url.searchParams.set('lang', lang);
      window.location.href = url.toString();
    }

    function toggleSection(id) {
      const content = document.getElementById('section-content-' + id);
      const arrow = document.getElementById('section-arrow-' + id);
      content.classList.toggle('hidden');
      arrow.classList.toggle('rotate-180');
    }

    function addSection() {
      document.getElementById('add-section-modal').classList.remove('hidden');
      document.getElementById('add-section-modal').classList.add('flex');
      document.getElementById('new-section-title').value = '';
    }

    function closeAddSectionModal() {
      document.getElementById('add-section-modal').classList.add('hidden');
      document.getElementById('add-section-modal').classList.remove('flex');
    }

    async function confirmAddSection() {
      const type = document.getElementById('new-section-type').value;
      const title = document.getElementById('new-section-title').value;

      if (!title) {
        alert('Masukkan judul section');
        return;
      }

      // If page already exists (editing), add section via API
      if (pageId) {
        try {
          const res = await fetch('/backend/api/page-section', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              action: 'add',
              pageId: pageId,
              type: type,
              title: title
            })
          });

          const result = await res.json();
          if (result.status === 'ok') {
            window.location.reload();
          } else {
            alert('Gagal menambah section: ' + result.message);
          }
        } catch (e) {
          alert('Error: ' + e.message);
        }
      } else {
        // New page - store section locally
        pendingSectionCounter++;
        const tempId = 'pending-' + pendingSectionCounter;
        pendingSections.push({ tempId, type, title });

        // Render the pending section in UI
        renderPendingSection({ tempId, type, title });
        closeAddSectionModal();
      }
    }

    function renderPendingSection(section) {
      const container = document.getElementById('sections-container');
      const emptyState = document.getElementById('empty-sections-state');
      const addButton = document.getElementById('add-section-button');

      // Hide empty state if visible
      if (emptyState) {
        emptyState.style.display = 'none';
      }

      // Show sections container
      if (!container) {
        // Create container if not exists
        const editTab = document.getElementById('tab-edit');
        const langSelector = editTab.querySelector('.mb-4');
        const newContainer = document.createElement('div');
        newContainer.id = 'sections-container';
        langSelector.insertAdjacentElement('afterend', newContainer);
      }

      const sectionsContainer = document.getElementById('sections-container');

      // Create section HTML
      const sectionHtml = \`
        <div class="section-editor bg-white border rounded-lg mb-4 border-dashed border-[#0475BC]" data-section-id="\${section.tempId}">
          <div class="section-header flex items-center justify-between px-4 py-3 border-b bg-blue-50 rounded-t-lg">
            <div class="flex items-center gap-3">
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"/>
              </svg>
              <span class="font-medium text-gray-700">\${section.title}</span>
              <span class="px-2 py-0.5 text-xs bg-[#0475BC]/10 text-[#0475BC] rounded">\${section.type}</span>
              <span class="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded">Belum disimpan</span>
            </div>
            <button onclick="removePendingSection('\${section.tempId}')" class="p-1 hover:bg-red-100 rounded text-red-500" title="Hapus">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="section-content p-4 text-gray-500 text-sm">
            <p>Section akan dibuat setelah halaman disimpan. Klik "Simpan" untuk menyimpan halaman dan section ini.</p>
          </div>
        </div>
      \`;

      sectionsContainer.insertAdjacentHTML('beforeend', sectionHtml);

      // Show add button if hidden
      if (!addButton) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'add-section-button';
        btn.onclick = addSection;
        btn.className = 'mt-4 w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-[#0475BC] hover:text-[#0475BC] flex items-center justify-center gap-2';
        btn.innerHTML = \`
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Tambah Section
        \`;
        sectionsContainer.insertAdjacentElement('afterend', btn);
      }
    }

    function removePendingSection(tempId) {
      pendingSections = pendingSections.filter(s => s.tempId !== tempId);
      const el = document.querySelector('[data-section-id="' + tempId + '"]');
      if (el) el.remove();

      // Show empty state if no sections
      if (pendingSections.length === 0) {
        const emptyState = document.getElementById('empty-sections-state');
        if (emptyState) {
          emptyState.style.display = 'block';
        }
      }
    }

    async function handlePageFileUpload(fieldId, input) {
      var file = input.files[0];
      if (!file) return;

      var formData = new FormData();
      formData.append('file', file);

      try {
        var res = await fetch('/_upload?to=pages', {
          method: 'POST',
          body: formData
        });
        var result = await res.json();

        if (result && result[0]) {
          var filePath = result[0];
          document.getElementById('input-' + fieldId).value = filePath;

          var preview = document.getElementById('preview-' + fieldId);
          if (preview) {
            preview.innerHTML = '<img src="/_img/' + filePath + '" style="width:80px;height:80px;object-fit:cover;border-radius:0.375rem;border:1px solid #e5e7eb;">' +
              '<span style="font-size:0.875rem;color:#059669;margin-left:0.5rem;">Uploaded! Klik Simpan.</span>';
          }
        } else {
          alert('Upload gagal: response tidak valid');
        }
      } catch(e) {
        alert('Upload gagal: ' + e.message);
      }
    }

    function refreshPreview() {
      const frame = document.getElementById('preview-frame');
      frame.src = frame.src;
    }

    async function savePage() {
      // Update hidden inputs from Quill
      Object.keys(quillEditors).forEach(id => {
        const inputId = id.replace('editor-', 'input-');
        const input = document.getElementById(inputId);
        if (input) {
          input.value = quillEditors[id].root.innerHTML;
        }
      });

      const form = document.getElementById('page-form');
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      // Add pending sections for new pages
      if (isNew && pendingSections.length > 0) {
        data.pendingSections = pendingSections.map(s => ({ type: s.type, title: s.title }));
      }

      try {
        const res = await fetch('/backend/api/page-save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(data)
        });

        const result = await res.json();
        if (result.status === 'ok') {
          alert('Halaman berhasil disimpan!');
          if (isNew && result.id) {
            window.location.href = '/backend/tpsadmin/pages/edit/' + result.id;
          }
        } else {
          alert('Gagal menyimpan: ' + result.message);
        }
      } catch (e) {
        alert('Error: ' + e.message);
      }
    }
  </script>
</body>
</html>`;
};

export const _ = {
  url: "/backend/tpsadmin/pages/:action/**",
  raw: true,
  async api(this: { req: Request; _url: URL }) {
    const req = this.req;
    const url = this._url || new URL(req?.url || "http://localhost");

    // Extract action and ID from URL
    const pathParts = url.pathname.split("/");
    const action = pathParts[4]; // "edit" or "add"
    const pageId = pathParts[5] || "";

    // Get session from cookie
    const cookies = req?.headers?.get("cookie") || "";
    const sidMatch = cookies.match(/sid=([^;]+)/);
    const sessionId = sidMatch?.[1] || "";

    const user = await getSessionUser(sessionId);

    if (!user) {
      return new Response(
        `<!DOCTYPE html>
<html>
<head>
  <title>Redirecting...</title>
  <script>
    if (!localStorage.getItem('session_id')) {
      window.location.href = '/backend/login';
    } else {
      document.cookie = 'sid=' + localStorage.getItem('session_id') + ';path=/';
      window.location.reload();
    }
  </script>
</head>
<body>Redirecting...</body>
</html>`,
        { headers: { "Content-Type": "text/html" } }
      );
    }

    const isNew = action === "add";
    const activeTab = url.searchParams.get("tab") || "edit";
    const activeLang = url.searchParams.get("lang") || "id";

    let pageData: PageData | null = null;
    if (!isNew && pageId) {
      pageData = await getPageData(pageId);
      if (!pageData) {
        return new Response(
          `<!DOCTYPE html>
<html>
<head>
  <title>Not Found</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 flex items-center justify-center min-h-screen">
  <div class="text-center">
    <h1 class="text-4xl font-bold text-gray-800 mb-2">404</h1>
    <p class="text-gray-600 mb-4">Halaman tidak ditemukan</p>
    <a href="/backend/tpsadmin/pages" class="text-blue-600 hover:underline">Kembali ke Daftar</a>
  </div>
</body>
</html>`,
          { status: 404, headers: { "Content-Type": "text/html" } }
        );
      }
    }

    return new Response(renderPage(user, pageData, isNew, activeTab, activeLang), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  },
};
