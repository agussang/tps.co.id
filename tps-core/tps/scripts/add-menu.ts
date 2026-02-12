/**
 * Script untuk menambah menu baru
 *
 * Usage:
 *   bun run scripts/add-menu.ts
 *
 * Edit konfigurasi MENU_CONFIG di bawah sesuai kebutuhan
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// =====================================================
// KONFIGURASI MENU BARU - EDIT DI SINI
// =====================================================
const MENU_CONFIG = {
  // Menu Bahasa Indonesia
  id: {
    label: "Karir",
    url: "/karir",
    order: 9,  // Urutan posisi (setelah PPID yang order 8)
  },
  // Menu Bahasa Inggris (opsional, hapus jika tidak perlu)
  en: {
    label: "Career",
    url: "/career",
    order: 8,  // Di EN belum ada PPID, jadi order 8
  },
};
// =====================================================

interface MenuData {
  label: string;
  url: string;
  order: number;
}

async function addMenu(lang: "id" | "en", data: MenuData) {
  console.log(`\n📝 Menambah menu "${data.label}" (${lang.toUpperCase()})...`);

  // Get structure IDs
  const structures = await db.structure.findMany({
    where: {
      path: { in: ["menu", "menu.label", "menu.url", "menu.order"] },
    },
  });

  const structMap: Record<string, string> = {};
  for (const s of structures) {
    if (s.path) structMap[s.path] = s.id;
  }

  if (!structMap["menu"]) {
    throw new Error("Structure 'menu' tidak ditemukan!");
  }

  // Check if menu with same label already exists
  const existing = await db.content.findFirst({
    where: {
      id_structure: structMap["menu"],
      lang: lang,
      status: "published",
      other_content: {
        some: {
          id_structure: structMap["menu.label"],
          text: data.label,
        },
      },
    },
  });

  if (existing) {
    console.log(`⚠️  Menu "${data.label}" (${lang}) sudah ada, skip...`);
    return null;
  }

  // Create main menu entry
  const menuEntry = await db.content.create({
    data: {
      id_structure: structMap["menu"],
      lang: lang,
      status: "published",
    },
  });

  // Create child contents (label, url, order)
  await db.content.createMany({
    data: [
      {
        id_structure: structMap["menu.label"],
        id_parent: menuEntry.id,
        lang: "inherited",
        status: "inherited",
        text: data.label,
      },
      {
        id_structure: structMap["menu.url"],
        id_parent: menuEntry.id,
        lang: "inherited",
        status: "inherited",
        text: data.url,
      },
      {
        id_structure: structMap["menu.order"],
        id_parent: menuEntry.id,
        lang: "inherited",
        status: "inherited",
        text: data.order.toString(),
      },
    ],
  });

  console.log(`✅ Menu "${data.label}" berhasil ditambahkan!`);
  console.log(`   ID: ${menuEntry.id}`);
  console.log(`   URL: ${data.url}`);
  console.log(`   Order: ${data.order}`);

  return menuEntry;
}

async function main() {
  console.log("========================================");
  console.log("🚀 SCRIPT TAMBAH MENU BARU");
  console.log("========================================");

  try {
    // Tambah menu Bahasa Indonesia
    if (MENU_CONFIG.id) {
      await addMenu("id", MENU_CONFIG.id);
    }

    // Tambah menu Bahasa Inggris
    if (MENU_CONFIG.en) {
      await addMenu("en", MENU_CONFIG.en);
    }

    console.log("\n========================================");
    console.log("🎉 SELESAI!");
    console.log("========================================");
    console.log("\nRefresh halaman /new untuk melihat menu baru.\n");
  } catch (error) {
    console.error("\n❌ Error:", error);
  }
}

main()
  .then(() => db.$disconnect())
  .catch((e) => {
    console.error(e);
    db.$disconnect();
    process.exit(1);
  });
