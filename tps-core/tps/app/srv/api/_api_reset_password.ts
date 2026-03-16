/**
 * Reset Password API
 * Route: POST /backend/api/reset-password
 *
 * Validates token and sets new password
 */

import { g } from "utils/global";
import { getPasswordPolicy, validatePassword } from "../utils/password-policy";

const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

export const _ = {
  url: "/backend/api/reset-password",
  raw: true,
  async api(this: { req: Request; _url: URL }) {
    const req = this.req as Request;

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ status: "error", message: "Method not allowed" }), {
        status: 405, headers: { "Content-Type": "application/json" },
      });
    }

    try {
      let body: any;
      try {
        const text = await req.text();
        body = JSON.parse(text);
      } catch (parseErr) {
        console.error("[RESET-PW] Body parse error. Body available:", req.bodyUsed, "Method:", req.method);
        return new Response(JSON.stringify({ status: "error", message: "Invalid request body" }), {
          status: 400, headers: { "Content-Type": "application/json" },
        });
      }
      const { token, password } = body;

      if (!token || !password) {
        return new Response(JSON.stringify({ status: "error", message: "Token dan password harus diisi" }), {
          status: 400, headers: { "Content-Type": "application/json" },
        });
      }

      if (!g.db) {
        return new Response(JSON.stringify({ status: "error", message: "Database tidak tersedia" }), {
          status: 500, headers: { "Content-Type": "application/json" },
        });
      }

      const db = g.db as any;

      // Find valid reset token
      const reset = await db.password_reset.findFirst({
        where: { token, used: false },
        include: { user: true },
      });

      if (!reset) {
        return new Response(JSON.stringify({ status: "error", message: "Token tidak valid atau sudah digunakan" }), {
          status: 400, headers: { "Content-Type": "application/json" },
        });
      }

      if (new Date(reset.expires_at) < new Date()) {
        return new Response(JSON.stringify({ status: "error", message: "Token sudah kedaluwarsa" }), {
          status: 400, headers: { "Content-Type": "application/json" },
        });
      }

      // Validate password against policy
      const policy = await getPasswordPolicy();
      const validation = validatePassword(password, policy);
      if (!validation.valid) {
        return new Response(JSON.stringify({
          status: "error",
          message: "Password tidak valid: " + validation.errors.join(", "),
        }), {
          status: 400, headers: { "Content-Type": "application/json" },
        });
      }

      // Update password
      const hashedPassword = await hashPassword(password);
      await db.user.update({
        where: { id: reset.id_user },
        data: {
          password: hashedPassword,
          password_changed_at: new Date(),
        },
      });

      // Mark token as used
      await db.password_reset.update({
        where: { id: reset.id },
        data: { used: true },
      });

      console.log("[RESET-PW] Password reset for user:", reset.user.username);

      return new Response(JSON.stringify({ status: "ok", message: "Password berhasil direset" }), {
        status: 200, headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("[RESET-PW] Error:", error);
      return new Response(JSON.stringify({ status: "error", message: "Terjadi kesalahan server" }), {
        status: 500, headers: { "Content-Type": "application/json" },
      });
    }
  },
};
