import { pathQuery } from "app/admin/query/path-query";

export const contentPopup = async function (lang: string, path: string) {
  return pathQuery({ path, lang, status: "published" });
};
