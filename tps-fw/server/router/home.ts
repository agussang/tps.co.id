import { home } from "server/data/home";
import { layout } from "server/data/layout";
import { Lang, printContent } from "server/lib";
import { log } from "server/log";
import { IMeta, PrasiArg } from "server/type";

export const routeHome = async (arg: PrasiArg, lang: Lang) => {
  const { index, url } = arg;

  let language = lang as string;

  if (lang === "id-id") {
    language = "id";
  }

  index.head = [];
  index.body = [];
  index.head.push(`<title>Terminal Peti Kemas Surabaya</title>`);

  log.now("home start");
  const body = await home(language);
  log.now("home end");

  const { header, footer } = await layout(language, arg);
  log.now("layout end");

  const content = { body, header, footer };

  const meta: Partial<IMeta>[] = [
    { name: "keywords", content: "" },
    { name: "description", content: "" },
    { name: "og:url", content: `https://tps.co.id/${lang}` },
    { name: "og:title", content: "Home - Terminal Peti Kemas Surabaya" },
    { name: "og:description", content: "Home - Terminal Peti Kemas Surabaya" },
    {
      name: "og:image",
      content: header.logo ? siteurl(`/_img/${header.logo}`) : "",
    },
    { name: "og:image:width", content: "124" },
    { name: "og:image:height", content: "75" },
  ];

  printContent(arg, index, content, meta);
  log.now("content end");

  return new Response(index.render(), {
    headers: { "content-type": "text/html" },
  });
};
