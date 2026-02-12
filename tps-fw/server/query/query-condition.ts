import { IParamsQuery } from "server/type";
import { Prisma } from "../../typings/prisma";

export const queryCondition = async (
  path: string,
  header: any,
  params: Array<IParamsQuery>,
  where?: Prisma.contentWhereInput
) => {
  let condition = null as null | Record<string, any>;
  let queryParams: any[] = [];

  let params_cols: any[] = [];
  for (const c of params) {
    params_cols = [
      ...params_cols,
      {
        ...header?.childs[`${path}.${c.field}`],
        _query: c.where,
      },
    ];
  }

  let and_result = [] as Array<string | null>;
  for (const c of params_cols) {
    const res = await db.content.findMany({
      where: {
        id_structure: c.id,
        id_parent: {
          not: null,
        },
        ...(c._query || {}),
      },
      select: {
        id: true,
        id_parent: true,
        lang: true,
      },
    });
    if (res) {
      and_result = [...and_result, ...res.map((e) => e.id_parent)];
    }
  }

  if (params_cols.length > 1) {
    queryParams = and_result
      .filter((item, i) => and_result.indexOf(item) !== i)
      .map((e) => ({
        id: e,
      }));
  } else {
    queryParams = and_result.map((item) => {
      return {
        id: item,
      };
    });
  }

  if (Array.isArray(queryParams) && queryParams.length > 0) {
    condition = {
      ...condition,
      ...{
        id_parent: {
          in: queryParams.map((e) => e.id),
        },
      },
    };
  }

  return condition;
};
