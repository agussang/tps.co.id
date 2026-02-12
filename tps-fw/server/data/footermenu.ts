export const footerMenu = () => {
  return [
    {
      label: "Tentang Kami",
      url: "#",
      items: [
        { label: "Tentang Kami", url: "/tentang-kami" },
        { label: "Manajemen", url: "#" },
        { label: "Moto", url: "#" },
        { label: "Lokasi", url: "#" },
      ],
    },
    {
      label: "Fasilitas & Layanan",
      url: "#",
      items: [
        { label: "Dermaga", url: "/facilities/wharf" },
        { label: "Lapangan", url: "/facilities/yard" },
      ],
    },
    {
      label: "CSR",
      url: "#",
    },
    {
      label: "Berita",
      url: "#",
      items: [
        { label: "Berita Terkini", url: "#" },
        { label: "Siaran Pers", url: "#" },
      ],
    },
    {
      label: "Tarif",
      url: "#",
    },
    {
      label: "Unduh Dokumen",
      url: "/unduh-dokumen",
    },
  ];
};
