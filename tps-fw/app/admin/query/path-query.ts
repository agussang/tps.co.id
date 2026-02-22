import get from "lodash.get";
import orderBy from "lodash.orderby";
import trim from "lodash.trim";
import { pathCache, PQArg, PQArgPaging } from "./path-cache";

export type CItem = {
  lang: string | null;
  status: string | null;
  field: CField;
  text: string | null;
  file: any;
  childs: Record<string, CItem>;
};
export type CField = { name: string; type: string | null };

export const pathQueryPaging = async (
  arg: PQArgPaging,
  opt?: { use_cache: boolean }
) => {
  const { sort, where, paging } = arg;
  const cached = pathCache.get(arg);
  if (opt?.use_cache !== false) {
    if (cached) {
      return cached as unknown as { unpaged: any[]; paged: any[] };
    }
  }
  const contents = await pathQueryInternal(arg, opt);
  let unpaged = flattenPathQuery(contents, { sort });

  if (where) {
    unpaged = unpaged.filter((e) => {
      return whereMatch(e, where);
    });
  }

  const paged = [];
  if (paging) {
    let i = 0;
    for (let item of unpaged) {
      if (i >= paging.skip) {
        paged.push(item);
        if (paged.length >= paging.take) {
          break;
        }
      }
      i++;
    }
  }

  pathCache.set(arg, { unpaged, paged });
  return { unpaged, paged };
};

export const pathQuery = async (
  arg: PQArg,
  opt?: { use_cache?: boolean; single_child_as?: "array" | "object" }
): Promise<any[]> => {
  const { sort, where } = arg;

  const cached = pathCache.get(arg);
  if (opt?.use_cache !== false) {
    if (cached) {
      return cached;
    }
  }

  const contents = await pathQueryInternal(arg, opt);
  let res = flattenPathQuery(contents, {
    sort,
    single_child_as: opt?.single_child_as,
  }) as any[];

  if (where) {
    res = res.filter((e) => {
      return whereMatch(e, where);
    });
  }

  pathCache.set(arg, res);
  return res as any[];
};

export const pathQueryInternal = async (
  arg: PQArg,
  opt?: { use_cache?: boolean; single_child_as?: "array" | "object" }
) => {
  const { lang, status, sort, where } = arg;
  const path = trim(arg.path.trim(), ".");

  const raw_structures = await db.structure.findMany({
    where: {
      OR: [{ path: path }, { path: { startsWith: `${path}.` } }],
    },
    select: { id: true, path: true, type: true },
  });

  const structures = {} as Record<string, CField>;
  let root_id = "";
  for (const e of raw_structures) {
    if (e.path === path) root_id = e.id;
    if (e.path) structures[e.id] = { name: e.path, type: e.type };
  }

  const source = await db.content.findMany({
    where: {
      id_structure: { in: Object.keys(structures) },
    },
    select: {
      id: true,
      lang: true,
      status: true,
      id_structure: true,
      text: true,
      file: true,
      id_parent: true,
    },
  });

  const contents = {} as Record<string, CItem>;
  const processed = new Set<string>();
  for (const c of source) {
    if (c.id_structure === root_id) {
      if (lang && c.lang !== lang) continue;
      if (status && c.status !== status) continue;

      contents[c.id] = {
        childs: {},
        field: structures[c.id_structure],
        file: c.file,
        text: c.text,
        lang: c.lang,
        status: c.status,
      };
      processed.add(c.id);
    }
  }

  process_contents({ processed, source, contents, structures });
  return contents;
};

const flattenChilds = (
  source: Record<string, CItem>,
  row: any,
  parent_field: string,
  single_child_as: "object" | "array"
) => {
  for (const [_, item] of Object.entries(source)) {
    const key = item.field.name.substring(parent_field.length + 1);
    if (Object.keys(item.childs).length > 0) {
      if (typeof row[key] === "object" && row[key]) {
        if (!Array.isArray(row[key])) {
          const first = row[key];
          const last = {};
          flattenChilds(item.childs, last, item.field.name, single_child_as);
          row[key] = [first, last];
        } else {
          const last = {};
          flattenChilds(item.childs, last, item.field.name, single_child_as);
          row[key] = [...row[key], last];
        }
        row[key] = row[key].filter((e: any) => e);

        if (typeof row[key]?.[0]?.["order"] !== "undefined") {
          row[key] = row[key].sort((a: any, b: any) => {
            return a.order - b.order;
          });
        }
      } else {
        const single = {};
        if (single_child_as === "array") {
          row[key] = [single];
        } else {
          row[key] = single;
        }
        flattenChilds(item.childs, single, item.field.name, single_child_as);
      }
    } else {
      row[key] = item.text || item.file?.path;
    }
  }
};

const flattenPathQuery = (
  source: Record<string, CItem>,
  opt: {
    sort?: PQArg["sort"];
    single_child_as?: "object" | "array";
  },
  is_child?: boolean
) => {
  let result = [] as any[];
  for (const [k, v] of Object.entries(source)) {
    const row = { id: k } as any;

    flattenChilds(
      v.childs,
      row,
      v.field.name,
      opt?.single_child_as || "array"
    );

    if (Object.keys(row).length > 1) {
      result.push(row);
    }

    if (!is_child) {
      row.lang = v.lang;
      row.status = v.status;
    }
  }

  if (opt.sort) {
    const [col, order] = Object.entries(opt.sort)[0];
    result = orderBy(result, col, order);
  }

  return result;
};

export const process_contents = ({
  processed,
  source,
  contents,
  structures,
}: {
  processed: Set<string>;
  contents: Record<string, CItem>;
  source: {
    lang: string | null;
    status: string | null;
    id: string;
    id_parent: string | null;
    id_structure: string | null;
    text: string | null;
    file?: any;
    id_file?: string | null;
  }[];
  structures: Record<string, CField>;
}) => {
  for (const c of source) {
    if (processed.has(c.id) || !c.id_parent || !c.id_structure) continue;
    const parent = contents[c.id_parent];
    if (parent) {
      processed.add(c.id);
      parent.childs[c.id] = {
        childs: {},
        field: structures[c.id_structure],
        file: c.file,
        text: c.text,
        lang: c.lang,
        status: c.status,
      };
      process_contents({
        processed,
        source,
        contents: parent.childs,
        structures,
      });
    }
  }
};

const whereMatch = (row: any, where: PQArg["where"]) => {
  if (where) {
    for (const condition of Object.entries(where)) {
      const [field, search] = condition;
      const value = get(row, field);
      if (typeof search === "string") {
        if (value !== search) return false;
      } else if (!value.toLowerCase().includes(search.contains.toLowerCase())) {
        return false;
      }
    }
  }
  return true;
};
