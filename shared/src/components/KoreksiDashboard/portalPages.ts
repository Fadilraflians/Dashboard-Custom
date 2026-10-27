interface KoreksiTableConfig {
  tableTitle: string;
  tableMeta: string;
  addLabel: string;
  columns: string[];
  rows: string[][];
}

export const PAGE_CONFIGS: Record<string, KoreksiTableConfig> = {
  "menu-koreksi/koreksi-giro": {
    tableTitle: "List Koreksi Giro",
    tableMeta: "Menampilkan data koreksi giro dalam rupiah",
    addLabel: "Tambah Data",
    columns: [
      "No",
      "Action",
      "Tanggal Transaksi",
      "Deskripsi",
      "Tipe Transaksi",
      "Kredit",
      "Debit",
    ],
    rows: [
      [
        "1",
        "",
        "01/10/2026",
        "Koreksi transaksi giro pooling periode Oktober",
        "Kredit",
        "Rp 18.450.000",
        "Rp 0",
      ],
      [
        "2",
        "",
        "30/09/2026",
        "Penyesuaian pemindahan jasa giro ke RKUD",
        "Debit",
        "Rp 0",
        "Rp 12.320.000",
      ],
      [
        "3",
        "",
        "28/09/2026",
        "Koreksi pembukuan transaksi giro puskesmas",
        "Kredit",
        "Rp 9.780.000",
        "Rp 0",
      ],
    ],
  },
  "menu-koreksi/koreksi-va": {
    tableTitle: "List Koreksi VA",
    tableMeta: "Menampilkan data koreksi VA dalam rupiah",
    addLabel: "Tambah Data",
    columns: [
      "No",
      "Action",
      "Tanggal Transaksi",
      "Deskripsi",
      "Tipe Transaksi",
      "Kredit",
      "Debit",
    ],
    rows: [
      [
        "1",
        "",
        "01/10/2026",
        "Koreksi transaksi virtual account periode Oktober",
        "Kredit",
        "Rp 24.500.000",
        "Rp 0",
      ],
      [
        "2",
        "",
        "30/09/2026",
        "Penyesuaian transaksi VA puskesmas",
        "Debit",
        "Rp 0",
        "Rp 11.750.000",
      ],
      [
        "3",
        "",
        "28/09/2026",
        "Koreksi alokasi menu kegiatan pada rekening VA",
        "Kredit",
        "Rp 7.900.000",
        "Rp 0",
      ],
    ],
  },
};
