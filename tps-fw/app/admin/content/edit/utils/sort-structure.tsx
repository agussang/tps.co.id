export const sortStructure = <T extends any[]>(structures: T) => {
  let sorted = !!structures.find(
    (e) => (e.path || "").includes(".") && e.sort_idx > 0
  );
  const first = ["name", "nama", "label"];
  const last = ["desc", "description", "order", "item", "items"];

  return structures.sort((a, b) => {
    if (sorted) {
      return a.sort_idx - b.sort_idx;
    }

    if (first.includes(a.title?.toLowerCase() || "")) return -1;
    if (first.includes(b.title?.toLowerCase() || "")) return 1;

    if (last.includes(a.title?.toLowerCase() || "")) return 1;
    if (last.includes(b.title?.toLowerCase() || "")) return -1;

    return (a.title || "").localeCompare(b.title || "");
  });
};
