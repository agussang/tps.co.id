export const convertSingleRow = async (
  row_items: any[],
  lines: {},
  relations: any[]
) => {
  for (const cell of row_items) {
    if (cell.id_structure) {
      const col_path = (cell.structure?.path || "").split(".").pop();
      if (col_path) {
        if (relations && relations.length > 0) {
          (lines as any)[col_path] = cell.file ? cell.file.path : cell.text;

          for (const rels of relations) {
            const key = Object.keys(rels)[0];
            const values = Object.values(rels)[0] as {
              columns: string[];
              relations: any[];
            };

            if (col_path === key) {
            }
          }
        } else {
          (lines as any)[col_path] = cell.file ? cell.file.path : cell.text;
        }
      }
    }
  }

  return lines;
};
