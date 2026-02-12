import { icon } from "@/comps/icon";
import { IMenu } from "../comps/typing";

const menu: IMenu = {
  // admin: [
  //   { label: "Dashboard", icon: icon.dashboard, url: "/dashboard" },
  //   { label: "Structure", icon: icon.workflow, url: "/structure" },
  //   { label: "Users", icon: icon.user, url: "/users" },
  //   {
  //     label: "Article",
  //     icon: icon.article,
  //     url: "#",
  //     items: [
  //       {
  //         label: "Berita Terkini",
  //         url: "/article/berita-terkini",
  //       },
  //       {
  //         label: "Siaran Pers",
  //         url: "/article/siaran-pers",
  //       },
  //       { label: "Gallery", url: "/article/gallery" },
  //       { label: "Flow Chart", url: "/article/flow-chart" },
  //     ],
  //   },
  // ],
  // moderator: [
  //   { label: "Dashboard", icon: icon.home, url: "/dashboard" },
  //   { label: "Maklumat", icon: icon.megaphone, url: "/maklumat" },
  //   { label: "Sasaran", icon: icon.pointer, url: "/sasaran" },
  //   { label: "Rangkuman", icon: icon.note, url: "/rangkuman" },
  //   { label: "TJSL", icon: icon.heart, url: "/tjsl" },
  //   { label: "Tarif", icon: icon.wallet, url: "/tarif" },
  //   { label: "Unduh Dokumen", icon: icon.download, url: "/unduh-dokumen" },
  //   { label: "User", icon: icon.manage_user, url: "/user", position: 'bottom' },
  //   { label: "Setting", icon: icon.setting, url: "/setting", position: 'bottom' },
  //   {
  //     label: "Article",
  //     icon: icon.article,
  //     url: "#",
  //     items: [
  //       {
  //         label: "Berita Terkini",
  //         url: "/article/berita-terkini",
  //       },
  //       {
  //         label: "Siaran Pers",
  //         url: "/article/siaran-pers",
  //       },
  //       { label: "Gallery", url: "/article/gallery" },
  //       { label: "Flow Chart", url: "/article/flow-chart" },
  //     ],
  //   },
  //   {
  //     label: "Profile",
  //     icon: icon.building,
  //     url: "#",
  //     items: [
  //       {
  //         label: "Tentang Kami",
  //         url: "/profile/tentang-kami",
  //       },
  //       {
  //         label: "Manajemen",
  //         url: "/profile/manajemen",
  //       },
  //       { label: "Moto", url: "/profile/moto" },
  //       { label: "Lokasi", url: "/profile/lokasi" },
  //     ],
  //   },
  //   {
  //     label: "Layanan Peti Kemas",
  //     icon: icon.box,
  //     url: "#",
  //     items: [
  //       {
  //         label: "Terminal Service Agreement",
  //         url: "/layanan/terminal-service-agreement",
  //       },
  //       {
  //         label: "Layanan Penerimaan Petikemas",
  //         url: "/layanan/penerimaan-petikemas",
  //       },
  //       {
  //         label: "Layanan Pemuatan Petikemas",
  //         url: "/layanan/pemuatan-petikemas",
  //       },
  //       {
  //         label: "Layanan Pembongakaran Petikemas",
  //         url: "/layanan/pembongkaran-petikemas",
  //       },
  //       {
  //         label: "Layanan Pengeluaran Petikemas",
  //         url: "/layanan/pengeluaran-petikemas",
  //       },
  //     ],
  //   },
  //   {
  //     label: "Layanan Freight Station",
  //     icon: icon.package,
  //     url: "#",
  //     items: [
  //       {
  //         label: "Layanan Penerimaan Barang",
  //         url: "/layanan/penerimaan-barang",
  //       },
  //       {
  //         label: "Layanan Pengeluaran Barang",
  //         url: "/layanan/pengeluaran-barang",
  //       },
  //       {
  //         label: "Layanan Penumpukan Barang",
  //         url: "/layanan/penumpukan-barang",
  //       },
  //       {
  //         label: "Layanan Perubahan Status Shiping",
  //         url: "/layanan/perubahan-status-shiping",
  //       },
  //       {
  //         label: "Layanan Pemeriksaan Bea Cukai",
  //         url: "/layanan/pemeriksaan-bea-cukai",
  //       },
  //     ],
  //   },
  //   {
  //     label: "Fasilitas",
  //     icon: icon.block,
  //     url: "#",
  //     items: [
  //       {
  //         label: "Dermaga",
  //         url: "/fasilitas/dermaga",
  //       },
  //       {
  //         label: "Lapangan",
  //         url: "/fasilitas/lapangan",
  //       },
  //       {
  //         label: "Peralatan",
  //         url: "/fasilitas/peralatan",
  //       },
  //       {
  //         label: "Terminal Operating System",
  //         url: "/fasilitas/terminal-operating-system",
  //       },
  //     ],
  //   },
  //   {
  //     label: "Kebijakan",
  //     icon: icon.policy,
  //     url: "#",
  //     items: [
  //       {
  //         label: "Kebijakan Integrasi",
  //         url: "/kebijakan/integrasi",
  //       },
  //       {
  //         label: "Penyataan Penerapan Sistem Manajemen Anti Penyuapan (SMAP)",
  //         url: "/kebijakan/penerapan-anti-penyuapan",
  //       },
  //     ],
  //   },
  //   {
  //     label: "Jadwal",
  //     icon: icon.ship,
  //     url: "#",
  //     items: [
  //       {
  //         label: "Jadwal Sandar Kapal",
  //         url: "/jadwal/sandar",
  //       },
  //       {
  //         label: "Jadwal Kapal",
  //         url: "/jadwal/kapal",
  //       },
  //     ],
  //   },
  //   {
  //     label: "Sosialisasi dan Pelaporan",
  //     icon: icon.volume,
  //     url: "#",
  //     items: [
  //       {
  //         label: "Gratifikasi",
  //         url: "/sosialisasi-pelaporan/gratifikasi",
  //       },
  //       {
  //         label: "Komitmen",
  //         url: "/sosialisasi-pelaporan/komitmen",
  //       },
  //       {
  //         label: "Sistem Pelaporan Pelanggaran",
  //         url: "/sosialisasi-pelaporan/sistem-pelaporan-pelanggaran",
  //       },
  //     ],
  //   },
  // ],
};

export default menu;
