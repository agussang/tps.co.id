import { pathQuery } from "app/admin/query/path-query";
import { PrasiArg } from "server/type";

export const headerMenu = async (lang: string, path: string) => {
  let result = await pathQuery({
    path,
    lang,
    status: "published",
    sort: { order: "asc" },
  });

  if (result && result.length > 0) {
    if (lang === "en") {
      result = result.map((menu: any, i) => {
        if (i === 0) {
          //re-order menu about us
          let items = [] as any;

          menu.items.forEach((element: any, i: number) => {
            if (menu.items[1]) items[0] = menu.items[1];
            if (menu.items[2]) items[1] = menu.items[2];
            if (menu.items[0]) items[2] = menu.items[0];
            if (menu.items[3]) items[3] = menu.items[3];
          });

          return { ...menu, items };
        }

        return menu;
      });
    }
  }
  return result;
};
