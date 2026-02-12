export const contentPengeluaranPetikemas = async () => {
  return {
    title: "Layanan Pengiriman Petikemas Internasional",
    description:
      "Layanan pengiriman petikemas adalah layanan pengiriman angkutan laut dengan volume yang sedikit. Layanan ini menggabungkan banyak barang kiriman dari berbagai pengirim lainnya yang dimuat dalam satu kontainer.",
    flow: [
      {
        order: 1,
        title: "Agen Pelayaran",
        summary:
          "Mengirimkan data DO Online ke terminal melalui EDI atau Web Access TPS",
        description: `Perusahaan Pelayaran mengirimkan file Delivery Order Online ke PT Terminal Petikemas Surabaya untuk setiap petikemas yang akan dikeluarkan dari terminal. File Delivery Order Online dapat dikirimkan menggunakan format EDI atau diunggah pada Web Access PT Terminal Petikemas Surabaya.`,
        icon: "/_file/layanan/pengeluaran-petikemas/cffwsbb4fmzeibgxq6zc.svg",
      },
      {
        order: 2,
        title: "Pengguna Jasa",
        summary:
          "Melakukan proses pembuatan job order secara online di aplikasi Clique247 berdasarkan data DO Online dan dokumen Bea Cukai; Sistem akan menahan dana di rekening pengguna jasa; Pengguna jasa mencetak job order di aplikasi Clique247 & menyerahkan ke pengemudi truk",
        description: `Melalui aplikasi Clique247, Pengguna jasa dapat membuat Job Order Pengeluaran Petikemas dengan menginput data. Aplikasi Clique247 memproses data yang diinputkan oleh Pengguna jasa. Pengguna jasa wajib mengecek data petikemas yang ditampilkan oleh sistem. Pengguna jasa mendistribusikan Job Order yang telah dicetak kepada pengemudi Truknya sebelum masuk ke dalam terminal.`,
        icon: "/_file/layanan/pengeluaran-petikemas/eth3x8afktcozrre6t1d.svg",
      },
      {
        order: 3,
        title: "Gate Operasi",
        summary:
          "Pengemudi truk menuju gate in dan menyerahkan job order /CEIR ke petugas gate",
        description: `Pengemudi Truk yang telah memiliki Job Order menuju ke Gate-In dan menyerahkan Job Order kepada Personil Gate. `,
        icon: "/_file/layanan/pengeluaran-petikemas/wtpka6zr9u6xnmrzta6s.svg",
      },
      {
        order: 4,
        title: "Gate Operasi",
        summary:
          "Petugas gatem emindai barcode CEIR dan menempelkan kartu identitas pengemudi di mesin pembaca RFID",
        description: `Personil Gate-In memindai kode batang Job Order, menginput nomor BAT dan nomor polisi, serta mencetak Job Slip untuk Pengemudi Truk.`,
        icon: "/_file/layanan/pengeluaran-petikemas/f6s9kzxoffgtucdhgp8o.svg",
      },
      {
        order: 5,
        title: "Gate Operasi",
        summary: "Pengemudi truk menuju ke lokasi sesuai dengan job slip",
        description: `Pengemudi Truk yang telah memiliki Job Slip menuju ke blok utama impor sesuai yang tertera di dalam Job Slip.`,
        icon: "/_file/layanan/pengeluaran-petikemas/ehmbgo5nlvkd0mzngqha.svg",
      },
      {
        order: 6,
        title: "Operasi Lapangan",
        summary: "RTG memindahkan petikemas dari lapangan penumpukan ke truk",
        description: `Operator RTG/RS memindahkan petikemas dari blok utama impor ke atas chassis truk dan mengkonfirmasinya melalui VMT.`,
        icon: "/_file/layanan/pengeluaran-petikemas/lrnqmqw5cq3kcjgejcc1.svg",
      },
      {
        order: 7,
        title: "Gate Operasi",
        summary:
          "Petugas gate menempelkan kartu identitas pengemudi di mesin pembaca RFID, memeriksa kesesuaian data pada sistem dengan fisik petikemas dan melakukan konfirmasi data",
        description: `Setelah petikemas selesai ditumpuk, Pengemudi Head Truck menuju Gate-Out (Gerbang Keluar) untuk melakukan proses Gate-Out. Pengemudi Head Truck menyerahkan Job Slip kepada Personil Gate dan menempelkan Kartu identitas ke RFID Reader. Di jembatan timbang, truk akan ditimbang kembali dan hasilnya akan tercatat di sistem PT Terminal Petikemas Surabaya setelah proses konfirmasi. Personil Gate menyerahkan bukti timbang kepada Pengemudi Head Truck. Pengemudi Head Truck keluar meninggalkan area PT Terminal  Petikemas Surabaya.`,
        icon: "/_file/layanan/pengeluaran-petikemas/eozi44ncbhzeetzpqrar.svg",
      },
    ],
    flow_caption: "Tata Cara Pengiriman Petikemas",
    file: `/_file/layanan/pengeluaran-petikemas/tps_book.pdf`,
    note: `Pengemudi Truk menuju ke Gate-Out dan mengembalikan Job Slip kepada Personil Gate-Out. Personil Gate-Out mengecek apakah data fisik petikemas dengan data di dalam sistem telah sesuai. Apabila data fisik petikemas dan data di dalam sistem telah sesuai, Personil Gate-Out mengkonfirmasi bahwa proses telah selesai.`,
    istilah: [
      {
        title: "CEIR",
        description: "Container & Equipment Interchange Receipt",
      },
      {
        title: "DO",
        description: "Delivery Order",
      },
      {
        title: "EDI",
        description: "Electronic Data Interchange",
      },
    ],
  };
};
