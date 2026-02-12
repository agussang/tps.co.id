import { IMenu } from "app/admin/comps/typing";
import { pathQuery } from "app/admin/query/path-query";
import { queryContent } from "server/query/query-content";
import { PrasiArg } from "server/type";

export const headerShortCut = async (lang: string, path: string) => {
  const result = await pathQuery({
    path,
    lang,
    status: "published",
    sort: { order: "asc" },
  });

  return {
    menu: result,
  };
};
