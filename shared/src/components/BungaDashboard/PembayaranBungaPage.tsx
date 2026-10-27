"use client";

import type { CSSProperties, ReactNode } from "react";
import { Fragment } from "react";
import { useMemo, useState } from "react";
import Icon from "../PusatInformasi/Icon";
import BalanceFilterPanel from "../BalanceFilterPanel";
import styles from "./page.module.css";

const accounts = [
  ["123456789012", "BOK Puskesmas Cipayung Operasional", "Rp 1.780.000.000", "Rp 245.000.000", "Rp 1.535.000.000", 86.2],
  ["123456789045", "BOK PMT Lokal & Gizi Anak", "Rp 420.500.000", "Rp 65.000.000", "Rp 355.500.000", 84.5],
  ["123456789078", "BOK Insentif Tenaga UKM Puskesmas", "Rp 310.250.000", "Rp 42.500.000", "Rp 267.750.000", 86.3],
  ["123456789102", "BOK Surveilans & Respon KLB", "Rp 185.750.000", "Rp 28.000.000", "Rp 157.750.000", 84.9],
  ["123456789134", "BOK RKUD Penampung Kasda", "Rp 650.000.000", "Rp 95.000.000", "Rp 555.000.000", 85.4],
];

export function SharedCardBoundary({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

const unitInfo = [
  ["Nama Entitas", "Puskesmas Cipayung", "dashboard"],
  ["Kode", "# P3276010101", "shield"],
  ["Provinsi", "Jawa Barat", "book"],
  ["Kabupaten / Kota", "Kota Depok", "dashboard"],
  ["Kecamatan / Kelurahan", "Kec. Cipayung / Kel. Cipayung", "pin"],
  ["Alamat Puskesmas", "Menampilkan 5 rekening aktif Puskesmas", "info"],
  ["No. Telepon", "(021) 7788-9102 +62 812-9876-5432", "info"],
  ["Email Kedinasan", "puskesmas.cipayung@depok.go.id bok.cipayung@kemkes.go.id", "file"],
  ["Penanggung Jawab / PIC", "dr. Hj. Siti Rahmawati, M.Kes (Kepala Puskesmas) Sdr Indrayanto (Bendahara BOK)", "shield"],
];

const historyGroups = [
  ["Senin, 28 Sep 2026", "1 Transaksi Terdeteksi", [
    ["2", "28 Sep 2026 10:30:15 WIB", "Pengiriman Jasa Giro Bunga", "1.990.000.000", "- 210.000.000", "1.780.000.000"],
  ]],
  ["Minggu, 27 Sep 2026", "1 Transaksi Terdeteksi", [
    ["4", "27 Sep 2026 11:20:45 WIB", "Pengiriman Jasa Giro Bunga", "1.750.000.000", "- 180.000.000", "1.570.000.000"],
  ]],
  ["Sabtu, 26 Sep 2026", "1 Transaksi Terdeteksi", [
    ["6", "26 Sep 2026 09:40:12 WIB", "Pengiriman Jasa Giro Bunga", "1.600.000.000", "- 125.000.000", "1.475.000.000"],
  ]],
  ["Jumat, 25 Sep 2026", "1 Transaksi Terdeteksi", [
    ["8", "25 Sep 2026 10:15:00 WIB", "Pengiriman Jasa Giro Bunga", "1.370.000.000", "- 120.000.000", "1.250.000.000"],
  ]],
];

const trendPoints = [
  ["Jan", 300],
  ["Feb", 360],
  ["Mar", 450],
  ["Apr", 540],
  ["Mei", 610],
  ["Jun", 690],
  ["Jul", 820],
  ["Agu", 790],
  ["Sep 2026", 842],
];

function widthStyle(value: number): CSSProperties {
  return { "--w": `${value}%` } as CSSProperties;
}

function trendLinePoints() {
  return trendPoints
    .map(([, value], index) => `${38 + index * 59},${168 - (Number(value) / 1000) * 125}`)
    .join(" ");
}

export default function MutasiPemindahanJasaBungaPage() {
  const [selected, setSelected] = useState(accounts[0][0]);
  const [activeTab, setActiveTab] = useState<"history" | "trend">("history");
  const [filterOpen, setFilterOpen] = useState(false);
  const account = useMemo(() => accounts.find((item) => item[0] === selected) || accounts[0], [selected]);

  return (
    <div className={styles.page}>
      <div className={styles.breadcrumb}>
        <span>Home</span>
        <span>/</span>
        <span>Bunga</span>
        <span>/</span>
        <strong>Pembayaran Bunga</strong>
      </div>

      <header className={styles.pageHead}>
        <div>
          <h1>Mutasi Pemindahan Jasa Bunga</h1>
          <p>Monitor transaksi rekening pemindahan jasa bunga pada periode yang dipilih.</p>
        </div>
        <div className={styles.headActions}>
          <span><i /> Last Updated : 22 Sept 2026 07:00:00 WIB</span>
          <button type="button" className={filterOpen ? styles.searchActive : ""} aria-expanded={filterOpen} onClick={() => setFilterOpen((open) => !open)}><Icon name="search" size={15} /> Pencarian</button>
        </div>
      </header>

      {filterOpen && <BalanceFilterPanel yearAsInfo onClose={() => setFilterOpen(false)} />}

      <section className={styles.unitCard}>
        <div className={styles.unitHeader}>
          <div>
            <h2><Icon name="dashboard" size={16} /> Informasi Unit Kerja & Wilayah Operasional</h2>
            <p>Data referensi fasilitas pelayanan kesehatan terdaftar Kementerian Kesehatan RI</p>
          </div>
          <div className={styles.unitActions}>
            <span>Kategori: Puskesmas</span>
            <button type="button"><Icon name="download" size={15} /> Download Report <Icon name="chevronDown" size={13} /></button>
          </div>
        </div>
        <div className={styles.unitGrid}>
          {unitInfo.map(([label, value, icon]) => (
            <div className={styles.unitItem} key={label}>
              <span>{label}</span>
              <strong><Icon name={icon} size={14} /> {value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.ledgerPanel}>
        <div className={styles.sectionIntro}>
          <h2>Riwayat Transaksi Pemindahan Jasa Bunga</h2>
          <p>Catatan historis seluruh mutasi transaksi debit, kredit, dan arus kas rekening jasa bunga operasional Puskesmas secara rinci dan terverifikasi perbankan.</p>
        </div>

        <div className={styles.ledgerGrid}>
          <aside className={styles.accountList}>
            <div className={styles.accountIntro}>
              <h3><Icon name="wallet" size={16} /> Daftar Rekening</h3>
              <p>Daftar rekening giro operasional dan virtual account yang dimiliki oleh Puskesmas untuk pengelolaan dana BOK secara transparan dan terpusat.</p>
              <label className={styles.searchBox}><Icon name="search" size={14} /><input placeholder="Cari no. rekening atau nama" /></label>
            </div>
            <div className={styles.accounts}>
              {accounts.map((item) => (
                <button
                  type="button"
                  key={item[0]}
                  className={`${styles.accountCard} ${item[0] === selected ? styles.accountActive : ""}`}
                  onClick={() => setSelected(String(item[0]))}
                >
                  <div className={styles.accountTop}>
                    <span><Icon name="wallet" size={14} /> {item[0]}</span>
                    <em>Giro</em>
                  </div>
                  <strong>{item[1]}</strong>
                  <div className={styles.accountMeta}>
                    <span>Sisa Saldo:</span><b>{item[2]}</b>
                    <span>Saldo Efektif:</span><b>{item[3]}</b>
                  </div>
                  <div className={styles.limitRow}>
                    <span>Limit VA Terpakai</span>
                    <b>{item[4]}</b>
                    <small>{item[5]}%</small>
                  </div>
                  <div className={styles.progress}><span style={widthStyle(Number(item[5]))} /></div>
                  <div className={styles.treeButton}><Icon name="shuffle" size={14} /> Tree View Graph</div>
                </button>
              ))}
            </div>
            <div className={styles.sidePager}><span>Hal 1 dari 2</span><button type="button"><Icon name="chevronLeft" size={13} /></button><b>1</b><button type="button">2</button><button type="button"><Icon name="chevronRight" size={13} /></button></div>
            <p className={styles.accountFoot}><Icon name="info" size={14} /> Menampilkan 5 rekening aktif Puskesmas</p>
          </aside>

          <div className={styles.contentPanel}>
            <div className={styles.selectedAccount}>
              <span className={styles.bankIcon}><Icon name="wallet" size={20} /></span>
              <div>
                <h3>{account[0]}&nbsp;&nbsp; {account[1]}</h3>
                <p>Rekening Giro Operasional utama yang digunakan untuk penampungan dan penyaluran dana Bantuan Operasional Kesehatan (BOK) Puskesmas Cipayung, mencakup transaksi belanja program, pembayaran kegiatan, dan operasional layanan kesehatan masyarakat.</p>
              </div>
              <span className={styles.activeBadge}>Aktif</span>
            </div>

            <div className={styles.tabs}>
              <button type="button" className={activeTab === "history" ? styles.tabActive : ""} onClick={() => setActiveTab("history")}><Icon name="receipt" size={15} /> Riwayat Transaksi Rekening</button>
              <button type="button" className={activeTab === "trend" ? styles.tabActive : ""} onClick={() => setActiveTab("trend")}><Icon name="chart" size={15} /> Trend Riwayat Saldo Harian</button>
            </div>

            {activeTab === "history" ? (
              <>
                <div className={styles.note}><Icon name="info" size={16} /><p><b>Riwayat Transaksi Rekening</b> Catatan historis posisi saldo buku rekening jasa bunga operasional, mutasi debit/kredit, dan pergerakan saldo kas harian secara rinci.</p></div>
                <div className={styles.tableWrap}>
                  <table className={styles.balanceTable}>
                    <thead>
                      <tr>
                        <th>No.</th>
                        <th>Deskripsi</th>
                        <th>Saldo Awal</th>
                        <th>Amount</th>
                        <th>Saldo Akhir</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyGroups.map(([date, count, rows]) => (
                        <Fragment key={String(date)}>
                          <tr className={styles.groupRow} key={String(date)}>
                            <td colSpan={2}><Icon name="calendar" size={14} /> {date}</td>
                            <td colSpan={3}>{count as string}</td>
                          </tr>
                          {(rows as string[][]).map((row) => (
                            <tr key={row[0]}>
                              <td>{row[0]}</td>
                              <td><small>{row[1]}</small><strong>{row[2]}</strong></td>
                              <td>{row[3]}</td>
                              <td className={row[4].startsWith("+") ? styles.plus : styles.minus}>{row[4]}</td>
                              <td>{row[5]}</td>
                            </tr>
                          ))}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className={styles.trendPanel}>
                <div className={styles.trendHead}>
                  <Icon name="chart" size={20} />
                  <div>
                    <h3>Grafik Tren Pemindahan Jasa Bunga</h3>
                    <p>Visualisasi pergerakan nominal pemindahan bunga giro operasional per bulan berjalan.</p>
                  </div>
                  <span><i /> Mutasi Pemindahan Bunga (Rp)</span>
                </div>
                <div className={styles.chartBox}>
                  <svg viewBox="0 0 580 230" className={styles.lineChart}>
                    {[45, 85, 125, 165].map((y) => <line key={y} x1="35" x2="552" y1={y} y2={y} />)}
                    <polyline points={trendLinePoints()} />
                    {trendPoints.map(([month, value], index) => (
                      <g key={String(month)}>
                        <circle cx={38 + index * 59} cy={168 - (Number(value) / 1000) * 125} r="3.5" />
                        <text x={38 + index * 59} y="210">{month}</text>
                      </g>
                    ))}
                    <path className={styles.marker} d="M510 34v138" />
                  </svg>
                  <div className={styles.tooltipBox}>
                    <b>Sep 2026 (Bulan Berjalan)</b>
                    <strong>Rp 965.000.000</strong>
                    <span>Mutasi dipindahkan ke RKUD</span>
                  </div>
                </div>
                <div className={styles.trendStats}>
                  <article><Icon name="wallet" size={18} /><span>Total Pemindahan:</span><b>Rp 965,0 Jt</b></article>
                  <article><Icon name="chart" size={18} /><span>Rata-rata Mutasi:</span><b>Rp 193,0 Jt</b></article>
                  <article><Icon name="wallet" size={18} /><span>Akumulasi Dipindahkan:</span><b>Rp 4.470.000.000</b></article>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={styles.bottomPager}><span>Menampilkan 1-10 dari 24 data</span><div><button type="button"><Icon name="chevronLeft" size={13} /> Sebelumnya</button><b>1</b><button type="button">2</button><button type="button">3</button><button type="button">Selanjutnya <Icon name="chevronRight" size={13} /></button></div></div>
        <div className={styles.securityNote}><Icon name="shield" size={15} /> Semua transaksi tercatat secara otomatis melalui Sistem Host-to-Host BNI Virtual Account & Rekening Giro Pemerintah Daerah.</div>
      </section>

      <footer className={styles.footerBar}>
        <span><Icon name="settings" size={22} /></span>
        <div><strong>BNI Institutional Treasury Integration</strong><p>Seluruh data mutasi diverifikasi langsung dengan ledger Bank Negara Indonesia dan BPKP.</p></div>
        <em>Server Jam: <b>14:45:10 WIB</b></em>
        <em>Versi Aplikasi: <b>v4.2.1-prod</b></em>
      </footer>
    </div>
  );
}
