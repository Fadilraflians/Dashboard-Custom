import type { SlicedPageConfig } from "./portalTypes";

const BUNGA_FILTER_ROWS = [
  [
    { label: "Tahun", placeholder: "2026", type: "select", span: 3 },
    { label: "Rentang Tanggal", placeholder: "26/01/2026 - 02/10/2026", type: "date", span: 9 },
  ],
  [
    { label: "Provinsi", placeholder: "Silahkan pilih provinsi", type: "select", span: 4 },
    { label: "Kabupaten/Kota", placeholder: "Silahkan pilih kabupaten/kota", type: "select", span: 4 },
    { label: "Puskesmas", placeholder: "Silahkan pilih puskesmas", type: "select", span: 4 },
  ],
];

const MUTASI_BUNGA_ROWS = [
  ["1", "26/09/2026", "9888 1234 5678", "Jasa giro rekening pooling BOK periode September", "Kredit", "Rp 0", "Rp 18.450.000"],
  ["2", "25/09/2026", "9888 1234 5678", "Pemindahan jasa giro ke RKUD Kota Depok", "Debet", "Rp 12.320.000", "Rp 0"],
  ["3", "24/09/2026", "9888 1234 5678", "Jasa giro rekening pooling BOK periode berjalan", "Kredit", "Rp 0", "Rp 9.780.000"],
  ["4", "22/09/2026", "9888 1234 5678", "Koreksi pembukuan bunga rekening", "Debet", "Rp 2.450.000", "Rp 0"],
  ["5", "20/09/2026", "9888 1234 5678", "Akumulasi bunga rekening operasional puskesmas", "Kredit", "Rp 0", "Rp 7.240.000"],
];

const MUTASI_RKUD_ROWS = [
  ["1", "26/09/2026", "9888 1234 5678", "Setoran jasa giro ke RKUD Kota Depok", "Debet", "Rp 18.450.000", "Rp 0"],
  ["2", "25/09/2026", "9888 1234 5678", "Validasi penerimaan RKUD atas bunga rekening", "Kredit", "Rp 0", "Rp 12.320.000"],
  ["3", "24/09/2026", "9888 1234 5678", "Pemindahan bunga rekening pooling ke RKUD", "Debet", "Rp 9.780.000", "Rp 0"],
  ["4", "22/09/2026", "9888 1234 5678", "Koreksi transaksi pemindahan RKUD", "Kredit", "Rp 0", "Rp 2.450.000"],
  ["5", "20/09/2026", "9888 1234 5678", "Rekonsiliasi mutasi RKUD periode berjalan", "Debet", "Rp 7.240.000", "Rp 0"],
];

const BUNGA_ROWS = [
  ["26/09/2026", "BG-260926-001", "Jawa Barat", "Puskesmas Cipayung", "Rp 18.450.000", "Belum Dipindahkan"],
  ["25/09/2026", "BG-250926-014", "Jawa Barat", "Puskesmas Tanah Sareal", "Rp 12.320.000", "Dipindahkan ke RKUD"],
  ["24/09/2026", "BG-240926-028", "Jawa Tengah", "Puskesmas Pandanaran", "Rp 9.780.000", "Belum Dipindahkan"],
  ["22/09/2026", "BG-220926-009", "DKI Jakarta", "Puskesmas Matraman", "Rp 15.600.000", "Dipindahkan ke RKUD"],
  ["20/09/2026", "BG-200926-006", "Banten", "Puskesmas Ciledug", "Rp 7.240.000", "Review"],
];

const DGO_FILTER_ROWS = [
  [
    { label: "Tahun", placeholder: "2026", type: "select", span: 6 },
    { label: "Rentang Tanggal", placeholder: "26/01/2026 - 02/10/2026", type: "date", span: 6 },
  ],
];

