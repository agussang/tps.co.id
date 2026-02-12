import { pathQuery } from "app/admin/query/path-query";
import { PrasiArg } from "server/type";

export const contentLabel = async (lang: string, arg: PrasiArg) => {
  let path = "label";

  const label = pathQuery({lang, path, status: "published"});


  return label;
};
