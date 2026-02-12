import { PrasiArg } from "server/type";
import { contentFooter } from "./content/footer";
import { contentHeader } from "./content/header";
import { contentLabel } from "./content/label";

export const layout = async (lang: string, arg: PrasiArg) => {

  return {
    header: await contentHeader(lang, arg),
    footer: await contentFooter(lang, arg),
    label: await contentLabel(lang, arg),
  };
};
