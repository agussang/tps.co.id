import { pathQuery } from "app/admin/query/path-query";
import { queryContent } from "server/query/query-content";
import { PrasiArg } from "server/type";

export const contentBannerHome = async function (
  lang: string,
  path: string,
) {
  return pathQuery({ path, lang, status: "published" });
};
