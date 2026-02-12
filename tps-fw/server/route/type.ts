import { PrasiArg } from "server/type";

export type RouteParam = {
  param: Record<string, string>;
  lang: string;
  id_structure: string;
  arg: PrasiArg;
};

export type Template = (arg: RouteParam) => Promise<any>;
