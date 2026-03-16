/**
 * Export Users/Roles to CSV (Excel-compatible) or HTML table (printable as PDF)
 * Route: GET /backend/api/export?type=users|roles&format=csv|pdf
 */

import { g } from "utils/global";

const getSessionUser = async (sessionId: string) => {
  if (!sessionId || !g.db) return null;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(sessionId)) return null;
  try {
    const session = await g.db.user_session.findFirst({
      where: { id: sessionId },
      select: { user: { select: { id: true, role: { select: { name: true } } } } },
    });
    return session?.user || null;
  } catch (e) {
    return null;
  }
};

const escapeHtml = (str: string | null): string => {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
};

const formatDate = (date: Date | null): string => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
};

const escapeCsv = (val: string): string => {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return '"' + val.replace(/"/g, '""') + '"';
  }
  return val;
};

async function exportUsers(format: string) {
  const users = await g.db!.user.findMany({
    select: {
      id: true, username: true, name: true, active: true,
      last_login: true, created_at: true, deactivated_at: true,
      role: { select: { name: true } },
    },
    orderBy: { id: "asc" },
  });

  if (format === "csv") {
    const header = "ID,Username,Nama,Role,Status,Tgl Aktif,Tgl Nonaktif,Last Login";
    const rows = users.map((u: any) =>
      [
        u.id,
        escapeCsv(u.username),
        escapeCsv(u.name || ""),
        escapeCsv(u.role.name),
        u.active ? "Aktif" : "Nonaktif",
        escapeCsv(formatDate(u.created_at)),
        escapeCsv(formatDate(u.deactivated_at)),
        escapeCsv(formatDate(u.last_login)),
      ].join(",")
    );
    const bom = "\uFEFF"; // UTF-8 BOM for Excel
    return new Response(bom + header + "\n" + rows.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="users_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  // PDF = printable HTML
  return new Response(
    `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>Daftar User - TPS Admin</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
      h1 { font-size: 18px; margin-bottom: 5px; }
      .subtitle { color: #666; margin-bottom: 15px; font-size: 11px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
      th { background: #f0f0f0; font-weight: bold; }
      .status-aktif { color: green; }
      .status-nonaktif { color: red; }
      @media print { body { margin: 0; } }
    </style></head><body>
    <h1>Daftar User - TPS Admin</h1>
    <div class="subtitle">Dicetak: ${formatDate(new Date())} | Total: ${users.length} user</div>
    <table>
      <thead><tr>
        <th>ID</th><th>Username</th><th>Nama</th><th>Role</th>
        <th>Status</th><th>Tgl Aktif</th><th>Tgl Nonaktif</th><th>Last Login</th>
      </tr></thead>
      <tbody>
        ${users.map((u: any) => `<tr>
          <td>${u.id}</td>
          <td>${escapeHtml(u.username)}</td>
          <td>${escapeHtml(u.name) || "-"}</td>
          <td>${escapeHtml(u.role.name)}</td>
          <td class="${u.active ? "status-aktif" : "status-nonaktif"}">${u.active ? "Aktif" : "Nonaktif"}</td>
          <td>${formatDate(u.created_at)}</td>
          <td>${formatDate(u.deactivated_at)}</td>
          <td>${formatDate(u.last_login)}</td>
        </tr>`).join("")}
      </tbody>
    </table>
    <script>window.print();</script>
    </body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

async function exportRoles(format: string) {
  const roles = await g.db!.role.findMany({
    select: {
      id: true, name: true, can_publish: true,
      user: { select: { id: true } },
    },
    orderBy: { id: "asc" },
  });

  if (format === "csv") {
    const header = "ID,Nama Role,Can Publish,Jumlah User";
    const rows = roles.map((r: any) =>
      [r.id, escapeCsv(r.name), r.can_publish ? "Ya" : "Tidak", r.user.length].join(",")
    );
    const bom = "\uFEFF";
    return new Response(bom + header + "\n" + rows.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="roles_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return new Response(
    `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>Daftar Role - TPS Admin</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
      h1 { font-size: 18px; margin-bottom: 5px; }
      .subtitle { color: #666; margin-bottom: 15px; font-size: 11px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
      th { background: #f0f0f0; font-weight: bold; }
      @media print { body { margin: 0; } }
    </style></head><body>
    <h1>Daftar Role - TPS Admin</h1>
    <div class="subtitle">Dicetak: ${formatDate(new Date())} | Total: ${roles.length} role</div>
    <table>
      <thead><tr><th>ID</th><th>Nama Role</th><th>Can Publish</th><th>Jumlah User</th></tr></thead>
      <tbody>
        ${roles.map((r: any) => `<tr>
          <td>${r.id}</td><td>${escapeHtml(r.name)}</td>
          <td>${r.can_publish ? "Ya" : "Tidak"}</td><td>${r.user.length}</td>
        </tr>`).join("")}
      </tbody>
    </table>
    <script>window.print();</script>
    </body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export const _ = {
  url: "/backend/api/export",
  raw: true,
  async api(this: { req: Request; _url: URL }) {
    const req = this.req as Request;
    const url = this._url || new URL(req?.url || "http://localhost");

    const cookies = req?.headers?.get("cookie") || "";
    const sidMatch = cookies.match(/sid=([^;]+)/);
    const sessionId = sidMatch?.[1] || "";

    const user = await getSessionUser(sessionId);
    if (!user) {
      return new Response(JSON.stringify({ status: "error", message: "Unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json" },
      });
    }

    const type = url.searchParams.get("type") || "users";
    const format = url.searchParams.get("format") || "csv";

    if (type === "roles") return exportRoles(format);
    return exportUsers(format);
  },
};
