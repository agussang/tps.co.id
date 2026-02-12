import { g } from "../pkgs/utils/global";

async function main() {
  // Wait for DB
  await new Promise(r => setTimeout(r, 1000));
  
  if (!g.db) {
    // Initialize DB manually
    const { PrismaClient } = await import("../app/db/node_modules/.prisma/client");
    g.db = new PrismaClient();
  }

  // Get lowongan structure
  const structures = await g.db.structure.findMany({
    where: {
      OR: [
        { path: "lowongan" },
        { path: { startsWith: "lowongan." } }
      ]
    },
    orderBy: { path: "asc" }
  });

  console.log("=== LOWONGAN STRUCTURE ===");
  for (const s of structures) {
    console.log(`${s.path} (${s.type}) - ID: ${s.id}`);
  }

  // Get existing lowongan content
  const rootStructure = structures.find((s: any) => s.path === "lowongan");
  if (rootStructure) {
    const contents = await g.db.content.findMany({
      where: { id_structure: rootStructure.id },
      select: { id: true, lang: true, status: true, text: true }
    });
    console.log("\n=== EXISTING LOWONGAN ===");
    console.log(`Total: ${contents.length}`);
    for (const c of contents) {
      console.log(`- ID: ${c.id}, Lang: ${c.lang}, Status: ${c.status}`);
    }
  }

  await g.db.$disconnect();
}

main();
