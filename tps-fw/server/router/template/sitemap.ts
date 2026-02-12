import { headerMenu } from "server/data/headermenu";
import { PrasiArg } from "server/type";

export const templateSitemap = async function (
  this: any,
  lang: string
) {
  return {
    sitemap: await headerMenu(lang, "menu", this),
  };
};
