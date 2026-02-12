import { contentKontakKami } from "server/data/content/kontakkami";
import { contentNomorPenting } from "server/data/content/nomorpenting";
import { PrasiArg } from "server/type";

export const templateContact = async function (
  this: any,
  lang: string
) {
  return {
    kontak_kami: await contentKontakKami(lang, "kontak_kami", this),
    nomor_penting: await contentNomorPenting(lang, "nomor_penting", this),
  };
};
