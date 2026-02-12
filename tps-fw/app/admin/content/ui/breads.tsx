import { useLocal } from "@/utils/use-local";
import { query } from "app/admin/query/content";
import { FC, ReactNode, useEffect } from "react";
import { validate } from "uuid";
import { Breadcrumb, getPathname } from "../../../..";
import { Pencil } from "lucide-react";
import { audit } from "app/admin/actions/audit";

export const ContentBreads: FC<{}> = ({}) => {
  const local = useLocal({
    breads: [] as { label: ReactNode; url: string }[],
    pathname: "",
  });

  useEffect(() => {
    (async () => {
      const hash: any = {};
      for (const h of location.hash.split("#")) {
        if (h) {
          const [key, value] = h.split("=");
          hash[key] = value;
        }
      }

      const where = {
        id_structure: validate(params.id) ? params.id : hash.st,
        id_content: hash.parent,
        mode: "list" as "form" | "list",
      };

      if (getPathname().startsWith("/backend/tpsadmin/content/edit/")) {
        where.id_structure = "";
        if (params.id === "new") {
          where.id_content = hash.parent;
          where.id_structure = hash.st;
        } else {
          where.id_content = params.id;
        }
        where.mode = "form";
      }

      if (where.id_content) {
        const parents = await query.parents(where.id_content, ["id_structure"]);
        const id_structures = [...parents.map((e) => e.id_structure || "")];
        const parents_by_structure = {} as Record<
          string,
          (typeof parents)[number]
        >;
        for (const p of parents) {
          parents_by_structure[p.id_structure || ""] = p;
        }

        if (where.id_structure) {
          id_structures.push(where.id_structure);
          parents_by_structure[where.id_structure] = {
            id_parent: where.id_content,
          } as any;
        }
        const structures = await db.structure.findMany({
          where: {
            id: {
              in: id_structures,
            },
          },
          select: { id: true, path: true, title: true },
        });
        local.breads = [];
        structures
          .sort((a, b) => (a.path || "").length - (b.path || "").length)
          .map((s, idx) => {
            const p = parents_by_structure[s.id];
            let parent_hash = "";
            if (s.path?.includes(".")) {
              parent_hash = `#parent=${p.id_parent}`;
            }
            if (idx > 0) {
              local.breads.push({
                label: <Pencil size={14} strokeWidth={2} />,
                url: `/backend/tpsadmin/content/edit/${p.id_parent}`,
              });
            }

            local.breads.push({
              url: `/backend/tpsadmin/content/list/${s.id}${parent_hash}`,
              label: s.title || s.path?.split(".")?.pop() || "",
            });
          });
      }

      if (where.mode === "form") {
        if (params.id === "new") {
          local.breads.push({ url: "", label: "Add New" });
        } else {
          local.breads.push({ url: "", label: "Edit" });
        }
      }
      local.render();

    })();
  }, [local.pathname, location.hash]);

  if (local.pathname !== getPathname()) {
    local.pathname = getPathname();
    return null;
  }

  const breads = [];
  let pushed = new Set<string>();
  for (const item of local.breads) {
    if (!pushed.has(item.url)) {
      pushed.add(item.url);
    } else {
      continue;
    }
    breads.push(item);
  }

  return (
    <>
      <Breadcrumb
        className={css`
          border-bottom: 0;
          padding-left: 0 !important;
        `}
        value={breads}
      />
    </>
  );
};
