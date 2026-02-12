export const convertMultipleRows = async (
  path: string,
  lines: any[],
  row_items: any[],
  columns: any,
  structure: any,
  relations?: any[]
) => {
  for (const line of lines) {
    for (const cell of row_items) {
      if (cell.id_parent === line.id && cell.id_structure) {
        const col = columns[cell.id_structure];
        if (col) {
          const col_path = (col.path || "").substring(`${path}.`.length);

          if (relations && relations.length > 0) {
            // relation define here
            (line as any)[col_path] = cell.file ? cell.file.path : cell.text;

            for (const rels of relations) {
              const key = Object.keys(rels)[0];
              const values = Object.values(rels)[0] as { columns: string[], relations: any[] };
              if (col_path === key) {
                const structure_relation = structure[`${path}.${key}`];
                const rel_relations = values.relations ? values.relations : []

                const column_ids = Object.values(structure)
                  .filter((s: any) => {
                    if (values.columns) {
                      for (const c of values.columns) {
                        if (s.path?.startsWith(`${path}.${key}.${c}`)) {
                          return true;
                        }
                      }
                    } else {
                      return true;
                    }
                    return false;
                  })
                  .map((e: any) => e.id);

                const rel_lines = await db.content.findMany({
                  where: {
                    id_structure: structure_relation.id,
                    id_parent: line.id,
                  },
                  select: {
                    id: true,
                  },
                });

                let rel_data: any[] = [];

                if (Array.isArray(rel_lines)) {
                  const rel_row_items = await db.content.findMany({
                    where: {
                      id_parent: { in: rel_lines.map((e) => e.id) },
                      id_structure: {
                        in: column_ids,
                      },
                    },
                    select: {
                      id: true,
                      id_parent: true,
                      id_structure: true,
                      text: true,
                      file: true,
                    },
                  });

                  rel_data = await convertMultipleRows(
                    `${path}.${key}`,
                    rel_lines,
                    rel_row_items,
                    columns,
                    structure,
                    rel_relations
                  );
                }

                (line as any)[col_path] = rel_data;
              }
            }
          } else {
            (line as any)[col_path] = cell.file ? cell.file.path : cell.text;
          }
        }
      }
    }
  }

  return lines;
};
