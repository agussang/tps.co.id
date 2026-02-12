import { useLocal } from "@/utils/use-local";
import { ExternalLink } from "lucide-react";
import { preview } from "server/route/preview";
import { validate } from "uuid";
import { getPathname } from "../..";
import { adminLang } from "./lang";
import { query } from "./query/content";
import { structure } from "./query/structure";

export const adminPreview = {
  preview,
  Button: () => {
    const local = useLocal({ url: "" });
    const path = getPathname();
    const mode = path.startsWith("/backend/tpsadmin/content/list")
      ? "list"
      : "detail";

    if (!local.url) return null;

    return (
      <a
        className={cx(
          "c-border c-cursor-pointer c-px-2 c-flex c-items-center c-text-xs c-bg-slate-100",
          "c-transition-all hover:c-bg-blue-800 hover:c-text-white hover:c-border-blue-800",
          css`
            height: 29px;
            border-radius: 3px;
          `
        )}
        onClick={async () => {
          let id_structure = params.id;
          if (validate(id_structure)) {
            if (mode === "detail") {
              const content = await db.content.findFirst({
                where: { id: id_structure },
                select: { id_structure: true },
              });
              if (content) {
                id_structure = content.id_structure;
              }
            }

            const head = (await structure.headers(id_structure)).find(
              (e) => e.path.split(".").length === 1
            );
            if (head) {
              const found = (preview as any)[head.id];

              if (found) {
                if (!found[adminLang.current]) {
                  local.url = getUrl(found, mode);
                } else {
                  const cur = found[adminLang.current];
                  if (cur) {
                    local.url = getUrl(cur, mode);
                  }
                }
              }

              if (local.url.indexOf(":") >= 0) {
                const parts = local.url.split("/").filter((e) => e);

                const res = await query.content(params.id);

                if (!res) {
                  console.warn("Failed to generate preview url:", local.url);
                  local.url = "";
                  local.render();
                  return;
                }
                const nparts = [];
                for (const part of parts) {
                  if (part.startsWith(":")) {
                    const name = part.substring(1);
                    nparts.push(res[name] || "_");
                  } else {
                    nparts.push(part);
                  }
                }

                local.url = `/${nparts.join("/")}`;
                window.open(local.url, "_blank");
              }
            }
            local.render();
          }
        }}
      >
        Preview <ExternalLink width={12} className={"-c-mt-1 c-ml-1"} />
      </a>
    );
  },
};

const getUrl = (arg: any, mode: "list" | "detail") => {
  let url = "";

  if (arg.all) {
    url = arg.all;
  } else if (arg[mode]) {
    url = arg[mode];
  }
  if (url) {
    let base = "";
    if (location.pathname.startsWith("/prod")) {
      base = location.pathname.split("/").slice(0, 3).join("/");
    }
    return `${base}/${adminLang.current}/${url}`;
  }
  return "";
};
