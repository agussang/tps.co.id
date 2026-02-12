import { pathQuery, pathQueryPaging } from "app/admin/query/path-query";
import { queryContent } from "server/query/query-content";
import { IBerita, PrasiArg } from "server/type";

export const contentNews = async (
  skip: number,
  take: number,
  lang: string,
  path: string,
  arg: PrasiArg
) => {
  let news: any[] = [];

  let result = await pathQueryPaging({
    path,
    lang,
    status: "published",
    sort: { publish_date: "desc" },
    paging: { skip, take },
  });

  news = result.paged.map((e: any) => {
    // remove tag html of img
    let content = e.content.replace(/<img[^>]*>/g, "");

    let image = e.image;
    if (!e.image) {
      image = `no-image-placeholder.png`;
    }

    return { ...e, content, image };
  });

  return {
    news,
    count: result.unpaged.length,
  };
};
