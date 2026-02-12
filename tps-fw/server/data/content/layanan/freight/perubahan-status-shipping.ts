export const contentPerubahanStatusShipping = async () => {
  return {
    title: "Layanan Perubahan Status Shipping",
    description:
      "Berikut ini adalah alur dari layanan perubahan status shipping",
    file: null,
    flow: [
      {
        order: 1,
        title: "Pelanggan",
        summary:
          "Pelanggan menyerahkan Surat Permohonan Perubahan Status Barang kepada TPS lewat Petugas Layanan Dokumen dilengkapi dengan Dokumen Asli, Warkat Dana, dan Perintah Pengeluaran",
        description: null,
        icon: "/_file/layanan/freight/perubahan-status-shipping/cffwsbb4fmzeibgxq6zc.svg",
      },
      {
        order: 2,
        title: "Petugas Layanan",
        summary:
          "Petugas Layanan Dokumen memeriksa dan mencetak Job Order dan diserahkan kepada Pelanggan, dan menyerahkan 2 lembar salinan kepada Petugas Layanan Operasi",
        description: null,
        icon: "/_file/layanan/freight/perubahan-status-shipping/eth3x8afktcozrre6t1d.svg",
      },
      {
        order: 3,
        title: "Asisten Manajer Operasi",
        summary:
          "Asisten Manajer Operasi CFS atau Petugas yang ditunjuk memeriksa dokumen dan mencetak Container Movement Job (Pekerjaan Pergerakan Petikemas) untuk menarik petikemas dari Lapangan Penumpukan ke CFS",
        description: null,
        icon: "/_file/layanan/freight/perubahan-status-shipping/wtpka6zr9u6xnmrzta6s.svg",
      },
      {
        order: 4,
        title: "Operasi Lapangan",
        summary: "Dermaga menarik petikemas dari Lapangan Penumpukan ke CFS",
        description: null,
        icon: "/_file/layanan/freight/perubahan-status-shipping/f6s9kzxoffgtucdhgp8o.svg",
      },
      {
        order: 5,
        title: "Petugas CFS",
        summary: `Petugas CFS memeriksa keadaan fisik petikemas dan memindahkan isi petikemas`,
        description: null,
        icon: "/_file/layanan/freight/perubahan-status-shipping/ehmbgo5nlvkd0mzngqha.svg",
      },
      {
        order: 6,
        title: "Status",
        summary:
          "Laporan perubahan status petikemas harus dikirimkan kepada Administrasi; Dokumen",
        description: null,
        icon: "/_file/layanan/freight/perubahan-status-shipping/lrnqmqw5cq3kcjgejcc1.svg",
      },
      {
        order: 7,
        title: "Penarikan petikemas kosong",
        summary: `Penarikan petikemas kosong harus diinformasikan kepada Perusahaan Pelayaran dan kepada :
        <ol>
          <li>Perencanaan Lapangan Dermaga</li>
          <li>Operasi Lapangan Dermaga</li>
          <li>Administrasi Dokumen</li>
          </ol>`,
        description: null,
        icon: "/_file/layanan/freight/perubahan-status-shipping/lrnqmqw5cq3kcjgejcc1.svg",
      },
    ],
  };
};
