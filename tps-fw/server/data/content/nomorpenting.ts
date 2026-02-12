import { pathQuery } from "app/admin/query/path-query";
import { queryContent } from "server/query/query-content";
import { INomorPenting, PrasiArg } from "server/type";

export const contentNomorPenting = async (
  lang: string,
  path: string,
  arg: PrasiArg
) => {

  let result = (await pathQuery({
    path,
    lang,
    status: "published",
    sort: { order: "desc" },
  })) as any;


  const content = result.map((item: any, i: number) => {
    const contact = item.contact.sort((a: any, b: any) => a.order - b.order)
    return {...item, contact}
  });

  return content;
};
