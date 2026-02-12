import { IParamsQueryChild } from "server/type";
import {
  Prisma,
  content,
  structure as db_structure,
} from "../../typings/prisma";
import { cache } from "./cache";
import { loadHeaders } from "./load-header";

export type QueryDeepArg = {
  path: string;
  condition?: {
    parent?: Prisma.contentWhereInput;
    childs?: Array<IParamsQueryChild>;
  };
  includes?: Partial<{ structure: boolean; file: boolean }>;
  take?: number;
  skip?: number;
  columns?: string[];
  sort?: { col: string; order: "asc" | "desc" };
};

export const queryDeep = async (arg: QueryDeepArg) => {
  const { path, condition, skip, take, sort } = arg;
  await loadHeaders(path);

  const header = cache.structure[path];

  if (header) {
    const struct_map_by_id = {} as Record<string, db_structure>;
    const struct_map_by_path = {} as Record<string, db_structure>;
    Object.values(header?.childs || {})
      .filter((s) => {
        struct_map_by_id[s.id] = s;
        struct_map_by_path[s.path || ""] = s;
        if (arg.columns) {
          for (const c of arg.columns) {
            if (s.path?.startsWith(`${path}.${c}`)) {
              return true;
            }
          }
        } else {
          return true;
        }
        return false;
      })
      .map((e) => ({ id: e.id, path: e.path }));

    if ((condition?.childs || [])?.length > 0) {
      const parent_structs = {} as Record<string, any>;
      // dapatkan child yg sessuai dengan kondisi
      const cond_results: Record<
        string,
        { childs: any[]; id_structure: string }
      >[] = [];

      for (const c of condition?.childs || []) {
        const struct = struct_map_by_path[c.path];
        if (struct) {
          const raw = await db.content.findMany({
            where: { id_structure: struct.id, ...c.where },
            select: {
              id: true,
              id_parent: true,
              text: true,
              file: true,
              id_structure: true,
            },
          });

          if (struct.parent) {
            if (struct_map_by_id[struct.parent]?.parent) {
              parent_structs[struct.parent] = struct_map_by_id[struct.parent];
            }
          }

          const result = {} as Record<
            string,
            { childs: any[]; id_structure: string }
          >;
          for (const item of raw) {
            const id_parent = item.id_parent || "";
            if (!result[id_parent]) {
              result[id_parent] = {
                childs: [],
                id_structure: item.id_structure || "",
              };
            }
            result[id_parent].childs.push(item);
          }

          cond_results.push(result);
        }
      }

      const valid_rows = {} as Record<
        string,
        { childs: any[]; id_structure: string }
      >;

      for (const results of cond_results) {
        for (const [id, cells] of Object.entries(results)) {
          if (id) {
            if (!valid_rows[id]) {
              valid_rows[id] = { childs: [], id_structure: cells.id_structure };
            }
            valid_rows[id].childs.push(cells.childs.map((e) => e.id));
          }
        }
      }

      const valid_ids: { id: string; id_structure: string }[] = [];
      for (const [id, valids] of Object.entries(valid_rows)) {
        if (valids.childs.length === (condition?.childs || []).length) {
          valid_ids.push({ id, id_structure: valids.id_structure });
        }
      }

      if (Object.keys(parent_structs).length > 0) {
        const res = await getParentByChildIds({
          child_ids: valid_ids.map((e) => e.id),
          extra: ["id_structure", "id_file", "text", "lang"],
        });

        const result = await getRowChilds({
          row_ids: res.filter((e) => !e.id_parent).map((e) => e.id),
          struct_map_by_path,
          includes: arg.includes,
          struct_map_by_id,
          skip,
          take,
          path: header.path || "",
        });
        return result;
      }

      return await getRowChilds({
        row_ids: valid_ids.map((e) => e.id),
        struct_map_by_id,
        struct_map_by_path,
        where: condition?.parent,
        includes: arg.includes,
        skip,
        take,
        sort,
        path: header.path || "",
      });
    } else {
      const childs = await getRowChilds({
        struct_map_by_id,
        struct_map_by_path,
        includes: arg.includes,
        where: { ...condition?.parent, id_structure: header.id },
        skip,
        take,
        sort,
        path: header.path || "",
      });

      return childs;
    }
  }

  return [];
};

const getParentByChildIds = async (arg: {
  child_ids: string[];
  extra?: string[];
}) => {
  const { child_ids, extra } = arg;
  const sql = `\ 
with recursive the_table as (
  select
    id, id_parent ${extra ? `, ${extra.join(",")}` : ""}
  from content
  where
    id in (${child_ids.map((e) => `uuid('${e}')`)})
  union all

  select
    content.id, content.id_parent ${extra ? `, content.${extra.join(", content.")}` : ""}
  from content 
  join the_table on the_table.id_parent = content.id
)

select
  *
from the_table 
order by
  id;`;
  return (await db.$queryRawUnsafe(sql)) as content[];
};

