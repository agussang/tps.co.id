import { pathQuery } from "app/admin/query/path-query";
import { PrasiArg } from "server/type";

export const contentFasilitas = async (
  lang: string,
  path: string,
  arg: PrasiArg
) => {
  let result = await pathQuery({
    path,
    lang,
    status: "published",
    sort: { publish_date: "asc" },
  });

  return result;
};
