export const contentPemeriksaanBeaCukai = async () => {
  return {
    title: "Pemeriksaan Bea Cukai",
    description: "Berikut ini adalah alur dari pemeriksaan bea cukai",
    file: null,
    flow: [
      {
        order: 1,
        title: "Pelanggan",
        summary:
          "Pelanggan menyerahkan Surat Permohonan Behandle Barang kepada TPS lewat Petugas Layanan Administrasi dilengkapi dengan Dokumen Asli, Warkat Dana, dan Perintah Pengeluaran.",
        description: null,
        icon: "/_file/layanan/freight/pemeriksaan-bea-cukai/cffwsbb4fmzeibgxq6zc.svg",
      },
      {
        order: 2,
        title: "Petugas Administrasi",
        summary:
          "Petugas Administrasi memeriksa dan mencetak Job Order dan menyerahkan kepada Pelanggan, dengan salinan Perintah Pengeluaran, dan menyerahkan 2 lembar salinan kepada Petugas Layanan Operasi.",
        description: null,
        icon: "/_file/layanan/freight/pemeriksaan-bea-cukai/eth3x8afktcozrre6t1d.svg",
      },
      {
        order: 3,
        title: "Job Order",
        summary:
          "Pelanggan menyerahkan Job Order kepada CFS Operations Assistant Manager",
        description: null,
        icon: "/_file/layanan/freight/pemeriksaan-bea-cukai/wtpka6zr9u6xnmrzta6s.svg",
      },
      {
        order: 4,
        title: "Asisten Manajer Operasi",
        summary:
          "Asisten Manajer Operasi CFS atau Staff yang ditunjuk memeriksa dokumen dan menerbitkan Container Movement Job (Pekerjaan Pergerakan Petikemas) untuk menarik petikemas dari Lapangan Penumpukan ke CFS",
        description: null,
        icon: "/_file/layanan/freight/pemeriksaan-bea-cukai/f6s9kzxoffgtucdhgp8o.svg",
      },
      {
        order: 5,
        title: "Pemeriksaan fisik petikemas",
        summary: `Setelah petikemas telah dipindahkan ke CFS, keadaan fisik petikemas akan diperiksa sebelum pemeriksaan Behandle dilakukan.`,
        description: null,
        icon: "/_file/layanan/freight/pemeriksaan-bea-cukai/ehmbgo5nlvkd0mzngqha.svg",
      },
      {
        order: 6,
        title: "Laporan",
        summary:
          "Setelah pengeluaran barang telah selesai dilakukan, laporan harus disiapkan dan diketahui oleh Petugas CFS, dan disetujui oleh Pelanggan.",
        description: null,
        icon: "/_file/layanan/freight/pemeriksaan-bea-cukai/lrnqmqw5cq3kcjgejcc1.svg",
      },
    ],
  };
};
