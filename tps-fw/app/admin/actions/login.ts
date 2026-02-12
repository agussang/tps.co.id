import { audit } from "./audit";

// Hash password menggunakan SHA-256
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

export const login = async (username: string, password: string) => {
  if (!username) {
    alert("Please enter username!");
    return;
  }

  if (!password) {
    alert("Please enter password!");
    return;
  }

  // Cek user di database lokal dulu
  const user = await db.user.findFirst({
    where: { username },
  });

  // Jika user punya password lokal, gunakan auth lokal
  if (user && user.password) {
    const hashedInput = await hashPassword(password);

    if (user.password === hashedInput) {
      if (!user.active) {
        alert("Akun belum aktif. Hubungi admin untuk aktivasi.");
        return;
      }

      // Update last login
      await db.user.update({
        data: { last_login: new Date() },
        where: { id: user.id },
      });

      // Buat session
      const session = await db.user_session.create({
        data: { id_user: user.id },
      });
      if (session) {
        localStorage.setItem("sid", session.id);
      }

      await audit.init();
      audit.log({ action: "login", url: "" });
      navigate(
        `/backend/tpsadmin/content/list/1eeacdaf-45b9-45c3-8c1e-18a58bc28b61`
      );
      return;
    } else {
      alert("Password salah!");
      return;
    }
  }

  // Fallback ke TPS ESS API jika tidak ada password lokal
  let loginURl = `/backend/api/login`;

  // Standalone mode: Use local backend for localhost
  if (window.location.hostname.startsWith("localhost")) {
    loginURl = `http://localhost:3300/backend/api/login`;
  }

  try {
    const tpsLogin = await fetch(loginURl, {
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

    const userTps = await tpsLogin.json();

    if (userTps.StatusCode && parseInt(userTps.StatusCode) === 402) {
      alert(userTps.message);
      return;
    }

    if (userTps.successCode && userTps.successCode === 402) {
      alert(userTps.message);
      return;
    }

    if (userTps.successCode !== 200) {
      alert("Login Failed - TPS ESS API error");
      return;
    }

    const fullName = userTps.result?.Data?.User?.FullName || username;
    let existingUser = await db.user.findFirst({
      where: { username },
    });

    const findRole = await db.role.findFirst({
      where: { name: "staff" },
    });

    if (findRole && !existingUser) {
      existingUser = await db.user.create({
        data: {
          username,
          id_role: findRole.id,
          name: fullName,
          last_login: new Date(),
          created_at: new Date(),
        },
      });

      alert("Silahkan hubungi admin untuk aktivasi akun Anda.");
      return;
    }

    if (existingUser) {
      if (!existingUser.active) {
        alert("Silahkan hubungi admin untuk aktivasi akun Anda.");
        return;
      }

      await db.user.update({
        data: {
          name: fullName,
          last_login: new Date(),
        },
        where: { id: existingUser.id },
      });

      const session = await db.user_session.create({
        data: { id_user: existingUser.id },
      });
      if (session) {
        localStorage.setItem("sid", session.id);
      }

      await audit.init();
      audit.log({ action: "login", url: "" });
      navigate(
        `/backend/tpsadmin/content/list/1eeacdaf-45b9-45c3-8c1e-18a58bc28b61`
      );
    }
  } catch (error) {
    // Jika user tidak punya password lokal dan TPS API gagal
    if (!user) {
      alert("User tidak ditemukan. Silahkan hubungi admin.");
    } else {
      alert("Gagal terhubung ke server. Silahkan set password lokal untuk user ini.");
    }
  }
};
