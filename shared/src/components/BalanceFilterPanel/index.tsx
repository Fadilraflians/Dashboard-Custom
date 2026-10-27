"use client";

import { useState } from "react";
import Icon from "../PusatInformasi/Icon";
import styles from "./styles.module.css";

export type BalanceFilterPanelProps = {
  includeVa?: boolean;
  showDescription?: boolean;
  yearAsInfo?: boolean;
  showClose?: boolean;
  onClose: () => void;
};

const formatDate = (value: string) => {
  const [year, month, day] = value.split("-");
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" })
    .format(new Date(Number(year), Number(month) - 1, Number(day)));
};

export default function BalanceFilterPanel({
  includeVa = false,
  showDescription = false,
  yearAsInfo = false,
  showClose = false,
  onClose,
}: BalanceFilterPanelProps) {
  const [year, setYear] = useState("2026");
  const [province, setProvince] = useState("Jawa Barat");
  const [regency, setRegency] = useState("Kota Depok");
  const [puskesmas, setPuskesmas] = useState("Puskesmas Cipayung");
  const [vaAccount, setVaAccount] = useState("988-0021-3310-01");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("2026-01-26");
  const [endDate, setEndDate] = useState("2026-09-28");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [appliedYear, setAppliedYear] = useState("2026");

  const reset = () => {
    setYear("2026");
    setProvince("Jawa Barat");
    setRegency("Kota Depok");
    setPuskesmas("Puskesmas Cipayung");
    setVaAccount("988-0021-3310-01");
    setDescription("");
    setStartDate("2026-01-26");
    setEndDate("2026-09-28");
    setAppliedYear("2026");
  };

  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <h2><Icon name="filter" size={16} /> Parameter Filter Data</h2>
        {showClose && <button type="button" onClick={onClose} aria-label="Tutup filter">&times;</button>}
      </header>

      <div className={styles.body}>
        <div className={styles.grid}>
          <label className={styles.yearField}>
            <span>Tahun Anggaran</span>
            {yearAsInfo ? (
              <strong className={styles.yearInfo}><Icon name="info" size={14} /> Menampilkan 5 rekening aktif Puskesmas</strong>
            ) : (
              <select value={year} onChange={(event) => setYear(event.target.value)}>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            )}
          </label>

          <div className={styles.periodField}>
            <span>Periode Transaksi</span>
            <button className={styles.dateRange} type="button" aria-expanded={calendarOpen} onClick={() => setCalendarOpen((open) => !open)}>
              <Icon name="calendar" size={15} /> {formatDate(startDate)} — {formatDate(endDate)}
              <Icon name="calendar" size={15} />
            </button>
            {calendarOpen && (
              <div className={styles.calendarPopover}>
                <div className={styles.calendarHead}>
                  <strong>Pilih Rentang Tanggal</strong>
                  <button type="button" onClick={() => setCalendarOpen(false)} aria-label="Tutup kalender">&times;</button>
                </div>
                <div className={styles.calendarGrid}>
                  <label>
                    <span>Tanggal Mulai</span>
                    <input type="date" value={startDate} max={endDate} onChange={(event) => setStartDate(event.target.value)} />
                  </label>
                  <label>
                    <span>Tanggal Selesai</span>
                    <input type="date" value={endDate} min={startDate} onChange={(event) => setEndDate(event.target.value)} />
                  </label>
                </div>
                <button className={styles.calendarApply} type="button" onClick={() => setCalendarOpen(false)}>Pilih Tanggal</button>
              </div>
            )}
          </div>

          <label className={includeVa ? styles.vaField : styles.giroField}>
            <span>Provinsi</span>
            <select value={province} onChange={(event) => setProvince(event.target.value)}>
              <option>Jawa Barat</option><option>Jawa Tengah</option><option>Jawa Timur</option>
            </select>
          </label>
          <label className={includeVa ? styles.vaField : styles.giroField}>
            <span>Kabupaten / Kota</span>
            <select value={regency} onChange={(event) => setRegency(event.target.value)}>
              <option>Kota Depok</option><option>Kota Bandung</option><option>Kabupaten Bogor</option>
            </select>
          </label>
          <label className={includeVa ? styles.vaField : styles.giroField}>
            <span>Puskesmas</span>
            <select value={puskesmas} onChange={(event) => setPuskesmas(event.target.value)}>
              <option>Puskesmas Cipayung</option><option>Puskesmas Garuda</option><option>Puskesmas Bogor Tengah</option>
            </select>
          </label>
          {includeVa && (
            <label className={styles.vaField}>
              <span>Rekening VA</span>
              <select value={vaAccount} onChange={(event) => setVaAccount(event.target.value)}>
                <option value="988-0021-3310-01">988-0021-3310-01</option>
                <option value="988-0021-3310-02">988-0021-3310-02</option>
                <option value="988-0021-3310-03">988-0021-3310-03</option>
              </select>
            </label>
          )}
          {showDescription && (
            <label className={styles.descriptionField}>
              <span>Deskripsi Mutasi</span>
              <input
                type="text"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Masukkan deskripsi mutasi..."
              />
            </label>
          )}
        </div>

        <footer className={styles.footer}>
          <div><span>Filter Aktif:</span><em>Tahun Anggaran : {appliedYear}</em></div>
          <div className={styles.actions}>
            <button className={styles.reset} type="button" onClick={reset}><Icon name="refresh" size={14} /> Reset Filter</button>
            <button className={styles.apply} type="button" onClick={() => setAppliedYear(year)}><Icon name="filter" size={14} /> Terapkan Filter</button>
          </div>
        </footer>
      </div>
    </section>
  );
}
