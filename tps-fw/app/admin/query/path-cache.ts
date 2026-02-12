import BunORM from "./sqlite";
import trim from "lodash.trim";
import hsum from "hash-sum";
import { pathQuery } from "./path-query";

const cdb = new BunORM(`../data/tps-cache.db`, {
  tables: {
    cache: {
      columns: {
        path: { type: "TEXT" },
        hash: { type: "TEXT" },
        arg: { type: "TEXT" }, // js, css, html, prop, comp
        data: { type: "TEXT" },
      },
    },
  },
});

export type PQArg = {
  path: string;
  lang?: string;
  status?: "published" | "draft";
  sort?: Record<string, "asc" | "desc">;
  where?: Record<string, string | { contains: string }>;
};

export type PQArgPaging = PQArg & {
  paging: { skip: number; take: number };
};

export const pathCache = {
  get(arg: PQArg) {
    const path = trim(arg.path.trim(), ".");
    const hash = hsum(arg);
    const result = cdb.tables.cache.find({ where: { path, hash } });
    if (result.length > 0) {
      return JSON.parse(result[0].data) as any;
    }
    return null;
  },
  set(arg: PQArg, data: any) {
    const path = trim(arg.path.trim(), ".");
    const hash = hsum(arg);
    const result = cdb.tables.cache.find({ where: { path, hash } });
    if (result.length > 0) {
      cdb.tables.cache.save({
        id: result[0].id,
        arg: JSON.stringify(arg),
        data: JSON.stringify(data),
        path,
        hash,
      });
    } else {
      cdb.tables.cache.save({
        arg: JSON.stringify(arg),
        data: JSON.stringify(data),
        path,
        hash,
      });
    }
  },
  async reload(path: string) {
    const result = cdb.tables.cache.find({ where: { path } });
    for (const [k, v] of Object.entries(result)) {
      await pathQuery(JSON.parse(v.arg), { use_cache: false });
    }
  },
  status() {
    return cdb.tables.cache.count({});
  },
  async clear(path: string) {
    if (!path) {
      cdb.tables.cache.delete({});
    } else {
      cdb.tables.cache.delete({ where: { path } });
    }
  },
};
