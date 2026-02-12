import { pathQuery } from "app/admin/query/path-query";
import { PrasiArg } from "server/type";

export const contentCSR = async (
  lang: string,
  slug: string,
  path: string,
  arg: PrasiArg
) => {
  let result = await pathQuery({ path, lang, status: "published" }) as any;

  result = result.find((item: any, i: number) => item);

  return result;
};
