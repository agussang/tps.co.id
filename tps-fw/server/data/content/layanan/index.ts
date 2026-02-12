import { pathQuery } from "app/admin/query/path-query";
import { queryContent } from "server/query/query-content";
import { ILayanan, PrasiArg } from "server/type";

export const contentLayanan = async (
  lang: string,
  slug: string,
  path: string,
  arg: PrasiArg
) => {
  const result = await pathQuery({
    path,
    lang,
    status: "published",
    sort: { title: "desc" },
    where: { slug: slug },
  });

  return result.find((item, i) => item);
};
