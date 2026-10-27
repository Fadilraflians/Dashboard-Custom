"use client";

import { useState, type ReactNode } from "react";
import Icon from "../PusatInformasi/Icon";
import legacyStyles from "./table.module.css";
import { PAGE_CONFIGS } from "./portalPages";
import styles from "./page.module.css";

const detailCards = [
  ["Nama Puskesmas", "Puskesmas Cipayung", "grid"],
  ["Kota / Kabupaten", "Kota Depok", "home"],
  ["Provinsi", "Jawa Barat", "book"],
  ["Rekening Giro Pooling", "1234567890", "wallet"],
  ["Cabang Padanan", "KCP Depok Timur", "pin"],
];

const stats = [
  ["Total Transaksi", "Rp 24.680.000.000", "Periode 01-20 Okt 2026", "report", "neutral"],
  ["Perlu Dikoreksi", "14 Transaksi", "Perlu Penyesuaian", "alert", "warning"],
  ["Sudah Dikoreksi", "128 Transaksi", "Selesai Diproses", "check", "success"],
  ["Menunggu Verifikasi", "7 Transaksi", "Antrian SP2D Bank", "info", "blue"],
];

export function SharedCardBoundary({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

const legacyTable = PAGE_CONFIGS["menu-koreksi/koreksi-giro"];

function Field({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <label className={`${styles.field} ${wide ? styles.fieldWide : ""}`}>
      <span>{label}</span>
      <div>
        {label.toLowerCase().includes("tanggal") ? <Icon name="calendar" size={14} /> : null}
        <p>{value}</p>
        <Icon name="chevronDown" size={14} />
      </div>
    </label>
  );
}

export default function KoreksiGiroPage() {
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <div className={styles.page}>
      <div className={styles.breadcrumb}>
        <Icon name="home" size={13} />
        <span>Home</span>
        <span>/</span>
        <span>Menu Koreksi</span>
        <span>/</span>
        <strong>Koreksi Giro</strong>
      </div>

      <header className={styles.pageHead}>
        <div>
          <h1>
            Koreksi Giro <span>TA 2026 Aktif</span>
          </h1>
          <p>Kelola dan koreksi transaksi rekening giro Puskesmas secara terstruktur dan terverifikasi.</p>
        </div>
        <div className={styles.headActions}>
          <button
            type="button"
            className={`${styles.secondaryBtn} ${filterOpen ? styles.searchActive : ""}`}
            aria-expanded={filterOpen}
            onClick={() => setFilterOpen((open) => !open)}
          >
            <Icon name="search" size={15} /> Pencarian
          </button>
          <button type="button" className={styles.primaryBtn}>
            <Icon name="download" size={15} /> Export to PDF
          </button>
        </div>
      </header>

      {filterOpen && <section className={styles.filterPanel}>
        <div className={styles.filterTop}>
          <div>
            <h2>
              <Icon name="filter" size={17} /> Parameter Filter Data & Anggaran
            </h2>
            <p>Saring transaksi berdasarkan tahun, rentang tanggal, wilayah, dan unit puskesmas.</p>
          </div>
          <span>TA 2026 Aktif</span>
        </div>

        <div className={styles.filterBody}>
          <div className={styles.filterGrid}>
            <Field label="Tahun Anggaran" value="2026" />
            <Field label="Rentang Tanggal" value="01/10/2026 to 20/10/2026" wide />
            <Field label="Provinsi" value="Silahkan Pilih Provinsi" />
            <Field label="Kabupaten / Kota" value="Silahkan Pilih Kab/Kota" />
            <Field label="Unit Puskesmas" value="Silahkan Pilih Puskesmas" />
          </div>

          <div className={styles.activeFilters}>
            <span>Filter Aktif:</span>
            <em>Tahun: 2026</em>
            <em>Periode: 01/10/2026 - 20/10/2026</em>
            <em>Cakupan: Nasional (Seluruh Indonesia)</em>
          </div>

          <div className={styles.filterActions}>
            <button type="button" className={styles.secondaryBtn}>
              <Icon name="refresh" size={14} /> Reset Filter
            </button>
            <button type="button" className={styles.orangeBtn}>
              <Icon name="filter" size={14} /> Terapkan Filter
            </button>
          </div>
        </div>
      </section>}

      <section className={styles.infoPanel}>
        <div className={styles.infoHead}>
          <div>
            <h2>
              <Icon name="wallet" size={17} /> Informasi Rekening
            </h2>
            <p>Rincian dan puskesmas atas rekening pooling penampung yang terhubung.</p>
          </div>
          <span>Rekening Aktif</span>
        </div>
        <div className={styles.detailGrid}>
          {detailCards.map(([label, value, icon]) => (
            <article key={label}>
              <small>{label}</small>
              <strong>
                <Icon name={icon} size={15} /> {value}
              </strong>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.statsGrid}>
        {stats.map(([label, value, helper, icon, tone]) => (
          <article key={label} className={`${styles.statCard} ${styles[tone]}`}>
            <div>
              <span>{label}</span>
              <strong>{value}</strong>
              <p>
                <Icon name={tone === "success" ? "check" : tone === "warning" ? "alert" : "info"} size={12} />
                {helper}
              </p>
            </div>
            <em>
              <Icon name={icon} size={19} />
            </em>
          </article>
        ))}
      </section>

      <section className={legacyStyles.tablePanel}>
        <div className={legacyStyles.tableHeader}>
          <div>
            <h2>{legacyTable.tableTitle}</h2>
            <p>{legacyTable.tableMeta}</p>
          </div>
          <button className={legacyStyles.primaryBtn} type="button">
            <Icon name="plus" size={17} /> {legacyTable.addLabel || "Tambah Data"}
          </button>
        </div>

        <div className={legacyStyles.tableWrap}>
          <table className={legacyStyles.table}>
            <thead>
              <tr>
                {legacyTable.columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {legacyTable.rows.map((row, rowIndex) => (
                <tr key={row[0]}>
                  {legacyTable.columns.map((column, index) =>
                    column === "Action" ? (
                      <td key={`${column}-${rowIndex}`}>
                        <div className={legacyStyles.actions}>
                          <button className={legacyStyles.editBtn} aria-label="Edit" type="button">
                            <Icon name="edit" size={15} />
                          </button>
                          <button className={legacyStyles.viewBtn} aria-label="Detail" type="button">
                            <Icon name="eye" size={15} />
                          </button>
                          <button className={legacyStyles.deleteBtn} aria-label="Hapus" type="button">
                            <Icon name="trash" size={15} />
                          </button>
                        </div>
                      </td>
                    ) : (
                      <td key={`${column}-${index}`}>{row[index]}</td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={legacyStyles.pagination}>
          <span>Menampilkan <strong>1-10</strong> dari <strong>38</strong> data</span>
          <div>
            <button type="button">Sebelumnya</button>
            <button type="button" className={legacyStyles.currentPage}>1</button>
            <button type="button">2</button>
            <button type="button">3</button>
            <button type="button">4</button>
            <button type="button">Selanjutnya</button>
          </div>
        </div>
      </section>

      <footer className={styles.securityNote}>
        <Icon name="shield" size={17} />
        <span>Semua koreksi transaksi tercatat otomatis melalui Sistem Host-to-Host BNI Virtual Account & Rekening Kas Daerah Pemerintah.</span>
        <strong>Interkoneksi H2H Aktif</strong>
      </footer>
    </div>
  );
}
