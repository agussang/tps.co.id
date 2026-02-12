import { Subprocess } from "bun";

type RouteItem<DATA> = {
  [K in string]: { _data: DATA[]; _sub: RouteItem<DATA> };
};
export const g = global as unknown as {
  siteurl: (path: string) => string;
  cmshub: {
    baseurl: string;
    lang: { url: string; value: string; label: string }[];
    route: {
      status: "init" | "ready";
    };
    studio: null | Subprocess;
    studio_out: string
  };
};
