import { contentMisi } from "server/data/content/profile/misi";
import { contentPerjalananKami } from "server/data/content/profile/perjalanankami";
import { contentTentangKami } from "server/data/content/profile/tentangkami";
import { contentVisi } from "server/data/content/profile/visi";
import { PrasiArg } from "server/type";

export const templateProfile = async function (
  this: any,
  lang: string
) {
  return {
    tentangkami: (await contentTentangKami(lang, "tentang_kami"))[0],
    visi: await contentVisi(lang, "visi", this),
    misi: await contentMisi(lang, "misi", this),
    perjalanankami: await contentPerjalananKami(lang, "perjalanan_kami", this),
  };
};
