import { contentFasilitas } from "server/data/content/fasilitas";
import { ICategoryFasilitas, PrasiArg } from "server/type";

export const templateFasilitas = async function (
  this: any,
  lang: string
) {
  const content = await contentFasilitas(lang, "fasilitas", this);
  const category: Record<string, ICategoryFasilitas> = {};

  content
    .sort((a, b) =>
      new Date(a.publish_date) < new Date(b.publish_date) ? 1 : -1
    )
    .forEach((item, i) => {
      if (!category[item.slug]) {
        category[item.slug] = {
          label: item.slug.toUpperCase(),
          icon: item.icon,
          value: item.slug,
        };
        return;
      }
    });

  return {
    category: Object.values(category),
    list: content,
  };
};
