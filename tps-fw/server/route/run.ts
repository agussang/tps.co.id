import { IMeta, PrasiArg } from "server/type";
import { route } from "./route";
import { layout } from "server/data/layout";
import { printContent } from "server/lib";
import { modifyBody } from "./modif-body";
import { head } from "./head";
import { g } from "server/global";

export const runRoute = async (arg: PrasiArg) => {
  const path = arg.url.pathname;
  const index = arg.index;

  if (
    !g.cmshub.lang ||
    !!(g.cmshub.lang && !g.cmshub.lang) ||
    route.status === "init"
  ) {
    await route.init(arg);
  }

  if (!isValidPath(path)) return false;

  index.body = [];
  index.head = [];

  const found = route.match(arg.url.pathname, arg);

  if (found.params.lang === "id-id") {
    found.params.lang = "id";
  }

  for (const f of found.matches) {
    if (f && typeof f.template === "function") {
      let body = await f.template(found.params, arg);

      if (!body) {
        continue;
      }

      let attributes = {} as any;
      const { header, footer, label } = await layout(found.params.lang, arg);

      if (f.id_page) {
        arg.prasi.page_id = f.id_page;
      }

      if (label && label.length > 0) {
        for (let l of label) {
          attributes[l.name] = l.value;
        }
      }

      body = { ...body, attributes };

      const content = {
        body: await modifyBody(f.path, found, body),
        header,
        footer,
      };

      const headTag = await head(found, arg, content, found.params.lang);

      printContent(arg, arg.index, content, headTag.meta, headTag.title);
      return new Response(arg.index.render(), {
        headers: { "content-type": "text/html" },
      });
    }
  }

  return false;
};

const isValidPath = (path: string) => {
  if (
    path.endsWith(".js") ||
    path.endsWith(".js.map") ||
    path.endsWith(".css") ||
    path.endsWith(".css.map") ||
    path.startsWith("/backend/tpsadmin")
  )
    return false;

  // if (path.startsWith("/new")) {
  //   return true;
  // }
  return true;
};
