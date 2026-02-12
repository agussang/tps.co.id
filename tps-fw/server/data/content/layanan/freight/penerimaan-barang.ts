export const contentPenerimaanBarang = async () => {
  return {
    title: "Layanan Penerimaan Barang",
    description: 'Berikut ini adalah alur dari layanan penerimaan barang',
    file: null,
    flow: [
      {
        order: 1,
        title: "Pelanggan",
        summary:
          "Pelanggan menyerahkan Surat Permohonan Penerimaan Barang kepada Manajer Senior Operasi, dilampiri dengan Dokumen Asli,Warkat Dana, Perintah Pengeluaran (DO = Delivery Order), SPPB (Surat Pemberitahuan Pengeluaran Barang), paling lambat 36 jam sebelum kedatangan kapal.",
        description: null,
        icon: "/_file/layanan/freight/penerimaan-barang/cffwsbb4fmzeibgxq6zc.svg",
      },
      {
        order: 2,
        title: "Petugas Layanan",
        summary:
          "Petugas Layanan Dokumen memeriksa dan mencetak Job Order, menyerahkannya kepada Pelanggan, dan memberikan 2 salinan kepada Petugas Layanan Operasi",
        description: null,
        icon: "/_file/layanan/freight/penerimaan-barang/eth3x8afktcozrre6t1d.svg",
      },
      {
        order: 3,
        title: "Asisten Manajer Operasi",
        summary:
          "Asisten Manajer Operasi CFS merencanakan lokasi penempatan barang di CFS",
        description: null,
        icon: "/_file/layanan/freight/penerimaan-barang/wtpka6zr9u6xnmrzta6s.svg",
      },
      {
        order: 4,
        title: "Petugas CFS",
        summary:
          "Petugas CFS memeriksa dokumen dan keadaan fisik barang dan mencatatnya dalam Receiving Tally Sheet (Lembar Tally Penerimaan), dan harus diketahui oleh Pelanggan",
        description: null,
        icon: "/_file/layanan/freight/penerimaan-barang/f6s9kzxoffgtucdhgp8o.svg",
      },
      {
        order: 5,
        title: "Tanda Pengenal Surveyor",
        summary:
          "Setiap barang yang memasuki CFS harus dilengkapi/dilindungi CTPS (Catatan Tanda Pengenal Surveyor) atau salinan PEB (Pemberitahuan Ekspor Barang), untuk diperiksa oleh Petugas Bea Cukai",
        description: null,
        icon: "/_file/layanan/freight/penerimaan-barang/ehmbgo5nlvkd0mzngqha.svg",
      },
      {
        order: 6,
        title: "Barang Disimpan",
        summary:
          "Paling lambat 36 (tiga puluh enam) jam sebelum kedatangan kapal, setiap barang yang akan ditumpuk harus disimpan di dalam CFS",
        description: null,
        icon: "/_file/layanan/freight/penerimaan-barang/lrnqmqw5cq3kcjgejcc1.svg",
      },
    ],
  };
};
