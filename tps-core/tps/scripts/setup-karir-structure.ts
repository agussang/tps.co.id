/**
 * Script untuk membuat struktur database halaman Karir
 *
 * Usage:
 *   bun run scripts/setup-karir-structure.ts
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function setupKarirStructure() {
  console.log("========================================");
  console.log("🚀 SETUP STRUKTUR HALAMAN KARIR");
  console.log("========================================\n");

  // =====================================================
  // 1. STRUKTUR "karir" - Informasi umum halaman karir
  // =====================================================
  console.log("📂 Membuat struktur 'karir'...");

  const karirStructures = [
    { path: "karir", type: "text", title: "Karir" },
    { path: "karir.title", type: "text", title: "Judul" },
    { path: "karir.subtitle", type: "text", title: "Sub Judul" },
    { path: "karir.description", type: "richtext", title: "Deskripsi" },
    { path: "karir.image", type: "file", title: "Gambar Banner" },
  ];

  for (const struct of karirStructures) {
    const existing = await db.structure.findFirst({
      where: { path: struct.path },
    });

    if (existing) {
      console.log(`  ⏭️  ${struct.path} sudah ada, skip...`);
      continue;
    }

    // Find parent if not root
    let parentId = null;
    if (struct.path.includes(".")) {
      const parentPath = struct.path.split(".").slice(0, -1).join(".");
      const parent = await db.structure.findFirst({
        where: { path: parentPath },
      });
      if (parent) parentId = parent.id;
    }

    await db.structure.create({
      data: {
        path: struct.path,
        type: struct.type,
        title: struct.title,
        parent: parentId,
        status: "published",
        visible: true,
        translate: true,
      },
    });
    console.log(`  ✅ ${struct.path} berhasil dibuat`);
  }

  // =====================================================
  // 2. STRUKTUR "lowongan" - Daftar lowongan kerja
  // =====================================================
  console.log("\n📂 Membuat struktur 'lowongan'...");

  const lowonganStructures = [
    { path: "lowongan", type: "text", title: "Lowongan Kerja", multiple: true },
    { path: "lowongan.title", type: "text", title: "Posisi" },
    { path: "lowongan.department", type: "text", title: "Departemen" },
    { path: "lowongan.location", type: "text", title: "Lokasi" },
    { path: "lowongan.type", type: "text", title: "Tipe (Full-time/Part-time)" },
    { path: "lowongan.description", type: "richtext", title: "Deskripsi Pekerjaan" },
    { path: "lowongan.requirements", type: "richtext", title: "Persyaratan" },
    { path: "lowongan.deadline", type: "text", title: "Batas Waktu" },
    { path: "lowongan.apply_url", type: "text", title: "URL Lamaran" },
    { path: "lowongan.order", type: "number", title: "Urutan" },
  ];

  for (const struct of lowonganStructures) {
    const existing = await db.structure.findFirst({
      where: { path: struct.path },
    });

    if (existing) {
      console.log(`  ⏭️  ${struct.path} sudah ada, skip...`);
      continue;
    }

    let parentId = null;
    if (struct.path.includes(".")) {
      const parentPath = struct.path.split(".").slice(0, -1).join(".");
      const parent = await db.structure.findFirst({
        where: { path: parentPath },
      });
      if (parent) parentId = parent.id;
    }

    await db.structure.create({
      data: {
        path: struct.path,
        type: struct.type,
        title: struct.title,
        parent: parentId,
        status: "published",
        visible: true,
        translate: true,
        multiple: struct.multiple || false,
      },
    });
    console.log(`  ✅ ${struct.path} berhasil dibuat`);
  }

  // =====================================================
  // 3. CONTENT SAMPLE - Data contoh
  // =====================================================
  console.log("\n📝 Membuat content sample...");

  // Get structure IDs
  const structures = await db.structure.findMany({
    where: {
      OR: [
        { path: { startsWith: "karir" } },
        { path: { startsWith: "lowongan" } },
      ],
    },
  });

  const structMap: Record<string, string> = {};
  for (const s of structures) {
    if (s.path) structMap[s.path] = s.id;
  }

  // Check if karir content already exists
  const existingKarir = await db.content.findFirst({
    where: {
      id_structure: structMap["karir"],
      status: "published",
    },
  });

  if (!existingKarir) {
    // Create karir content (ID)
    const karirEntry = await db.content.create({
      data: {
        id_structure: structMap["karir"],
        lang: "id",
        status: "published",
      },
    });

    await db.content.createMany({
      data: [
        {
          id_structure: structMap["karir.title"],
          id_parent: karirEntry.id,
          lang: "inherited",
          status: "inherited",
          text: "Bergabunglah Bersama Kami",
        },
        {
          id_structure: structMap["karir.subtitle"],
          id_parent: karirEntry.id,
          lang: "inherited",
          status: "inherited",
          text: "Jadilah bagian dari tim Terminal Petikemas Surabaya",
        },
        {
          id_structure: structMap["karir.description"],
          id_parent: karirEntry.id,
          lang: "inherited",
          status: "inherited",
          text: "<p>PT Terminal Petikemas Surabaya membuka kesempatan bagi profesional yang berdedikasi untuk bergabung dengan tim kami. Kami mencari individu yang bersemangat, inovatif, dan berkomitmen untuk memberikan layanan terbaik.</p>",
        },
      ],
    });

    console.log("  ✅ Content karir (ID) berhasil dibuat");

    // Create karir content (EN)
    const karirEntryEN = await db.content.create({
      data: {
        id_structure: structMap["karir"],
        lang: "en",
        status: "published",
      },
    });

    await db.content.createMany({
      data: [
        {
          id_structure: structMap["karir.title"],
          id_parent: karirEntryEN.id,
          lang: "inherited",
          status: "inherited",
          text: "Join Our Team",
        },
        {
          id_structure: structMap["karir.subtitle"],
          id_parent: karirEntryEN.id,
          lang: "inherited",
          status: "inherited",
          text: "Be part of Terminal Petikemas Surabaya team",
        },
        {
          id_structure: structMap["karir.description"],
          id_parent: karirEntryEN.id,
          lang: "inherited",
          status: "inherited",
          text: "<p>PT Terminal Petikemas Surabaya opens opportunities for dedicated professionals to join our team. We are looking for passionate, innovative, and committed individuals to deliver the best service.</p>",
        },
      ],
    });

    console.log("  ✅ Content karir (EN) berhasil dibuat");
  } else {
    console.log("  ⏭️  Content karir sudah ada, skip...");
  }

  // Create sample lowongan
  const existingLowongan = await db.content.findFirst({
    where: {
      id_structure: structMap["lowongan"],
      status: "published",
    },
  });

  if (!existingLowongan) {
    // Sample lowongan 1
    const lowongan1 = await db.content.create({
      data: {
        id_structure: structMap["lowongan"],
        lang: "id",
        status: "published",
      },
    });

    await db.content.createMany({
      data: [
        {
          id_structure: structMap["lowongan.title"],
          id_parent: lowongan1.id,
          lang: "inherited",
          status: "inherited",
          text: "Staff IT - Network Engineer",
        },
        {
          id_structure: structMap["lowongan.department"],
          id_parent: lowongan1.id,
          lang: "inherited",
          status: "inherited",
          text: "Information Technology",
        },
        {
          id_structure: structMap["lowongan.location"],
          id_parent: lowongan1.id,
          lang: "inherited",
          status: "inherited",
          text: "Surabaya",
        },
        {
          id_structure: structMap["lowongan.type"],
          id_parent: lowongan1.id,
          lang: "inherited",
          status: "inherited",
          text: "Full-time",
        },
        {
          id_structure: structMap["lowongan.description"],
          id_parent: lowongan1.id,
          lang: "inherited",
          status: "inherited",
          text: "<p>Bertanggung jawab untuk mengelola dan memelihara infrastruktur jaringan perusahaan.</p>",
        },
        {
          id_structure: structMap["lowongan.requirements"],
          id_parent: lowongan1.id,
          lang: "inherited",
          status: "inherited",
          text: "<ul><li>S1 Teknik Informatika/Sistem Informasi</li><li>Pengalaman min. 2 tahun</li><li>Sertifikasi CCNA/CCNP lebih diutamakan</li></ul>",
        },
        {
          id_structure: structMap["lowongan.deadline"],
          id_parent: lowongan1.id,
          lang: "inherited",
          status: "inherited",
          text: "31 Januari 2025",
        },
        {
          id_structure: structMap["lowongan.order"],
          id_parent: lowongan1.id,
          lang: "inherited",
          status: "inherited",
          text: "1",
        },
      ],
    });

    console.log("  ✅ Sample lowongan berhasil dibuat");
  } else {
    console.log("  ⏭️  Content lowongan sudah ada, skip...");
  }

  // Print structure IDs for router.ts
  console.log("\n========================================");
  console.log("📋 ID STRUKTUR UNTUK router.ts");
  console.log("========================================");
  console.log(`karir:    ${structMap["karir"]}`);
  console.log(`lowongan: ${structMap["lowongan"]}`);
  console.log("\nUpdate id_struct di router.ts dengan ID di atas.\n");

  console.log("========================================");
  console.log("🎉 SELESAI!");
  console.log("========================================\n");
}

setupKarirStructure()
  .then(() => db.$disconnect())
  .catch((e) => {
    console.error("Error:", e);
    db.$disconnect();
    process.exit(1);
  });
