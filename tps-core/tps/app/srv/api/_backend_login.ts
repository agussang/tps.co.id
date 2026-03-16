/**
 * Endpoint login untuk admin panel (standalone + SSO)
 * Route: /backend/api/login
 *
 * Flow:
 * 1. Jika user punya password lokal → gunakan auth lokal
 * 2. Jika tidak ada password lokal → fallback ke TPS ESS API
 */

import { g } from "utils/global";
import {
  getPasswordPolicy,
  isPasswordExpired,
  shouldAutoDeactivate,
} from "../utils/password-policy";

// TPS ESS API endpoint
const TPS_ESS_API = "https://api.tps.co.id/api/ess/signin";

// Hash password menggunakan SHA-256
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Call TPS ESS API for SSO login
async function callTpsEssApi(username: string, password: string): Promise<any> {
  try {
    console.log("[LOGIN] Calling TPS ESS API for:", username);

    const res = await fetch(TPS_ESS_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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

export const _ = {
  url: "/backend/api/login",
  raw: true,
  async api() {
    // @ts-ignore
    const req = this.req as Request;

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
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (!g.db) {
        return new Response(
          JSON.stringify({
            StatusCode: "500",
            successCode: 500,
            message: "Database tidak tersedia",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Cek user di database
      let user = await g.db.user.findFirst({
        where: { username },
        include: { role: true },
      });

      console.log("[LOGIN] User found:", user ? { id: user.id, hasPassword: !!user.password, active: user.active } : null);

      // Load password policy for expiry & auto-deactivation checks
      const policy = await getPasswordPolicy();

      // ===== AUTO-DEACTIVATION CHECK (Item 12) =====
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
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        // Cek status aktif
        if (!user.active) {
          return new Response(
            JSON.stringify({
              StatusCode: "402",
              successCode: 402,
              message: "Akun nonaktif. Hubungi admin untuk aktivasi.",
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        // ===== PASSWORD EXPIRY CHECK (Item 11) =====
        if (isPasswordExpired(user.password_changed_at, policy.expiry_days)) {
          return new Response(
            JSON.stringify({
              StatusCode: "403",
              successCode: 403,
              message: "Password sudah kedaluwarsa. Hubungi admin untuk reset password.",
              password_expired: true,
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
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
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
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
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
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
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
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
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
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
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
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
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
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
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("[LOGIN] Error:", error);
      return new Response(
        JSON.stringify({
          StatusCode: "500",
          successCode: 500,
          message: "Terjadi kesalahan server",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },
};
