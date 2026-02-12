export const contentPenumpukanBarang = async () => {
  return {
    title: "Layanan Penumpukan Barang",
    description: "Berikut ini adalah alur dari layanan penumpukan barang",
    file: null,
    flow: [
      {
        order: 1,
        title: "Pelanggan",
        summary:
          "Pelanggan menyerahkan Surat Permohonan Penumpukan Barang kepada TPS lewat  Petugas Layanan Dokumen dengan dilengkapi dengan Dokumen Asli, Warkat Dana, dan Daftar Barang",
        description: null,
        icon: "/_file/layanan/freight/penumpukan-barang/cffwsbb4fmzeibgxq6zc.svg",
      },
      {
        order: 2,
        title: "Petugas Layanan",
        summary:
          "Petugas Layanan Dokumen memeriksa dan mencetak Job Order dan diserahkan ke Pelanggan dan menyerahkan 2 lembar salinan Petugas Layanan Operasi",
        description: null,
        icon: "/_file/layanan/freight/penumpukan-barang/eth3x8afktcozrre6t1d.svg",
      },
      {
        order: 3,
        title: "Asisten Manajer Operasi",
        summary:
          "Asisten Manajer Operasi CFS mempersiapkan petikemas kosong yang akan digunakan untuk penumpukan sesuai dengan permohonan Pelanggan",
        description: null,
        icon: "/_file/layanan/freight/penumpukan-barang/wtpka6zr9u6xnmrzta6s.svg",
      },
      {
        order: 4,
        title: "Kedatangan Kapal",
        summary:
          "Paling lambat 12 (dua belas) jam sebelum kedatangan kapal, barang-barang terkait harus sudah selesai ditumpuk",
        description: null,
        icon: "/_file/layanan/freight/penumpukan-barang/f6s9kzxoffgtucdhgp8o.svg",
      },
      {
        order: 5,
        title: "Asisten Manajer Operasi",
        summary: `Asisten Manajer Operasi CFS mempersiapkan Nota Penarikan Ekspor kepada :
        <ol>
          <li>Perencanaan Lapangan Dermaga</li>
          <li>Operasi Lapangan Dermaga</li>
          <li>Administrasi Dokumen</li>
        </ol>`,
        description: null,
        icon: "/_file/layanan/freight/penumpukan-barang/ehmbgo5nlvkd0mzngqha.svg",
      },
      {
        order: 6,
        title: "Status",
        summary:
          "Layanan untuk Petikemas dengan status LCL sama dengan layanan untuk Petikemas dengan status FCL",
        description: null,
        icon: "/_file/layanan/freight/penumpukan-barang/lrnqmqw5cq3kcjgejcc1.svg",
      },
    ],
    istilah: [
      {
        title: "LCL",
        description: "Less Container Load = Muatan Petikemas Campuran",
      },
      {
        title: "FCL",
        description: "Full Container Load = Muatan Petikemas Penuh",
      },
    ],
  };
};
