import { pathQuery } from "app/admin/query/path-query";
import { queryContent } from "server/query/query-content";
import { IVisi, PrasiArg } from "server/type";

export const contentVisi = async (
  lang: string,
  path: string,
  arg: PrasiArg
) => {
  let result = await pathQuery({ path, lang, status: "published" });

  return result.find((item: any, i: number) => item);
};
