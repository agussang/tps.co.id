import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function checkUsers() {
  // Raw query untuk melihat semua kolom
  const users = await db.$queryRaw`SELECT * FROM "user" LIMIT 10`;

  console.log("\n=== DAFTAR USER ===\n");
  console.log(users);

  // Cek roles
  const roles = await db.role.findMany();
  console.log("\n=== DAFTAR ROLE ===\n");
  console.log(roles);
}

checkUsers()
  .then(() => db.$disconnect())
  .catch(console.error);
