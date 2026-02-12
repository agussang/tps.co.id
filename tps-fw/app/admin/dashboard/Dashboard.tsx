import { useLocal } from "@/utils/use-local";
import {
  FileText,
  FilePenLine,
  FileCheck,
  FolderTree,
  Users,
  Clock,
  ArrowRight,
  Activity
} from "lucide-react";
import { FC, useEffect } from "react";
import { dashboardQuery } from "../query/dashboard";
import { Skeleton } from "@/comps/ui/skeleton";

const w = window as any;

// Stat card component
const StatCard: FC<{
  icon: any;
  label: string;
  value: number | string;
  color: string;
  loading?: boolean;
}> = ({ icon: Icon, label, value, color, loading }) => (
  <div className={cx(
    "c-bg-white c-rounded-lg c-border c-p-4 c-flex c-items-center c-space-x-4",
    "hover:c-shadow-md c-transition-shadow"
  )}>
    <div className={cx(
      "c-w-12 c-h-12 c-rounded-lg c-flex c-items-center c-justify-center",
      color
    )}>
      <Icon className="c-w-6 c-h-6 c-text-white" />
    </div>
    <div className="c-flex c-flex-col">
      <span className="c-text-sm c-text-gray-500">{label}</span>
      {loading ? (
        <Skeleton className="c-w-16 c-h-7" />
      ) : (
        <span className="c-text-2xl c-font-bold">{value}</span>
      )}
    </div>
  </div>
);

// Time ago formatter
const timeAgo = (date: Date | string | null) => {
  if (!date) return "-";
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return then.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
};

// Action label mapper
const getActionLabel = (action: string) => {
  const map: Record<string, { label: string; color: string }> = {
    login: { label: "Login", color: "c-bg-green-100 c-text-green-700" },
    logout: { label: "Logout", color: "c-bg-gray-100 c-text-gray-700" },
    edit: { label: "Edit", color: "c-bg-blue-100 c-text-blue-700" },
    create: { label: "Create", color: "c-bg-purple-100 c-text-purple-700" },
    delete: { label: "Delete", color: "c-bg-red-100 c-text-red-700" },
    publish: { label: "Publish", color: "c-bg-emerald-100 c-text-emerald-700" },
    view: { label: "View", color: "c-bg-slate-100 c-text-slate-700" },
  };
  return map[action] || { label: action, color: "c-bg-gray-100 c-text-gray-700" };
};

