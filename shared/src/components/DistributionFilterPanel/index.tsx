"use client";

import { useState } from "react";
import Icon from "../PusatInformasi/Icon";
import styles from "./styles.module.css";

export type DistributionFilterPanelProps = {
  onClose: () => void;
};

const formatDate = (value: string) => {
  const [year, month, day] = value.split("-");
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" })
    .format(new Date(Number(year), Number(month) - 1, Number(day)));
};

export default function DistributionFilterPanel({ onClose }: DistributionFilterPanelProps) {
  const [year, setYear] = useState("2026");
  const [province, setProvince] = useState("Jawa Barat");
  const [regency, setRegency] = useState("Kota Depok");
  const [startDate, setStartDate] = useState("2026-01-26");
  const [endDate, setEndDate] = useState("2026-09-28");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [appliedYear, setAppliedYear] = useState("2026");

  const reset = () => {
    setYear("2026");
    setProvince("Jawa Barat");
    setRegency("Kota Depok");
    setStartDate("2026-01-26");
    setEndDate("2026-09-28");
    setAppliedYear("2026");
  };

  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <h2><Icon name="filter" size={16} /> Parameter Filter Data</h2>
        <button type="button" onClick={onClose} aria-label="Tutup filter">&times;</button>
      </header>

      <div className={styles.body}>
        <div className={styles.grid}>
          <label>
            <span>Tahun Anggaran</span>
            <select value={year} onChange={(event) => setYear(event.target.value)}>
              <option value="2026">2026</option><option value="2025">2025</option><option value="2024">2024</option>
            </select>
          </label>

          <div className={styles.periodField}>
            <span>Periode Penyaluran</span>
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
                  <label><span>Tanggal Mulai</span><input type="date" value={startDate} max={endDate} onChange={(event) => setStartDate(event.target.value)} /></label>
                  <label><span>Tanggal Selesai</span><input type="date" value={endDate} min={startDate} onChange={(event) => setEndDate(event.target.value)} /></label>
                </div>
                <button className={styles.calendarApply} type="button" onClick={() => setCalendarOpen(false)}>Pilih Tanggal</button>
              </div>
            )}
          </div>

          <label>
            <span>Provinsi</span>
            <select value={province} onChange={(event) => setProvince(event.target.value)}>
              <option>Jawa Barat</option><option>Jawa Tengah</option><option>Jawa Timur</option><option>Sumatera Utara</option>
            </select>
          </label>
          <label>
            <span>Kabupaten / Kota</span>
            <select value={regency} onChange={(event) => setRegency(event.target.value)}>
              <option>Kota Depok</option><option>Kota Bandung</option><option>Kabupaten Bogor</option><option>Kota Surabaya</option>
            </select>
          </label>
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
