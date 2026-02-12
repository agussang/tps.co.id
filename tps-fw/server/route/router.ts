import { home } from "server/data/home";
import { templateContact } from "server/router/template/contact";
import { templateCSR } from "server/router/template/csr";
import { templateDetailArticle } from "server/router/template/detailnews";
import { templateFasilitas } from "server/router/template/fasilitas";
import { templateJadwalOnline } from "server/router/template/jadwalonline";
import { templateKarir } from "server/router/template/karir";
import { templateLayanan } from "server/router/template/layanan";
import { templateLegal } from "server/router/template/legal";
import { templateMaklumat } from "server/router/template/maklumat";
import { templateMaklumatCategory } from "server/router/template/maklumatcategory";
import { templateManagement } from "server/router/template/management";
import { templateNews } from "server/router/template/news";
import { templateProfile } from "server/router/template/profile";
import { templateSitemap } from "server/router/template/sitemap";
import { templateThroughput } from "server/router/template/throughput";
import { templateUnduh } from "server/router/template/unduh";

const paging = (p: any) => {
  let take = p.take || 10;
  let skip = 0;
  if (p.page) {
    skip = (parseInt(p.page) - 1) * take;
  } else {
    skip = 0;
  }
  return { skip, take: take };
};

export const router = () => ({
  ":lang": {
    route: route_with_lang,
  },
  ...route_with_lang({ lang: "id" }),
});