const DUPLIKASI_RPD_FILTER_ROWS = [
  [
    { label: "Tanggal Log (Range)", placeholder: "26/09/2026 - 02/10/2026", type: "date", span: 3 },
    { label: "Sukses Pembukuan", placeholder: "Semua", type: "select", span: 3 },
    { label: "Status Transaksi", placeholder: "Semua", type: "select", span: 3 },
    { label: "Potensi Duplikat", placeholder: "Ya", type: "select", span: 3 },
  ],
  [
    { label: "Puskesmas", placeholder: "Semua Puskesmas", type: "select", span: 3 },
    { kind: "actions", span: 9 },
  ],
];

const DOWNLOAD_FILE_FILTER_ROWS = [
  [
    { label: "File Name", placeholder: "Type File Name Here", type: "text", span: 6 },
  ],
  [
    { kind: "actions", span: 12 },
  ],
];

const DOWNLOAD_FILE_ROWS = [
  [
    "1",
    "02 Okt 2026 01:31:29",
    "03 Okt 2026 01:31:29",
    "Report_Excel_Summary_Dashboard___02102026013129945",
    "xlsx",
    "Download File",
  ],
];

const DETAIL_FIELDS = [
  { label: "Nama Puskesmas", value: "Puskesmas Cipayung" },
  { label: "Kota / Kabupaten", value: "Kota Depok" },
  { label: "Provinsi", value: "Jawa Barat" },
  { label: "Rekening Giro Pooling", value: "9888 1234 5678" },
  { label: "Cabang Padanan", value: "BNI Depok" },
];

export const MUTASI_BUNGA_PAGE_CONFIG: SlicedPageConfig = {
  title: "Rekapan Mutasi",
  breadcrumb: ["Home", "Dashboard", "List Rekapan Mutasi Bunga"],
  description: "Pantau transaksi debet dan kredit bunga atau jasa giro rekening BOK berdasarkan wilayah dan puskesmas.",
  filterTitle: "Filter Rekapan Mutasi Bunga",
  tableTitle: "List Rekapan Mutasi Bunga",
  tableMeta: "Menampilkan transaksi mutasi bunga periode 26/01/2026 sampai 02/10/2026",
  tableActions: [
    { label: "Report PDF", icon: "file" },
    { label: "Report Excel", icon: "download" },
  ],
  detailFields: DETAIL_FIELDS,
  filterRows: BUNGA_FILTER_ROWS,
  columns: ["No", "Tanggal Transaksi", "Rekening", "Deskripsi", "Tipe Transaksi", "Debet", "Kredit"],
  rows: MUTASI_BUNGA_ROWS,
  type: "ledger",
};

export const MUTASI_RKUD_PAGE_CONFIG: SlicedPageConfig = {
  title: "Rekapan Mutasi",
  breadcrumb: ["Home", "Dashboard", "List Rekapan Mutasi RKUD"],
  description: "Pantau transaksi debet dan kredit pemindahan bunga atau jasa giro ke Rekening Kas Umum Daerah.",
  filterTitle: "Filter Rekapan Mutasi RKUD",
  tableTitle: "List Rekapan Mutasi RKUD",
  tableMeta: "Menampilkan transaksi mutasi RKUD periode 26/01/2026 sampai 02/10/2026",
  tableActions: [
    { label: "Report PDF", icon: "file" },
    { label: "Report Excel", icon: "download" },
  ],
  detailFields: DETAIL_FIELDS,
  filterRows: BUNGA_FILTER_ROWS,
  columns: ["No", "Tanggal Transaksi", "Rekening", "Deskripsi", "Tipe Transaksi", "Debet", "Kredit"],
  rows: MUTASI_RKUD_ROWS,
  type: "ledger",
};

export const BUKTI_KIRIM_JASA_GIRO_PAGE_CONFIG: SlicedPageConfig = {
  title: "Bukti Kirim Jasa Giro",
  breadcrumb: ["Home", "Dashboard", "Bukti Jasa Kirim Jasa Giro"],
  description: "Unduh bukti kirim jasa giro berdasarkan periode, wilayah, dan puskesmas.",
  filterTitle: "Filter Bukti Kirim Jasa Giro",
  filterActions: [
    { label: "Download Bukti Jasa Giro", icon: "download", variant: "primary" },
    { label: "Clear Filter", icon: "refresh", variant: "secondary" },
  ],
  tableTitle: "Bukti Kirim Jasa Giro",
  tableMeta: "Dokumen bukti kirim jasa giro ke kas daerah",
  filterRows: BUNGA_FILTER_ROWS,
  columns: ["Tanggal", "No Referensi", "Provinsi", "Puskesmas", "Nominal", "Status"],
  rows: BUNGA_ROWS.map((row) => [
    ...row.slice(0, 5),
    row[5] === "Dipindahkan ke RKUD" ? "Tersedia" : "Belum Tersedia",
  ]),
  type: "ledger",
  hideTable: true,
};

