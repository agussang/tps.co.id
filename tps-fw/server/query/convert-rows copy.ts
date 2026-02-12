export const convertRows = async (
  path: string,
  lines: any[],
  row_items: any[],
  columns: any,
  relations?: any[]
) => {
  for (const line of lines) {
    for (const cell of row_items) {
      if (cell.id_parent === line.id && cell.id_structure) {
        const col = columns[cell.id_structure];
        if (col) {
          const col_path = (col.path || "").substring(`${path}.`.length);

          (line as any)[col_path] = cell.file ? cell.file.path : cell.text;
        }
      }
    }
  }

  return lines;
};
