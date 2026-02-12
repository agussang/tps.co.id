import { pathQuery } from "app/admin/query/path-query";

export const contentKarir = async function (lang: string, path: string) {
  return pathQuery({ path, lang, status: "published" });
};

export const contentLowongan = async function (lang: string, path: string) {
  return pathQuery({
    path,
    lang,
    status: "published",
    sort: { order: "asc" }
  });
};
