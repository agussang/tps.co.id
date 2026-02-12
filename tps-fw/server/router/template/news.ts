import { contentNews } from "server/data/content/news/news";
import { convertDate } from "server/lib";
import { IBerita, PrasiArg } from "server/type";

export const templateNews = async function (
  this: any,
  slug: string,
  skip: number,
  take: number,
  lang: string
) {
  let data = [] as Array<IBerita>;
  let dataCount = 0 as number;

  let path = null as null | string;

  path = slug.replaceAll("-", "_");
  const { news, count } = await contentNews(skip, take, lang, path, this);
  if (news && news.length > 0) {
    data = news;
    dataCount = count;
  }
  if (data.length === 0) return null;

  return {
    news:
      data.length > 0 &&
      data.map((item, i: number) => {
        return {
          ...item,
          publish_date: convertDate(new Date(item.publish_date)),
        };
      }),
    slug: slug,
    count: dataCount,
    take,
  };
};
