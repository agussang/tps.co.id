import { IMeta } from "server/type";

export const head = async (
  found: any,
  arg: any,
  content: { body: any; header: any; footer: any },
  lang: string
) => {
  // default meta
  const { body, header, footer } = content;
  let title: string = `<title>Terminal Petikemas Surabaya</title>`;
  const description =
    "PT Terminal Petikemas Surabaya (TPS) memegang andil besar sebagai pengelola terminal petikemas. TPS adalah penyedia layanan jasa dalam mata rantai logistik, khususnya petikemas ekspor/impor di Indonesia. Sebagai salah satu anak usaha PT Pelindo Terminal Petikemas (SPTP) yang merupakan Subholding dalam PT Pelabuhan Indonesia (Pelindo) Grup, TPS merupakan terminal pertama di Indonesia yang menerapkan standar keamanan kapal dan fasilitas pelabuhan (ISPS Code) yang mulai diterapkan sejak bulan Juli 2004.";

  let newMeta: Partial<IMeta>[] = [];
  let meta: Partial<IMeta>[] = [
    {
      name: "description",
      content: description,
    },
    { name: "og:url", content: siteurl(arg.url.pathname) },
    { name: "og:type", content: "website" },
    {
      name: "og:description",
      content: description,
    },
    {
      name: "og:image",
      content: header.logo ? siteurl(`/_img/${header.logo}`) : "",
    },
    { name: "og:image:width", content: "124" },
    { name: "og:image:height", content: "75" },
    { name: "og:site_name", content: "tps" },
  ];

  if (found.matches && found.matches.length > 0) {
    for (let f of found.matches) {
      if (f.id_page === "46a3cbcd-2764-412d-82ea-994fc4dfe1ae") {
        //home
        newMeta = [
          { name: "keywords", content: "tps, terminal petikemas surabaya" },
          { name: "og:title", content: "Home - Terminal Petikemas Surabaya" },
        ];
      } else if (f.id_page === "a639d893-c007-4fea-8f63-564d4ebd7b90") {
        //unduh dokumen
        title = `<title>Unduh Dokumen - Terminal Petikemas Surabaya</title>`;
        newMeta = [
          {
            name: "keywords",
            content:
              "tps, terminal petikemas surabaya, unduh dokumen tps, unduh dokumen terminal petikemas surabaya",
          },
          {
            name: "og:title",
            content: "Unduh Dokumen - Terminal Petikemas Surabaya",
          },
        ];
      } else if (f.id_page === "41c8e542-a9e7-4d28-a8cf-9bd2f9c45416") {
        //berita_detail
        const regexForStripHTML = /<([^</> ]+)[^<>]*?>[^<>]*?<\/\1> */gi;
        title = `<title>${body.detail.title}</title>`;
        newMeta = [
          {
            name: "keywords",
            content: body.detail.keyword ? body.detail.keyword : "tps, terminal petikemas surabaya",
          },
          {
            name: "description",
            content: body.detail.content.replace(/<[^>]*>?/gm, ""),
          },

          { name: "og:title", content: body.detail.title },
          {
            name: "og:description",
            content: body.detail.content.replace(/<[^>]*>?/gm, ""),
          },
          {
            name: "og:image",
            content: body.detail.image
              ? siteurl(`/_img/${body.detail.image}`) + "?w=500&h=500"
              : "",
          },
        ];
      } else if (f.id_page === "354b2f3f-3fb4-4ada-894b-f01a8a76162c") {
        //throughput
        title = `<title>Throughput - Terminal Petikemas Surabaya</title>`;
        newMeta = [
          {
            name: "keywords",
            content:
              "tps, terminal petikemas surabaya, throughput terminal petikemas surabaya, arus petikemas terminal petikemas surabaya",
          },
          {
            name: "og:title",
            content: "Throughput - Terminal Petikemas Surabaya",
          },
        ];
      } else if (
        f.id_page === "30cbec46-2f7e-49a6-9c21-416d1fd6485a" &&
        found.params.slug === "gcg"
      ) {
        //tata kelola
        title = `<title>Tata Kelola - Terminal Petikemas Surabaya</title>`;
        newMeta = [
          {
            name: "keywords",
            content:
              "tps, terminal petikemas surabaya, throughput terminal petikemas surabaya, tata kelola terminal petikemas surabaya",
          },
          {
            name: "og:title",
            content: "Tata Kelola - Terminal Petikemas Surabaya",
          }
        ];
      } else if (f.id_page === "4b49b893-c2c2-42bf-a454-dd9d81314721") {
        // tariff
        title = `<title>Tarif - Terminal Petikemas Surabaya</title>`;
        newMeta = [
          {
            name: "keywords",
            content:
              "tps, terminal petikemas surabaya, throughput terminal petikemas surabaya, tarif terminal petikemas surabaya",
          },
          {
            name: "og:title",
            content: "Tarif - Terminal Petikemas Surabaya",
          }
        ];
      } else if (f.id_page === "e15234f9-7c87-4fe0-ab86-55b60f04d467") {
        //sitemap
        title = `<title>Sitemap - Terminal Petikemas Surabaya</title>`;
        newMeta = [
          {
            name: "keywords",
            content:
              "tps, terminal petikemas surabaya, throughput terminal petikemas surabaya, sitemap terminal petikemas surabaya",
          },
          {
            name: "og:title",
            content: "Sitemap - Terminal Petikemas Surabaya",
          }
        ];
      } else if (f.id_page === "53512795-1d82-4bbd-9883-b70e884039fe") {
        //kontak
        title = `<title>Kontak - Terminal Petikemas Surabaya</title>`;
        newMeta = [
          {
            name: "keywords",
            content:
              "tps, terminal petikemas surabaya, throughput terminal petikemas surabaya, kontak terminal petikemas surabaya",
          },
          {
            name: "og:title",
            content: "Kontak - Terminal Petikemas Surabaya",
          },
          {
            name: "og:image",
            content: body?.footer_content?.banner
              ? siteurl(`${body.footer_content.banner}`) + "?w=500&h=500"
              : "",
          },
        ];
      } else if (f.id_page === "1487bd26-f104-4aaf-bd34-ddb8f2b43166") {
        //jadwal online
        title = `<title>Jadwal Online - Terminal Petikemas Surabaya</title>`;
        newMeta = [
          {
            name: "keywords",
            content:
              "tps, terminal petikemas surabaya, throughput terminal petikemas surabaya, jadwal online terminal petikemas surabaya",
          },
          {
            name: "og:title",
            content: "Jadwal Online - Terminal Petikemas Surabaya",
          },
        ];
      } else if (f.id_page === "929d45a2-ec37-45d1-b730-5832eca8a53d") {
        //fasilitas
        title = `<title>Fasilitas - Terminal Petikemas Surabaya</title>`;
        newMeta = [
          {
            name: "keywords",
            content:
              "tps, terminal petikemas surabaya, throughput terminal petikemas surabaya, fasilitas online terminal petikemas surabaya",
          },
          {
            name: "og:title",
            content: "Fasilitas - Terminal Petikemas Surabaya",
          },
        ];
      } else if (
        f.id_page === "10672ed0-686a-4c79-9d27-d324f99095e7" &&
        found.params.slug === "program-pengembangan-masyarakat"
      ) {
        //csr
        title = `<title>CSR - Terminal Petikemas Surabaya</title>`;
        newMeta = [
          {
            name: "keywords",
            content:
              "tps, terminal petikemas surabaya, throughput terminal petikemas surabaya, csr online terminal petikemas surabaya",
          },
          {
            name: "og:title",
            content: "CSR - Terminal Petikemas Surabaya",
          },
          {
            name: "og:image",
            content: body.csr
              ? siteurl(`/_img/${body.csr.banner}`) + "?w=500&h=500"
              : "",
          },
        ];
      } else if (f.id_page === "1b3d9667-179d-4132-af09-d582229269a8") {
        //berita
        title = `<title>Berita - Terminal Petikemas Surabaya</title>`;
        newMeta = [
          {
            name: "keywords",
            content:
              "tps, terminal petikemas surabaya, throughput terminal petikemas surabaya, berita terminal petikemas surabaya",
          },
          {
            name: "og:title",
            content: "Berita - Terminal Petikemas Surabaya",
          },
        ];
      } else if (
        f.id_page === "c33106cb-1327-442e-8886-8f0036da94cc" &&
        found.params.slug === "declaration-of-services"
      ) {
        //maklumat
        title = `<title>Maklumat - Terminal Petikemas Surabaya</title>`;
        newMeta = [
          {
            name: "keywords",
            content:
              "tps, terminal petikemas surabaya, throughput terminal petikemas surabaya, maklumat terminal petikemas surabaya",
          },
          {
            name: "og:title",
            content: "Maklumat - Terminal Petikemas Surabaya",
          },
          {
            name: "og:image",
            content: body.maklumat.banner
              ? siteurl(`/_img/${body.maklumat.banner}`) + "?w=500&h=500"
              : "",
          },
        ];
      } else if (
        f.id_page === "37e190d5-827b-47e5-8adc-76cf78624b5c" &&
        ["sasaran", "kebijakan"].includes(found.params.slug)
      ) {
        //smi
        title = `<title>SMI - Terminal Petikemas Surabaya</title>`;
        newMeta = [
          {
            name: "keywords",
            content:
              "tps, terminal petikemas surabaya, throughput terminal petikemas surabaya, smi terminal petikemas surabaya",
          },
          {
            name: "og:title",
            content: "SMI - Terminal Petikemas Surabaya",
          },
        ];
      } else if (f.id_page === "559271c9-f1b4-4207-b69d-143efc68f197") {
        //management
        title = `<title>Management - Terminal Petikemas Surabaya</title>`;
        newMeta = [
          {
            name: "keywords",
            content:
              "tps, terminal petikemas surabaya, throughput terminal petikemas surabaya, management terminal petikemas surabaya",
          },
          {
            name: "og:title",
            content: "Management - Terminal Petikemas Surabaya",
          },
        ];
      } else if (f.id_page === "b7be4d23-bdf5-43ef-bd29-0fbf364655d8") {
        //profile
        title = `<title>Profile - Terminal Petikemas Surabaya</title>`;
        newMeta = [
          {
            name: "keywords",
            content:
              "tps, terminal petikemas surabaya, throughput terminal petikemas surabaya, profile terminal petikemas surabaya",
          },
          {
            name: "og:title",
            content: "Profile - Terminal Petikemas Surabaya",
          },
          {
            name: "og:image",
            content: body?.footer_content?.banner
              ? siteurl(`${body.footer_content.banner}`) + "?w=500&h=500"
              : "",
          },
        ];
      } else if (
        f.id_page === "e0330560-e335-4652-bc49-0f601c202324" ||
        f.id_page === "c25a7ef0-6aba-4a51-96d9-513e48eb8c59"
      ) {
        //layanan
        title = `<title>Layanan - Terminal Petikemas Surabaya</title>`;
        newMeta = [
          {
            name: "keywords",
            content:
              "tps, terminal petikemas surabaya, throughput terminal petikemas surabaya, layanan terminal petikemas surabaya",
          },
          {
            name: "og:title",
            content: "Layanan - Terminal Petikemas Surabaya",
          },
        ];
      }
    }
  }

  meta = meta.filter((item, i) => {
    const findMeta = newMeta.filter((newItem, x) => newItem.name === item.name)
    
    if(findMeta.length === 0) {
      return item
    }
  })

  meta = [...meta, ...newMeta]

  return {
    meta,
    title,
  };
};
