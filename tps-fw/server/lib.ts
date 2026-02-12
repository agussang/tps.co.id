import { content, file, structure } from "../typings/prisma";
import { config } from "./config";
import { IMeta, PrasiArg } from "./type";
export type Lang = "en" | "id-id";

export const pickLang = (pathname: string) => {
  if (pathname.startsWith("/en")) return "en";
  return "id-id";
};

export const routeMatch = (lang: Lang, url: { raw: URL; pathname: string }) => {
  if (url.pathname.startsWith(`/${lang}`)) {
    return config.router.lookup(url.pathname.substring(`/${lang}`.length));
  }

  return config.router.lookup(url.pathname);
};

export const printContent = (
  arg: PrasiArg,
  index: Parameters<PrasiServer["http"]>[0]["index"],
  content: any,
  meta: Partial<IMeta>[],
  title?: any
) => {
  const { url } = arg;

  index.body.push(`\
<script id="content_script">
  window.___content = ${JSON.stringify(content.body)}
  window.___header = ${JSON.stringify(content.header)}
  window.___footer = ${JSON.stringify(content.footer)}
/****/</script>`);

  index.head.push(
    `<link rel="shortcut icon" href=${"https://tps.co.id/_file/pelindo-ico.ico"}>`
  );
  if (title) index.head.push(title);
  meta.map((item, i) => {
    return index.head.push(
      `<meta ${Object.entries(item)
        .map(([k, v]) => {
          return `${k}="${v}"`;
        })
        .join(" ")} />`
    );
  });
};

export const findContent = async (id_structure: string | null) => {
  let content = null as Partial<content>[] | null;

  const columns = await db.structure.findMany({
    where: {
      parent: id_structure,
    },
  });

  if (columns) {
    content = await db.content.findMany({
      select: {
        text: true,
        id: true,
        structure: {
          select: {
            path: true,
            type: true,
          },
        },
        file: {
          select: {
            name: true,
            path: true,
            type: true,
            size: true,
          },
        },
      },
      where: {
        id_structure: {
          in: columns.map((col) => col.id),
        },
      },
    });
  }

  return content;
};

export const getColumnName = (path: string) => {
  let col_arr = path.split(".");
  let result = "" as string;

  if (col_arr) {
    result = col_arr.pop() as string;
  }

  return result;
};

export const getBase64Image = async (url: string) => {
  if (!url) {
    return null;
  }

  const imgUrl = await fetch(url, {
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  });

  const buffer = await imgUrl.arrayBuffer();
  const stringifiedBuffer = Buffer.from(buffer).toString("base64");
  const contentType = imgUrl.headers.get("content-type");

  return `data:${contentType};base64,${stringifiedBuffer}`;
};

export const convertDate = (date: Date, type?: "long" | "short") => {
  const current_date = date;
  const day = current_date.getDate().toString().padStart(2, "0");
  const month = current_date.toLocaleString("default", {
    month: type ? type : "long",
  });
  return `${day} ${month} ${current_date.getFullYear()}`;
};
