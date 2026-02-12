import { contentKebijakan } from "server/data/content/maklumat/kebijakan";
import { contentSasaran } from "server/data/content/maklumat/sasaran";
import { contentTataKelola } from "server/data/content/tatakelola";
import { ICategory, IKebijakan, PrasiArg } from "server/type";

export const templateMaklumatCategory = async function (
  this: any,
  lang: string,
  slug: string
) {
  const category: Record<string, ICategory> = {};
  let layanan = [] as any;
  if (["policy", "kebijakan"].includes(slug)) {
    layanan = await contentKebijakan(lang, "kebijakan", this);
  } else if (["sasaran", "target"].includes(slug)) {
    layanan = await contentSasaran(lang, "sasaran", this);
  } else {
    layanan = await contentTataKelola(lang, "tata_kelola", this);
  }

  layanan.forEach((item: any) => {
    if (!category[item.category]) {
      category[item.category] = {
        label: item.category.toUpperCase(),
        value: item.category,
      };
      return;
    }
  });

  return {
    category: Object.values(category),
    layanan,
  };
};
