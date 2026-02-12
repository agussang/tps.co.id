import { pathQuery } from "app/admin/query/path-query";

export const contentServices = async function (lang: string, path: string) {
  return pathQuery({
    path,
    lang,
    status: "published",
    sort: { order: "desc" },
  });
};
