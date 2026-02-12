import { pathQuery } from "app/admin/query/path-query";
import { queryContent } from "server/query/query-content";
import { IBerita, PrasiArg } from "server/type";

export const contentDetailNews = async (
  slug: string,
  lang: string,
  arg: PrasiArg
) => {
  let news = {} as IBerita;

  let type = "press_release" as string;

  let result = (await pathQuery({
    path: "press_release",
    lang,
    status: "published",
    where: { slug: slug },
  })) as any;

  if (Array.isArray(result) && result.length === 0) {
    type = "latest_news";
    result = await pathQuery({
      path: "latest_news",
      lang,
      status: "published",
      where: { slug: slug },
    });
  }

  result = result.find((item: any, i: number) => item);

  // update count
  await queryContent.updateViews<{}>({
    path: type,
    columns: `${type}.views`,
    id_parent: result?.id,
    count: result.views,
  });

  if (result) {
    let content = result.content.replace(/<img[^>]*>/g, "");
    let image = result.image;
    if (!result.image) {
      image = `no-image-placeholder.png`;
    }

    news = { ...result, content, image };
  }

  return news;
};
