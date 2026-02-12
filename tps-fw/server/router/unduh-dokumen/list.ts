import { Lang, printContent } from "server/lib";
import { IMeta, PrasiArg } from "server/type";

export const routeListUnduhDokumen = async (
  arg: PrasiArg,
  lang: Lang
) => {
  const { index } = arg;

  let meta = [] as Partial<IMeta>[];

  index.head.push(`<title>Unduh Dokumen | Terminal Petikemas Surabaya</title>`);

  meta = [
    { name: "keywords", content: "" },
    {
      name: "description",
      content: "",
    },
    {
      name: "og:url",
      content: "https://www.tps.co.id/unduh-dokumen",
    },
    { name: "og:title", content: "Unduh Dokumen" },
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