export const PRINT_DGO_PAGE_CONFIG: SlicedPageConfig = {
  title: "Print Template DGO",
  breadcrumb: ["Home", "Dashboard", "Print Template DGO"],
  description: "Unduh template DGO berdasarkan tahun dan rentang tanggal transaksi.",
  filterTitle: "Filter Print Template DGO",
  filterActions: [
    { label: "Download Template 1", icon: "download", variant: "primary" },
    { label: "Download Template 2", icon: "download", variant: "primary" },
    { label: "Download Template 3", icon: "download", variant: "primary" },
    { label: "Clear Filter", icon: "refresh", variant: "secondary" },
  ],
  tableTitle: "Print Template DGO",
  tableMeta: "Dokumen DGO yang siap dicetak",
  filterRows: DGO_FILTER_ROWS,
  columns: ["Tanggal", "No Referensi", "Provinsi", "Puskesmas", "Nominal", "Status"],
  rows: BUNGA_ROWS.map((row) => [
    ...row.slice(0, 5),
    row[5] === "Review" ? "Review" : "Siap Cetak",
  ]),
  type: "ledger",
  hideTable: true,
};

export const CHECK_DUPLIKASI_RPD_PAGE_CONFIG: SlicedPageConfig = {
  title: "Check Potensi Duplikasi RPD",
  breadcrumb: ["Home", "Check Potensi Duplikasi RPD"],
  description: "Pantau potensi duplikasi log RPD berdasarkan rekening, virtual akun, bulan, dan nilai rencana penarikan.",
  filterTitle: "Filter Potensi Duplikasi RPD",
  filterRows: DUPLIKASI_RPD_FILTER_ROWS,
  filterActions: [
    { label: "Filter", icon: "search", variant: "primary" },
  ],
  tableTitle: "Data Potensi Duplikasi Log RPD",
  tableMeta: "Grouped by: Nomor Rekening, No Virtual Akun, Bulan, Nilai Rencana Penarikan",
  tableNote: "Menampilkan 1 row per group duplikasi (JumlahPercobaan terbesar). Klik tombol plus untuk melihat row duplikat lainnya.",
  tableActions: [],
  columns: [
    "No",
    "Sukses Pembukuan",
    "Potensi Duplikat",
    "Status Transaksi",
    "Bulan",
    "Tahun",
    "Cronjob Date",
    "Nilai Rencana Penarikan",
    "Jumlah Percobaan",
    "Nomor Rekening",
    "No Virtual Akun",
    "Reference Number",
    "Detail",
  ],
  rows: [],
  emptyMessage: "Tidak ada data potensi ditemukan",
  type: "ledger",
};

export const DOWNLOAD_FILE_PAGE_CONFIG: SlicedPageConfig = {
  title: "Download List File",
  breadcrumb: ["Home", "Download List File"],
  description: "Daftar file hasil proses yang siap diunduh.",
  filterTitle: "Search",
  filterRows: DOWNLOAD_FILE_FILTER_ROWS,
  filterActions: [
    { label: "Search", icon: "search", variant: "primary" },
    { label: "Clear", icon: "refresh", variant: "secondary" },
  ],
  tableTitle: "Download List",
  tableMeta: "Menampilkan 1 Sampai 1 Dari 1 Data",
  tableActions: [],
  columns: ["No", "Generated Date", "Expired Date", "File Name", "Extension", "Status"],
  rows: DOWNLOAD_FILE_ROWS,
  type: "ledger",
};
