import { contentBongkarPetikemas } from "./bongkar-petikemas";

export const contentPemuatanPetikemas = async () => {
  return {
    title: "Layanan Pemuatan Petikemas Internasional",
    description:
      "Layanan pemuatan petikemas (loading) adalah layanan kegiatan pemuatan petikemas dari yard menuju dermaga hingga dimuat di atas kapal. ",
    flow: [
      {
        order: 1,
        title: "Pengguna Jasa",
        summary:
          "Perusahaan Pelayaran mengirimkan dokumen-dokumen yang terkait dengan pemuatan petikemas",
        description: null,
        icon: "/_file/layanan/pemuatan-petikemas/cffwsbb4fmzeibgxq6zc.svg",
      },
      {
        order: 2,
        title: "Perencanaan Lapangan dan Dermaga",
        summary:
          "Menerima dan memeriksa kelengkapan dokumen dari pelanggan dan mempersiapkan bahan Rapat Operasional Harian",
        description: null,
        icon: "/_file/layanan/pemuatan-petikemas/eth3x8afktcozrre6t1d.svg",
      },
      {
        order: 3,
        title: "Perencanaan Lapangan dan Dermaga",
        summary:
          "Bersama Departemen Peralatan mengadakan Rapat Operasional Harian untuk merencanakan kegiatan bongkar muat",
        description: null,
        icon: "/_file/layanan/pemuatan-petikemas/wtpka6zr9u6xnmrzta6s.svg",
      },
      {
        order: 4,
        title: "Perencanaan Lapangan dan Dermaga",
        summary:
          "Petugas Perencanaan Kapal menerima Rencana Pra-Penumpukan dari Pelanggan untuk mempersiapkan Antrian Kerja Pemuatan berdasarkan data petikemas di sistem",
        description: null,
        icon: "/_file/layanan/pemuatan-petikemas/f6s9kzxoffgtucdhgp8o.svg",
      },
      {
        order: 5,
        title: "Control Center",
        summary:
          "Petugas Control Center memproses Antrian Kerja Pemuatan Kapal ke dalam sistem komputer",
        description: null,
        icon: "/_file/layanan/pemuatan-petikemas/ehmbgo5nlvkd0mzngqha.svg",
      },
      {
        order: 6,
        title: "Operasi Lapangan",
        summary:
          "Operator RTG memindahkan petikemas dari lapangan penumpukan ke ITV sesuai dengan perintan VMT",
        description: null,
        icon: "/_file/layanan/pemuatan-petikemas/lrnqmqw5cq3kcjgejcc1.svg",
      },
      {
        order: 7,
        title: "Operasi Lapangan",
        summary:
          "Setelah petikemas berada di atas chassis, ITV menuju dermaga sesuai dengan perintah VMT",
        description: null,
        icon: "/_file/layanan/pemuatan-petikemas/eozi44ncbhzeetzpqrar.svg",
      },
      {
        order: 8,
        title: "Operasi Dermaga",
        summary:
          "Setelah ITV sampai di bawah CC yang dituju, Operator CC mengangkat petikemas dan dimuat ke atas kapal; Petugas Tally Dermaga mengkonfirmasi melalui HHT/Teklogic",
        description: null,
        icon: "/_file/layanan/pemuatan-petikemas/eozi44ncbhzeetzpqrar.svg",
      },
      {
        order: 9,
        title: "Operasi Dermaga",
        summary:
          "Setelah petikemas berada di atas kapal, ITV kembali ke Lapangan Penumpukan untuk mengambil petikemas lain hingga proses pemuatan selesai",
        description: null,
        icon: "/_file/layanan/pemuatan-petikemas/eozi44ncbhzeetzpqrar.svg",
      },
    ],
    flow_caption: null,
    file: null,
    note: `Ketika pemuatan selesai, pada akhir shift, petugas tally dermaga melaporkan kepada superintenden dermaga
    `,
    istilah: [
      {
        title: "CVIA",
        description: "Container Vessel Identification Advice",
      },
      {
        title: "LWQ",
        description: "Loading Work Queue",
      },
    ],
  };
};
