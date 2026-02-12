import { contentUnduhDokumen } from "server/data/content/unduh/dokumen";
import { convertDate } from "server/lib";
import { queryContent } from "server/query/query-content";
import {
  ICategory,
  IParamsQuery,
  IParamsQueryChild,
  PrasiArg,
} from "server/type";

export const templateLegal = async function (
  this: any,
  slug: string,
  skip: number,
  take: number,
  lang: string,
  params: { category?: string; year?: string }
) {
  const category: Record<string, ICategory> = {};
  const year: Record<string, ICategory> = {};

  let content = [] as Array<{
    category: string;
    publish_date: string;
  }>;

  let path = null as null | string;
  let tag = null as null | string;
  path = "unduh_dokumen";

  tag = slug;

  let params_condition = [] as Array<IParamsQueryChild>;

  // if (tag === "tarif") {
  params_condition = [
    ...params_condition,
    {
      path: "unduh_dokumen.tag",
      where: {
        text: tag,
      },
    },
  ];
  // }

  const cats = (await queryContent.groupBy({
    path: [path],
    where: {
      content: { lang },
    },
    columns: ["category"],
    params: [
      {
        field: "tag",
        value: tag,
        where: {
          text: tag,
        },
      },
    ],
    arg: this,
  })) as Array<{ text: string }>;

  let unduh_params_condition = [] as Array<IParamsQueryChild>;

  if (params) {
    for (let p of Object.keys(params)) {
      if (!["slug", "lang", "page"].includes(p)) {
        if (p === "year") {
          if ((params as any)[p] !== "all") {
            unduh_params_condition = [
              ...unduh_params_condition,
              {
                path: "unduh_dokumen.publish_date",
                where: {
                  text: {
                    contains: (params as any)[p],
                  },
                },
              },
            ];
          }
        } else {
          if (p === "category") {
            let value = (params as any)[p].replaceAll("-", " ");
            if ((params as any)[p] !== "all") {
              unduh_params_condition = [
                ...unduh_params_condition,
                {
                  path: `unduh_dokumen.${p}`,
                  where: {
                    text: value,
                  },
                },
              ];
            }
          } else {
            unduh_params_condition = [
              ...unduh_params_condition,
              {
                path: `unduh_dokumen.${p}`,
                where: {
                  text: (params as any)[p],
                },
              },
            ];
          }
        }
      }
    }
  }

  unduh_params_condition = [...unduh_params_condition, ...params_condition];
  const { list, count } = await contentUnduhDokumen(
    skip,
    take,
    lang,
    path,
    unduh_params_condition,
    this
  );

  content = list.map((item: any) => {
    return { ...item, publish_date: convertDate(new Date(item.publish_date)) };
  });

  category["all"] = { label: "ALL", value: "all" };
  if (cats) {
    cats?.forEach((item) => {
      if (item.text) {
        if (!category[item.text]) {
          category[item.text] = {
            label: item.text.toUpperCase(),
            value: item.text.replaceAll(" ", "-"),
          };
          return;
        }
      }
    });
  }
  const current_date = new Date();

  year["all"] = { label: "ALL YEAR", value: "all" };
  for (let y = 0; y <= 10; y++) {
    year[current_date.getFullYear() - y] = {
      label: (current_date.getFullYear() - y).toString(),
      value: current_date.getFullYear() - y,
    };
  }

  return {
    category: Object.values(category),
    list: content,
    year: Object.values(year).sort((a, b) => (a.value < b.value ? 1 : -1)),
    count,
    take,
  };
};
