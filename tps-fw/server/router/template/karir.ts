import { contentKarir, contentLowongan } from "server/data/content/karir";

export const templateKarir = async function (
  this: any,
  lang: string
) {
  return {
    karir: (await contentKarir(lang, "karir"))[0],
    lowongan: await contentLowongan(lang, "lowongan"),
  };
};
