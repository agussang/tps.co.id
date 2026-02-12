export const contentPenerimaanPetikemas = async () => {
  return {
    title: "Layanan Penerimaan Petikemas Internasional",
    description:
      "Layanan penerimaan petikemas adalah layanan yang memindahkan barang dari tempat penumpukan di gudang atau lapangan penumpukan, dan menyerahkannya sampai tersusun di atas kendaraan di pintu gudang atau lapangan penumpukan.",
    flow: [
      {
        order: 1,
        title: "Agen Pelayaran",
        summary:
          "Mengirimkan data COPARN ke terminal melalui EDI atau Web Access TPS",
        description: `Perusahaan Pelayaran mengirimkan data COPARN ke PT Terminal Petikemas Surabaya, baik melalui Web Access (file Excel) maupun melalui FTP - File Transfer Protocol (file EDI).`,
        icon: "/_file/layanan/penerimaan-petikemas/cffwsbb4fmzeibgxq6zd.svg",
      },
      {
        order: 2,
        title: "Pengguna Jasa",
        summary:
          "Membuat job order secara online di aplikasi Clique247 menggunakan data COPARN dan dokumen Bea Cukai, Sistem akan menahan dana di rekening pengguna jasa",
        description: `Pengguna jasa membuat Job Order melalui aplikasi Clique247, mencetak E-CEIR (Electronic Container Equipment Intercharge Receipt), dan mendistribusikan E-CEIR kepada Pengemudi Head Truck.`,
        icon: "/_file/layanan/penerimaan-petikemas/eth3x8afktcozrre6t1d.svg",
      },
      {
        order: 3,
        title: "Gate Operasi",
        summary:
          "Pengemudi truk menuju gate in dan menempelkan kartu identitas pengemudi di Kios-K",
        description: `Pengemudi Head Truck menuju ke Gate-In (Gerbang Masuk) bersama petikemasnya dan menempelkan QR-Code yang terdapata pada E-CEIR ke QR-Code Reader yang ada di Gate.`,
        icon: "/_file/layanan/penerimaan-petikemas/wtpka6zr9u6xnmrzta6s.svg",
      },
      {
        order: 4,
        title: "Gate Operasi",
        summary:
          "Gate inspektor melakukan pengecekan fisik kontainer, menginputkan nomor seal dan selanjutnya melakukan proses konfirmasi data",
        description: `Petugas Tally Pre Gate-In memasukkan nomor polisi truk dan nomor BAT dan mengkonfirmasi nomor petikemas melalui HHT. Setelah informasi detil petikemas tampil pada HHT, petugas Tally Pre Gate-In memeriksa kesesuaian antara fisik dan informasi yang tampil pada HHT. Petugas Tally Pre Gate-In memasukkan MGW (Maximum Gross Weight)dan Nomor Segel, kemudian menekan tombol Refresh pada HHT untuk merekam berat truk dan muatan petikemasnya.`,
        icon: "/_file/layanan/penerimaan-petikemas/f6s9kzxoffgtucdhgp8o.svg",
      },
      {
        order: 5,
        title: "Gate Operasi",
        summary:
          "Pengemudi truk menuju ke lokasi (blok atau exception area) sesuai dengan Job Slip",
        description: `Pengemudi Head Truck menempelkan Kartu identitas ke RFID Reader (Radio Frequency Identification Device), mengambil Job Slip yang tercetak dan menuju ke lokasi penumpukan yang seusai yang tertulis pada Job Slip.`,
        icon: "/_file/layanan/penerimaan-petikemas/ehmbgo5nlvkd0mzngqha.svg",
      },
      {
        order: 6,
        title: "Operasi Lapangan",
        summary: "RTG memindahkan petikemas dari truk ke lapangan penumpukan",
        description: `Yard Dispatcher mengirimkan perintah kerja kepada RTG/RS melalui VMT (vehicle Mounted Terminal) untuk memindahkan petikemas dari truk ke lapangan penumpukan. Operator RTG/RS memindahkan petikemas dan truk ke lapangan penumpukan sesuai dengan instruksi yang ditampilkan pada VMT.`,
        icon: "/_file/layanan/penerimaan-petikemas/lrnqmqw5cq3kcjgejcc1.svg",
      },
      {
        order: 7,
        title: "Gate Operasi",
        summary:
          "Pengemudi truk menempelkan identitas pengemudi di mini Kios-K dan mengambil hasil cetak slip timbangan",
        description: `Setelah petikemas selesai ditumpuk, Pengemudi Head Truck menuju Gate-Out (Gerbang Keluar) untuk melakukan proses Gate-Out. Pengemudi Head Truck menyerahkan Job Slip kepada Personil Gate dan menempelkan Kartu identitas ke RFID Reader. Di jembatan timbang, truk akan ditimbang kembali dan hasilnya akan tercatat di sistem PT Terminal Petikemas Surabaya setelah proses konfirmasi. Personil Gate menyerahkan bukti timbang kepada Pengemudi Head Truck. Pengemudi Head Truck keluar meninggalkan area PT Terminal  Petikemas Surabaya.`,
        icon: "/_file/layanan/penerimaan-petikemas/eozi44ncbhzeetzpqrar.svg",
      },
    ],
    flow_caption: "Tata Cara Peneriman Petikemas",
    file: `/_file/layanan/penerimaan-petikemas/tps_book.pdf`,
    note: `Ketika pemuatan selesai, pada akhir shift, petugas tally dermaga melaporkan kepada superintenden dermaga
        `,
    istilah: [
      {
        title: "COPARN",
        description: "Container Announcement Message",
      },
      {
        title: "EDI",
        description: "Electronic Data Interchage",
      },
      {
        title: "EXCEPTION AREA",
        description: "Area Perbaikan Data Petikemas",
      },
    ],
  };
};
