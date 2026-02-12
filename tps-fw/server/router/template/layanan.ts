import { contentLayanan } from "server/data/content/layanan";
import { PrasiArg } from "server/type";

export const templateLayanan = async function (
  this: any,
  lang: string,
  slug: any
) {
  const path = "layanan";

  return {
    layanan: await contentLayanan(lang, slug, path, this),
  };
};