export const Dashboard: FC = () => {
  const local = useLocal({
    loading: true,
    stats: null as null | Awaited<ReturnType<typeof dashboardQuery.stats>>,
    recentContent: [] as Awaited<ReturnType<typeof dashboardQuery.recentContent>>,
    recentLogs: [] as Awaited<ReturnType<typeof dashboardQuery.recentLogs>>,
    quickLinks: [] as Awaited<ReturnType<typeof dashboardQuery.quickLinks>>,
  }, async () => {
    if (w.user?.role?.id) {
      const [stats, recentContent, recentLogs, quickLinks] = await Promise.all([
        dashboardQuery.stats(),
        dashboardQuery.recentContent(5),
        dashboardQuery.recentLogs(5),
        dashboardQuery.quickLinks(w.user.role.id),
      ]);
      local.stats = stats;
      local.recentContent = recentContent;
      local.recentLogs = recentLogs;
      local.quickLinks = quickLinks;
      local.loading = false;
      local.render();
    }
  });

  return (
    <div className="c-flex c-flex-col c-h-full c-overflow-auto c-bg-gray-50">
      {/* Header */}
      <div className="c-bg-white c-border-b c-px-6 c-py-4">
        <h1 className="c-text-2xl c-font-bold c-text-gray-800">Dashboard</h1>
        <p className="c-text-sm c-text-gray-500">
          Selamat datang, {w.user?.username || "User"}
        </p>
      </div>

      <div className="c-p-6 c-space-y-6">
        {/* Stats Grid */}
        <div className="c-grid c-grid-cols-2 lg:c-grid-cols-5 c-gap-4">
          <StatCard
            icon={FileText}
            label="Total Konten"
            value={local.stats?.totalContent || 0}
            color="c-bg-blue-500"
            loading={local.loading}
          />
          <StatCard
            icon={FilePenLine}
            label="Draft"
            value={local.stats?.draftContent || 0}
            color="c-bg-amber-500"
            loading={local.loading}
          />
          <StatCard
            icon={FileCheck}
            label="Published"
            value={local.stats?.publishedContent || 0}
            color="c-bg-green-500"
            loading={local.loading}
          />
          <StatCard
            icon={FolderTree}
            label="Struktur"
            value={local.stats?.totalStructures || 0}
            color="c-bg-purple-500"
            loading={local.loading}
          />
          <StatCard
            icon={Users}
            label="User Aktif"
            value={local.stats?.totalUsers || 0}
            color="c-bg-indigo-500"
            loading={local.loading}
          />
        </div>

        {/* Two Column Layout */}
        <div className="c-grid c-grid-cols-1 lg:c-grid-cols-2 c-gap-6">
          {/* Recently Edited */}
          <div className="c-bg-white c-rounded-lg c-border c-overflow-hidden">
            <div className="c-px-4 c-py-3 c-border-b c-bg-gray-50 c-flex c-items-center c-justify-between">
              <div className="c-flex c-items-center c-space-x-2">
                <Clock className="c-w-4 c-h-4 c-text-gray-500" />
                <h2 className="c-font-semibold c-text-gray-700">Terakhir Diedit</h2>
              </div>
            </div>
            <div className="c-divide-y">
              {local.loading ? (
                <div className="c-p-4 c-space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="c-flex c-items-center c-space-x-3">
                      <Skeleton className="c-w-8 c-h-8 c-rounded" />
                      <div className="c-flex-1">
                        <Skeleton className="c-w-3/4 c-h-4 c-mb-1" />
                        <Skeleton className="c-w-1/2 c-h-3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : local.recentContent.length === 0 ? (
                <div className="c-p-8 c-text-center c-text-gray-400">
                  Belum ada konten yang diedit
                </div>
              ) : (
                local.recentContent.map((item) => (
                  <a
                    key={item.id}
                    href={`/backend/tpsadmin/content/edit/${item.id}`}
                    className={cx(
                      "c-flex c-items-center c-px-4 c-py-3 hover:c-bg-blue-50 c-cursor-pointer c-group",
                      "c-transition-colors"
                    )}
                  >
                    <div className="c-flex-1 c-min-w-0">
                      <div className="c-flex c-items-center c-space-x-2">
                        <span className="c-font-medium c-text-gray-800 c-truncate">
                          {item.title}
                        </span>
                        <span className={cx(
                          "c-text-xs c-px-2 c-py-0.5 c-rounded-full",
                          item.status === "published"
                            ? "c-bg-green-100 c-text-green-700"
                            : "c-bg-amber-100 c-text-amber-700"
                        )}>
                          {item.status}
                        </span>
                      </div>
                      <div className="c-flex c-items-center c-space-x-2 c-text-sm c-text-gray-500">
                        <span>{item.structureTitle}</span>
                        <span>•</span>
                        <span>{timeAgo(item.updatedAt)}</span>
                      </div>
                    </div>
                    <ArrowRight className="c-w-4 c-h-4 c-text-gray-300 group-hover:c-text-blue-500 c-transition-colors" />
                  </a>
                ))
              )}
            </div>
          </div>

          {/* Activity Log */}
          <div className="c-bg-white c-rounded-lg c-border c-overflow-hidden">
            <div className="c-px-4 c-py-3 c-border-b c-bg-gray-50 c-flex c-items-center c-justify-between">
              <div className="c-flex c-items-center c-space-x-2">
                <Activity className="c-w-4 c-h-4 c-text-gray-500" />
                <h2 className="c-font-semibold c-text-gray-700">Aktivitas Terbaru</h2>
              </div>
            </div>
            <div className="c-divide-y">
              {local.loading ? (
                <div className="c-p-4 c-space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="c-flex c-items-center c-space-x-3">
                      <Skeleton className="c-w-16 c-h-5 c-rounded" />
                      <div className="c-flex-1">
                        <Skeleton className="c-w-1/2 c-h-4" />
                      </div>
                      <Skeleton className="c-w-20 c-h-3" />
                    </div>
                  ))}
                </div>
              ) : local.recentLogs.length === 0 ? (
                <div className="c-p-8 c-text-center c-text-gray-400">
                  Belum ada aktivitas
                </div>
              ) : (
                local.recentLogs.map((log) => {
                  const actionInfo = getActionLabel(log.action);
                  return (
                    <div key={log.id} className="c-flex c-items-center c-px-4 c-py-3">
                      <span className={cx(
                        "c-text-xs c-px-2 c-py-1 c-rounded c-font-medium c-mr-3",
                        actionInfo.color
                      )}>
                        {actionInfo.label}
                      </span>
                      <div className="c-flex-1 c-min-w-0">
                        <span className="c-text-sm c-text-gray-700 c-font-medium">
                          {log.user}
                        </span>
                        {log.url && (
                          <span className="c-text-sm c-text-gray-400 c-ml-1 c-truncate">
                            {log.url.split("/").pop()}
                          </span>
                        )}
                      </div>
                      <span className="c-text-xs c-text-gray-400">
                        {timeAgo(log.createdAt)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="c-bg-white c-rounded-lg c-border c-overflow-hidden">
          <div className="c-px-4 c-py-3 c-border-b c-bg-gray-50">
            <h2 className="c-font-semibold c-text-gray-700">Akses Cepat</h2>
          </div>
          <div className="c-grid c-grid-cols-2 sm:c-grid-cols-4 lg:c-grid-cols-8 c-gap-4 c-p-4">
            {local.loading ? (
              [1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="c-flex c-flex-col c-items-center c-p-3">
                  <Skeleton className="c-w-12 c-h-12 c-rounded-lg c-mb-2" />
                  <Skeleton className="c-w-16 c-h-3" />
                </div>
              ))
            ) : local.quickLinks.length === 0 ? (
              <div className="c-col-span-full c-text-center c-py-4 c-text-gray-400">
                Tidak ada akses cepat tersedia
              </div>
            ) : (
              local.quickLinks.map((link) => (
                <a
                  key={link.id}
                  href={`/backend/tpsadmin/content/list/${link.id}`}
                  className={cx(
                    "c-flex c-flex-col c-items-center c-p-3 c-rounded-lg",
                    "hover:c-bg-blue-50 c-cursor-pointer c-group c-transition-colors"
                  )}
                >
                  <div className={cx(
                    "c-w-12 c-h-12 c-rounded-lg c-bg-gray-100 c-flex c-items-center c-justify-center c-mb-2",
                    "group-hover:c-bg-blue-100 c-transition-colors",
                    css`
                      svg {
                        width: 24px;
                        height: 24px;
                        color: #6b7280;
                      }
                      .group:hover & svg {
                        color: #3b82f6;
                      }
                    `
                  )}
                    dangerouslySetInnerHTML={{
                      __html: link.icon || `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>`
                    }}
                  />
                  <span className="c-text-xs c-text-center c-text-gray-600 group-hover:c-text-blue-600 c-font-medium c-line-clamp-2">
                    {link.title}
                  </span>
                  <span className="c-text-xs c-text-gray-400">
                    {link.count} item
                  </span>
                </a>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
