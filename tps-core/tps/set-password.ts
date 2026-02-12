#!/usr/bin/env bun
/**
 * Script untuk set password user lokal
 *
 * Usage:
 *   bun run set-password.ts <username> <password>
 *   bun run set-password.ts --list              # List semua user
 *   bun run set-password.ts --create <username> <password> <role_id>  # Buat user baru
 *
 * Contoh:
 *   bun run set-password.ts tps-super-admin admin123
 *   bun run set-password.ts --list
 *   bun run set-password.ts --create admin admin123 1
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Hash password menggunakan SHA-256 (sama dengan di login.ts)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function listUsers() {
  const users = await prisma.user.findMany({
    include: { role: true },
    orderBy: { id: "asc" },
  });

  console.log("\n=== Daftar User ===\n");
  console.log("ID\tUsername\t\tActive\tRole\t\tHas Password");
  console.log("-".repeat(70));

  for (const user of users) {
    const hasPassword = user.password ? "✓" : "✗";
    console.log(
      `${user.id}\t${user.username.padEnd(20)}\t${user.active ? "✓" : "✗"}\t${user.role.name.padEnd(10)}\t${hasPassword}`
    );
  }
  console.log("");
}

async function setPassword(username: string, password: string) {
  const user = await prisma.user.findFirst({
    where: { username },
  });

  if (!user) {
    console.error(`\n❌ User "${username}" tidak ditemukan!\n`);
    console.log("Gunakan --list untuk melihat daftar user");
    console.log("Gunakan --create untuk membuat user baru\n");
    return;
  }

  const hashedPassword = await hashPassword(password);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  console.log(`\n✅ Password untuk user "${username}" berhasil di-set!\n`);
}

async function createUser(username: string, password: string, roleId: number) {
  // Cek apakah username sudah ada
  const existing = await prisma.user.findFirst({
    where: { username },
  });

  if (existing) {
    console.error(`\n❌ Username "${username}" sudah digunakan!\n`);
    return;
  }

  // Cek apakah role valid
  const role = await prisma.role.findUnique({
    where: { id: roleId },
  });

  if (!role) {
    console.error(`\n❌ Role ID ${roleId} tidak ditemukan!\n`);
    const roles = await prisma.role.findMany();
    console.log("Role yang tersedia:");
    for (const r of roles) {
      console.log(`  ${r.id}: ${r.name}`);
    }
    console.log("");
    return;
  }

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      id_role: roleId,
      active: true,
      created_at: new Date(),
    },
  });

  console.log(`\n✅ User "${username}" berhasil dibuat dengan role "${role.name}"!\n`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Usage:
  bun run set-password.ts <username> <password>        # Set password user
  bun run set-password.ts --list                       # List semua user
  bun run set-password.ts --create <username> <password> <role_id>

Contoh:
  bun run set-password.ts tps-super-admin admin123
  bun run set-password.ts --create newadmin pass123 1
`);
    return;
  }

  if (args[0] === "--list") {
    await listUsers();
    return;
  }

  if (args[0] === "--create") {
    if (args.length < 4) {
      console.error("\n❌ Usage: --create <username> <password> <role_id>\n");
      return;
    }
    await createUser(args[1], args[2], parseInt(args[3]));
    return;
  }

  // Default: set password
  if (args.length < 2) {
    console.error("\n❌ Usage: bun run set-password.ts <username> <password>\n");
    return;
  }

  await setPassword(args[0], args[1]);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
