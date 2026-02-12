export const modifyBody = async (path: string, found: any, body: any) => {
  // default
  body.header_content = {
    title: "" as string | null,
    banner: "/_file/layout/header/header-default-bg.png",
    tagline: "World class performance",
    heading: "Terminal operator",
    sub_heading: "Terminal Petikemas Surabaya",
  };

  // Handle karir page by path first (before page_id check)
  if (path === "/karir" || path === "/career" || path === "/id/karir" || path === "/en/career") {
    const karirData = body.karir || {};
    body.header_content = {
      title: karirData.title || (found.params?.lang === "id" ? "Karir" : "Career"),
      subtitle: karirData.subtitle || "",
      description: karirData.description || "",
      banner: karirData.image ? `/_img/${karirData.image}` : "/_file/layout/header/header-default-bg.png",
      tagline: "World class performance",
      heading: "Terminal operator",
      sub_heading: "Terminal Petikemas Surabaya",
    };
    return body;
  }

  if (found.matches && found.matches.length > 0) {
    for (let f of found.matches) {
      if (f.id_page === "a639d893-c007-4fea-8f63-564d4ebd7b90") {
        body.header_content = {
          title:
            found.params.lang === "id"
              ? "Unduh Dokumen"
              : ("Download Document" as string | null),
          banner: "/_file/layout/header/header-default-bg.png",
          tagline: "World class performance",
          heading: "Terminal operator",
          sub_heading: "Terminal Petikemas Surabaya",
        };
      } else if (f.id_page === "cdda0634-6de9-478b-b9c5-0bd6280de363") {
        body.header_content = {
          title: `Legal`,
          banner: "/_file/layout/header/header-default-bg.png",
          tagline: "World class performance",
          heading: "Terminal operator",
          sub_heading: "Terminal Petikemas Surabaya",
        };
      } else if (f.id_page === "4b49b893-c2c2-42bf-a454-dd9d81314721") {
        body.header_content = {
          title:
            found.params.lang === "id" ? "Tarif" : ("Tariff" as string | null),
          banner: "/_file/layout/header/header-default-bg.png",
          tagline: "World class performance",
          heading: "Terminal operator",
          sub_heading: "Terminal Petikemas Surabaya",
        };
      } else if (f.id_page === "53512795-1d82-4bbd-9883-b70e884039fe") {
        body.header_content = {
          title:
            found.params.lang === "id"
              ? "Kontak"
              : ("Contact" as string | null),
          banner: "/_file/layout/header/header-default-bg.png",
          tagline: "World class performance",
          heading: "Terminal operator",
          sub_heading: "Terminal Petikemas Surabaya",
        };
        body.footer_content = {
          banner: "/_img/layout/footer/footer-content.jpeg",
        };
      } else if (
        f.id_page === "1b3d9667-179d-4132-af09-d582229269a8" &&
        ["latest-news", "press-release"].includes(found.params.slug)
      ) {
        body.header_content = {
          title:
            found.params.lang === "id" ? "Berita" : ("News" as string | null),
          banner: "/_file/layout/header/header-default-bg.png",
          tagline: "World class performance",
          heading: "Terminal operator",
          sub_heading: "Terminal Petikemas Surabaya",
        };
      } else if (
        f.id_page === "10672ed0-686a-4c79-9d27-d324f99095e7" &&
        ["program-pengembangan-masyarakat", "tjsl"].includes(found.params.slug)
      ) {
        body.header_content = {
          title: found.params.lang === "id" ? "CSR" : ("CSR" as string | null),
          banner: "/_file/layout/header/header-default-bg.png",
          tagline: "World class performance",
          heading: "Terminal operator",
          sub_heading: "Terminal Petikemas Surabaya",
        };
      } else if (f.id_page === "559271c9-f1b4-4207-b69d-143efc68f197") {
        body.header_content = {
          title:
            found.params.lang === "id"
              ? "Manajemen"
              : ("Management" as string | null),
          banner: "/_file/layout/header/header-default-bg.png",
          tagline: "World class performance",
          heading: "Terminal operator",
          sub_heading: "Terminal Petikemas Surabaya",
        };
      } else if (f.id_page === "30cbec46-2f7e-49a6-9c21-416d1fd6485a") {
        body.header_content = {
          title:
            found.params.lang === "id"
              ? "Tata Kelola"
              : ("Governance" as string | null),
          banner: "/_file/layout/header/header-default-bg.png",
          tagline: "World class performance",
          heading: "Terminal operator",
          sub_heading: "Terminal Petikemas Surabaya",
        };
      } else if (f.id_page === "c33106cb-1327-442e-8886-8f0036da94cc") {
        body.header_content = {
          title:
            found.params.lang === "id"
              ? "Maklumat Pelayanan"
              : ("Service Information" as string | null),
          banner: "/_file/layout/header/header-default-bg.png",
          tagline: "World class performance",
          heading: "Terminal operator",
          sub_heading: "Terminal Petikemas Surabaya",
        };
      } else if (f.id_page === "37e190d5-827b-47e5-8adc-76cf78624b5c") {
        const title_content = found.params ? found.params.slug : "";
        body.header_content = {
          title: title_content as string | null,
          banner: "/_file/layout/header/header-default-bg.png",
          tagline: "World class performance",
          heading: "Terminal operator",
          sub_heading: "Terminal Petikemas Surabaya",
        };
      } else if (f.id_page === "929d45a2-ec37-45d1-b730-5832eca8a53d") {
        body.header_content = {
          title:
            found.params.lang === "id"
              ? "Fasilitas"
              : ("Facility" as string | null),
          banner: "/_file/layout/header/header-default-bg.png",
          tagline: "World class performance",
          heading: "Terminal operator",
          sub_heading: "Terminal Petikemas Surabaya",
        };
      } else if (f.id_page === "1487bd26-f104-4aaf-bd34-ddb8f2b43166") {
        body.header_content = {
          title:
            found.params.lang === "id"
              ? "Jadwal Online"
              : ("Online Schedule" as string | null),
          banner: "/_file/layout/header/header-default-bg.png",
          tagline: "World class performance",
          heading: "Terminal operator",
          sub_heading: "Terminal Petikemas Surabaya",
        };
      } else if (f.id_page === "e15234f9-7c87-4fe0-ab86-55b60f04d467") {
        body.header_content = {
          title: "Sitemap" as string | null,
          banner: "/_file/layout/header/header-default-bg.png",
          tagline: "World class performance",
          heading: "Terminal operator",
          sub_heading: "Terminal Petikemas Surabaya",
        };
      } else if (f.id_page === "41c8e542-a9e7-4d28-a8cf-9bd2f9c45416") {
        body.header_content = {
          title:
            found.params.lang === "id" ? "Berita" : ("News" as string | null),
          banner: "/_file/layout/header/header-default-bg.png",
          tagline: "World class performance",
          heading: "Terminal operator",
          sub_heading: "Terminal Petikemas Surabaya",
        };
      } else if (f.id_page === "354b2f3f-3fb4-4ada-894b-f01a8a76162c") {
        body.header_content = {
          title: "Throughput" as string | null,
          banner: "/_file/layout/header/header-default-bg.png",
          tagline: "World class performance",
          heading: "Terminal operator",
          sub_heading: "Terminal Petikemas Surabaya",
        };
      } else if (f.id_page === "c25a7ef0-6aba-4a51-96d9-513e48eb8c59") {
        body.header_content = {
          title:
            found.params.lang === "id"
              ? "Layanan"
              : ("Service" as string | null),
          banner: "/_file/layout/header/header-default-bg.png",
          tagline: "World class performance",
          heading: "Terminal operator",
          sub_heading: "Terminal Petikemas Surabaya",
        };
      } else if (f.id_page === "e0330560-e335-4652-bc49-0f601c202324") {
        body.header_content = {
          title:
            found.params.lang === "id"
              ? "Layanan"
              : ("Service" as string | null),
          banner: "/_file/layout/header/header-default-bg.png",
          tagline: "World class performance",
          heading: "Terminal operator",
          sub_heading: "Terminal Petikemas Surabaya",
        };
      } else if (f.id_page === "b7be4d23-bdf5-43ef-bd29-0fbf364655d8") {
        body.footer_content = {
          banner: "/_img/profile/visi/profil-footer-img.jpg",
        };
      }
    }
  }

  return body;
};
