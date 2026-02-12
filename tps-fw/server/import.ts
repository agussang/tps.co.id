import { adminLang } from "app/admin/lang";
import { g } from "./global";
import { cache } from "./query/cache";
import { queryDeep } from "./query/query-deep";
import { PrasiArg } from "./type";
export const importLangRoute = async (arg: PrasiArg) => {
  const id = arg.url.raw.searchParams.get("id");
  const to = arg.url.raw.searchParams.get("to");

  if (id && to) {
    const result = await importLang(id, to);
    return new Response(JSON.stringify({ status: "ok" }, null, 2));
  }
  return new Response(JSON.stringify({ status: "alredy-imported" }));
};

export const importLang = async (id: string, to: string) => {
  const row = await db.content.findFirst({
    where: {
      id,
    },
    select: {
      status: true,
      structure: {
        select: {
          id: true,
          path: true,
        },
      },
    },
  });

  if (row?.structure?.path) {
    const id_structure_parent = row.structure.id;
    const res = await queryDeep({
      path: row.structure.path,
      condition: { parent: { id } },
      includes: {
        structure: true,
        file: true,
      },
    });

    if (!Array.isArray(res) || (Array.isArray(res) && !res[0])) {
      const parent = await db.content.create({
        data: {
          id_structure: row.structure.id,
          id_ori_lang: id,
          lang: to,
          status: row.status
        },
      });
      console.log(
        "error translate - failed to query structure:",
        row.structure,
        id
      );
      return {};
    }

    const results: Record<
      string,
      { id: string; value: any; key: string; translated?: string }
    > = {};

    pluck({ item: res[0], results });
    const original_arr = Object.values(results).map((e) => e);
    const original = Object.values(results).map((e) => e.value);
    const translated = await translate_array(original);
    for (const [k, v] of Object.entries(translated)) {
      original_arr[parseInt(k)].translated = v;
    }
    pluck({ item: res[0], results });

    await save_translate(id_structure_parent, res[0], row.structure.path, to);

    delete cache.query_deep[row.structure.path.split(".").shift() || ""];
    return res;
  }
};

const save_translate = async (
  id_structure_parent: string,
  original: any,
  path: string,
  to: string
) => {
  const cur = await db.content.findFirst({
    where: { id_ori_lang: original.id, id_parent: null },
  });

  if (cur) {
    const target = await queryDeep({
      path,
      condition: { parent: { id: cur.id } },
      includes: {
        structure: true,
        file: true,
      },
    });

    await save_recursive(
      id_structure_parent,
      original,
      target[0],
      to,
      original.id
    );
  } else {
    await save_recursive(
      id_structure_parent,
      original,
      undefined,
      to,
      original.id
    );
  }
};

const save_recursive = async (
  id_structure_parent: string,
  translated: Record<string, any> & { id_structures: Record<string, string> }[],
  existing:
    | undefined
    | (Record<string, any> & { id_structures: Record<string, string> }[]),
  to: string,
  id_ori_lang?: string
) => {
  if (!existing) {
    const id_parent = await create_parent({
      lang: to,
      id_structure: id_structure_parent,
      id_ori_lang: id_ori_lang || translated.id,
    });
    translated.id = id_parent;
    await create_fields({
      item: translated,
      lang: to,
      id_parent,
      id_ori_lang: id_ori_lang || translated.id,
    });
  } else {
    await create_fields({
      item: translated,
      existing,
      lang: to,
      id_parent: existing.id,
      id_ori_lang: id_ori_lang || translated.id,
    });
  }
};

