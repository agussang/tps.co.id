import { contentDetailNews } from "server/data/content/news/detailnews";
import { convertDate } from "server/lib";
import { PrasiArg } from "server/type";

export const templateDetailArticle = async function (
  this: any,
  slug: string,
  lang: string
) {
  const news = await contentDetailNews(slug, lang, this);

  const detail = {
    ...news,
    publish_date: convertDate(new Date(news.publish_date)),
  };

  return {
    detail,
  };
};
