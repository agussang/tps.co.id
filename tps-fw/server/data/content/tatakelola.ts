import { pathQuery } from "app/admin/query/path-query";
import { queryContent } from "server/query/query-content";
import { IKebijakan, PrasiArg } from "server/type";

export const contentTataKelola = async (
  lang: string,
  path: string,
  arg: PrasiArg
) => {
  let result = await pathQuery(
    {
      path,
      lang,
      status: "published",
      sort: { title: "desc" },
    },
    { single_child_as: "array" }
  );

  return result;
};
