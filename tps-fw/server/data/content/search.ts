import { queryContent } from "server/query/query-content";

export const contentSearch = async (lang: string, query: string) => {
  let result = [];
  let search = await queryContent.search({
    where: {
      text: {
        contains: query,
        mode: "insensitive",
      },
    },
  });

  if (search) {
    result = search.map((item, i) => {
      const regEx = new RegExp(query, "gi");
      const content = item.content.replace(regEx, `<mark>${query}</mark>`);
      return {
        ...item,
        content,
      };
    });
  }

  return result;
};
