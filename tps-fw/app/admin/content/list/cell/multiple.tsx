import { useLocal } from "@/utils/use-local";
import { FC } from "react";
import { structure as db_structure } from "../../../../../typings/prisma";
import { Btn } from "../../ui/btn";
import { query } from "app/admin/query/content";

export const CellMultiple: FC<{ st: db_structure; row: any; lang: string }> = ({
  st,
  row,
  lang,
}) => {
  const local = useLocal(
    {
      count: 0,
      status: "loading",
    },
    async () => {
      local.status = "loading";
      local.render();
      const count = await db.content.findMany({
        where: {
          id_structure: st.id,
          id_parent: row.id,
          lang: { in: [lang, "inherited"] },
          other_content: { some: {} },
        },
      });
      local.count = count.length;
      local.status = "ready";
      local.render();
    }
  );

  return (
    <div className="c-flex c-items-center c-space-x-1">
      <Btn
        onClick={() => {
          navigate(`/backend/tpsadmin/content/list/${st.id}#parent=${row.id}`);
        }}
      >
        {local.status === "loading"
          ? "..."
          : `${local.count} item${local.count > 1 ? "s" : ""}`}
      </Btn>

      <Btn
        onClick={() => {
          navigate(
            `/backend/tpsadmin/content/edit/new#parent=${row.id}#st=${st.id}`
          );
        }}
      >
        +
      </Btn>
    </div>
  );
};
