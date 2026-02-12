import { pathQuery } from "app/admin/query/path-query";
import { queryContent } from "server/query/query-content";
import { IKontakKami, PrasiArg } from "server/type";

export const contentKontakKami = async (
  lang: string,
  path: string,
  arg: PrasiArg
) => {

  let result = (pathQuery({
    path,
    lang,
    status: "published",
    sort: { order: "desc" },
  })) as any;


  const content = result;
  return content;
};
