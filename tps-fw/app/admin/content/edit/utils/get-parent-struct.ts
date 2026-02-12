
export const getParentOrStructure = async () => {
  const query = {
    id_structure: "",
    id_parent: "",
  };

  if (params.id === "new") {
    for (const h of location.hash.split("#")) {
      if (h) {
        const [key, value] = h.split("=");
        if (key === "st") {
          query.id_structure = value;
        } else if (key === "parent") {
          query.id_parent = value;
        }
      }
    }
  } else {
    query.id_parent = params.id;
    const res = await db.content.findFirst({
      where: { id: params.id },
      select: {
        id_structure: true,
      },
    });
    if (res && res.id_structure) {
      query.id_structure = res.id_structure;
    }
  }
  return query;
};
