import { pathQuery } from "app/admin/query/path-query";
import { queryContent } from "server/query/query-content";
import { IMaklumat, PrasiArg } from "server/type";

export const contentMaklumat = async (
  lang: string,
  path: string,
  arg: PrasiArg
) => {

  let result = (await pathQuery({
    path,
    lang,
    status: "published",
    sort: { title: "desc" },
  })) as any;

  

  return result.find((item: any, i: number) => item);
};