const route_with_lang = (params: { lang?: string }) => ({
  "": {
    id_page: "46a3cbcd-2764-412d-82ea-994fc4dfe1ae",
    lang: params.lang || "id",
    template: (p: any, arg: any) => {
      return home.bind(arg)(p.lang);
    },
  },
  "unduh-dokumen": {
    id_page: "a639d893-c007-4fea-8f63-564d4ebd7b90",
    id_struct: "1853d4b9-89df-444c-bfa8-a80782f0dc51",
    lang: "id",
    template: (p: any, arg: any) => {
      const { skip, take } = paging(p);
      return templateUnduh.bind(arg)("unduh-dokumen", skip, take, p.lang, p);
    },
  },
  "download-documents": {
    id_page: "a639d893-c007-4fea-8f63-564d4ebd7b90",
    id_struct: "1853d4b9-89df-444c-bfa8-a80782f0dc51",
    lang: "en",
    template: (p: any, arg: any) => {
      const { skip, take } = paging(p);
      return templateUnduh.bind(arg)(
        "download-documents",
        skip,
        take,
        p.lang,
        p
      );
    },
  },
  "upload/legal": {
    id_page: "cdda0634-6de9-478b-b9c5-0bd6280de363",
    id_struct: "1853d4b9-89df-444c-bfa8-a80782f0dc51",
    lang: "id",
    template: (p: any, arg: any) => {
      const { skip, take } = paging(p);
      return templateLegal.bind(arg)("upload", skip, take, p.lang, p);
    },
  },
  "profil/visi": {
    id_page: "b7be4d23-bdf5-43ef-bd29-0fbf364655d8",
    id_struct: "9d160d76-c07b-4638-ba07-186c2c920203",
    lang: "id",
    template: (p: any, arg: any) => {
      return templateProfile.bind(arg)(p.lang);
    },
  },
  "profile/vision": {
    id_page: "b7be4d23-bdf5-43ef-bd29-0fbf364655d8",
    id_struct: "9d160d76-c07b-4638-ba07-186c2c920203",
    lang: "en",
    template: (p: any, arg: any) => {
      return templateProfile.bind(arg)(p.lang);
    },
  },
  "profil/managemen": {
    id_page: "559271c9-f1b4-4207-b69d-143efc68f197",
    id_struct: "1134f017-a530-4350-9dd6-27f0dfd7f930",
    lang: "id",
    template: (p: any, arg: any) => {
      return templateManagement.bind(arg)(p.lang);
    },
  },
  "profile/managemen": {
    id_page: "559271c9-f1b4-4207-b69d-143efc68f197",
    id_struct: "1134f017-a530-4350-9dd6-27f0dfd7f930",
    lang: "en",
    template: (p: any, arg: any) => {
      return templateManagement.bind(arg)(p.lang);
    },
  },
  "smi/declaration-of-services": {
    id_page: "c33106cb-1327-442e-8886-8f0036da94cc",
    id_struct: "807134c9-8867-42a7-a279-be8f77000cff",
    lang: "id",
    template: (p: any, arg: any) => {
      return templateMaklumat.bind(arg)(p.lang);
    },
  },
  "integrated-management-system/declaration-of-services": {
    id_page: "c33106cb-1327-442e-8886-8f0036da94cc",
    id_struct: "807134c9-8867-42a7-a279-be8f77000cff",
    lang: "en",
    template: (p: any, arg: any) => {
      return templateMaklumat.bind(arg)(p.lang);
    },
  },
  "smi/:slug": {
    id_page: "37e190d5-827b-47e5-8adc-76cf78624b5c",
    id_struct: "807134c9-8867-42a7-a279-be8f77000cff",
    lang: "id",
    template: (p: any, arg: any) => {
      return templateMaklumatCategory.bind(arg)(p.lang, p.slug);
    },
  },
  "integrated-management-system/:slug": {
    id_page: "37e190d5-827b-47e5-8adc-76cf78624b5c",
    id_struct: "807134c9-8867-42a7-a279-be8f77000cff",
    lang: "en",
    template: (p: any, arg: any) => {
      return templateMaklumatCategory.bind(arg)(p.lang, p.slug);
    },
  },
  "layanan/:slug": {
    id_page: "c25a7ef0-6aba-4a51-96d9-513e48eb8c59",
    id_struct: "78e29788-9d87-424e-bdac-927ea2a19c59",
    lang: "id",
    template: (p: any, arg: any) => {
      return templateLayanan.bind(arg)(p.lang, p.slug);
    },
  },
  "services/:slug": {
    id_page: "c25a7ef0-6aba-4a51-96d9-513e48eb8c59",
    id_struct: "78e29788-9d87-424e-bdac-927ea2a19c59",
    lang: "en",
    template: (p: any, arg: any) => {
      return templateLayanan.bind(arg)(p.lang, p.slug);
    },
  },
  "layanan/layanan-container-freight-station/:slug": {
    id_page: "e0330560-e335-4652-bc49-0f601c202324",
    id_struct: "78e29788-9d87-424e-bdac-927ea2a19c59",
    lang: "id",
    template: (p: any, arg: any) => {
      return templateLayanan.bind(arg)(p.lang, p.slug);
    },
  },
  "services/container-freight-station-service/:slug": {
    id_page: "e0330560-e335-4652-bc49-0f601c202324",
    id_struct: "78e29788-9d87-424e-bdac-927ea2a19c59",
    lang: "en",
    template: (p: any, arg: any) => {
      return templateLayanan.bind(arg)(p.lang, p.slug);
    },
  },
  throughput: {
    id_page: "354b2f3f-3fb4-4ada-894b-f01a8a76162c",
    id_struct: "5507641b-596d-4fb6-a307-90fe8371c080",
    lang: params.lang || "id",
    template: (p: any, arg: any) => {
      return templateThroughput.bind(arg)(p.lang);
    },
  },
  gcg: {
    id_page: "30cbec46-2f7e-49a6-9c21-416d1fd6485a",
    id_struct: "884e577e-6f92-45da-8c60-163f4da84392",
    lang: params.lang || "id",
    template: (p: any, arg: any) => {
      return templateMaklumatCategory.bind(arg)(p.lang, p.slug);
    },
  },
  tariff: {
    id_page: "4b49b893-c2c2-42bf-a454-dd9d81314721",
    id_struct: "1853d4b9-89df-444c-bfa8-a80782f0dc51",
    lang: params.lang || "id",
    template: (p: any, arg: any) => {
      const { skip, take } = paging(p);
      return templateUnduh.bind(arg)(p.slug, skip, take, p.lang, p);
    },
  },
  sitemap: {
    id_page: "e15234f9-7c87-4fe0-ab86-55b60f04d467",
    lang: params.lang || "id",
    template: (p: any, arg: any) => {
      return templateSitemap.bind(arg)(p.lang);
    },
  },
  contact: {
    id_page: "53512795-1d82-4bbd-9883-b70e884039fe",
    id_struct: "db659177-04d8-4a9e-b75a-8bb3cecdd33e",
    lang: params.lang || "id",
    template: (p: any, arg: any) => {
      return templateContact.bind(arg)(p.lang);
    },
  },
  karir: {
    id_page: "53512795-1d82-4bbd-9883-b70e884039fe", // Using contact page layout (similar structure)
    id_struct: "768ad3ff-5026-409a-b4e4-baa74cbcacae",
    lang: params.lang || "id",
    template: (p: any, arg: any) => {
      return templateKarir.bind(arg)(p.lang);
    },
  },
  career: {
    id_page: "53512795-1d82-4bbd-9883-b70e884039fe", // Using contact page layout (similar structure)
    id_struct: "768ad3ff-5026-409a-b4e4-baa74cbcacae",
    lang: params.lang || "en",
    template: (p: any, arg: any) => {
      return templateKarir.bind(arg)(p.lang);
    },
  },
  "layanan-online-dan-jadwal": {
    id_page: "1487bd26-f104-4aaf-bd34-ddb8f2b43166",
    lang: params.lang || "id",
    template: () => templateJadwalOnline(),
  },
  "online-services-and-schedule": {
    id_page: "1487bd26-f104-4aaf-bd34-ddb8f2b43166",
    lang: params.lang || "id",
    template: () => templateJadwalOnline(),
  },
  search: {
    id_page: "9cbbe158-4e46-4123-a332-cb03b8744609",
    lang: params.lang || "id",
    template: () => templateJadwalOnline(),
  },
  fasilitas: {
    id_page: "929d45a2-ec37-45d1-b730-5832eca8a53d",
    id_struct: "150394f8-16bf-4748-8933-a087515d4231",
    lang: params.lang || "id",
    template: (p: any, arg: any) => {
      return templateFasilitas.bind(arg)(p.lang);
    },
  },
  facilities: {
    id_page: "929d45a2-ec37-45d1-b730-5832eca8a53d",
    id_struct: "150394f8-16bf-4748-8933-a087515d4231",
    lang: params.lang || "en",
    template: (p: any, arg: any) => {
      return templateFasilitas.bind(arg)(p.lang);
    },
  },
  "program-pengembangan-masyarakat": {
    id_page: "10672ed0-686a-4c79-9d27-d324f99095e7",
    id_struct: "c789d054-ed5c-4d1e-88ec-6a258d5197ab",
    lang: params.lang || "id",
    template: (p: any, arg: any) => {
      return templateCSR.bind(arg)(p.lang, p.slug);
    },
  },
  "tjsl": {
    id_page: "10672ed0-686a-4c79-9d27-d324f99095e7",
    id_struct: "c789d054-ed5c-4d1e-88ec-6a258d5197ab",
    lang: params.lang || "en",
    template: (p: any, arg: any) => {
      return templateCSR.bind(arg)(p.lang, p.slug);
    },
  },
  "berita/:slug": {
    lang: params.lang || "id",
    id_page: "1b3d9667-179d-4132-af09-d582229269a8",
    id_struct: [
      "1eeacdaf-45b9-45c3-8c1e-18a58bc28b65",
      "1eeacdaf-45b9-45c3-8c1e-18a58bc28b61",
    ],
    template: (p: any, arg: any) => {
      const { skip, take } = paging(p);
      return templateNews.bind(arg)(p.slug, skip, take, p.lang);
    },
  },
  "news/latest-news/listing/:year/:month/:day/:segment/:category/:slug": {
    lang: params.lang || "id",
    id_page: "41c8e542-a9e7-4d28-a8cf-9bd2f9c45416",
    id_struct: [
      "1eeacdaf-45b9-45c3-8c1e-18a58bc28b65",
      "1eeacdaf-45b9-45c3-8c1e-18a58bc28b61",
    ],
    template: (p: any, arg: any) => {
      return templateDetailArticle.bind(arg)(p.slug, p.lang);
    },
  },
});
