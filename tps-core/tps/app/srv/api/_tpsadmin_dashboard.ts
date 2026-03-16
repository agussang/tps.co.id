/**
 * Admin Dashboard Page - Full SSR
 * Route: /backend/tpsadmin/dashboard
 *
 * Server-side rendered dashboard that doesn't depend on frontend bundle
 */

import { g } from "utils/global";
import { AdminSidebar, loadSidebarStructures } from "../components/AdminSidebar";
import { loadRolePermissions } from "../utils/permissions";

interface DashboardStats {
  totalContent: number;
  draftContent: number;
  publishedContent: number;
  inheritedContent: number;
  totalStructures: number;
  totalUsers: number;
  activeUsers: number;
  // Per-language stats
  idContent: number;
  enContent: number;
  idPublished: number;
  enPublished: number;
  idDraft: number;
  enDraft: number;
}

interface RecentContent {
  id: string;
  title: string;
  status: string;
  updated_at: Date | null;
  structure_title: string | null;
  lang: string;
}

interface RecentLog {
  id: number;
  activity: string;
  user: string;
  created_at: Date;
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

  // Validate UUID format
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
            role: {
              select: {
                id: true,
                name: true,
              },
            },
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

const getDashboardStats = async (): Promise<DashboardStats> => {
  if (!g.db) {
    return {
      totalContent: 0, draftContent: 0, publishedContent: 0, inheritedContent: 0,
      totalStructures: 0, totalUsers: 0, activeUsers: 0,
      idContent: 0, enContent: 0, idPublished: 0, enPublished: 0, idDraft: 0, enDraft: 0
    };
  }

  const [
    totalContent,
    draftContent,
    publishedContent,
    inheritedContent,
    totalStructures,
    totalUsers,
    activeUsers,
    // ID language stats
    idContent,
    idPublished,
    idDraft,
    // EN language stats
    enContent,
    enPublished,
    enDraft,
  ] = await Promise.all([
    g.db.content.count({ where: { id_parent: null } }),
    g.db.content.count({ where: { id_parent: null, status: "draft" } }),
    g.db.content.count({ where: { id_parent: null, status: "published" } }),
    g.db.content.count({ where: { id_parent: null, status: "inherited" } }),
    g.db.structure.count({ where: { parent: null } }),
    g.db.user.count(),
    g.db.user.count({ where: { active: true } }),
    // ID language stats - treat null/inherited as ID (default language)
    g.db.content.count({ where: { id_parent: null, OR: [{ lang: "id" }, { lang: null }, { lang: "inherited" }] } }),
    g.db.content.count({ where: { id_parent: null, status: "published", OR: [{ lang: "id" }, { lang: null }, { lang: "inherited" }] } }),
    g.db.content.count({ where: { id_parent: null, status: "draft", OR: [{ lang: "id" }, { lang: null }, { lang: "inherited" }] } }),
    // EN language stats
    g.db.content.count({ where: { id_parent: null, lang: "en" } }),
    g.db.content.count({ where: { id_parent: null, status: "published", lang: "en" } }),
    g.db.content.count({ where: { id_parent: null, status: "draft", lang: "en" } }),
  ]);

  return {
    totalContent,
    draftContent,
    publishedContent,
    inheritedContent,
    totalStructures,
    totalUsers,
    activeUsers,
    idContent,
    enContent,
    idPublished,
    enPublished,
    idDraft,
    enDraft,
  };
};

const getRecentContent = async (limit = 10, lang?: string): Promise<RecentContent[]> => {
  if (!g.db) return [];

  // Build where clause based on language filter
  // IMPORTANT: Only get content where structure.parent IS NULL (root structures only)
  const where: any = {
    id_parent: null,
    structure: { parent: null }  // Only root structures, not field-level content
  };
  if (lang === "id") {
    // ID includes null and inherited (default language)
    where.OR = [{ lang: "id" }, { lang: null }, { lang: "inherited" }];
  } else if (lang === "en") {
    where.lang = "en";
  }

  const content = await g.db.content.findMany({
    where,
    orderBy: { created_at: "desc" },
    take: limit,
    select: {
      id: true,
      status: true,
      lang: true,
      updated_at: true,
      created_at: true,
      structure: {
        select: {
          title: true,
          path: true,
        },
      },
      other_content: {
        select: {
          text: true,
          structure: {
            select: {
              path: true,
              type: true,
              indexs: true,
            },
          },
        },
      },
    },
  });

  return content.map((c) => {
    // Find title from child content - prioritize: indexs=true, then .title, then .name, then .content
    let titleText = "";

    // First try to find field with indexs=true
    const indexField = c.other_content.find(
      (oc: any) => oc.structure?.indexs === true && oc.structure?.type === "text"
    );
    if (indexField) {
      titleText = indexField.text || "";
    }

    // If not found, try common title field patterns
    if (!titleText) {
      const titlePatterns = [".title", ".name", ".judul", ".nama"];
      for (const pattern of titlePatterns) {
        const field = c.other_content.find(
          (oc: any) => oc.structure?.path?.endsWith(pattern) && oc.text
        );
        if (field) {
          titleText = field.text || "";
          break;
        }
      }
    }

    // If still not found, use first text field with content
    if (!titleText) {
      const firstText = c.other_content.find(
        (oc: any) => oc.structure?.type === "text" && oc.text && oc.text.length < 200
      );
      if (firstText) {
        titleText = firstText.text || "";
      }
    }

    // Determine display language
    const displayLang = c.lang === "en" ? "en" : "id";

    return {
      id: c.id,
      title: titleText || "Untitled",
      status: c.status || "draft",
      updated_at: c.updated_at || c.created_at, // Fallback to created_at
      structure_title: c.structure?.title || null,
      lang: displayLang,
    };
  });
};

const getRecentLogs = async (limit = 10): Promise<RecentLog[]> => {
  if (!g.db) return [];

  return g.db.logs.findMany({
    orderBy: { created_at: "desc" },
    take: limit,
  });
};


const formatDate = (date: Date | null): string => {
  if (!date) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

const escapeHtml = (str: string): string => {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const renderDashboard = (
  user: { id: number; username: string; role: { id: number; name: string } },
  stats: DashboardStats,
  recentContentId: RecentContent[],
  recentContentEn: RecentContent[],
  recentLogs: RecentLog[],
  structures: ContentStructure[],
  viewableStructureIds?: Set<string>
): string => {
  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      published: "bg-green-100 text-green-800",
      draft: "bg-yellow-100 text-yellow-800",
      inherited: "bg-gray-100 text-gray-800",
    };
    return colors[status] || colors.inherited;
  };

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard - TPS Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="icon" href="/_img/tps-logo.png">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    .stat-card { transition: transform 0.2s, box-shadow 0.2s; }
    .stat-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
  </style>
</head>
<body class="bg-gray-50">
  <div class="min-h-screen flex">
    ${AdminSidebar({
      activePage: "dashboard",
      user: { username: user.username, role: { name: user.role.name } },
      structures,
      viewableStructureIds,
    })}

    <!-- Main Content -->
    <main class="flex-1 ml-64 overflow-auto">
      <div class="p-6">
        <!-- Header -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p class="text-gray-500">Selamat datang, ${escapeHtml(user.username)}</p>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <!-- Content ID -->
          <div class="stat-card bg-white rounded-lg p-4 shadow-sm border border-l-4 border-l-red-500">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-500 flex items-center gap-1">
                  <span class="inline-block w-5 h-3 bg-red-500 rounded-sm"></span>
                  Konten Indonesia
                </p>
                <p class="text-2xl font-bold text-gray-800">${stats.idContent}</p>
              </div>
              <div class="p-3 bg-red-100 rounded-full">
                <span class="text-red-600 font-bold text-sm">ID</span>
              </div>
            </div>
            <div class="mt-2 flex items-center flex-wrap gap-1 text-xs">
              <span class="text-green-600">${stats.idPublished} published</span>
              <span class="text-gray-300">|</span>
              <span class="text-yellow-600">${stats.idDraft} draft</span>
            </div>
          </div>

          <!-- Content EN -->
          <div class="stat-card bg-white rounded-lg p-4 shadow-sm border border-l-4 border-l-blue-500">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-500 flex items-center gap-1">
                  <span class="inline-block w-5 h-3 bg-blue-500 rounded-sm"></span>
                  Content English
                </p>
                <p class="text-2xl font-bold text-gray-800">${stats.enContent}</p>
              </div>
              <div class="p-3 bg-blue-100 rounded-full">
                <span class="text-blue-600 font-bold text-sm">EN</span>
              </div>
            </div>
            <div class="mt-2 flex items-center flex-wrap gap-1 text-xs">
              <span class="text-green-600">${stats.enPublished} published</span>
              <span class="text-gray-300">|</span>
              <span class="text-yellow-600">${stats.enDraft} draft</span>
            </div>
          </div>

          <!-- Structures -->
          <div class="stat-card bg-white rounded-lg p-4 shadow-sm border">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-500">Structures</p>
                <p class="text-2xl font-bold text-gray-800">${stats.totalStructures}</p>
              </div>
              <div class="p-3 bg-purple-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-purple-600"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
              </div>
            </div>
            <p class="mt-2 text-xs text-gray-500">Content types</p>
          </div>

          <!-- Users -->
          <div class="stat-card bg-white rounded-lg p-4 shadow-sm border">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-500">Users</p>
                <p class="text-2xl font-bold text-gray-800">${stats.totalUsers}</p>
              </div>
              <div class="p-3 bg-orange-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-orange-600"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
            </div>
            <p class="mt-2 text-xs text-gray-500">${stats.activeUsers} active users</p>
          </div>
        </div>

        <!-- Recent Content - Two columns for ID and EN -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <!-- Recent Content ID -->
          <div class="bg-white rounded-lg shadow-sm border border-l-4 border-l-red-500">
            <div class="px-4 py-3 border-b flex items-center justify-between bg-red-50">
              <h2 class="font-semibold text-gray-800 flex items-center gap-2">
                <span class="inline-block w-5 h-3 bg-red-500 rounded-sm"></span>
                Konten Terbaru (Indonesia)
              </h2>
              <span class="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded">ID</span>
            </div>
            <div class="divide-y max-h-80 overflow-auto">
              ${
                recentContentId.length > 0
                  ? recentContentId
                      .map(
                        (c) => `
                <a href="/backend/tpsadmin/edit/${c.id}" class="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-800 truncate">${escapeHtml(c.title)}</p>
                    <p class="text-xs text-gray-500">${c.structure_title ? escapeHtml(c.structure_title) : "Unknown"}</p>
                  </div>
                  <div class="flex items-center gap-2 ml-4">
                    <span class="px-2 py-1 text-xs rounded ${statusBadge(c.status)}">${c.status}</span>
                    <span class="text-xs text-gray-400 whitespace-nowrap">${formatDate(c.updated_at)}</span>
                  </div>
                </a>
              `
                      )
                      .join("")
                  : '<div class="px-4 py-8 text-center text-gray-500">Belum ada konten Indonesia</div>'
              }
            </div>
          </div>

          <!-- Recent Content EN -->
          <div class="bg-white rounded-lg shadow-sm border border-l-4 border-l-blue-500">
            <div class="px-4 py-3 border-b flex items-center justify-between bg-blue-50">
              <h2 class="font-semibold text-gray-800 flex items-center gap-2">
                <span class="inline-block w-5 h-3 bg-blue-500 rounded-sm"></span>
                Recent Content (English)
              </h2>
              <span class="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">EN</span>
            </div>
            <div class="divide-y max-h-80 overflow-auto">
              ${
                recentContentEn.length > 0
                  ? recentContentEn
                      .map(
                        (c) => `
                <a href="/backend/tpsadmin/edit/${c.id}" class="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-800 truncate">${escapeHtml(c.title)}</p>
                    <p class="text-xs text-gray-500">${c.structure_title ? escapeHtml(c.structure_title) : "Unknown"}</p>
                  </div>
                  <div class="flex items-center gap-2 ml-4">
                    <span class="px-2 py-1 text-xs rounded ${statusBadge(c.status)}">${c.status}</span>
                    <span class="text-xs text-gray-400 whitespace-nowrap">${formatDate(c.updated_at)}</span>
                  </div>
                </a>
              `
                      )
                      .join("")
                  : '<div class="px-4 py-8 text-center text-gray-500">No English content yet</div>'
              }
            </div>
          </div>
        </div>

        <!-- Recent Activity - Full width -->
        <div class="bg-white rounded-lg shadow-sm border">
          <div class="px-4 py-3 border-b flex items-center justify-between">
            <h2 class="font-semibold text-gray-800">Recent Activity</h2>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <div class="divide-y max-h-48 overflow-auto">
            ${
              recentLogs.length > 0
                ? recentLogs
                    .map(
                      (log) => `
              <div class="px-4 py-3">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-800">${escapeHtml(log.user)}</span>
                  <span class="text-xs text-gray-400">${formatDate(log.created_at)}</span>
                </div>
                <p class="text-sm text-gray-600 mt-1">${escapeHtml(log.activity)}</p>
              </div>
            `
                    )
                    .join("")
                : '<div class="px-4 py-8 text-center text-gray-500">No activity logs</div>'
            }
          </div>
        </div>
      </div>
    </main>
  </div>

  <script>
    // Store session in localStorage for other pages
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
<body>
  <p>Redirecting to login...</p>
</body>
</html>`;
};

export const _ = {
  url: "/backend/tpsadmin/dashboard",
  raw: true,
  async api(this: { req: Request; _url: URL }) {
    // @ts-ignore - this is bound to current context by serve-api.ts
    const req = this.req as Request;

    // Get session from cookie or localStorage (via query param for SPA navigation)
    const cookies = req?.headers?.get("cookie") || "";
    const sidMatch = cookies.match(/sid=([^;]+)/);
    let sessionId = sidMatch ? sidMatch[1] : "";

    // Also check URL for sid param (for SPA navigation)
    const url = this._url || new URL(req?.url || "http://localhost");
    const sidParam = url.searchParams.get("sid");
    if (sidParam) {
      sessionId = sidParam;
    }

    // If no session in cookie, try to get from request body or localStorage
    console.log("[DASHBOARD] Session ID from cookie:", sessionId || "NONE");
    if (!sessionId) {
      console.log("[DASHBOARD] No session cookie, showing localStorage loader");
      return new Response(
        `<!DOCTYPE html>
<html>
<head>
  <title>Loading Dashboard...</title>
  <script>
    console.log('[DASHBOARD CLIENT] Checking localStorage...');
    const sid = localStorage.getItem('sid');
    console.log('[DASHBOARD CLIENT] localStorage sid:', sid);
    if (sid) {
      // Set cookie and reload
      console.log('[DASHBOARD CLIENT] Setting cookie and reloading...');
      document.cookie = 'sid=' + sid + '; path=/; SameSite=Lax';
      console.log('[DASHBOARD CLIENT] Cookie set, current cookies:', document.cookie);
      window.location.reload();
    } else {
      console.log('[DASHBOARD CLIENT] No sid in localStorage, redirecting to login');
      window.location.href = '/backend/tpsadmin';
    }
  </script>
</head>
<body>
  <p>Loading...</p>
</body>
</html>`,
        {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }
      );
    }

    // Validate session
    console.log("[DASHBOARD] Validating session:", sessionId);
    const user = await getSessionUser(sessionId);
    console.log("[DASHBOARD] User found:", user ? user.username : "NONE");
    if (!user) {
      console.log("[DASHBOARD] Invalid session, redirecting to login");
      return new Response(renderLoginRedirect(), {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Load permissions for sidebar filtering
    const permMap = await loadRolePermissions(user.role.id);
    let viewableStructureIds: Set<string> | undefined;
    if (user.role.name !== "superadmin") {
      viewableStructureIds = new Set<string>();
      for (const [sid, p] of permMap) {
        if (p.can_view) viewableStructureIds.add(sid);
      }
    }

    // Fetch dashboard data - separate ID and EN content
    const [stats, recentContentId, recentContentEn, recentLogs, structures] = await Promise.all([
      getDashboardStats(),
      getRecentContent(10, "id"),
      getRecentContent(10, "en"),
      getRecentLogs(10),
      loadSidebarStructures(),
    ]);

    // Render dashboard
    const html = renderDashboard(user, stats, recentContentId, recentContentEn, recentLogs, structures, viewableStructureIds);

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Set-Cookie": `sid=${sessionId}; Path=/; HttpOnly; SameSite=Lax`,
      },
    });
  },
};
