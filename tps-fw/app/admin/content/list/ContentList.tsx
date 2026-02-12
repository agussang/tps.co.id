import { getPathname } from "@/utils/pathname";
import { useLocal } from "@/utils/use-local";
import { FC, useEffect } from "react";
import { structure as db_structure } from "../../../../typings/prisma";
import { structure } from "../../query/structure";

export const list_local = {
  cur: null as null | db_structure,
  headers: [] as db_structure[],
  loading: true,
  cache: {} as Record<string, db_structure[]>,
};

export const ContentList: FC<{ children: any; PassProp: any }> = ({
  children,
  PassProp,
}) => {
  const local = useLocal(list_local);

  useEffect(() => {
    (async () => {
      if (!local.cache[params.id]) {
        local.loading = true;
        const headers = await structure.headers(params.id);
        local.cache[params.id] = JSON.parse(JSON.stringify(headers));
      }
      local.headers = JSON.parse(JSON.stringify(local.cache[params.id]));

      const cur = local.headers.findIndex((e) => e.id === params.id);
      if (typeof cur === "number") {
        local.cur = local.headers[cur];
        local.headers.splice(cur, 1);
      }

      local.loading = false;
      local.render();
    })();
  }, [getPathname()]);

  return <PassProp local={local}>{children}</PassProp>;
};
