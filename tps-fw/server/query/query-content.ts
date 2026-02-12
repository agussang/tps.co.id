import { structure } from "app/admin/query/structure";
import { query } from "app/admin/query/content";
import { cache } from "./cache";
import { structure as db_structure, Prisma } from "../../typings/prisma";
import { IParamsQuery, IParamsQueryChild, PrasiArg } from "server/type";
import { queryCondition } from "./query-condition";
import { convertMultipleRows } from "./convert-multiple-rows";
import { g } from "server/global";
import { queryDeep, QueryDeepArg } from "./query-deep";
import { log } from "server/log";

const isPreview = (arg?: PrasiArg | void) => {
  if (arg && arg.url && arg.url.raw) {
    if (typeof arg.url.raw.searchParams.get("preview") === "string") {
      return true;
    }
  }
  return false;
};

export const queryContent = {
  updateViews: async <T extends Object>(arg: {
    path: string;
    columns: string;
    id_parent: string;
    count: string;
  }): Promise<boolean> => {
    let headers = "" as any;
    await loadHeader(arg.path);

    const header = cache.structure[arg.path];

    for (const col of header?.childs
      ? Object.entries(header?.childs || {})
      : []) {
      if (col) {
        if (col[0] !== arg.path) {
          headers = [...headers, { [col[0]]: col[1] }];
        }
      }
    }

    let struct = {} as any;
    for (let item of headers) {
      const values = Object.values(item)[0] as any;

      if (values.path === arg.columns) {
        struct = values;
      }
    }

    await db.content.updateMany({
      data: {
        text: (parseInt(arg.count) + 1).toString(),
      },
      where: {
        id_structure: struct.id,
        id_parent: arg.id_parent,
      },
    });

    return true;
  },
  groupBy: async (arg: {
    path: string[];
    where?: Prisma.contentWhereInput;
    columns?: string[];
    params?: Array<IParamsQuery>;
    arg?: PrasiArg | void;
  }) => {
    const { path, where, columns, params } = arg;

    let headers = [] as any;
    let condition = {} as {} | null;
    if (path && path.length > 0) {
      for (const p of path) {
        await loadHeader(p);

        const header = cache.structure[p];

        if (params && params.length > 0) {
          condition = await queryCondition(p, header, params, where);

          if (!condition) {
            return 0;
          }
        }

        for (const col of header?.childs
          ? Object.entries(header?.childs || {})
          : []) {
          if (col) {
            if (col[0] !== p) {
              headers = [...headers, { [col[0]]: col[1] }];
            }
          }
        }
      }
    }

    let result = [] as any;
    if (headers && columns) {
      const cols = headers.filter((s: any, i: any) => {
        if (columns) {
          for (const c of columns) {
            for (const p of path) {
              if (s[`${p}.${c}`]) {
                return true;
              }
            }
          }
        } else {
          return true;
        }
        return false;
      });

      let column_search = [] as Array<{ id: string }>;
      for (const col of cols) {
        for (const p of path) {
          for (const c of columns) {
            if (col[`${p}.${c}`])
              column_search = [...column_search, col[`${p}.${c}`]];
          }
        }
      }

      result = await db.content.groupBy({
        by: ["text"],
        where: {
          id_structure: {
            in: column_search.map((col, i) => col.id),
          },
          text: {
            not: "",
          },
          ...(where || {}),
          ...(condition || {}),
        },
      });

      return result;
    }

    return [];
  },
  findFirst: async <T extends Object>(arg: {
    path: string[];
    where: Prisma.contentWhereInput;
    whereChild: any;
    columns?: string[];
    arg?: PrasiArg | void;
  }) => {
    const { path, where, whereChild, columns } = arg;

    let headers = [] as any;
    if (path && path.length > 0) {
      for (const p of path) {
        await loadHeader(p);

        const header = cache.structure[p];

        for (const col of header?.childs
          ? Object.entries(header?.childs || {})
          : []) {
          if (col) {
            if (col[0] !== p) {
              headers = [...headers, { [col[0]]: col[1] }];
            }
          }
        }
      }
    }

    if (headers) {
      const columns = headers.filter((s: any) => {
        if (whereChild) {
          for (const c of Object.keys(whereChild)) {
            for (const p of path) {
              if (s[`${p}.${c}`]) {
                return true;
              }
            }
          }
        } else {
          return true;
        }
        return false;
      });

      let column_search = [] as Array<{ id: string }>;
      for (const col of columns) {
        for (const p of path) {
          for (const c of Object.keys(whereChild)) {
            if (col[`${p}.${c}`])
              column_search = [...column_search, col[`${p}.${c}`]];
          }
        }
      }

      let result = await db.content.findFirst({
        where: {
          id_structure: {
            in: column_search.map((col, i) => col.id),
          },
          text:
            Object.keys(whereChild).length > 0
              ? {
                  in: Object.values(whereChild),
                }
              : undefined,
          ...(where || {}),
        },
        select: {
          id_parent: true,
          id: true,
        },
      });

      if (where?.lang && where?.lang !== g.cmshub.lang[0].value && !result) {
        result = await db.content.findFirst({
          where: {
            id_structure: {
              in: column_search.map((col, i) => col.id),
            },
            text:
              Object.keys(whereChild).length > 0
                ? {
                    in: Object.values(whereChild),
                  }
                : undefined,
            ...where,
            lang: g.cmshub.lang[0].value,
          },
          select: {
            id_parent: true,
            id: true,
          },
        });
      }

      if (
        where?.content?.lang &&
        where?.content?.lang !== g.cmshub.lang[0].value &&
        !result
      ) {
        result = await db.content.findFirst({
          where: {
            id_structure: {
              in: column_search.map((col, i) => col.id),
            },
            text:
              Object.keys(whereChild).length > 0
                ? {
                    in: Object.values(whereChild),
                  }
                : undefined,
            ...where,
            content: { ...where.content, lang: g.cmshub.lang[0].value },
          },
          select: {
            id_parent: true,
            id: true,
          },
        });
      }

      if (result) {
        const row_items = await db.content.findMany({
          where: {
            id_parent: result.id_parent,
          },
          select: {
            id: true,
            id_parent: true,
            id_structure: true,
            text: true,
            file: true,
            structure: {
              select: {
                path: true,
              },
            },
          },
        });

        for (const cell of row_items) {
          if (cell.id_structure) {
            const col_path = (cell.structure?.path || "").split(".").pop();
            if (col_path)
              (result as any)[col_path] = cell.file
                ? cell.file.path
                : cell.text;
          }
        }

        return result as unknown as T;
      }
    }

    return null;
  },
  countAll: async <T extends Object>(args: {
    path: string;
    where?: Prisma.contentWhereInput;
    params?: Array<IParamsQueryChild>;
    arg: PrasiArg;
  }) => {
    const { path, params, where } = args;
    const arg = {
      path,
      condition: {
        parent: {
          ...where,
          status: "published",
        },
        childs: params,
      },
    };

    const is_preview = isPreview(args.arg);
    if (is_preview) {
      // if (arg.condition?.childs && arg.condition?.childs.length > 0) {
      //   const childs = arg.condition?.childs.filter(
      //     (item, i) => !item.path.endsWith(".preview")
      //   );
      //   arg.condition.childs = childs;
      // }
      return (await queryDeep(arg))?.length;
    }
    const cache_key = JSON.stringify(arg);

    const first_path = arg.path.split(".").shift() || "";
    if (first_path) {
      log.now(
        first_path + " " + JSON.stringify(!!cache.query_deep[first_path])
      );

      if (!cache.query_deep[first_path]) {
        cache.query_deep[first_path] = {};
      }

      let existing = cache.query_deep[first_path][cache_key];
      if (!existing) {
        cache.query_deep[first_path][cache_key] = {
          ts: Date.now(),
          data: (await queryDeep(arg))?.length,
        };
        existing = cache.query_deep[first_path][cache_key];
      }

      return existing.data;
    }

    return (await queryDeep(arg))?.length;
  },
  count: async <T extends Object>(arg: {
    path: string;
    where?: Prisma.contentWhereInput;
    params?: Array<IParamsQuery>;
    arg?: PrasiArg | void;
  }) => {
    const { path, where, params } = arg;
    let condition = {} as any;

    await loadHeader(path);

    const header = cache.structure[path];
    let count: number = 0;
    if (header && header.childs) {
      if (params && params.length > 0) {
        condition = await queryCondition(path, header, params, where);

        if (!condition) {
          return 0;
        }
      }

      const new_cond = { id: condition.id_parent };
      count = await db.content.count({
        where: {
          ...(new_cond || {}),
          ...(where || {}),
        },
      });
    }

    return count;
  },
  search: async (arg: {
    where?: Prisma.contentWhereInput;
    take?: number;
    skip?: number;
  }) => {
    const { where } = arg;

    let paths: any[] = [];
    let results: any[] = [];

    let search = await db.content.findMany({
      where,
      select: {
        id: true,
        id_parent: true,
        id_structure: true,
        text: true,
        structure: {
          select: {
            path: true,
          },
          where: {
            indexs: true,
          },
        },
      },
    });

    search = search.filter((item, i) => item.structure !== null);

    if (search) {
      for (let s of search) {
        const path = s.structure?.path?.split(".")[0];

        let parent = [] as Array<{ id: string; id_parent: string | null }>;
        if (s.id_parent) {
          parent = await query.parents(s.id_parent);
        }

        if (path)
          paths.push({
            [path]: {
              text: s.text,
              id_parent: parent.find((p, i) => p.id_parent === null)?.id,
            },
          });
      }
    }

    if (paths) {
      const structure = await db.structure.findMany({
        select: {
          path: true,
          url_pattern: true,
        },
        where: {
          path: {
            in: paths.map((e, i) => Object.keys(e)[0]),
          },
        },
      });

      if (structure) {
        for (let p of paths) {
          let data = {};
          let content = null;
          const path = Object.keys(p)[0];
          for (let s of structure) {
            if (path === s.path) {
              content = p[path].text;

              if (content) {
                data = {
                  ...s,
                  ...{
                    content: content.replace(/<img[^>]*>/g, ""),
                    id_parent: p[path].id_parent,
                    path: s.path.replaceAll("_", " "),
                    url: "/",
                  },
                };
                results.push(data);
              }
            }
          }
        }
      }

      return results;
    }
  },
  findMany: async <T extends Object>(
    arg: QueryDeepArg & { arg: PrasiArg }
  ): Promise<T[]> => {
    let cache_key = JSON.stringify({
      path: arg.path,
      condition: arg.condition,
      take: arg.take,
      skip: arg.skip,
      sort: arg.sort,
    });

    const is_preview = isPreview(arg.arg);
    if (is_preview) {
      if (arg.condition?.childs && arg.condition?.childs.length > 0) {
        const childs = arg.condition?.childs.filter(
          (item, i) => !item.path.endsWith(".preview")
        );

        arg.condition.childs = childs;
      }

      if (arg.condition?.parent) {
        arg.condition.parent.status = "draft";
      }

      return queryDeep(arg);
    }

    const first_path = arg.path.split(".").shift() || "";
    if (first_path) {
      log.now(
        first_path + " " + JSON.stringify(!!cache.query_deep[first_path])
      );

      if (!cache.query_deep[first_path]) {
        cache.query_deep[first_path] = {};
      }

      let existing = cache.query_deep[first_path][cache_key];
      if (!existing) {
        cache.query_deep[first_path][cache_key] = {
          ts: Date.now(),
          data: await queryDeep(arg),
        };
        existing = cache.query_deep[first_path][cache_key];
      }

      return existing.data;
    }

    const result = await queryDeep(arg);
    return result;
  },
  findAll: async <T extends Object>(arg: {
    path: string;
    where?: Prisma.contentWhereInput;
    params?: Array<IParamsQuery>;
    take?: number;
    skip?: number;
    columns?: string[];
    relations?: any[];
    sort?: { col: string; order: "asc" | "desc" };
    arg?: PrasiArg | void;
  }): Promise<T[]> => {
    let cache_key = JSON.stringify({
      path: arg.path,
      where: arg.where,
      params: arg.params,
      take: arg.take,
      skip: arg.skip,
      sort: arg.sort,
    });
    const is_preview = isPreview(arg.arg);

    const run = async (where: any) => {
      const { path, sort, params, relations } = arg;

      let condition = {} as Record<string, any> | null;

      await loadHeader(path);
      const header = cache.structure[path];
      if (header && header.childs) {
        const columns = {} as Record<string, db_structure>;
        const column_ids = Object.values(header.childs)
          .filter((s) => {
            columns[s.id] = s;
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
          .map((e) => e.id);

        if (column_ids.length > 0) {
          let lines: any[] = [];

          if (params && params.length > 0) {
            condition = await queryCondition(path, header, params, where);

            if (!condition) {
              return [] as T[];
            }
          }

          if (!condition) {
            condition = {
              ...(condition || {}),
              ...{
                id_parent: {
                  not: null,
                },
              },
            };
          }

          let regular_lines = true;

          if (sort) {
            const head = header?.childs?.[`${path}.${sort.col}`];
            if (head) {
              regular_lines = false;

              const finalWhere = {
                structure: { id: head.id },
                ...condition,
                ...(where || {}),
              };

              if (!is_preview) {
                finalWhere.content = {
                  ...finalWhere.content,
                  status: "published",
                };
              }

              lines = (
                await db.content.findMany({
                  where: finalWhere,
                  select: {
                    id: true,
                    id_parent: true,
                  },
                  ...(arg.take ? { take: arg.take } : {}),
                  ...(arg.skip ? { skip: arg.skip } : {}),
                  orderBy: {
                    text: sort.order,
                  },
                })
              ).map((e) => ({ id: e.id_parent }));
            }
          }

          if (regular_lines) {
            const finalWhere = {
              structure: { id: header.id },
              ...condition,
              ...(where || {}),
            };
            if (!is_preview) {
              finalWhere.status = "published";
            }

            lines = await db.content.findMany({
              where: finalWhere,
              select: {
                id: true,
              },
              ...(arg.take ? { take: arg.take } : {}),
              ...(arg.skip ? { skip: arg.skip } : {}),
            });
          }

          if (Array.isArray(lines)) {
            const row_items = await db.content.findMany({
              where: {
                id_parent: { in: lines.map((e) => e.id) },
                id_structure: {
                  in: column_ids,
                },
              },
              select: {
                id: true,
                id_parent: true,
                id_structure: true,
                text: true,
                file: true,
                lang: true,
              },
            });

            lines = await convertMultipleRows(
              path,
              lines,
              row_items,
              columns,
              header?.childs as any,
              relations
            );

            if (!is_preview)
              cache.content[cache_key] = { ts: Date.now(), data: lines };

            return lines as unknown as T[];
          }
        }
      }
      return [];
    };

    const query = async (where: any) => {
      if (is_preview) return await run(where);
      const cached = cache.content[cache_key];
      if (cached) {
        if (Date.now() - cached.ts > cache.timeout) {
          run(where);
        }
        return cache.content[cache_key].data;
      }
      return await run(where);
    };
    const result = await query(arg.where);

    if (
      result.length === 0 &&
      arg.where?.lang &&
      arg.where?.lang !== g.cmshub.lang[0].value
    ) {
      return await run({
        ...arg.where,
        lang: g.cmshub.lang[0].value,
      });
    }
    if (
      result.length === 0 &&
      arg.where?.content?.lang &&
      arg.where?.content?.lang !== g.cmshub.lang[0].value
    ) {
      return await run({
        ...arg.where,
        content: {
          ...arg.where.content,
          lang: g.cmshub.lang[0].value,
        },
      });
    }
    return result;
  },
};

const loadHeader = async (path: string) => {
  if (cache.structure[path]) return;

  const root = await db.structure.findFirst({
    where: { path },
    select: { id: true },
  });
  if (root) {
    const headers = await structure.headers(root.id);
    if (Array.isArray(headers)) {
      const header = headers?.find((e) => e.path === path);
      if (header) {
        cache.structure[path] = header;
        cache.structure[path].childs = {};
      }

      if (cache.structure[path]) {
        const cached_header = cache.structure[path];
        for (const s of headers) {
          if (s.path && cached_header.childs) {
            cached_header.childs[s.path] = s;
          }
        }
      }
    } else {
      console.log("no-headers", headers);
    }
  }
};
