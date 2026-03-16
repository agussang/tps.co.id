/**
 * Admin Nested Items Management Page - Full SSR
 * Route: /backend/tpsadmin/nested/:parentId/:structureId
 *
 * Manage nested/repeater items for a parent content
 */

import { g } from "utils/global";
import { loadRolePermissions, hasPermission } from "../utils/permissions";

interface NestedItem {
  id: string;
  fields: Record<string, any>;
  displayTitle: string;
  order: number;
}

interface FieldDef {
  id: string;
  path: string;
  title: string;
  type: string;
  multiple: boolean;
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

const getParentInfo = async (parentId: string) => {
  if (!g.db) return null;

  const content = await g.db.content.findFirst({
    where: { id: parentId },
    select: {
      id: true,
      structure: { select: { id: true, title: true, path: true } },
      other_content: {
        where: {
          structure: {
            path: { endsWith: ".title" },
          },
        },
        select: { text: true },
        take: 1,
      },
    },
  });

  if (!content) return null;

  const title =
    content.other_content[0]?.text || content.structure?.title || "Content";

  return {
    id: content.id,
    title,
    structureId: content.structure?.id || "",
    structurePath: content.structure?.path || "",
    structureTitle: content.structure?.title || "",
  };
};

const getNestedStructure = async (structureId: string) => {
  if (!g.db) return null;

  const structure = await g.db.structure.findFirst({
    where: { id: structureId },
    select: { id: true, title: true, path: true, multiple: true },
  });

  return structure;
};

const getFieldDefinitions = async (structurePath: string): Promise<FieldDef[]> => {
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
  return fields
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
};

const getNestedItems = async (
  parentId: string,
  structureId: string
): Promise<NestedItem[]> => {
  if (!g.db) return [];

  const nestedContents = await g.db.content.findMany({
    where: {
      id_parent: parentId,
      id_structure: structureId,
    },
    select: { id: true, created_at: true },
    orderBy: { created_at: "asc" },
  });

  const items: NestedItem[] = [];

  for (const nested of nestedContents) {
    const children = await g.db.content.findMany({
      where: { id_parent: nested.id },
      select: {
        text: true,
        structure: { select: { path: true, type: true } },
        file: { select: { path: true } },
      },
    });

    const fields: Record<string, any> = {};
    let displayTitle = "";
    let order = 999;

    for (const child of children) {
      if (child.structure?.path) {
        const fieldName = child.structure.path.split(".").pop() || "";
        if (child.structure.type === "file" && child.file) {
          fields[fieldName] = child.file.path;
        } else {
          fields[fieldName] = child.text || "";
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
      fields,
      displayTitle: displayTitle || `Item ${items.length + 1}`,
      order,
    });
  }

  // Sort by order
  items.sort((a, b) => a.order - b.order);

  return items;
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

const renderNestedPage = (
  user: { id: number; username: string; role: { id: number; name: string } },
  parentInfo: any,
  nestedStructure: any,
  fieldDefs: FieldDef[],
  items: NestedItem[]
): string => {
  const simpleFields = fieldDefs.filter((f) => !f.multiple);
  const displayFields = simpleFields.slice(0, 5);

  const renderCellValue = (field: FieldDef, value: any) => {
    if (!value) return '<span class="text-gray-400">-</span>';

    if (field.type === "file") {
      const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(value);
      if (isImage) {
        return `<img src="/_img/${escapeHtml(value)}?h=40" class="h-10 w-10 object-cover rounded border" onerror="this.outerHTML='<span class=\\'text-gray-400\\'>File</span>'">`;
      }
      return `<a href="/_file/${escapeHtml(value)}" target="_blank" class="text-blue-600 hover:underline text-sm">View</a>`;
    }

    const text = stripHtml(String(value));
    if (text.length > 60) {
      return `<span title="${escapeHtml(text)}">${escapeHtml(text.substring(0, 60))}...</span>`;
    }
    return escapeHtml(text);
  };

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(nestedStructure.title)} - ${escapeHtml(parentInfo.title)} - TPS Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="icon" href="/_img/tps-logo.png">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    .table-row:hover { background-color: #f9fafb; }
  </style>
</head>
<body class="bg-gray-50">
  <div class="min-h-screen">
    <!-- Header -->
    <header class="bg-white border-b sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <a href="/backend/tpsadmin/edit/${parentInfo.id}" class="p-2 rounded-lg hover:bg-gray-100" title="Back to parent">
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
            </a>
            <div>
              <div class="flex items-center gap-2 text-sm text-gray-500">
                <a href="/backend/tpsadmin/list/${parentInfo.structureId}" class="hover:text-blue-600">${escapeHtml(parentInfo.structureTitle)}</a>
                <span>/</span>
                <a href="/backend/tpsadmin/edit/${parentInfo.id}" class="hover:text-blue-600">${escapeHtml(stripHtml(parentInfo.title).substring(0, 30))}</a>
                <span>/</span>
                <span class="text-gray-700 font-medium">${escapeHtml(nestedStructure.title)}</span>
              </div>
              <h1 class="text-xl font-semibold text-gray-800 mt-1">
                Kelola ${escapeHtml(nestedStructure.title)}
                <span class="text-sm font-normal text-gray-500">(${items.length} items)</span>
              </h1>
            </div>
          </div>
          <button onclick="addItem()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center font-medium">
            <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Add Item
          </button>
        </div>
      </div>
    </header>

    <!-- Content -->
    <main class="max-w-7xl mx-auto px-6 py-6">
      <div class="bg-white rounded-lg border shadow-sm overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="bg-gray-50 border-b">
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">Order</th>
              ${displayFields.map((f) => `<th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">${escapeHtml(f.title)}</th>`).join("")}
              <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            ${
              items.length > 0
                ? items
                    .map(
                      (item, idx) => `
              <tr class="table-row" data-id="${item.id}">
                <td class="px-4 py-3">
                  <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 text-sm font-medium">
                    ${item.order !== 999 ? item.order : idx + 1}
                  </span>
                </td>
                ${displayFields
                  .map((f) => {
                    const fieldName = f.path.split(".").pop() || "";
                    return `<td class="px-4 py-3 text-sm">${renderCellValue(f, item.fields[fieldName])}</td>`;
                  })
                  .join("")}
                <td class="px-4 py-3 text-right">
                  <div class="flex items-center justify-end gap-1">
                    <a href="/backend/tpsadmin/edit/${item.id}" class="p-2 rounded-lg text-blue-600 hover:bg-blue-50" title="Edit">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                    </a>
                    <button onclick="deleteItem('${item.id}')" class="p-2 rounded-lg text-red-600 hover:bg-red-50" title="Delete">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            `
                    )
                    .join("")
                : `
              <tr>
                <td colspan="${displayFields.length + 2}" class="px-4 py-12 text-center text-gray-500">
                  <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
                  </svg>
                  <p class="font-medium">No items yet</p>
                  <p class="text-sm mt-1">Click "Add Item" to create your first item</p>
                </td>
              </tr>
            `
            }
          </tbody>
        </table>
      </div>
    </main>
  </div>

  <script>
    const parentId = '${parentInfo.id}';
    const structureId = '${nestedStructure.id}';

    function showToast(message, type) {
      const existing = document.querySelector('.toast');
      if (existing) existing.remove();

      const toast = document.createElement('div');
      toast.className = 'toast fixed bottom-5 right-5 px-5 py-3 rounded-lg text-white z-50 animate-slide-in';
      toast.style.animation = 'slideIn 0.3s ease';
      if (type === 'success') toast.style.background = '#22c55e';
      else if (type === 'error') toast.style.background = '#ef4444';
      else toast.style.background = '#3b82f6';
      toast.textContent = message;
      document.body.appendChild(toast);

      if (type !== 'loading') {
        setTimeout(() => toast.remove(), 3000);
      }
    }

    async function addItem() {
      showToast('Membuat item baru...', 'loading');

      try {
        const res = await fetch('/backend/api/nested-item', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            action: 'create',
            parentId: parentId,
            structureId: structureId
          })
        });

        const result = await res.json();
        console.log('Create result:', result);

        if (result.status === 'ok' && result.id) {
          showToast('Item berhasil dibuat', 'success');
          // Redirect to edit the new item
          setTimeout(() => {
            window.location.href = '/backend/tpsadmin/edit/' + result.id;
          }, 500);
        } else {
          showToast('Gagal membuat item: ' + (result.message || JSON.stringify(result)), 'error');
        }
      } catch (e) {
        console.error('Add item error:', e);
        showToast('Error: ' + e.message, 'error');
      }
    }

