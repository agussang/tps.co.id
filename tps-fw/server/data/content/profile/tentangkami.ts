import { pathQuery } from "app/admin/query/path-query";

export const contentTentangKami = async function (lang: string, path: string) {
  return pathQuery({ path, lang, status: "published" });
};
