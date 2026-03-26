import { file } from "bun";
import { existsAsync, inspectAsync, listAsync } from "fs-jetpack";
import { join } from "path";
import { createRouter } from "radix3";
import { dir } from "../utils/dir";
import { g } from "../utils/global";
import { parseArgs } from "./parse-args";
import { serveAPI } from "./serve-api";
import { serveWeb } from "./serve-web";
import { prodIndex } from "utils/prod-index";
import { serveDynamicPage } from "../../app/srv/api/_dynamic_page";

// Standalone login handler with SSO support
import {
  getPasswordPolicy,
  isPasswordExpired,
  shouldAutoDeactivate,
} from "../../app/srv/utils/password-policy";

const TPS_ESS_API = "https://api.tps.co.id/api/ess/signin";

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function callTpsEssApi(username: string, password: string): Promise<any> {
  try {
    console.log("[LOGIN] Calling TPS ESS API for:", username);
    const res = await fetch(TPS_ESS_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        EmployeeID: username,
        Password: password,
        mac_address: "-",
      }),
    });
    const data = await res.json();
    console.log("[LOGIN] TPS ESS API response:", { successCode: data.successCode, hasResult: !!data.result });
    return data;
  } catch (error) {
    console.error("[LOGIN] TPS ESS API error:", error);
    return null;
  }
}

