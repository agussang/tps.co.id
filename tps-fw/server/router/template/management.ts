import { contentDireksi } from "server/data/content/management/direksi";
import { contentKomisaris } from "server/data/content/management/komisaris";
import { PrasiArg } from "server/type";

export const templateManagement = async function (
  this: any,
  lang: string
) {
  return {
    komisaris: await contentKomisaris(lang, "komisaris", this),
    direksi: await contentDireksi(lang, "direksi", this),
  };
};
