/**
 * Forgot Password API
 * Route: POST /backend/api/forgot-password
 *
 * Generates a reset token and sends email with reset link
 */

import { g } from "utils/global";

export const _ = {
  url: "/backend/api/forgot-password",
  raw: true,
  async api(this: { req: Request; _url: URL }) {
    const req = this.req as Request;

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ status: "error", message: "Method not allowed" }), {
        status: 405, headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const body = await req.json();
      const { username, email } = body;

      if (!username || !email) {
        return new Response(JSON.stringify({ status: "error", message: "Username dan email harus diisi" }), {
          status: 400, headers: { "Content-Type": "application/json" },
        });
      }

      if (!g.db) {
        return new Response(JSON.stringify({ status: "error", message: "Database tidak tersedia" }), {
          status: 500, headers: { "Content-Type": "application/json" },
        });
      }

      // Find user with matching username AND email
      const user = await g.db.user.findFirst({
        where: { username, email },
      });

      if (!user || !user.active) {
        // Don't reveal whether user exists or is inactive - always show success
        return new Response(JSON.stringify({ status: "ok", message: "Jika data cocok, link reset akan dikirim ke email" }), {
          status: 200, headers: { "Content-Type": "application/json" },
        });
      }

      // Generate reset token
      const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").substring(0, 8);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Invalidate existing unused tokens
      await (g.db as any).password_reset.updateMany({
        where: { id_user: user.id, used: false },
        data: { used: true },
      });

      // Create new reset token
      await (g.db as any).password_reset.create({
        data: {
          id_user: user.id,
          token,
          expires_at: expiresAt,
        },
      });

      // Build reset URL
      const host = req.headers.get("host") || "localhost:3300";
      const protocol = req.headers.get("x-forwarded-proto") || "http";
      const resetUrl = `${protocol}://${host}/backend/tpsadmin/reset-password?token=${token}`;

      // Send email via SMTP
      let emailSent = false;
      try {
        // Load SMTP settings
        const settings = await (g.db as any).site_settings.findMany({
          where: { key: { startsWith: "smtp_" } },
        });
        const smtp: Record<string, string> = {};
        for (const s of settings) {
          smtp[s.key] = s.value;
        }

        if (smtp.smtp_host && smtp.smtp_from) {
          const smtpHost = smtp.smtp_host;
          const smtpPort = parseInt(smtp.smtp_port || "587");
          const smtpUser = smtp.smtp_user || "";
          const smtpPass = smtp.smtp_pass || "";
          const smtpFrom = smtp.smtp_from;

          // Simple SMTP send using Bun's built-in fetch to a mail relay
          // For production, use nodemailer or similar
          // Here we use a basic SMTP socket connection
          const emailBody = [
            `From: TPS Admin <${smtpFrom}>`,
            `To: ${email}`,
            `Subject: Reset Password - TPS Admin`,
            `Content-Type: text/html; charset=utf-8`,
            ``,
            `<html><body style="font-family: Arial, sans-serif;">`,
            `<div style="max-width: 500px; margin: 0 auto; padding: 20px;">`,
            `<h2 style="color: #0475BC;">Reset Password</h2>`,
            `<p>Halo <strong>${user.name || user.username}</strong>,</p>`,
            `<p>Anda menerima email ini karena ada permintaan reset password untuk akun TPS Admin Anda.</p>`,
            `<p><a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #0475BC; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a></p>`,
            `<p style="color: #666; font-size: 14px;">Link ini berlaku selama 1 jam. Jika Anda tidak merasa melakukan permintaan ini, abaikan email ini.</p>`,
            `<hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">`,
            `<p style="color: #999; font-size: 12px;">TPS Admin System</p>`,
            `</div></body></html>`,
          ].join("\r\n");

          // Use nodemailer-like approach with TCP socket
          const net = require("net");
          const tls = require("tls");

          emailSent = await new Promise<boolean>((resolve) => {
            try {
              const socket = smtpPort === 465
                ? tls.connect(smtpPort, smtpHost, { rejectUnauthorized: false })
                : net.createConnection(smtpPort, smtpHost);

              let step = 0;
              let buffer = "";
              let activeSocket = socket;
              const timeout = setTimeout(() => { socket.destroy(); resolve(false); }, 15000);

              const send = (cmd: string) => activeSocket.write(cmd + "\r\n");

              const handleData = (data: Buffer) => {
                buffer += data.toString();
                const lines = buffer.split("\r\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                  const code = parseInt(line.substring(0, 3));
                  if (line[3] === "-") continue; // multiline response

                  if (step === 0 && code === 220) {
                    send(`EHLO localhost`);
                    step = 1;
                  } else if (step === 1 && code === 250) {
                    if (smtpPort !== 465 && smtpPort !== 25) {
                      send(`STARTTLS`);
                      step = 10;
                    } else if (smtpUser) {
                      send(`AUTH LOGIN`);
                      step = 2;
                    } else {
                      send(`MAIL FROM:<${smtpFrom}>`);
                      step = 4;
                    }
                  } else if (step === 10 && code === 220) {
                    // Upgrade to TLS - switch activeSocket to TLS
                    const tlsSocket = tls.connect({ socket, rejectUnauthorized: false }, () => {
                      activeSocket = tlsSocket;
                      send(`EHLO localhost`);
                      step = 11;
                    });
                    tlsSocket.on("data", handleData);
                    tlsSocket.on("error", () => { clearTimeout(timeout); resolve(false); });
                    return; // Switch to TLS socket
                  } else if (step === 11 && code === 250) {
                    if (smtpUser) {
                      send(`AUTH LOGIN`);
                      step = 2;
                    } else {
                      send(`MAIL FROM:<${smtpFrom}>`);
                      step = 4;
                    }
                  } else if (step === 2 && code === 334) {
                    send(Buffer.from(smtpUser).toString("base64"));
                    step = 3;
                  } else if (step === 3 && code === 334) {
                    send(Buffer.from(smtpPass).toString("base64"));
                    step = 31;
                  } else if (step === 31 && code === 235) {
                    send(`MAIL FROM:<${smtpFrom}>`);
                    step = 4;
                  } else if (step === 4 && code === 250) {
                    send(`RCPT TO:<${email}>`);
                    step = 5;
                  } else if (step === 5 && code === 250) {
                    send(`DATA`);
                    step = 6;
                  } else if (step === 6 && code === 354) {
                    send(emailBody + "\r\n.");
                    step = 7;
                  } else if (step === 7 && code === 250) {
                    send(`QUIT`);
                    clearTimeout(timeout);
                    socket.destroy();
                    resolve(true);
                  } else if (code >= 400) {
                    console.error("[FORGOT-PW] SMTP error:", line);
                    clearTimeout(timeout);
                    socket.destroy();
                    resolve(false);
                  }
                }
              };

              socket.on("data", handleData);
              socket.on("error", (err: any) => {
                console.error("[FORGOT-PW] SMTP socket error:", err.message);
                clearTimeout(timeout);
                resolve(false);
              });
            } catch (e) {
              console.error("[FORGOT-PW] SMTP connect error:", e);
              resolve(false);
            }
          });

          if (emailSent) {
            console.log("[FORGOT-PW] Email sent to:", email);
          }
        }
      } catch (emailError) {
        console.error("[FORGOT-PW] Email error:", emailError);
      }

      if (!emailSent) {
        // If email fails, log the reset URL for admin to share manually
        console.log("[FORGOT-PW] Email not sent. Reset URL:", resetUrl);
        console.log("[FORGOT-PW] Token:", token, "User:", username);
      }

      // Always return success (don't reveal if email was sent or not for security)
      return new Response(JSON.stringify({
        status: "ok",
        message: "Jika data cocok, link reset akan dikirim ke email",
      }), {
        status: 200, headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("[FORGOT-PW] Error:", error);
      return new Response(JSON.stringify({ status: "error", message: "Terjadi kesalahan server" }), {
        status: 500, headers: { "Content-Type": "application/json" },
      });
    }
  },
};
