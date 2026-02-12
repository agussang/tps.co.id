import { PrismaClient } from "@prisma/client";
import { apiContext } from "service-srv";

const prisma = new PrismaClient();

// Hash password menggunakan SHA-256
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const localLogin = async (req: Request): Promise<Response | null> => {
  try {
    const body = await req.json();
    const username = body.EmployeeID || body.username;
    const password = body.Password || body.password;

    console.log("[AUTH] Login attempt:", { username, password: "***" });

    if (!username || !password) {
      console.log("[AUTH] Missing username or password");
      return null; // Let TPS ESS API handle it
    }

    // Cek user di database
    const user = await prisma.user.findFirst({
      where: { username },
      include: { role: true },
    });

    console.log("[AUTH] User found:", user ? { id: user.id, username: user.username, hasPassword: !!user.password, active: user.active } : null);

    // Jika user punya password lokal, gunakan auth lokal
    if (user && user.password) {
      const hashedInput = await hashPassword(password);

      if (user.password === hashedInput) {
        if (!user.active) {
          return new Response(
            JSON.stringify({
              successCode: 402,
              message: "Akun belum aktif. Hubungi admin untuk aktivasi.",
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { last_login: new Date() },
        });

        // Return success response (format sama dengan TPS ESS API)
        return new Response(
          JSON.stringify({
            successCode: 200,
            message: "Login successful",
            result: {
              Data: {
                User: {
                  FullName: user.name || username,
                  EmployeeID: username,
                  Role: user.role.name,
                },
              },
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      } else {
        return new Response(
          JSON.stringify({
            successCode: 402,
            message: "Password salah!",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Jika tidak ada password lokal, return null untuk fallback ke TPS ESS API
    return null;
  } catch (error) {
    console.error("Local login error:", error);
    return null; // Fallback ke TPS ESS API
  }
};

export const _ = {
  url: "/_auth/login",
  raw: true,
  async api() {
    const { req } = apiContext(this);
    const result = await localLogin(req);
    if (result) return result;

    return new Response(
      JSON.stringify({
        successCode: 402,
        message: "User tidak ditemukan atau tidak memiliki password lokal",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  },
};