const create_parent = async (arg: {
  id?: string;
  id_parent?: string;
  lang: string;
  id_structure: string;
  id_ori_lang: null | string;
}) => {
  const data = {
    id: arg.id,
    id_parent: arg.id_parent,
    id_structure: arg.id_structure,
    status: "published",
    id_ori_lang: arg.id_ori_lang,
    lang: arg.lang,
  } as any;
  const res = await db.content.create({
    data: {
      created_at: new Date(Date.now() - Math.floor(Math.random() * 1000) + 1),
      ...data,
    },
    select: { id: true },
  });

  return res.id;
};
const create_fields = async (arg: {
  item: any;
  existing?: any;
  lang: string;
  id_parent: null | string;
  id_ori_lang: null | string;
}) => {
  const existing = arg.existing;
  const lang = arg.lang;
  const id_ori_lang = arg.id_ori_lang;
  let target = arg.item;

  if (existing) {
    const item_exclude_exist: any = {
      id: existing.id,
      id_parent: existing.id_parent,
      id_structures: existing.id_structures,
    };
    for (const [k, v] of Object.entries(arg.item)) {
      if (
        typeof item_exclude_exist[k] === "undefined" &&
        typeof arg.item[k] !== "undefined"
      ) {
        if (
          typeof existing[k] === "undefined" ||
          (typeof existing[k] === "object" &&
            existing[k] &&
            arg.item[k] &&
            arg.item[k].length > existing[k].length)
        ) {
          item_exclude_exist[k] = arg.item[k];
        }
      }
    }
    target = item_exclude_exist;
  }

  for (const [k, v] of Object.entries(target)) {
    if (["id_structures", "id", "id_parent"].includes(k)) {
      continue;
    }
    const id_structure = arg?.item?.id_structures?.[k];

    if (!id_structure) {
      console.log("no struct", arg);
      continue;
    }
    if (
      typeof v !== "object" ||
      (typeof v === "object" && v && (v as any).uuid)
    ) {
      const data: any = {
        id_parent: arg.id_parent,
        lang,
        id_structure,
        id_ori_lang,
      };

      if (typeof v === "object" && v && (v as any).uuid) {
        data.id_file = (v as any).uuid;
      } else {
        data.text = v;
      }

      const res = await db.content.create({ data, select: { id: true } });
    } else if (Array.isArray(v)) {
      if (id_structure) {
        for (const [idx, sub_item] of Object.entries(v)) {
          const id_parent = await create_parent({
            id_parent: target.id,
            lang,
            id_ori_lang,
            id_structure,
          });
          sub_item.id = id_parent;
          await create_fields({
            id_ori_lang,
            id_parent,
            item: sub_item,
            lang,
          });
        }
      }
    }
  }
};

const pluck = (arg: {
  item: any;
  results: Record<
    string,
    { id: string; value: any; key: string; translated?: string }
  >;
  prefix?: string;
  skip?: boolean;
}) => {
  const { item, results, prefix } = arg;
  for (const [k, v] of Object.entries(item || {})) {
    if (k === "id" || k === "id_parent") continue;
    if (typeof v === "object" && !Array.isArray(v)) continue;
    if (Array.isArray(v)) {
      for (const [i, j] of Object.entries(v)) {
        pluck({
          item: j,
          results: arg.results,
          prefix: `${prefix ? prefix + "." : ""}${k}.${i}`,
        });
      }
    } else {
      if (arg.skip || arg.skip === undefined) {
        if (typeof v === "string" && parseInt(v)) continue;
        const skipping = [
          "icon",
          "url",
          "name",
          "order",
          "date",
          "time",
          "slug",
          "file",
          "img",
          "image",
          "tag",
        ].find((e) => k.includes(e));
        if (skipping) {
          continue;
        }
      }

      const path = `${prefix ? prefix + "." : ""}${k}`;
      if (results[path]) {
        item[k] = results[path].translated || results[path].value;
      } else {
        results[path] = {
          id: item.id,
          key: k,
          value: v,
        };
      }
    }
  }
};

const translate_array = async (str: string[]) => {
  const result: any = {};

  // Standalone mode: Use internal translation service
  const url = `http://172.19.154.97:5000`;

  const promises = [];
  for (const [k, v] of Object.entries(str)) {
    promises.push(
      fetch(`${url}/translate`, {
        method: "POST",
        body: JSON.stringify({
          q: v,
          source: "id",
          target: "en",
          format: "text",
          api_key: "",
        }),
        headers: { "Content-Type": "application/json" },
      }).then(async (res) => {
        const res_tr = (await res.json()) || {};
        const translated = res_tr?.translatedText || "";
        result[k] = translated;
      })
    );
  }

  await Promise.all(promises);

  return Object.values(result) as string[];
};
