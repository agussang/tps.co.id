import { getPathname } from "@/exports";
import { useLocal } from "@/utils/use-local";
import { FC, useEffect } from "react";
import { validate } from "uuid";
import { edit_local } from "./utils/edit-local";
import { getParentOrStructure } from "./utils/get-parent-struct";

export const ContentEdit: FC<{ child: any; PassProp: any }> = ({
  child,
  PassProp,
}) => {
  const local = useLocal({ ...edit_local });
  
  useEffect(() => {
    (async () => {
      local.field_cache = {};
      local.structures = [];
      local.render();

      const { id_structure } = await getParentOrStructure();
      if (validate(id_structure)) {
        local.structures = await db.structure.findMany({
          where: { OR: [{ parent: id_structure }, { id: id_structure }] },
          orderBy: {
            sort_idx: "asc",
          },
        });
        if (local.structures) {
          const root = local.structures.find((e) => e.id === id_structure);
          if (root) {
            local.root = root;
            (root as any).is_root = true;
          }
          local.render();
        }
      }
    })();
  }, [getPathname()]);

  return <PassProp local={local}>{child}</PassProp>;
};
