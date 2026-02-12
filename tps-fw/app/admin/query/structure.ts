import { TreeItem } from "@/comps/list/Tree";
import { structure as db_structure } from "../../../typings/prisma";

type TStructure = Record<string, db_structure & { childs?: TStructure }>;
const cache = {
  structure: {} as TStructure,
};

export const structure = {
  root: async () => {
    return await db.structure.findMany({
      where: {
        parent: null,
      },
    });
  },
  init: async function () {
    const all = await db.structure.findMany({
      where: {
        parent: null,
      },
      select: { id: true },
    });

    if (Array.isArray(all)) {
      for (const root of all) {
        const headers = await structure.headers(root.id);
        for (const header of headers) {
          if (header && header.path) {
            cache.structure[header.path] = header;
            cache.structure[header.path].childs = {};

            if (cache.structure[header.path]) {
              const cached_header = cache.structure[header.path];
              for (const s of headers) {
                if (s.path && cached_header.childs) {
                  cached_header.childs[s.path] = s;
                }
              }
            }
          }
        }
      }
    }
  },
  content: async (
    parent: db_structure,
    structures: db_structure[],
    where?: any
  ) => {
    const lines = await db.content.findMany({
      where: {
        id_structure: parent.id,
        ...where,
      },
      select: { id: true },
    });

    if (!lines) return [];

    const short_contents = structures.filter((e) => e.type !== "textarea");
    const long_contents = structures.filter((e) => e.type === "textarea");
    const res = await db.content.findMany({
      where: {
        id_parent: { in: lines.map((e) => e.id) },
        id_structure: {
          in: short_contents.map((e) => e.id),
        },
      },
      select: {
        id: true,
        id_parent: true,
        id_structure: true,
        text: true,
        file: true,
      },
    });
    const res_long = await db.content.findMany({
      where: {
        id_parent: { in: lines.map((e) => e.id) },
        id_structure: {
          in: long_contents.map((e) => e.id),
        },
      },
      select: {
        id: true,
        id_parent: true,
        id_structure: true,
      },
    });

    const structs: Record<string, db_structure> = {};
    for (const s of structures) {
      structs[s.id] = s;
    }

    const rows: Record<string, any> = {};
    for (const cell of res) {
      if (cell.id_parent && cell.id_structure) {
        if (!rows[cell.id_parent]) {
          rows[cell.id_parent] = {};
        }
        const row = rows[cell.id_parent];
        const s = structs[cell.id_structure];
        if (row && s.path) {
          if (!row.id) row.id = cell.id_parent;

          row[s.path] = cell.text;
          if (cell.file) {
            row[s.path] = cell.file;
          }
        }
      }
    }

    for (const cell of res_long) {
      if (cell.id_parent && cell.id_structure) {
        if (!rows[cell.id_parent]) {
          rows[cell.id_parent] = {};
        }
        const row = rows[cell.id_parent];
        const s = structs[cell.id_structure];
        if (row && s.path) {
          row[s.path] = cell;
        }
      }
    }

    return Object.values(rows);
  },
  headers: async (id: string) => {
    // Validate UUID format - return empty array if invalid
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!id || !uuidRegex.test(id)) {
      return [];
    }

    const result = (await db.$queryRaw`with recursive
    n as (
      select * from structure where id = uuid(${id})
     union all
      select i.*
      from n
      join structure i on i.parent = n.id
    )
    select * from n`) as db_structure[];

    return (result || []).map((e) => ({
      ...e,
      path: (e.path || "").replace(/\s/g, "").replace(/\?/ig, ""),
    }));
  },
  tree: async (id_role: number) => {
    const structures = await db.structure.findMany({
      where: {
        parent: null,
        status: "published",
      },
      select: {
        id: true,
        title: true,
        id_folder: true,
        sort_idx: true,
        icon: true,
      },
    });
    const folders = await db.structure_folder.findMany({
      where: {
        role_menu: {
          some: {
            id_role,
          },
        },
      },
    });

    const tree: (TreeItem & { type: "structure" | "folder"; icon: string })[] =
      [];
    for (const s of structures) {
      tree.push({
        id: s.id,
        type: "structure",
        id_parent: s.id_folder || "",
        sort_idx: s.sort_idx,
        text: s.title || "",
        icon: s.icon,
      });
    }
    for (const s of folders) {
      tree.push({
        id: s.id,
        type: "folder",
        id_parent: s.id_parent || "",
        sort_idx: s.sort_idx,
        text: s.name || "",
        icon: s.icon,
        children: [],
      });
    }

    return tree;
  },
};
