import { pathQuery } from "app/admin/query/path-query";
import { queryContent } from "server/query/query-content";
import { IPerjalananKami, PrasiArg } from "server/type";

export const contentPerjalananKami = async (
  lang: string,
  path: string,
  arg: PrasiArg
) => {
  let result = await pathQuery({ path, lang, status: "published" });

  return result;
};