const getRowChilds = async (arg: {
  row_ids?: string[];
  struct_map_by_id: Record<string, db_structure>;
  struct_map_by_path: Record<string, db_structure>;
  where?: Prisma.contentWhereInput;
  skip?: number;
  take?: number;
  includes?: QueryDeepArg["includes"];
  sort?: { col: string; order: "asc" | "desc" };
  path: string;
}) => {
  const {
    row_ids,
    struct_map_by_id,
    where,
    skip,
    take,
    sort,
    path,
    struct_map_by_path,
  } = arg;

  let cells = await db.content.findMany({
    where: row_ids
      ? { id_parent: { in: row_ids }, content: where }
      : { content: where },
    select: {
      id: true,
      id_structure: true,
      id_parent: true,
      text: true,
      file: true,
      lang: true,
    },
  });

  const paged_cells = {} as Record<string, true>;
  let should_page = false;

  let sorted: { id: string; id_parent: string | null }[] = [];
  if (
    typeof skip === "number" ||
    typeof take === "number" ||
    typeof sort === "object"
  ) {
    should_page = true;
    const parent_ids = [...new Set(cells.map((e) => e.id_parent || ""))];

    if (sort) {
      const struct = struct_map_by_path[`${path}.${sort.col}`];
      if (struct) {
        sorted = await db.content.findMany({
          where: {
            id_structure: struct.id,
            id_parent: { in: parent_ids },
          },
          skip,
          take,
          select: { id: true, id_parent: true },
          orderBy: sort ? { text: sort.order } : undefined,
        });

        for (const root of sorted) paged_cells[root.id_parent || ""] = true;
      }
    } else {
      console.log(parent_ids)

      const roots = await db.content.findMany({
        where: {
          id: { in: parent_ids },
          id_parent: null,
        },
        skip,
        take,
        select: { id: true },
        // orderBy: sort && where.id_structure ? { text: sort.order } : undefined,
      });

      for (const root of roots) paged_cells[root.id] = true;
    }
  }

  const raw_rows = {} as Record<string, any[]>;
  for (const cell of cells) {
    if (!raw_rows[cell.id_parent || ""]) raw_rows[cell.id_parent || ""] = [];
    raw_rows[cell.id_parent || ""].push(cell);
  }

  const rows = {} as Record<string, any>;

  const pending_multiple = {} as Record<
    string,
    Record<
      string,
      {
        item: any;
        key: string;
        value: { type: "multiple"; id: Record<string, true> };
      }
    >
  >;

  for (const [parent_id, row] of Object.entries(raw_rows)) {
    if (parent_id) {
      const item: any = { id: parent_id };
      if (arg.includes?.structure) {
        item.id_structures = {};
      }

      for (const cell of row) {
        const struct = struct_map_by_id[cell.id_structure || ""];
        if (struct) {
          const final_path = struct.path?.split(".").pop() || "";

          if (item.id_structures) {
            item.id_structures[final_path] = cell.id_structure;
          }

          if (!struct.multiple) {
            item[final_path] =
              typeof cell.file === "object" && cell.file
                ? cell.file.path
                : cell.text;

            if (
              arg.includes?.file &&
              typeof cell.file === "object" &&
              cell.file
            ) {
              item[final_path] = cell.file;
            }
          } else {
            if (!pending_multiple[parent_id]) {
              pending_multiple[parent_id] = {};
            }
            if (!item[final_path])
              item[final_path] = { type: "multiple", id: {} };
            if (item[final_path]) item[final_path].id[cell.id] = true;
            pending_multiple[parent_id][final_path] = {
              item,
              key: final_path,
              value: item[final_path],
            };
          }
        }
      }

      if (should_page) {
        if (paged_cells[parent_id]) {
          rows[parent_id] = item;
        }
      } else {
        rows[parent_id] = item;
      }
    }
  }

  if (Object.keys(pending_multiple).length > 0) {
    await fillChildMultiple({
      pending_multiple,
      struct_map_by_id,
      includes: arg.includes,
    });
  }

  if (sorted.length > 0) {
    const result = [];
    const inserted = {} as Record<string, any>;
    for (const item of sorted) {
      if (item.id_parent && rows[item.id_parent]) {
        const row = rows[item.id_parent];

        if (!inserted[row.id]) {
          inserted[row.id] = row;
          result.push(row);
        }
      }
    }

    return result;
  }

  const inserted = {} as Record<string, any>;

  const result = [];
  for (const item of Object.values(rows)) {
    if (item.id_parent && rows[item.id_parent]) {
      const row = rows[item.id_parent];
      if (!inserted[row.id]) {
        inserted[row.id] = row;
        result.push(row);
      }
    }
  }

  return result;
};

