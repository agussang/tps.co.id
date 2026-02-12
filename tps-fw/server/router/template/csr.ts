import { contentCSR } from "server/data/content/csr/content";
import { contentProgramCSR } from "server/data/content/csr/program";
import { PrasiArg } from "server/type";

export const templateCSR = async function (
  this: any,
  lang: string,
  slug: string
) {
  let slugCSR = "program-pengembangan-masyarakat";
  if (lang === "en") {
    slugCSR = "tjsl";
  }

  const csr = await contentCSR(lang, slugCSR, "csr", this);
  if (!csr) return null;

  return {
    csr,
    programs: await contentProgramCSR(lang, "program_csr", this),
  };
};
