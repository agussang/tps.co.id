import { pathQuery } from "app/admin/query/path-query";
import { queryContent } from "server/query/query-content";
import { IProgramCSR, PrasiArg } from "server/type";

export const contentProgramCSR = async (
  lang: string,
  path: string,
  arg: PrasiArg
) => {
  let result = (await pathQuery({
    path,
    lang,
    status: "published",
    sort: { order: "asc" },
  })) as any;

  return result;
};
