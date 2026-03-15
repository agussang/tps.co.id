/**
 * Admin Content Edit Page - Full SSR
 * Route: /backend/tpsadmin/edit/:id
 *
 * Server-side rendered content editor that doesn't depend on Prasi bundle
 * Features: Quill WYSIWYG, Form Sections, Drag-drop file upload
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
  options: any; // JSON field for options config
  optionsList?: Array<{ value: string; label: string }>; // Loaded options
}

interface NestedItem {
  id: string;
  fields: Record<string, any>;
  displayTitle: string;
  order: number;
}

interface NestedItemGroup {
  structureId: string;
  structureTitle: string;
  structurePath: string;
  items: NestedItem[];
}

interface ParentInfo {
  id: string;
  title: string;
  structureId: string;
  structureTitle: string;
}

interface ContentData {
  id: string;
  status: string;
  isNested: boolean;
  parent: ParentInfo | null;
  structure: {
    id: string;
    title: string;
    path: string;
  };
  fields: Record<string, any>;
  nestedGroups: NestedItemGroup[];
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

const getContentData = async (
  contentId: string
): Promise<ContentData | null> => {
  if (!g.db) return null;

  // Get main content with parent info
  const content = await g.db.content.findFirst({
    where: { id: contentId },
    select: {
      id: true,
      status: true,
      id_parent: true,
      structure: {
        select: { id: true, title: true, path: true },
      },
    },
  });

  if (!content || !content.structure) return null;

  // Check if this is a nested item (has parent)
  const isNested = !!content.id_parent;
  let parent: ParentInfo | null = null;

  if (isNested && content.id_parent) {
    const parentContent = await g.db.content.findFirst({
      where: { id: content.id_parent },
      select: {
        id: true,
        structure: { select: { id: true, title: true, path: true } },
        other_content: {
          where: { structure: { path: { endsWith: ".title" } } },
          select: { text: true },
          take: 1,
        },
      },
    });

    if (parentContent) {
      parent = {
        id: parentContent.id,
        title: parentContent.other_content[0]?.text || parentContent.structure?.title || "Parent",
        structureId: parentContent.structure?.id || "",
        structureTitle: parentContent.structure?.title || "",
      };
    }
  }

  // Get structure fields
  const structures = await g.db.structure.findMany({
    where: {
      OR: [
        { id: content.structure.id },
        { path: { startsWith: `${content.structure.path}.` } },
      ],
    },
    orderBy: { sort_idx: "asc" },
  });

  // Get child content (field values)
  const children = await g.db.content.findMany({
    where: { id_parent: contentId },
    select: {
      id: true,
      text: true,
      id_file: true,
      structure: { select: { path: true, type: true } },
      file: { select: { uuid: true, path: true } },
    },
  });

  // Build fields object
  const fields: Record<string, any> = {};
  for (const child of children) {
    if (child.structure?.path) {
      const fieldName = child.structure.path.split(".").pop() || "";
      if (child.structure.type === "file") {
        // For file fields, use the file.path if available, otherwise check if id_file exists and load it
        if (child.file?.path) {
          fields[fieldName] = child.file.path;
        } else if (child.id_file) {
          // Fallback: query the file directly if relation didn't load
          const fileRecord = await g.db.file.findFirst({
            where: { uuid: child.id_file },
            select: { path: true },
          });
          if (fileRecord?.path) {
            fields[fieldName] = fileRecord.path;
          }
        }
      } else {
        fields[fieldName] = child.text || "";
      }
    }
  }

  // Get multiple/repeater fields
  const multipleStructures = await g.db.structure.findMany({
    where: {
      path: { startsWith: `${content.structure.path}.` },
      multiple: true,
      visible: true,
    },
    select: { id: true, path: true, title: true },
    orderBy: { sort_idx: "asc" },
  });

  // Only get direct child multiple fields
  const pathDepth = content.structure.path.split(".").length;
  const directMultiples = multipleStructures.filter((s) => {
    const fieldDepth = (s.path || "").split(".").length;
    return fieldDepth === pathDepth + 1;
  });

  // Load nested items for each multiple field
  const nestedGroups: NestedItemGroup[] = [];

  for (const multiStruct of directMultiples) {
    const nestedContents = await g.db.content.findMany({
      where: {
        id_parent: contentId,
        id_structure: multiStruct.id,
      },
      select: { id: true, created_at: true },
      orderBy: { created_at: "asc" },
    });

    const items: NestedItem[] = [];

    for (const nested of nestedContents) {
      const nestedChildren = await g.db.content.findMany({
        where: { id_parent: nested.id },
        select: {
          text: true,
          structure: { select: { path: true, type: true } },
          file: { select: { path: true } },
        },
      });

      const nestedFields: Record<string, any> = {};
      let displayTitle = "";
      let order = 999;

      for (const child of nestedChildren) {
        if (child.structure?.path) {
          const fieldName = child.structure.path.split(".").pop() || "";
          if (child.structure.type === "file" && child.file) {
            nestedFields[fieldName] = child.file.path;
          } else {
            nestedFields[fieldName] = child.text || "";
          }

          if (
            ["title", "name", "label", "description"].includes(
              fieldName.toLowerCase()
            )
          ) {
            if (!displayTitle && child.text) {
              displayTitle = child.text;
            }
          }

          if (fieldName.toLowerCase() === "order" && child.text) {
            order = parseInt(child.text) || 999;
          }
        }
      }

      items.push({
        id: nested.id,
        fields: nestedFields,
        displayTitle: displayTitle || `Item ${items.length + 1}`,
        order,
      });
    }

    // Sort by order
    items.sort((a, b) => a.order - b.order);

    nestedGroups.push({
      structureId: multiStruct.id,
      structureTitle: multiStruct.title || "Items",
      structurePath: multiStruct.path || "",
      items,
    });
  }

  return {
    id: content.id,
    status: content.status || "draft",
    isNested,
    parent,
    structure: content.structure,
    fields,
    nestedGroups,
  };
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
      options: true, // Include options field
    },
  });

  // Only get direct children (one level deep)
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

  // Load options for fields that have options config
  for (const field of fields) {
    if (field.options && field.type === "options") {
      const opts = field.options as any;

      // If options is a reference to another structure (master data)
      if (opts.ref) {
        // opts.ref contains the structure ID of the master data
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
          // Try to find a title/name field in child content
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
      }
      // If options is a static array
      else if (Array.isArray(opts)) {
        field.optionsList = opts.map((o: string) => ({ value: o, label: o }));
      }
      // If options has items array
      else if (opts.items && Array.isArray(opts.items)) {
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
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const stripHtml = (html: string): string => {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim();
};

const renderEditPage = (
  user: { id: number; username: string; role: { id: number; name: string } },
  content: ContentData,
  fields: StructureField[],
  structures: ContentStructure[]
): string => {
  // Categorize fields
  const basicFields = fields.filter(
    (f) =>
      ["text", "date", "number", "options"].includes(f.type) && !f.multiple
  );
  const contentFields = fields.filter((f) => f.type === "textarea");
  const mediaFields = fields.filter((f) => f.type === "file");
  const multipleFields = fields.filter((f) => f.multiple);

  const renderField = (field: StructureField, value: any) => {
    const fieldName = field.path.split(".").pop() || "";
    const fieldValue = value || "";
    const required = field.required ? "required" : "";
    const requiredStar = field.required
      ? '<span class="text-red-500 ml-0.5">*</span>'
      : "";

    // Special handling for year fields (throughput.year, annual_throughput.year)
    if (field.path === "throughput.year" || field.path === "annual_throughput.year" ||
        (fieldName === "year" && (field.path.includes("throughput")))) {
      const currentYear = new Date().getFullYear();
      const years = [];
      // 5 years forward and 5 years backward from current year
      for (let y = currentYear + 5; y >= currentYear - 5; y--) {
        years.push(y);
      }
      const selectedYear = fieldValue || currentYear.toString();
      return `
        <div class="space-y-1.5">
          <label class="flex items-center text-sm font-medium text-gray-700">
            ${escapeHtml(field.title)}${requiredStar}
          </label>
          <select name="${fieldName}" id="input-${fieldName}" ${required}
                  class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
            ${years.map((y) => `<option value="${y}" ${selectedYear == y.toString() ? "selected" : ""}>${y}</option>`).join("")}
          </select>
        </div>
      `;
    }

    // Special handling for domestics/international fields - format as number with thousand separator
    if ((fieldName === "domestics" || fieldName === "international") &&
        (field.path.includes("throughput") || field.path.includes("annual_throughput"))) {
      const rawValue = fieldValue ? fieldValue.toString().replace(/[^\d]/g, "") : "";
      const numValue = rawValue ? parseInt(rawValue) : "";
      const formattedValue = numValue ? numValue.toLocaleString("id-ID") : "";
      return `
        <div class="space-y-1.5">
          <label class="flex items-center text-sm font-medium text-gray-700">
            ${escapeHtml(field.title)}${requiredStar}
          </label>
          <div class="relative">
            <input type="text"
                   id="display-${fieldName}"
                   value="${escapeHtml(formattedValue)}"
                   ${required}
                   class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none number-input"
                   data-field="${fieldName}"
                   oninput="formatNumberInput(this)"
                   placeholder="0">
            <input type="hidden" name="${fieldName}" id="input-${fieldName}" value="${rawValue}">
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
      const selectedMonth = fieldValue || currentMonth.toString();
      return `
        <div class="space-y-1.5">
          <label class="flex items-center text-sm font-medium text-gray-700">
            ${escapeHtml(field.title)}${requiredStar}
          </label>
          <select name="${fieldName}" id="input-${fieldName}" ${required}
                  class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
            ${months.map((m) => `<option value="${m.value}" ${selectedMonth == m.value ? "selected" : ""}>${m.label}</option>`).join("")}
          </select>
        </div>
      `;
    }

    if (field.type === "textarea") {
      // Determine if this field needs richtext (Quill) or plain textarea
      // Fields named "content", "description", or "footer_description" use richtext
      // Other textarea fields (address, etc.) use plain textarea
      const lastPart = (field.path || "").split(".").pop() || "";
      const isRichtext = ["content", "description", "footer_description"].includes(lastPart);

      if (isRichtext) {
        // Encode richtext content as base64 to prevent HTML parser issues
        // (raw HTML with <script> tags would break the page's own <script> block)
        const encodedContent = Buffer.from(fieldValue || "").toString("base64");
        return `
          <div class="space-y-1.5">
            <label class="flex items-center text-sm font-medium text-gray-700">
              ${escapeHtml(field.title)}${requiredStar}
            </label>
            <div id="editor-${fieldName}" class="quill-editor border rounded-lg overflow-hidden" data-field="${fieldName}" data-content="${encodedContent}">
            </div>
            <input type="hidden" name="${fieldName}" id="input-${fieldName}" value="">
          </div>
        `;
      } else {
        // Plain textarea for non-richtext fields (address, etc.)
        return `
          <div class="space-y-1.5">
            <label class="flex items-center text-sm font-medium text-gray-700">
              ${escapeHtml(field.title)}${requiredStar}
            </label>
            <textarea name="${fieldName}" id="input-${fieldName}" rows="4"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Masukkan ${escapeHtml(field.title).toLowerCase()}..."
            >${escapeHtml(fieldValue || "")}</textarea>
          </div>
        `;
      }
    }

    if (field.type === "file") {
      const hasFile = fieldValue && fieldValue.length > 0;
      const fileUrl = hasFile ? `/_file/${fieldValue}` : "";
      const imgUrl = hasFile ? `/_img/${fieldValue}?h=80` : "";

      return `
        <div class="space-y-1.5">
          <label class="flex items-center text-sm font-medium text-gray-700">
            ${escapeHtml(field.title)}${requiredStar}
          </label>
          <div class="file-upload-area border-2 border-dashed rounded-lg transition-all ${hasFile ? "border-gray-200 border-solid" : "border-gray-300 hover:border-gray-400"}"
               data-field="${fieldName}" data-has-file="${hasFile}">
            ${
              hasFile
                ? `
              <div class="flex items-center p-3 gap-3">
                <div class="flex-shrink-0">
                  <a href="${fileUrl}" target="_blank">
                    <img src="${imgUrl}" class="w-16 h-16 object-cover rounded-lg border bg-gray-100"
                         onerror="this.parentElement.innerHTML='<div class=\\'w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center\\'><svg class=\\'w-8 h-8 text-gray-400\\' fill=\\'none\\' stroke=\\'currentColor\\' viewBox=\\'0 0 24 24\\'><path stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\' stroke-width=\\'2\\' d=\\'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z\\'></path></svg></div>'">
                  </a>
                </div>
                <div class="flex-1 min-w-0">
                  <a href="${fileUrl}" target="_blank" class="flex items-center text-sm font-medium text-blue-600 hover:underline">
                    <span class="truncate">Lihat File</span>
                    <svg class="w-3 h-3 ml-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                  </a>
                </div>
                <div class="flex items-center gap-1">
                  <button type="button" onclick="triggerFileUpload('${fieldName}')" class="p-2 rounded-lg text-gray-500 hover:bg-gray-100" title="Ganti file">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                  </button>
                  <button type="button" onclick="removeFile('${fieldName}')" class="p-2 rounded-lg text-red-500 hover:bg-red-50" title="Hapus file">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>
              </div>
            `
                : `
              <label class="flex flex-col items-center justify-center py-6 px-4 cursor-pointer hover:bg-gray-50 transition-colors" onclick="triggerFileUpload('${fieldName}')">
                <div class="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-gray-100">
                  <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                </div>
                <span class="text-sm font-medium text-gray-600">Klik untuk upload atau drag & drop</span>
                <span class="text-xs text-gray-400 mt-1">PNG, JPG, PDF hingga 10MB</span>
              </label>
            `
            }
            <input type="file" id="file-${fieldName}" class="hidden" onchange="handleFileUpload('${fieldName}', this)">
            <input type="hidden" name="${fieldName}" id="input-${fieldName}" value="${escapeHtml(fieldValue)}">
          </div>
        </div>
      `;
    }

    if (field.type === "date") {
      // Convert ISO date string to YYYY-MM-DD format for HTML date input
      let dateValue = fieldValue || "";
      if (dateValue) {
        try {
          const d = new Date(dateValue);
          if (!isNaN(d.getTime())) {
            dateValue = d.toISOString().split("T")[0]; // YYYY-MM-DD
          }
        } catch (e) {
          // Keep original value if parsing fails
        }
      }
      return `
        <div class="space-y-1.5">
          <label class="flex items-center text-sm font-medium text-gray-700">
            ${escapeHtml(field.title)}${requiredStar}
          </label>
          <input type="date" name="${fieldName}" id="input-${fieldName}" value="${escapeHtml(dateValue)}" ${required}
                 class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
        </div>
      `;
    }

    if (field.type === "number") {
      // Format number with thousand separator for display
      const rawNumValue = fieldValue ? fieldValue.toString().replace(/[^\d]/g, "") : "";
      const numValue = rawNumValue ? parseInt(rawNumValue) : "";
      const formattedValue = numValue ? numValue.toLocaleString("id-ID") : "";
      return `
        <div class="space-y-1.5">
          <label class="flex items-center text-sm font-medium text-gray-700">
            ${escapeHtml(field.title)}${requiredStar}
          </label>
          <div class="relative">
            <input type="text"
                   id="display-${fieldName}"
                   value="${escapeHtml(formattedValue)}"
                   ${required}
                   class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none number-input"
                   data-field="${fieldName}"
                   oninput="formatNumberInput(this)"
                   placeholder="0">
            <input type="hidden" name="${fieldName}" id="input-${fieldName}" value="${rawNumValue}">
          </div>
        </div>
      `;
    }

    // Options/Dropdown field
    if (field.type === "options" && field.optionsList && field.optionsList.length > 0) {
      return `
        <div class="space-y-1.5">
          <label class="flex items-center text-sm font-medium text-gray-700">
            ${escapeHtml(field.title)}${requiredStar}
          </label>
          <select name="${fieldName}" id="input-${fieldName}" ${required}
                  class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
            <option value="">-- Pilih ${escapeHtml(field.title)} --</option>
            ${field.optionsList.map((opt) => `<option value="${escapeHtml(opt.value)}" ${fieldValue === opt.value ? "selected" : ""}>${escapeHtml(opt.label)}</option>`).join("")}
          </select>
        </div>
      `;
    }

    // Default: text input
    return `
      <div class="space-y-1.5">
        <label class="flex items-center text-sm font-medium text-gray-700">
          ${escapeHtml(field.title)}${requiredStar}
        </label>
        <input type="text" name="${fieldName}" id="input-${fieldName}" value="${escapeHtml(fieldValue)}" ${required}
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
            ${sectionFields.map((f) => renderField(f, content.fields[f.path.split(".").pop() || ""])).join("")}
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
  <title>Edit ${escapeHtml(content.structure.title || "")} - TPS Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.quilljs.com/1.3.7/quill.snow.css" rel="stylesheet">
  <script src="https://cdn.quilljs.com/1.3.7/quill.min.js"></script>
  <link rel="icon" href="/_img/tps-logo.png">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    .ql-toolbar { border: none !important; border-bottom: 1px solid #e5e7eb !important; background: #f9fafb; }
    .ql-container { border: none !important; font-size: 14px; }
    .ql-editor { min-height: 200px; max-height: 600px; overflow-y: auto; }
    .ql-editor.ql-blank::before { font-style: normal !important; color: #9ca3af; }
    .section-content { transition: max-height 0.3s ease, opacity 0.3s ease; overflow: hidden; }
    .section-collapsed .section-content { max-height: 0; opacity: 0; padding: 0; }
    .section-collapsed .section-chevron { transform: rotate(-90deg); }
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
      activePage: "content",
      user: { username: user.username, role: { name: user.role.name } },
      currentStructureId: content.structure.id,
      structures,
    })}

    <!-- Main Content -->
    <main class="flex-1 ml-64 overflow-auto">
      <!-- Header -->
      <div class="sticky top-0 z-10 bg-white border-b px-6 py-3 flex items-center justify-between">
        <div>
          ${content.isNested && content.parent ? `
          <div class="flex items-center text-sm text-gray-500">
            <a href="/backend/tpsadmin/list/${content.parent.structureId}" class="hover:text-blue-600">${escapeHtml(content.parent.structureTitle)}</a>
            <svg class="w-4 h-4 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            <a href="/backend/tpsadmin/edit/${content.parent.id}" class="hover:text-blue-600">${escapeHtml(stripHtml(content.parent.title).substring(0, 25))}</a>
            <svg class="w-4 h-4 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            <a href="/backend/tpsadmin/nested/${content.parent.id}/${content.structure.id}" class="hover:text-blue-600">${escapeHtml(content.structure.title)}</a>
            <svg class="w-4 h-4 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            <span class="text-gray-700 font-medium">Edit Item</span>
          </div>
          ` : `
          <div class="flex items-center text-sm text-gray-500">
            <a href="/backend/tpsadmin/list/${content.structure.id}" class="hover:text-blue-600">${escapeHtml(content.structure.title || "")}</a>
            <svg class="w-4 h-4 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            <span>Edit</span>
          </div>
          `}
        </div>
        <div class="flex items-center gap-3">
          ${content.isNested ? `
          <span class="px-3 py-1.5 rounded-lg text-sm font-medium bg-purple-50 border-2 border-purple-200 text-purple-700">
            Inherited
          </span>
          <input type="hidden" id="statusSelect" value="inherited">
          ` : `
          <select id="statusSelect" name="status" onchange="updateStatusStyle(this)"
                  class="px-3 py-1.5 rounded-lg text-sm font-medium border-2 cursor-pointer outline-none transition-colors
                         ${content.status === "published" ? "bg-green-50 border-green-200 text-green-700" : "bg-yellow-50 border-yellow-200 text-yellow-700"}">
            <option value="draft" ${content.status === "draft" ? "selected" : ""}>Draft</option>
            <option value="published" ${content.status === "published" ? "selected" : ""}>Published</option>
          </select>
          `}
          <button type="button" onclick="saveContent()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center font-medium">
            <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            Save
          </button>
        </div>
      </div>

      <!-- Form -->
      <form id="editForm" class="p-6 space-y-6 max-w-4xl mx-auto"
            data-content-id="${content.id}"
            data-is-nested="${content.isNested ? 'true' : 'false'}"
            data-parent-id="${content.parent?.id || ''}"
            data-structure-id="${content.structure.id}">
        <input type="hidden" name="id" value="${content.id}">

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

        ${
          content.nestedGroups.length > 0
            ? content.nestedGroups.map((group) => `
        <div class="bg-white border rounded-lg overflow-hidden shadow-sm">
          <div class="flex items-center px-4 py-3 border-b bg-gray-50">
            <svg class="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
            <h3 class="font-semibold text-gray-700 flex-1 text-sm">${escapeHtml(group.structureTitle)}</h3>
            <span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full mr-2">${group.items.length} items</span>
            <button type="button" onclick="addNestedItem('${group.structureId}')" class="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center">
              <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              Add
            </button>
          </div>
          <div class="p-4">
            ${group.items.length > 0 ? `
            <div class="space-y-2">
              ${group.items.map((item, idx) => `
              <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:border-blue-300 group">
                <div class="flex items-center gap-3 min-w-0 flex-1">
                  <span class="flex-shrink-0 w-8 h-8 rounded-full bg-white border flex items-center justify-center text-sm font-medium text-gray-500">
                    ${item.order !== 999 ? item.order : idx + 1}
                  </span>
                  <div class="min-w-0 flex-1">
                    <div class="font-medium text-gray-800 truncate">${escapeHtml(stripHtml(item.displayTitle).substring(0, 80))}</div>
                    ${Object.keys(item.fields).length > 1 ? `
                    <div class="text-xs text-gray-500 mt-0.5">${Object.keys(item.fields).filter(k => k !== 'order' && k !== 'title' && k !== 'description').slice(0, 3).map(k => escapeHtml(k)).join(', ')}</div>
                    ` : ''}
                  </div>
                </div>
                <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a href="/backend/tpsadmin/edit/${item.id}" class="p-2 rounded-lg text-blue-600 hover:bg-blue-50" title="Edit">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  </a>
                  <button type="button" onclick="deleteNestedItem('${item.id}')" class="p-2 rounded-lg text-red-600 hover:bg-red-50" title="Delete">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </div>
              `).join('')}
            </div>
            <div class="mt-3 pt-3 border-t">
              <a href="/backend/tpsadmin/nested/${content.id}/${group.structureId}" class="text-sm text-blue-600 hover:underline flex items-center">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
                Kelola semua ${escapeHtml(group.structureTitle.toLowerCase())} →
              </a>
            </div>
            ` : `
            <div class="text-center py-6 text-gray-500">
              <svg class="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
              <p class="text-sm">Belum ada ${escapeHtml(group.structureTitle.toLowerCase())}</p>
              <button type="button" onclick="addNestedItem('${group.structureId}')" class="mt-2 text-blue-600 hover:underline text-sm">+ Tambah ${escapeHtml(group.structureTitle)}</button>
            </div>
            `}
          </div>
        </div>
        `).join('')
            : ""
        }
      </form>
    </main>
  </div>

  <script>
    // Toast notification - defined first since it's used by other functions
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

    // Normalize HTML for Quill editor
    function normalizeHtmlForQuill(html) {
      if (!html) return '';

      // Create a temporary container to parse HTML
      const temp = document.createElement('div');
      temp.innerHTML = html;

      // Convert div-based structure to p tags for Quill
      // Replace empty divs with line breaks
      let normalized = html
        // Remove empty divs used as spacers
        .replace(/<div>\\s*<\\/div>/g, '')
        // Convert divs to p tags
        .replace(/<div>/g, '<p>')
        .replace(/<\\/div>/g, '</p>')
        // Clean up consecutive empty p tags
        .replace(/(<p>\\s*<\\/p>)+/g, '<p><br></p>')
        // Clean up leading/trailing whitespace in p tags
        .replace(/<p>\\s+/g, '<p>')
        .replace(/\\s+<\\/p>/g, '</p>');

      return normalized;
    }

    // Initialize Quill editors with error handling
    const quillEditors = {};
    try {
      document.querySelectorAll('.quill-editor').forEach(container => {
        const fieldName = container.dataset.field;
        // Decode base64 content to avoid HTML parser issues with raw richtext
        const encodedContent = container.dataset.content || '';
        let rawContent = '';
        if (encodedContent) {
          try { rawContent = atob(encodedContent); } catch(e) { rawContent = ''; }
        }
        const initialContent = normalizeHtmlForQuill(rawContent);

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

        if (initialContent && initialContent !== '<br>') {
          quill.root.innerHTML = initialContent;
        }

        quillEditors[fieldName] = quill;
      });
    } catch (e) {
      console.error('Quill initialization error:', e);
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
      let value = input.value.replace(/[^\d]/g, '');

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

    // Update status dropdown style
    function updateStatusStyle(select) {
      select.classList.remove('bg-green-50', 'border-green-200', 'text-green-700', 'bg-yellow-50', 'border-yellow-200', 'text-yellow-700');
      if (select.value === 'published') {
        select.classList.add('bg-green-50', 'border-green-200', 'text-green-700');
      } else {
        select.classList.add('bg-yellow-50', 'border-yellow-200', 'text-yellow-700');
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
          var filePath = result[0];
          document.getElementById('input-' + fieldName).value = filePath;

          // Update preview in-place (no reload - save first via Simpan button)
          var area = document.querySelector('[data-field="' + fieldName + '"]');
          if (area) {
            var fileUrl = '/_file/' + filePath;
            var imgUrl = '/_img/' + filePath + '?h=80';
            area.innerHTML = \`
              <div class="flex items-center p-3 gap-3">
                <div class="flex-shrink-0">
                  <a href="\${fileUrl}" target="_blank">
                    <img src="\${imgUrl}" class="w-16 h-16 object-cover rounded-lg border bg-gray-100"
                         onerror="this.parentElement.innerHTML='<div class=\\\\'w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center\\\\'><svg class=\\\\'w-8 h-8 text-gray-400\\\\' fill=\\\\'none\\\\' stroke=\\\\'currentColor\\\\' viewBox=\\\\'0 0 24 24\\\\'><path stroke-linecap=\\\\'round\\\\' stroke-linejoin=\\\\'round\\\\' stroke-width=\\\\'2\\\\' d=\\\\'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z\\\\'></path></svg></div>'">
                  </a>
                </div>
                <div class="flex-1 min-w-0">
                  <a href="\${fileUrl}" target="_blank" class="flex items-center text-sm font-medium text-blue-600 hover:underline">
                    <span class="truncate">\${file.name}</span>
                    <svg class="w-3 h-3 ml-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                  </a>
                  <span class="text-xs text-green-600 font-medium">Uploaded - klik Simpan untuk menyimpan</span>
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
              <input type="hidden" name="\${fieldName}" id="input-\${fieldName}" value="\${filePath}">
            \`;
            area.classList.remove('border-dashed', 'border-gray-300', 'hover:border-gray-400');
            area.classList.add('border-solid', 'border-gray-200');
          }
          showToast('File berhasil diupload. Klik Simpan untuk menyimpan.', 'success');
        } else {
          showToast('Upload gagal: response kosong', 'error');
        }
      } catch (e) {
        console.error('Upload error:', e);
        showToast('Gagal mengupload file: ' + e.message, 'error');
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
      const form = document.getElementById('editForm');

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

      // Get status from dropdown (outside form)
      const status = document.getElementById('statusSelect').value;

      // Get content data from form data attributes
      var contentId = form.dataset.contentId;
      var isNested = form.dataset.isNested === 'true';
      var parentId = form.dataset.parentId;
      var structureId = form.dataset.structureId;

      try {
        // Use custom save API that properly updates status
        var res = await fetch('/backend/api/content-save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            id: contentId,
            status: status,
            entry: formData,
            lang: 'id'
          })
        });

        var result = await res.json();

        if (result.status === 'ok') {
          // Cache is auto-cleared by API, show success
          showToast('Data berhasil disimpan', 'success');

          // For nested items, redirect back to nested management page
          if (isNested && parentId) {
            setTimeout(function() {
              window.location.href = '/backend/tpsadmin/nested/' + parentId + '/' + structureId;
            }, 800);
          } else {
            // For regular content, just reload
            setTimeout(function() { window.location.reload(); }, 1000);
          }
        } else {
          showToast('Gagal menyimpan: ' + (result.message || JSON.stringify(result.errors || 'Unknown error')), 'error');
        }
      } catch (e) {
        console.error('Save error:', e);
        showToast('Gagal menyimpan: ' + e.message, 'error');
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
    var sidCookie = document.cookie.split('; ').find(function(row) { return row.startsWith('sid='); });
    if (sidCookie) {
      localStorage.setItem('sid', sidCookie.split('=')[1]);
    }

    // Nested Items Management
    async function addNestedItem(nestedStructureId) {
      showToast('Membuat item baru...', 'loading');

      // Get parent ID from form data attribute
      var form = document.getElementById('editForm');
      var parentId = form.dataset.contentId;

      try {
        var res = await fetch('/backend/api/nested-item', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            action: 'create',
            parentId: parentId,
            structureId: nestedStructureId
          })
        });

        var result = await res.json();

        if (result.status === 'ok' && result.id) {
          showToast('Item berhasil dibuat', 'success');
          // Redirect to edit the new item
          window.location.href = '/backend/tpsadmin/edit/' + result.id;
        } else {
          showToast('Gagal membuat item: ' + (result.message || 'Unknown error'), 'error');
        }
      } catch (e) {
        console.error('Create nested item error:', e);
        showToast('Gagal membuat item: ' + e.message, 'error');
      }
    }

    async function deleteNestedItem(itemId) {
      if (!confirm('Yakin ingin menghapus item ini? Tindakan ini tidak dapat dibatalkan.')) {
        return;
      }

      showToast('Menghapus item...', 'loading');

      try {
        var res = await fetch('/backend/api/nested-item', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            action: 'delete',
            itemId: itemId
          })
        });

        var result = await res.json();

        if (result.status === 'ok') {
          showToast('Item berhasil dihapus', 'success');
          // Reload the page to refresh the list
          setTimeout(function() { window.location.reload(); }, 500);
        } else {
          showToast('Gagal menghapus: ' + (result.message || 'Unknown error'), 'error');
        }
      } catch (e) {
        console.error('Delete nested item error:', e);
        showToast('Gagal menghapus: ' + e.message, 'error');
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
    <p class="text-gray-600 mb-4">Content tidak ditemukan</p>
    <a href="/backend/tpsadmin" class="text-blue-600 hover:underline">Kembali ke Dashboard</a>
  </div>
</body>
</html>`;
};

export const _ = {
  url: "/backend/tpsadmin/edit/:id",
  raw: true,
  async api(this: { req: Request; _url: URL }) {
    const req = this.req as Request;

    // Get content ID from URL
    const url = this._url || new URL(req?.url || "http://localhost");
    const pathParts = url.pathname.split("/");
    const contentId = pathParts[pathParts.length - 1];

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

    // Get content data
    const content = await getContentData(contentId);
    if (!content) {
      return new Response(renderNotFound(), {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Get structure fields and sidebar data
    const [fields, structures] = await Promise.all([
      getStructureFields(content.structure.id, content.structure.path),
      loadSidebarStructures(),
    ]);

    // Render page
    const html = renderEditPage(user, content, fields, structures);

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Set-Cookie": `sid=${sessionId}; Path=/; HttpOnly; SameSite=Lax`,
      },
    });
  },
};
