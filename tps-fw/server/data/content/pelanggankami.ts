import { pathQuery } from "app/admin/query/path-query";
import { queryContent } from "server/query/query-content";
import { PrasiArg } from "server/type";

export const contentPelangganKami = async (
  lang: string,
  path: string,
  arg: PrasiArg
) => {
  let result = await pathQuery({
    path,
    lang,
    status: "published",
    sort: { order: "desc" },
  });

  result.sort((a: any, b: any) => a.order - b.order);

  return result;
};
