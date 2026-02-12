import { queryContent } from "server/query/query-content";
import { headerMenu } from "../headermenu";
import { PrasiArg } from "server/type";
import { pathQuery } from "app/admin/query/path-query";

export const contentFooter = async (lang: string, arg: PrasiArg) => {
  let path = "footer";
  let copyright = null;
  let certificate = [] as [] | null;
  let company = [] as [] | null;
  let phone = [] as [] | null;
  let email = [] as [] | null;

  // const footers = (
  //   await queryContent.findAll<{
  //     certificate: [];
  //     phone: [];
  //     company: [];
  //     email: [];
  //     copyright: string;
  //   }>({
  //     path,
  //     where: {
  //       content: {
  //         lang,
  //       },
  //     },
  //     relations: [
  //       {
  //         company: {
  //           columns: ["name", "address"],
  //         },
  //       },
  //       {
  //         certificate: {
  //           columns: ["image", "title"],
  //         },
  //       },
  //       {
  //         phone: {
  //           columns: ["label", "value"],
  //         },
  //       },
  //       {
  //         email: {
  //           columns: ["label", "value"],
  //         },
  //       },
  //     ],
  //     columns: ["copyright", "certificate", "company", "phone", "email"],
  //     sort: { col: "copyright", order: "asc" },
  //     skip: 0,
  //     take: 1,
  //     arg,
  //   })
  // ).find((item, i) => item);

  const footer = (
    await pathQuery({
      path,
      lang,
      status: "published",
      sort: { copyright: "desc" },
    })
  ).find((item, i) => item);

  if (footer) {
    certificate = footer.certificate;
    copyright = footer.copyright;
    company = footer.company;
    phone = footer.phone;
    email = footer.email;
  }

  let sitemap = await headerMenu(lang, "menu");
  sitemap = sitemap.filter((item: any, i) => item.url !== "/contact");
  return {
    sitemap,
    copyright,
    certificate,
    contactus: {
      title: "Contact Us",
      company,
      phone,
      email,
    },
  };
};
