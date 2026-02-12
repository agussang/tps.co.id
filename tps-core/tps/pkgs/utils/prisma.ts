import { existsAsync } from "fs-jetpack";
import { dir } from "./dir";
import { $ } from "execa";
import { g } from "./global";

export const preparePrisma = async () => {
  if (process.env.DATABASE_URL && !g.db) {
    // Try prisma generate first, but don't fail if it errors
    if (g.mode !== "dev") {
      try {
        await $({ cwd: dir(`app/db`) })`bun prisma generate`;
      } catch (e) {
        console.log("Prisma generate failed (using existing client):", (e as Error).message || e);
      }
    }

    // Import and initialize PrismaClient (works if client was previously generated)
    try {
      const { PrismaClient } = await import("../../app/db/db");
      g.db = new PrismaClient();
    } catch (e) {
      console.log("Prisma not initialized:", e);
    }
  }

  g.dburl = process.env.DATABASE_URL || "";
};
