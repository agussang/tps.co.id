export const contentPengeluaranBarang = async () => {
  return {
    title: "Layanan Pengeluaran Barang",
    description: 'Berikut ini adalah alur dari layanan pengeluaran barang',
    file: null,
    flow: [
      {
        order: 1,
        title: "Pelanggan",
        summary:
          "Pelanggan menyerahkan Surat Permohonan Pengeluaran Barang kepada TPS lewat Petugas Layanan Dokumen, dilengkapi dengan Dokumen Asli, Warkat Dana, dan Perintah Pengeluaran.",
        description: null,
        icon: "/_file/layanan/freight/pengeluaran-barang/cffwsbb4fmzeibgxq6zc.svg",
      },
      {
        order: 2,
        title: "Petugas Layanan",
        summary:
          "Petugas Layanan Dokumen memeriksa dan mencetak Job Order menyerahkan kepada Pelanggan, dan menyerahkan 2 lembar salinan kepada Petugas Layanan Operasi",
        description: null,
        icon: "/_file/layanan/freight/pengeluaran-barang/eth3x8afktcozrre6t1d.svg",
      },
      {
        order: 3,
        title: "Pelanggan",
        summary:
          "Pelanggan menyerahkan Job Order atau SPPB (Surat Pemberitahuan Ekspor Barang) dan Order Pengeluaran  yang telah disetujui oleh CFS Operations",
        description: null,
        icon: "/_file/layanan/freight/pengeluaran-barang/wtpka6zr9u6xnmrzta6s.svg",
      },
      {
        order: 4,
        title: "Asisten Manajer Operasi",
        summary:
          "Asisten Manajer Operasi CFS memeriksa dokumen dan mempersiapkan pengeluaran barang",
        description: null,
        icon: "/_file/layanan/freight/pengeluaran-barang/f6s9kzxoffgtucdhgp8o.svg",
      },
      {
        order: 5,
        title: "Pengeluaran Barang",
        summary:
          "Setelah pengeluaran barang telah selesai dilakukan, laporan harus disiapkan dan diketahui oleh Petugas CFS, dan disetujui oleh Pelanggan",
        description: null,
        icon: "/_file/layanan/freight/pengeluaran-barang/ehmbgo5nlvkd0mzngqha.svg",
      },
      {
        order: 6,
        title: "Head Truck",
        summary:
          "Head Truck dan barang keluar melalui Out-Gate (Gerbang Keluar).",
        description: null,
        icon: "/_file/layanan/freight/pengeluaran-barang/lrnqmqw5cq3kcjgejcc1.svg",
      },
    ],
  };
};