const fillChildMultiple = async (arg: {
  pending_multiple: Record<
    string,
    Record<
      string,
      {
        item: any;
        key: string;
        value: { type: "multiple"; id: Record<string, true> };
      }
    >
  >;
  struct_map_by_id: Record<string, db_structure>;
  includes?: QueryDeepArg["includes"];
}) => {
  const ids_ref = {} as Record<
    string,
    { id_parent: string; key: string; row: any }
  >;
  for (const [id_parent, multiples] of Object.entries(arg.pending_multiple)) {
    for (const [key, { value }] of Object.entries(multiples)) {
      const id = value.id;
      const ids = Object.keys(id);
      for (const id of ids) {
        ids_ref[id] = { id_parent, key, row: { id, id_parent } };
        if (arg.includes?.structure) {
          ids_ref[id].row.id_structures = {};
        }
      }
    }
  }

  const cells = await db.content.findMany({
    where: { id_parent: { in: Object.keys(ids_ref) } },
    select: {
      id: true,
      id_parent: true,
      id_structure: true,
      text: true,
      file: { select: { uuid: true, path: true } },
    },
  });

  const child_mp = {} as typeof arg.pending_multiple;

  for (const cell of cells) {
    const id_parent = cell.id_parent || "";
    const st = arg.struct_map_by_id[cell.id_structure || ""];
    if (st) {
      const path = st.path?.split(".").pop() || "";

      if (ids_ref[id_parent].row.id_structures) {
        ids_ref[id_parent].row.id_structures[path] = cell.id_structure;
      }

      if (st.multiple) {
        if (!ids_ref[id_parent].row[path])
          ids_ref[id_parent].row[path] = { type: "multiple", id: {} };

        if (!child_mp[id_parent]) {
          child_mp[id_parent] = {};
        }

        if (ids_ref[id_parent].row[path])
          ids_ref[id_parent].row[path].id[cell.id] = true;

        child_mp[id_parent][path] = {
          item: ids_ref[id_parent].row,
          key: path,
          value: ids_ref[id_parent].row[path],
        };
      } else {
        ids_ref[id_parent].row[path] =
          typeof cell.file === "object" && cell.file
            ? cell.file.path
            : cell.text;

        if (arg.includes?.file && typeof cell.file === "object" && cell.file) {
          ids_ref[id_parent].row[path] = cell.file;
        }
      }
    }
  }

  const result = {} as Record<string, Record<string, any[]>>;
  for (const [id, item] of Object.entries(ids_ref)) {
    if (!result[item.id_parent]) {
      result[item.id_parent] = {};
    }
    const row = result[item.id_parent];
    if (!row[item.key]) {
      row[item.key] = [];
    }
    row[item.key].push(item.row);
  }

  const empty_rows: {
    id_parent: string;
    key: string;
    idx: number;
    items: { id: string; id_parent: string }[];
    item: { id: string; id_parent: string };
  }[] = [];

  for (const [id_parent, multiples] of Object.entries(arg.pending_multiple)) {
    const row = result[id_parent];
    if (row) {
      for (const [key, new_value] of Object.entries(row)) {
        if (multiples[key]) {
          multiples[key].item[key] = new_value;
          for (const [idx, new_item] of Object.entries(new_value)) {
            if (
              Object.keys(new_item).length === 2 &&
              new_item.id &&
              new_item.id_parent
            ) {
              empty_rows.push({
                id_parent,
                key,
                idx: parseInt(idx),
                items: new_value,
                item: new_item,
              });
            }
          }
        }
      }
    }
  }

  if (Object.keys(empty_rows).length > 0) {
    const row_ids = [];
    for (const row of empty_rows) {
      row_ids.push(row.item.id);
    }
    await db.content.deleteMany({ where: { id: { in: row_ids } } });
  }

  if (Object.keys(child_mp).length > 0) {
    await fillChildMultiple({
      pending_multiple: child_mp,
      struct_map_by_id: arg.struct_map_by_id,
      includes: arg.includes,
    });
  }
};

export const cobaQueryDeep = async () => {
  let result = (await queryDeep({
    path: "press_release",
    // condition: {
    //   parent: {
    //     lang,
    //     status: "published",
    //   },
    // },
    // skip,
    // take,
    sort: { col: "publish_date", order: "desc" },
  })) as any;
  console.log(
    result.map((e: any, idx: number) => {
      return idx + "---" + e.title + "---" + e.publish_date;
    })
  );

  // let result = await queryDeep({
  //   path: "tata_kelola",
  //   condition: {
  //     parent: {
  //       lang: "id",
  //       status: "published",
  //     },
  //   },
  //   sort: { col: "title", order: "desc" },
  // });
  // console.log(result);
  // const res = await queryDeep({
  //   // path: "kontak_kami",
  //   path: "unduh_dokumen",
  //   condition: {
  //     parent: {
  //       lang: "en",
  //     },
  //     childs: [
  //       // {
  //       //   path: "unduh_dokumen.tag",
  //       //   where: {
  //       //     text: {
  //       //       contains: "document",
  //       //     },
  //       //   },
  //       // },
  //       // {
  //       //   path: "unduh_dokumen.publish_date",
  //       //   where: {
  //       //     text: {
  //       //       contains: "2024",
  //       //     },
  //       //   },
  //       // },
  //       // {
  //       //   path: "kontak_kami.name",
  //       //   where: {
  //       //     text: { contains: "place", mode: "insensitive" },
  //       //   },
  //       // },
  //     ],
  //   },
  //   skip: 40,
  //   take: 2,
  //   sort: {
  //     col: "keyword",
  //     order: "asc",
  //   },
  // });
};
