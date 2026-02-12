/**
 * Script untuk menambah lowongan baru
 * Usage: bun run add-lowongan.ts
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

interface LowonganData {
  title: string;
  department: string;
  location: string;
  type: string; // Full-time, Part-time, Contract, Internship
  description: string;
  requirements: string;
  deadline: string;
  apply_url?: string;
  order?: number;
  lang?: string;
}

async function addLowongan(data: LowonganData) {
  const lang = data.lang || "id";

  // Get structure IDs
  const structures = await db.structure.findMany({
    where: {
      OR: [
        { path: "lowongan" },
        { path: { startsWith: "lowongan." } }
      ]
    }
  });

  const structureMap: Record<string, string> = {};
  for (const s of structures) {
    structureMap[s.path!] = s.id;
  }

  const rootId = structureMap["lowongan"];
  if (!rootId) {
    throw new Error("Structure 'lowongan' not found! Run setup-karir-structure.ts first.");
  }

  // Create root content (lowongan entry)
  const rootContent = await db.content.create({
    data: {
      id_structure: rootId,
      lang: lang,
      status: "published",
    }
  });

  console.log(`Created lowongan: ${rootContent.id}`);

  // Create child content for each field
  const fields = [
    { path: "lowongan.title", value: data.title },
    { path: "lowongan.department", value: data.department },
    { path: "lowongan.location", value: data.location },
    { path: "lowongan.type", value: data.type },
    { path: "lowongan.description", value: data.description },
    { path: "lowongan.requirements", value: data.requirements },
    { path: "lowongan.deadline", value: data.deadline },
    { path: "lowongan.apply_url", value: data.apply_url || "#" },
    { path: "lowongan.order", value: String(data.order || 99) },
  ];

  for (const field of fields) {
    const structureId = structureMap[field.path];
    if (structureId) {
      await db.content.create({
        data: {
          id_structure: structureId,
          id_parent: rootContent.id,
          lang: "inherited",
          status: "inherited",
          text: field.value,
        }
      });
      console.log(`  - Added ${field.path}: ${field.value.substring(0, 50)}...`);
    }
  }

  console.log(`\nLowongan "${data.title}" berhasil ditambahkan!`);
  return rootContent.id;
}

// ============================================
// EDIT DATA LOWONGAN DI BAWAH INI
// ============================================

const newLowongan: LowonganData = {
  title: "Staff Accounting",
  department: "Finance",
  location: "Surabaya",
  type: "Full-time",
  description: "<p>Bertanggung jawab untuk pencatatan transaksi keuangan dan pembuatan laporan keuangan perusahaan.</p>",
  requirements: "<ul><li>S1 Akuntansi</li><li>Pengalaman min. 1 tahun</li><li>Menguasai SAP lebih diutamakan</li><li>Teliti dan detail-oriented</li></ul>",
  deadline: "15 Februari 2025",
  apply_url: "mailto:recruitment@tps.co.id?subject=Lamaran Staff Accounting",
  order: 2, // urutan tampil (1 = paling atas)
  lang: "id"
};

// Jalankan
addLowongan(newLowongan)
  .then(() => db.$disconnect())
  .catch((e) => {
    console.error("Error:", e);
    db.$disconnect();
  });
