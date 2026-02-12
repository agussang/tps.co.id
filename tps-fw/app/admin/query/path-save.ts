import get from "lodash.get";
import { query } from "./content";
import { structure } from "./structure";
import { content } from "../../../typings/prisma";
import { pathCache } from "./path-cache";
import dayjs from "dayjs";
type CSimpleStruct = {
  id: string;
  path: string;
  type: string;
  required: boolean;
  title: string;
};

export const pathSave = async (
  arg: {
    entry: any;
    lang: string;
    status: string;
    is_new?: boolean;
  } & (
    | { id: string; mode: "update" }
    | { mode: "new"; id_structure: string; id_parent: string }
  )
) => {
  let id = "";
  let id_structure = "";
  const result = {
    structure_name: "",
  };
  if (arg.mode === "update") {
    id = arg.id;
    const c = await db.content.findFirst({
      where: { id },
      select: { id_structure: true },
    });
    if (c) {
      id_structure = c.id_structure || "";
    }
  } else {
    id_structure = arg.id_structure;
  }
  if (id_structure) {
    const content_by_struct = {} as Record<string, any>;

    if (id) {
      const source = await query.childs(
        id,
        "lang, status, id_structure, text, id_file, id_parent"
      );

      for (const item of source) {
        if (item.id_structure) {
          content_by_struct[item.id_structure] = item;
        }
      }
    }

    const updates = [] as {
      id: string;
      text?: string;
      id_file?: null | string;
    }[];
    const inserts = [] as Partial<content>[];
    const struct_by_id = {} as Record<string, CSimpleStruct>;
    const struct_by_path = {} as Record<string, CSimpleStruct>;

    const root_struct = await db.structure.findFirst({
      where: { id: id_structure },
    });

    (await structure.headers(id_structure)).forEach((s) => {
      struct_by_id[s.id] = {
        id: s.id,
        type: s.type || "",
        path: s.path || "",
        required: s.required,
        title: s.title || s.path,
      };
      struct_by_path[s.path] = {
        id: s.id,
        type: s.type || "",
        path: s.path || "",
        required: s.required,
        title: s.title || s.path,
      };
    });

    const errors = {} as Record<string, string[]>;

    await Promise.all(
      Object.values(struct_by_id).map(async (struct) => {
        const parts = struct.path.split(".");

        const parent_path = parts.slice(0, parts.length - 1).join(".");
        const parent_struct = struct_by_path[parent_path];
        if (!parent_struct) return;

        const existing = content_by_struct[struct.id];
        const parent_content = content_by_struct[parent_struct?.id];

        const path = struct.path.substring(root_struct!.path!.length + 1);
        let new_value = get(arg.entry, path);

        if (!new_value && struct.required && !path.includes(".")) {
          errors[path] = [`${struct.title} harus diisi`];
        }

        if (existing) {
          let update_item = {} as (typeof updates)[number];
          if (struct.type === "file") {
            update_item = { id: existing.id, id_file: null };

            if (typeof new_value === "string") {
              let file = await db.file.findFirst({
                where: { path: new_value },
                select: { uuid: true },
              });
              if (!file) {
                file = await db.file.create({
                  data: {
                    path: new_value,
                    method: "upload",
                  },
                  select: { uuid: true },
                });
              }
              update_item.id_file = file.uuid;
            } else {
              update_item.id_file = new_value?.uuid || null;
            }

            if (existing.id_file !== update_item.id_file) {
              updates.push(update_item);
            }
          } else {
            if (struct.type === "date") {
              new_value = dayjs(new_value).format("YYYY-MM-DD");
            }

            update_item = { id: existing.id, text: new_value || "" };

            if (update_item.text !== (existing.text || "")) {
              updates.push(update_item);
            }
          }
        } else if (parent_content || arg.mode === "new") {
          const insert_item: (typeof inserts)[number] = {
            id_parent: parent_content?.id,
            lang: parent_content?.lang || arg.lang,
            status: parent_content?.status || arg.status,
            updated_at: new Date(),
            id_structure: struct.id,
            created_at: new Date(),
          };

          if (new_value) {
            if (struct.type === "file") {
              if (typeof new_value === "string") {
                let file = await db.file.findFirst({
                  where: { path: new_value },
                  select: { uuid: true },
                });
                if (!file) {
                  file = await db.file.create({
                    data: {
                      path: new_value,
                      method: "upload",
                    },
                    select: { uuid: true },
                  });
                }
                insert_item.id_file = file.uuid;
              } else {
                insert_item.id_file = new_value?.uuid || null;
              }
            } else if (struct.type === "date") {
              insert_item.text = dayjs(new_value).format("YYYY-MM-DD");
            } else {
              insert_item.text = new_value || "";
            }

            inserts.push(insert_item);
          }
        }
      })
    );

    if (Object.keys(errors).length > 0) {
      return { status: "error", errors };
    }

    if (arg.mode === "new") {
      const parent = await db.content.create({
        data: {
          id_structure: arg.id_structure,
          id_parent: arg.id_parent,
          status: arg.status,
          lang: arg.lang,
        },
      });
      id = parent.id;
      for (const item of inserts) {
        item.id_parent = parent.id;
      }
    }

    await Promise.all([
      ...updates.map((u) =>
        db.content.update({
          where: { id: u.id },
          data: { id_file: u.id_file, text: u.text },
        })
      ),
      ...inserts.map((item) =>
        db.content.create({
          data: item,
        })
      ),
    ]);
    result.structure_name = struct_by_id[id_structure].title;

    await pathCache.clear(
      struct_by_id[id_structure].path.split(".").shift() || ""
    );
  }
  return { status: "ok", id, structure: { name: result.structure_name } };
};
