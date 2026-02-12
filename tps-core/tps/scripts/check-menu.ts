/**
 * Script untuk mengecek struktur menu di database
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function checkMenuStructure() {
  console.log("\n========================================");
  console.log("📂 STRUKTUR MENU (tabel: structure)");
  console.log("========================================\n");

  // Get all menu-related structures
  const structures = await db.structure.findMany({
    where: {
      OR: [{ path: "menu" }, { path: { startsWith: "menu." } }],
    },
    orderBy: { path: "asc" },
    select: {
      id: true,
      path: true,
      type: true,
      title: true,
      multiple: true,
    },
  });

  console.log("Path                          | Type      | Title");
  console.log("------------------------------|-----------|------------------");
  for (const s of structures) {
    const path = (s.path || "").padEnd(29);
    const type = (s.type || "").padEnd(9);
    console.log(`${path} | ${type} | ${s.title || "-"}`);
  }

  // Build structure map
  const structMap: Record<string, { id: string; path: string }> = {};
  let rootId = "";
  for (const s of structures) {
    if (s.path === "menu") rootId = s.id;
    if (s.path) structMap[s.id] = { id: s.id, path: s.path };
  }

  console.log("\n\n========================================");
  console.log("📋 ISI MENU (tabel: content)");
  console.log("========================================\n");

  // Get all menu content entries (root level)
  const menuContents = await db.content.findMany({
    where: {
      id_structure: rootId,
      OR: [
        { status: "published" },
        { status: "inherited" },
      ],
    },
    select: {
      id: true,
      lang: true,
      status: true,
    },
  });

  console.log(`Total menu entries: ${menuContents.length}\n`);

  // For each menu entry, get its children
  for (const menu of menuContents) {
    const children = await db.content.findMany({
      where: {
        id_parent: menu.id,
      },
      select: {
        id: true,
        id_structure: true,
        text: true,
        lang: true,
      },
    });

    // Build menu object
    const menuItem: Record<string, any> = {
      id: menu.id.substring(0, 8) + "...",
      lang: menu.lang,
      status: menu.status,
    };

    for (const child of children) {
      const struct = structMap[child.id_structure || ""];
      if (struct) {
        const fieldName = struct.path.replace("menu.", "");

        // Check if this field has nested children (for submenu items)
        if (fieldName === "items") {
          const subItems = await db.content.findMany({
            where: { id_parent: child.id },
            select: {
              id: true,
              id_structure: true,
              text: true,
            },
          });

          if (subItems.length > 0) {
            // Get sub-item details
            const subItemData: any[] = [];
            const uniqueParents = new Set<string>();

            for (const si of subItems) {
              if (si.id_structure) {
                const siStruct = structMap[si.id_structure];
                if (siStruct && siStruct.path === "menu.items") {
                  uniqueParents.add(si.id);
                }
              }
            }

            for (const parentId of uniqueParents) {
              const itemChildren = await db.content.findMany({
                where: { id_parent: parentId },
                select: { id_structure: true, text: true },
              });

              const subItem: Record<string, string> = {};
              for (const ic of itemChildren) {
                const icStruct = structMap[ic.id_structure || ""];
                if (icStruct) {
                  const subFieldName = icStruct.path.replace("menu.items.", "");
                  subItem[subFieldName] = ic.text || "";
                }
              }
              if (Object.keys(subItem).length > 0) {
                subItemData.push(subItem);
              }
            }

            menuItem[fieldName] = subItemData;
          }
        } else {
          menuItem[fieldName] = child.text || "";
        }
      }
    }

    console.log("─".repeat(60));
    console.log(`Menu: ${menuItem.label || "(no label)"}`);
    console.log(`  URL: ${menuItem.url || "(no url)"}`);
    console.log(`  Order: ${menuItem.order || "(no order)"}`);
    console.log(`  Lang: ${menuItem.lang}, Status: ${menuItem.status}`);

    if (menuItem.items && menuItem.items.length > 0) {
      console.log(`  Submenu (${menuItem.items.length} items):`);
      for (const sub of menuItem.items) {
        console.log(`    └─ ${sub.label || "(no label)"} → ${sub.url || "(no url)"}`);
      }
    }
  }

  console.log("\n─".repeat(60));
  console.log("\n✅ Selesai!\n");
}

checkMenuStructure()
  .then(() => db.$disconnect())
  .catch((e) => {
    console.error("Error:", e);
    db.$disconnect();
  });
