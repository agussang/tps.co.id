import { g } from "server/global";
import { PrasiArg } from "server/type";
import { router } from "./router";

type MatchResult = {
  matches: { id_structure: string; id_page: string; name: string }[];
  param: Record<string, string>;
  lang: string;
};

export const route = {
  get status() {
    if (typeof g === "object") return g.cmshub.route.status;
    return "init";
  },
  async render(found: MatchResult, arg: PrasiArg) {},
  match(
    pathname: string,
    arg: PrasiArg
  ): {
    params: Record<string, string>;
    matches: {
      path: string;
      id_page: string;
      id_struct?: string | string[];
      template: any;
    }[];
  } {
    const parts = pathname
      .toLowerCase()
      .split("/")
      .filter((e) => e);
    const url = arg.url.raw;
    const searchParams = {} as any;
    for (const [k, v] of Object.entries(
      JSON.parse(JSON.stringify(url.searchParams))
    ) as any) {
      searchParams[k] = v;
    }

    let lang = g.cmshub?.lang[0]?.value;

    let matches = [] as any;
    const try_match = (cur: any, parts: string[], parent_params?: any): any => {
      for (const pattern of Object.keys(cur)) {
        const route = (cur as any)[pattern];

        if (typeof route.route === "function") {
          const pats = pattern.split("/");
          const first_parts = parts.slice(0, pats.length);
          const last_parts = parts.slice(pats.length);
          const match_params = match_pattern(pattern, first_parts);

          if (match_params) {
            const final_params = { ...parent_params, ...(match_params || {}) };
            const routes = route.route(final_params);
            const result = try_match(routes, [...last_parts], final_params);

            if (result) {
              return result;
            }
            continue;
          }
        }

        const params = match_pattern(pattern, parts);
        if (params) {
          matches.push(route);
          return {
            ...parent_params,
            ...params,
          };
        }
      }
      return {} as any;
    };
    const res_params = try_match(router(), parts) || {};
    if (!res_params.lang && lang) res_params.lang = lang;

    return { matches, params: { ...res_params, ...searchParams } };
  },
  async init(arg: PrasiArg) {
    const config = await db.config.findFirst({});
    if (config) {
      g.cmshub.lang = config.lang as any;
    }
    g.cmshub.route.status = "ready";
  },
};

const match_pattern = (pattern: string, parts: string[]) => {
  const pat_parts = pattern.split("/").filter((e) => e);
  const params = {} as any;

  if (pat_parts.join("/") === parts.join()) return params;

  if (parts.length === pat_parts.length) {
    let idx = 0;
    for (const c of pat_parts) {
      const d = parts[idx];
      if (c.startsWith(":")) {
        let name = c;
        name = name.substring(1);
        if (name === "lang") {
          if (g.cmshub.lang.find((e) => e.url === d)) {
            params[name] = d;
          } else {
            return false;
          }
        } else {
          params[name] = d;
        }
      } else if (d !== c) {
        return false;
      }
      idx++;
    }
    return params;
  }
  return false;
};