async function handleStandaloneLogin(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const username = body.EmployeeID || body.username;
    const password = body.Password || body.password;

    console.log("[LOGIN] Attempt:", { username });

    if (!username || !password) {
      return new Response(
        JSON.stringify({
          StatusCode: "402",
          successCode: 402,
          message: "Username dan password harus diisi",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!g.db) {
      return new Response(
        JSON.stringify({
          StatusCode: "500",
          successCode: 500,
          message: "Database tidak tersedia",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Cek user di database
    let user = await g.db.user.findFirst({
      where: { username },
      include: { role: true },
    });

    console.log("[LOGIN] User found:", user ? { id: user.id, hasPassword: !!user.password, active: user.active } : null);

    // Load password policy
    const policy = await getPasswordPolicy();

    // ===== AUTO-DEACTIVATION CHECK =====
    if (user && user.active && shouldAutoDeactivate(user.last_login, policy.auto_deactivate_days)) {
      await g.db.user.update({
        where: { id: user.id },
        data: { active: false, deactivated_at: new Date() },
      });
      user.active = false;
      console.log("[LOGIN] User auto-deactivated due to inactivity:", username);
    }

    // ===== AUTH LOKAL (jika user punya password lokal) =====
    if (user && user.password) {
      const hashedInput = await hashPassword(password);

      if (user.password !== hashedInput) {
        return new Response(
          JSON.stringify({
            StatusCode: "402",
            successCode: 402,
            message: "Password salah!",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      if (!user.active) {
        return new Response(
          JSON.stringify({
            StatusCode: "402",
            successCode: 402,
            message: "Akun nonaktif. Hubungi admin untuk aktivasi.",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      // ===== PASSWORD EXPIRY CHECK =====
      if (isPasswordExpired(user.password_changed_at, policy.expiry_days)) {
        return new Response(
          JSON.stringify({
            StatusCode: "403",
            successCode: 403,
            message: "Password sudah kedaluwarsa. Hubungi admin untuk reset password.",
            password_expired: true,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      // Update last login
      await g.db.user.update({
        where: { id: user.id },
        data: { last_login: new Date() },
      });

      // Create session
      const session = await g.db.user_session.create({
        data: { id_user: user.id },
      });

      console.log("[LOGIN] Success (local auth):", { username, sessionId: session.id });

      return new Response(
        JSON.stringify({
          StatusCode: "200",
          successCode: 200,
          message: "Login successful",
          valid_mac: "1",
          session_id: session.id,
          result: {
            StatusCode: 200,
            successCode: 200,
            Data: {
              User: {
                Id: user.id.toString(),
                FullName: user.name || username,
                Username: username,
                EmployeeID: username,
                Role: user.role.name,
                Email: null,
              },
            },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // ===== SSO via TPS ESS API (jika tidak ada password lokal) =====
    console.log("[LOGIN] No local password, trying TPS ESS API...");

    const essResponse = await callTpsEssApi(username, password);

    if (!essResponse) {
      return new Response(
        JSON.stringify({
          StatusCode: "500",
          successCode: 500,
          message: "Gagal terhubung ke server TPS ESS",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Cek response dari TPS ESS API
    if (essResponse.StatusCode && parseInt(essResponse.StatusCode) === 402) {
      return new Response(JSON.stringify(essResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (essResponse.successCode && essResponse.successCode === 402) {
      return new Response(JSON.stringify(essResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (essResponse.successCode !== 200) {
      return new Response(
        JSON.stringify({
          StatusCode: "402",
          successCode: 402,
          message: essResponse.message || "Login gagal - TPS ESS API error",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // ESS login berhasil - buat/update user di database lokal
    const fullName = essResponse.result?.Data?.User?.FullName || username;

    if (!user) {
      // User belum ada di database lokal, buat baru
      const staffRole = await g.db.role.findFirst({
        where: { name: "staff" },
      });

      if (!staffRole) {
        return new Response(
          JSON.stringify({
            StatusCode: "500",
            successCode: 500,
            message: "Role 'staff' tidak ditemukan di database",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      user = await g.db.user.create({
        data: {
          username,
          id_role: staffRole.id,
          name: fullName,
          active: false, // Perlu aktivasi admin
          last_login: new Date(),
          created_at: new Date(),
        },
        include: { role: true },
      });

      console.log("[LOGIN] New user created from ESS:", { id: user.id, username });

      return new Response(
        JSON.stringify({
          StatusCode: "402",
          successCode: 402,
          message: "Akun berhasil dibuat. Silahkan hubungi admin untuk aktivasi.",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // User sudah ada, cek status aktif
    if (!user.active) {
      return new Response(
        JSON.stringify({
          StatusCode: "402",
          successCode: 402,
          message: "Akun belum aktif. Hubungi admin untuk aktivasi.",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Update user info dan last login
    await g.db.user.update({
      where: { id: user.id },
      data: {
        name: fullName,
        last_login: new Date(),
      },
    });

    // Create session
    const session = await g.db.user_session.create({
      data: { id_user: user.id },
    });

    console.log("[LOGIN] Success (SSO):", { username, sessionId: session.id });

    return new Response(
      JSON.stringify({
        StatusCode: "200",
        successCode: 200,
        message: "Login successful",
        valid_mac: "1",
        session_id: session.id,
        result: {
          StatusCode: 200,
          successCode: 200,
          Data: {
            User: {
              Id: user.id.toString(),
              FullName: user.name || username,
              Username: username,
              EmployeeID: username,
              Role: user.role.name,
              Email: null,
            },
          },
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[LOGIN] Error:", error);
    return new Response(
      JSON.stringify({
        StatusCode: "500",
        successCode: 500,
        message: "Terjadi kesalahan server",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
}

export const createServer = async () => {
  g.router = createRouter({ strictTrailingSlash: true });
  g.api = {};
  const scan = async (path: string, root?: string) => {
    const apis = await listAsync(path);
    if (apis) {
      for (const filename of apis) {
        const importPath = join(path, filename);
        if (filename.endsWith(".ts")) {
          try {
            const api = await import(importPath);
            let args: string[] = await parseArgs(importPath);
            const route = {
              url: api._.url,
              args,
              raw: !!api._.raw,
              fn: api._.api,
              path: importPath.substring((root || path).length + 1),
            };
            g.api[filename] = route;
            g.router.insert(route.url, g.api[filename]);
          } catch (e) {
            g.log.warn(
              `Failed to import app/srv/api${importPath.substring(
                (root || path).length
              )}`
            );

            const f = file(importPath);
            if (f.size > 0) {
              console.error(e);
            } else {
              g.log.warn(` ➨ file is empty`);
            }
          }
        } else {
          const dir = await inspectAsync(importPath);
          if (dir?.type === "dir") {
            await scan(importPath, path);
          }
        }
      }
    }
  };
  await scan(dir(`app/srv/api`));
  await scan(dir(`pkgs/api`));

  g.createServer = (arg) => {
    return async (site_id: string) => {
      return arg;
    };
  };

  g.server = Bun.serve({
    port: g.port,
    maxRequestBodySize: 1024 * 1024 * 128,
    async fetch(req) {
      const url = new URL(req.url) as URL;
      url.pathname = url.pathname.replace(/\/+/g, "/");

      // Visitor logging - only log page visits (not static assets/API)
      if (g.db && !url.pathname.startsWith("/_") && !url.pathname.startsWith("/backend/api/") &&
          !url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|map)$/i)) {
        const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
        try {
          (g.db as any).$executeRawUnsafe(
            "INSERT INTO visitor_log (path, ip, user_agent, referer) VALUES ($1, $2, $3, $4)",
            url.pathname.substring(0, 500),
            ip.substring(0, 100),
            (req.headers.get("user-agent") || "").substring(0, 500),
            (req.headers.get("referer") || "").substring(0, 500)
          ).catch(() => {});
        } catch (e) {}
      }

      const prasi = {};
      const index = prodIndex(g.deploy.config.site_id, prasi);

      const handle = async (req: Request) => {
        const api = await serveAPI(url, req);

        if (api) {
          return api;
        }

        if (g.deploy.router) {
          const found = g.deploy.router.lookup(url.pathname);
          if (found) {
            return await serveWeb({
              content: index.render(),
              pathname: "index.html",
              cache_accept: req.headers.get("accept-encoding") || "",
            });
          }

          if (g.deploy.content) {
            const core = g.deploy.content.code.core;
            const site = g.deploy.content.code.site;

            let pathname = url.pathname;
            if (url.pathname[0] === "/") pathname = pathname.substring(1);

            if (
              !pathname ||
              pathname === "index.html" ||
              pathname === "index.htm"
            ) {
              return await serveWeb({
                content: index.render(),
                pathname: "index.html",
                cache_accept: req.headers.get("accept-encoding") || "",
              });
            }

            let content = "";

            if (core[pathname]) content = core[pathname];
            else if (site[pathname]) content = site[pathname];

            if (content) {
              return await serveWeb({
                content,
                pathname,
                cache_accept: req.headers.get("accept-encoding") || "",
              });
            }
          }
        }

        return new Response(`404 Not Found`, {
          status: 404,
          statusText: "Not Found",
        });
      };

      // Intercept /backend/api/login untuk standalone auth
      if (url.pathname === "/backend/api/login") {
        return await handleStandaloneLogin(req);
      }

      // /backend/tpsadmin is now handled by SSR login page (_tpsadmin_login.ts)
      // No redirect needed - the login page checks session and redirects to dashboard if logged in

      // Handle /karir via API first (bypass tps-fw)
      // Support bilingual URLs: /karir, /career, /id-id/karir, /en/career, etc.
      const isKarirRoute = url.pathname === "/karir" || url.pathname === "/career" ||
                           url.pathname.endsWith("/karir") || url.pathname.endsWith("/career");
      if (isKarirRoute) {
        // Extract language from path prefix (e.g., /id-id/karir -> id, /en/career -> en)
        let lang = "id";
        if (url.pathname.startsWith("/en/") || url.pathname.startsWith("/en-")) {
          lang = "en";
        }
        // Normalize URL to /karir for router lookup
        const normalizedUrl = new URL(url.toString());
        normalizedUrl.pathname = "/karir";
        normalizedUrl.searchParams.set("_lang", lang);
        const api = await serveAPI(normalizedUrl, req);
        if (api) return api;
      }

      // Redirect /file/* to /_file/* (Prasi legacy pages use /file/ URL pattern)
      // Prasi encodes spaces as ~ in file URLs, convert back to %20
      if (url.pathname.startsWith("/file/")) {
        const filePath = url.pathname.substring(6).replace(/~/g, "%20");
        const newPath = "/_file/" + filePath;
        return Response.redirect(new URL(newPath + url.search, url.origin).toString(), 301);
      }

      // Language-aware redirect for Prasi legacy pages
      // When user navigates from an English page (referer contains /en/) to a non-prefixed URL,
      // redirect to the English version so language is preserved across navigation
      if (!url.pathname.startsWith("/en/") && !url.pathname.startsWith("/id-id/") &&
          !url.pathname.startsWith("/backend/") && !url.pathname.startsWith("/_") &&
          !url.pathname.startsWith("/file/") && url.pathname !== "/") {
        const referer = req.headers.get("referer") || "";
        try {
          const refUrl = referer ? new URL(referer) : null;
          if (refUrl && (refUrl.pathname.startsWith("/en/") || refUrl.pathname.startsWith("/en-"))) {
            return Response.redirect(new URL("/en" + url.pathname + url.search, url.origin).toString(), 302);
          }
        } catch (_) {}
      }

      // Handle dynamic pages from database (based on structure.url_pattern)
      const dynamicPage = await serveDynamicPage(url, req);
      if (dynamicPage) return dynamicPage;

      if (
        !url.pathname.startsWith("/_deploy") &&
        !url.pathname.startsWith("/_prasi")
      ) {
        if (g.deploy.server && index) {
          try {
            return await g.deploy.server.http({
              handle,
              mode: "prod",
              req,
              server: g.server,
              url: { pathname: url.pathname, raw: url },
              index: index,
              prasi,
            });
          } catch (e) {
            console.error(e);
          }
        }
      }

      return handle(req);
    },
  });

  if (process.env.PRASI_MODE === "dev") {
    g.log.info(`http://localhost:${g.server.port}`);
  } else {
    g.log.info(`Started at port: ${g.server.port}`);
  }
};
