import { structure } from "./structure";
import { content, structure as db_structure } from "../../../typings/prisma";
import { validate } from "uuid";

export const query = {
  parents: async (id: string, extra?: string[]) => {
    if (!validate(id)) {
      throw new Error("invalid id");
    }

    const sql = `\
with recursive whosYourDaddy as (
  select
    id, id_parent ${extra ? `, ${extra.join(",")}` : ""}
  from content
  where
    id = uuid('${id}')

  union all

  select
    content.id, content.id_parent ${extra ? `, content.${extra.join(", content.")}` : ""}
  from content 
  join whosYourDaddy on whosYourDaddy.id_parent = content.id
)

select
  *
from whosYourDaddy 
order by
  id;`;
    return (await db.$queryRawUnsafe(sql)) as content[];
  },
  childs: async (id: string, extra?: string) => {
    if (!validate(id)) {
      throw new Error("invalid id");
    }

    const sql = `with recursive
    n as (
      select * from content where id = uuid('${id}')
     union all
      select i.*
      from n
      join content i on i.id_parent = n.id
    )
    select id ${extra ? `, ${extra}` : ""} from n`;
    return (await db.$queryRawUnsafe(sql)) as content[];
  },
  content: async (id_content: string, lang?: string) => {
    if (!id_content || !validate(id_content)) return null;

    let _status = "";
    const contents = await db.content.findMany({
      where: {
        AND: [
          {
            OR: [{ id_parent: id_content }, { id: id_content }],
          },
          lang ? { lang: { in: ["inherited", lang] } } : {},
        ],
      },
      select: {
        id: true,
        id_structure: true,
        text: true,
        file: true,
        lang: true,
        status: true
      },
    });

    let id_structure = "";
    for (const c of Object.values(contents)) {
      if (!c.id_structure) continue;
      if (c.id === id_content) {
        _status = c.status || "";
        id_structure = c.id_structure;
      }
    }

    if (!id_structure) return null;

    const sts = await structure.headers(id_structure);
    const st = {} as Record<string, db_structure>;
    for (const s of sts) {
      st[s.id] = s;
    }

    const item = {} as any;
    const langs = {} as Record<string, string>;
    for (const c of Object.values(contents)) {
      if (!c.id_structure) continue;
      const s = st[c.id_structure];
      if (st[c.id_structure]) {
        const key = s.path?.split(".").pop();
        if (key) {
          if (!item[key]) {
            item[key] = c.file || c.text;
            langs[key] = c.lang || "inherited";
          } else {
            if (c.lang !== "inherited" && langs[key] === "inherited") {
              item[key] = c.file || c.text;
            }
          }
        }
      }
    }

    item._status = _status;

    return item;
  },
};
