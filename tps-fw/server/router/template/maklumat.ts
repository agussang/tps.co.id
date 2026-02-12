import { contentMaklumat } from "server/data/content/maklumat/content";
import { PrasiArg } from "server/type";

export const templateMaklumat = async function (
  this: any,
  lang: string
) {
  return {
    maklumat: await contentMaklumat(lang, "maklumat", this),
  };
};
