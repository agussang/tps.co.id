import { Lang, printContent } from "server/lib";
import { IMeta, PrasiArg } from "server/type";
import { layout } from "server/data/layout";
import { templateContact } from "./template/contact";
import { templateFasilitas } from "./template/fasilitas";
import { templateUnduh } from "./template/unduh";
import { templateCSR } from "./template/csr";
import { templateDetailArticle } from "./template/detailnews";
import { templateLayanan } from "./template/layanan";
import { templateMaklumat } from "./template/maklumat";
import { templateThroughput } from "./template/throughput";
import { templateJadwalOnline } from "./template/jadwalonline";
import { templateManagement } from "./template/management";
import { templateMaklumatCategory } from "./template/maklumatcategory";
import { home } from "server/data/home";
import { templateProfile } from "./template/profile";
import { templateNews } from "./template/news";
import { templateSitemap } from "./template/sitemap";
import { templateSearch } from "./template/search";

export const routeContent = async (
  arg: PrasiArg,
  lang: Lang,
  route: {
    params: any;
    seo: any;
    meta: any;
  },
  template:
    | "test"
    | "kontak_kami"
    | "list_unduh"
    | "detail_unduh"
    | "list_article"
    | "detail_article"
    | "fasilitas"
    | "layanan"
    | "throughput"
    | "maklumat"
    | "maklumat-category"
    | "jadwal-online"
    | "management"
    | "profil"
    | "sitemap"
    | "search"
    | "csr" // ambil dari table route field meta.template,
) => {
  const { index, url } = arg;

  index.head = [];
  index.body = [];

  const originURL = new URL(url.raw);
  const params = originURL.searchParams;

  let skip = undefined as undefined | number;
  let take = 10 as number;

  let meta = [] as Partial<IMeta>[];
  let structure = null as null | Array<string>; // ambil dari table route field meta.structure, nilai array karena 1 halaman bisa terdiri dari beberapa structure
  let queryContent = null as any; // ambil dari table route field meta.query, format prisma query (where, order, limit etc)
  let slug = null as any;
  let language = lang as string;

  if (lang === "id-id") {
    language = "id";
  }

  const seo = {
    title: "Terminal Petikemas Surabaya",
    description:
      "Terminal pertama di Indonesia yang menerapkan standar keamanan kapal dan fasilitas pelabuhan (ISPS Code) yang mulai diterapkan sejak bulan Juli 2004.",
    keywords: "tps, terminal petikemas surabaya",
  }; // ambil dari table route field seo

  let header_content = {
    title: "" as string | null | Array<string>,
    banner: "/_file/layout/header/header-default-bg.png",
    tagline: "World class performance",
    heading: "Terminal operator",
    sub_heading: "Terminal Petikemas Surabaya",
  }; // ambil dari table route field meta

  let footer_content = {
    banner: "/_file/layout/footer/footer-content.jpeg",
  }; // ambil dari table route field meta

  let body = null;

  if (template === "test") {
    body = await home(lang);
    header_content = { ...header_content, title: "Kontak" };
    body = { ...body, header_content, footer_content };
  }

  if (template === "search") {
    const query = params.get("query");
    if (query) {
      body = await templateSearch(language, query);
    } else {
      body = {
        result: [],
      };
    }

    header_content = { ...header_content, title: "Search" };
    body = { ...body, header_content, footer_content };
  }

  if (template === "profil") {
    body = await templateProfile(language);
    if (route.meta.footer_content) {
      footer_content = {
        ...footer_content,
        banner: route.meta.footer_content.banner,
      };
    }
    body = { ...body, footer_content };
  }

  if (template === "list_article") {
    const page = params.get("page");
    if (page) {
      skip = (parseInt(page) - 1) * take;
    } else {
      skip = 0;
    }
    slug = route.params.slug;
    body = await templateNews(slug, skip, take, language);
    header_content = { ...header_content, title: "Berita" };
    body = { ...body, header_content };
  }

  if (template === "kontak_kami") {
    body = await templateContact(language);
    header_content = { ...header_content, title: "Kontak" };
    body = { ...body, header_content, footer_content };
  }

  if (template === "fasilitas") {
    body = await templateFasilitas(language);
    header_content = { ...header_content, title: "Fasilitas" };
    body = { ...body, header_content, footer_content };
  }

  if (template === "list_unduh") {
    const segment = url.pathname.split("/").pop();

    const page = params.get("page");
    const category = params.get("category");
    const year = params.get("year");

    if (page) {
      skip = (parseInt(page) - 1) * take;
    } else {
      skip = 0;
    }

    let queryParams = {};
    if (category && category !== "all") {
      queryParams = { ...queryParams, category: category.replaceAll("-", " ") };
    }

    if (year && year !== "all") {
      queryParams = { ...queryParams, year };
    }

    slug = segment?.replaceAll("-", "_");
    body = await templateUnduh(slug, skip, take, language, queryParams);

    header_content = {
      ...header_content,
      title: segment ? segment.replaceAll("-", " ") : "",
    };
    body = { ...body, header_content, footer_content };
  }

  if (template === "csr") {
    const segment = url.pathname.split("/").pop();

    if (segment) slug = segment;
    body = await templateCSR(language, slug);
    header_content = { ...header_content, title: "CSR" };
    body = { ...body, header_content, footer_content };
  }

  if (template === "sitemap") {
    body = await templateSitemap(language);
    header_content = { ...header_content, title: "Sitemap" };
    body = { ...body, header_content, footer_content };
  }

  if (template === "detail_article") {
    slug = route.params.slug;
    body = await templateDetailArticle(slug, language);
    header_content = { ...header_content, title: "Berita" };
    body = { ...body, header_content, footer_content };
  }

  if (template === "layanan") {
    slug = route.params.slug;
    body = await templateLayanan(language, slug);
    header_content = { ...header_content, title: "Layanan" };
    body = { ...body, header_content, footer_content };
  }

  if (template === "maklumat") {
    body = await templateMaklumat(language);
    header_content = { ...header_content, title: "Maklumat Pelayanan" };
    body = { ...body, header_content, footer_content };
  }

  if (template === "maklumat-category") {
    if (route.params && route.params.slug) {
      slug = route.params.slug;
    }

    body = await templateMaklumatCategory(language, slug);
    header_content = { ...header_content, title: slug };
    body = { ...body, header_content, footer_content };
  }

  if (template === "throughput") {
    body = await templateThroughput(language);
    header_content = { ...header_content, title: "Throughput" };
    body = { ...body, header_content, footer_content };
  }

  if (template === "jadwal-online") {
    body = await templateJadwalOnline();
    header_content = { ...header_content, title: "Jadwal Online" };
    body = { ...body, header_content, footer_content };
  }

  if (template === "management") {
    body = await templateManagement(language);
    header_content = { ...header_content, title: "Management" };
    body = { ...body, header_content, footer_content };
  }

  const { header, footer } = await layout(language, arg);
  const content = { body, header, footer };

  index.head.push(
    `<title>${seo.title !== "" ? `${seo.title} | ` : ""} Terminal Petikemas Surabaya</title>`
  );

  meta = [
    { name: "keywords", content: seo.keywords },
    { name: "description", content: `${seo.description}` },
    { name: "og:url", content: `https://tps.co.id${arg.url.pathname}` },
    { name: "og:title", content: `${seo.title}` },
    { name: "og:description", content: `${seo.description}` },
    {
      name: "og:image",
      content: siteurl("/_file/media/project/corporate/news/pelindo--hut.jpeg"),
    },
    { name: "og:image:width", content: "124" },
    { name: "og:image:height", content: "75" },
  ];

  printContent(arg, index, content, meta);

  return new Response(index.render(), {
    headers: { "content-type": "text/html" },
  });
};
