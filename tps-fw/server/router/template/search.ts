import { contentSearch } from "server/data/content/search";

export const templateSearch = async (lang: string, query: string) => {

  return {
    result: await contentSearch(lang, query),
  };
};