    async function deleteItem(id) {
      if (!confirm('Yakin ingin menghapus item ini? Tindakan ini tidak dapat dibatalkan.')) return;

      showToast('Menghapus item...', 'loading');

      try {
        const res = await fetch('/backend/api/nested-item', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            action: 'delete',
            itemId: id
          })
        });

        const result = await res.json();

        if (result.status === 'ok') {
          showToast('Item berhasil dihapus', 'success');
          setTimeout(() => window.location.reload(), 500);
        } else {
          showToast('Gagal menghapus: ' + (result.message || 'Unknown error'), 'error');
        }
      } catch (e) {
        console.error('Delete item error:', e);
        showToast('Error: ' + e.message, 'error');
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
<body>
  <p>Redirecting to login...</p>
</body>
</html>`;
};

const renderNotFound = (message: string): string => {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Not Found</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 flex items-center justify-center min-h-screen">
  <div class="text-center">
    <h1 class="text-4xl font-bold text-gray-800 mb-2">404</h1>
    <p class="text-gray-600 mb-4">${message}</p>
    <a href="/backend/tpsadmin/dashboard" class="text-blue-600 hover:underline">Back to Dashboard</a>
  </div>
</body>
</html>`;
};

const renderForbidden = (): string => {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Akses Ditolak</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="icon" href="/_img/tps-logo.png">
</head>
<body class="bg-gray-50 flex items-center justify-center min-h-screen">
  <div class="text-center">
    <svg class="w-16 h-16 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
    </svg>
    <h1 class="text-2xl font-bold text-gray-800 mb-2">Akses Ditolak</h1>
    <p class="text-gray-600 mb-4">Anda tidak memiliki izin untuk mengakses halaman ini</p>
    <a href="/backend/tpsadmin/dashboard" class="text-blue-600 hover:underline">Kembali ke Dashboard</a>
  </div>
</body>
</html>`;
};

export const _ = {
  url: "/backend/tpsadmin/nested/:parentId/:structureId",
  raw: true,
  async api(this: { req: Request; _url: URL }) {
    const req = this.req as Request;
    const url = this._url || new URL(req?.url || "http://localhost");

    // Get IDs from URL path
    const pathParts = url.pathname.split("/");
    const structureId = pathParts[pathParts.length - 1];
    const parentId = pathParts[pathParts.length - 2];

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

    // Get parent info
    const parentInfo = await getParentInfo(parentId);
    if (!parentInfo) {
      return new Response(renderNotFound("Parent content not found"), {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Check can_view permission on parent structure
    const permMap = await loadRolePermissions(user.role.id);
    if (!hasPermission(user.role.name, parentInfo.structureId, "can_view", permMap)) {
      return new Response(renderForbidden(), {
        status: 403,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Get nested structure info
    const nestedStructure = await getNestedStructure(structureId);
    if (!nestedStructure) {
      return new Response(renderNotFound("Structure not found"), {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Get field definitions and items
    const [fieldDefs, items] = await Promise.all([
      getFieldDefinitions(nestedStructure.path || ""),
      getNestedItems(parentId, structureId),
    ]);

    // Render page
    const html = renderNestedPage(
      user,
      parentInfo,
      nestedStructure,
      fieldDefs,
      items
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
