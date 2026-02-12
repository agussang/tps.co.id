import { structure } from "app/admin/query/structure";
import { cache } from "./cache";

export const loadHeaders = async (path: string) => {
  if (cache.structure[path]) return cache.structure[path];

  const root = await db.structure.findFirst({
    where: { path },
    select: { id: true },
  });
  if (root) {
    const headers = await structure.headers(root.id);

    if (Array.isArray(headers)) {
      const header = headers?.find((e) => e.path === path);
      if (header) {
        cache.structure[path] = header;
        cache.structure[path].childs = {};
      }

      if (cache.structure[path]) {
        const cached_header = cache.structure[path];
        for (const s of headers) {
          if (s.path && cached_header.childs) {
            cached_header.childs[s.path] = s;
          }
        }
      }
    }
  }
  return cache.structure[path] || [];
};
