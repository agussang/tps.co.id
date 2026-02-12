import { structure } from "../../typings/prisma";

export type TStructure = Record<string, TStructureItem>;
export type TStructureItem = structure & { childs?: TStructure };

export const cache = {
  timeout: 60 * 1000,
  structure: {} as TStructure,
  query_deep: {} as Record<string, Record<string, { ts: number; data: any }>>,
  content: {} as Record<string, { ts: number; data: any }>,
  async clear(type: "content" | "query-deep", arg: { path: string }) {
    if (type === "content") {
      for (const rawkey of Object.keys(this.content)) {
        const key = JSON.parse(rawkey);
        if (key.path.startsWith(arg.path) || key.path === arg.path) {
          delete this.content[rawkey];
        }
      }
    } else {
    }
  },
};
