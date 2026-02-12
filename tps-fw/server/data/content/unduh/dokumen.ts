import { pathQuery, pathQueryPaging } from "app/admin/query/path-query";
import { queryContent } from "server/query/query-content";
import { IDocument, PrasiArg } from "server/type";

export const contentUnduhDokumen = async (
  skip: number,
  take: number,
  lang: string,
  path: string,
  params: any,
  arg: PrasiArg
) => {
  const where = {} as any;
  if (Array.isArray(params)) {
    params.forEach((condition) => {
      where[`${condition.path.split(".").slice(1).join(".")}`] =
        condition.where.text;
    });
  }

  let result = await pathQueryPaging({
    path,
    lang,
    status: "published",
    sort: { publish_date: "desc" },
    paging: {
      skip,
      take,
    },
    where: Array.isArray(params) ? where : undefined,
  });

  return {
    list: result.paged,
    count: result.unpaged.length,
  };
};
