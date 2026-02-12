import { Lang, printContent } from "server/lib";
import { IMeta, PrasiArg } from "server/type";

export const routeDetailUnduhDokumen = async (
  arg: PrasiArg,
  lang: Lang
) => {
  const { index } = arg;

  let meta = [] as Partial<IMeta>[];

  index.head.push(`<title>Penyesuaian Tarif Pelayanan Jasa Petikemas Domestik dan Internasional di TPS | Terminal Petikemas Surabaya</title>`); // dynamic title from db

  meta = [
    { name: "keywords", content: "" },
    {
      name: "description",
      content: "",
    },
    {
      name: "og:url",
      content: "https://www.tps.co.id/unduh-dokumen/listing/2024/01/26/10/52/penyesuaian-tarif-pelayanan-jasa-petikemas-domestik-dan-internasional-di-tps", // dynamic link from db
    },
    { name: "og:title", content: "Penyesuaian Tarif Pelayanan Jasa Petikemas Domestik dan Internasional di TPS" }, // dynamic title from db
    {
      name: "og:description",
      content: "",
    },
    {
      name: "og:image",
      content:
        "https://tps.co.id:443/-/media/project/corporate/news/pelindo--hut.jpg",
    },
    { name: "og:image:width", content: "124" },
    { name: "og:image:height", content: "75" },
  ];
  printContent(index, meta);

  return new Response(index.render(), {
    headers: { "content-type": "text/html" },
  });
};
