import React from "react";
import { GripVertical, RotateCcw, X } from "lucide-react";
import MetricCard from "../components/MetricCard/MetricCard";
import CategoryBarChart from "../components/CategoryBarChart/CategoryBarChart";
import LineChartMonthlySales from "../components/LineChartMonthlySales/LineChartMonthlySales";
import BarChartMonthlySales from "../components/BarChartMonthlySales/BarChartMonthlySales";
import DonutProductChart from "../components/DonutProductChart/DonutProductChart";
import { AnalyticsTable, AreaChart, PieChart, ScatterChart } from "../components/AnalyticsVisualizations/AnalyticsVisualizations";
import styles from "./Gallery.module.css";

const categoryData = [
  { label: "Elektronik", value: 610 },
  { label: "Rumah Tangga", value: 583 },
  { label: "Olahraga", value: 496 },
];
const monthlyData = [
  { period: "2025-01", label: "Jan", sales: 125000000, qty: 410, orders: 96 },
  { period: "2025-02", label: "Feb", sales: 148000000, qty: 520, orders: 112 },
  { period: "2025-03", label: "Mar", sales: 132000000, qty: 465, orders: 103 },
  { period: "2025-04", label: "Apr", sales: 176000000, qty: 590, orders: 137 },
];
const ageData = [
  { label: "21", x: 21, y: 18, value: 18 },
  { label: "27", x: 27, y: 32, value: 32 },
  { label: "34", x: 34, y: 24, value: 24 },
  { label: "42", x: 42, y: 38, value: 38 },
];
const statusData = [
  { name: "Selesai", qty: 72, sales: 72, percent: 72, color: "#087f73" },
  { name: "Dikirim", qty: 18, sales: 18, percent: 18, color: "#149bd7" },
  { name: "Diproses", qty: 10, sales: 10, percent: 10, color: "#f59e0b" },
];
const tableData = [
  { Kategori: "Elektronik", "Jumlah Unit": 610 },
  { Kategori: "Rumah Tangga", "Jumlah Unit": 583 },
  { Kategori: "Olahraga", "Jumlah Unit": 496 },
];

function PreviewWidget({ title, size, children }: { title: string; size: "metric" | "chart" | "pie" | "donut" | "table"; children: React.ReactNode }) {
  return <article className={`${styles.widget} ${styles[size]}`}>
    <header className={styles.controlBar}>
      <div className={styles.dragTitle}><GripVertical size={13} /><span>{title}</span><small>• Geser Bebas</small></div>
      <div className={styles.controls} aria-hidden="true">
        <span>1/3</span><span>1/2</span><span>Full</span><span><RotateCcw size={10} /></span><span className={styles.close}><X size={11} /></span>
      </div>
    </header>
    <div className={styles.widgetBody}>{children}</div>
  </article>;
}

const exampleNote = "Contoh statis · bukan data database";

export default function Gallery() {
  return <main className={styles.page}>
    <h1>Shared UI — Komponen Dashboard</h1>
    <p className={styles.description}>
      Pratinjau ini memakai data ilustrasi. Dashboard menampilkan hasil query database yang dikirim AiGovtech sebagai JSON ke komponen Shared UI.
    </p>

    <section className={styles.metricGrid} aria-label="Contoh kartu metrik">
      <PreviewWidget title="Total Penjualan" size="metric"><MetricCard title="Total Penjualan" formattedValue="Rp 405.000.000" subtitle={exampleNote} icon="wallet" /></PreviewWidget>
      <PreviewWidget title="Jumlah Pesanan" size="metric"><MetricCard title="Jumlah Pesanan" value={351} subtitle={exampleNote} icon="arrow-left-right" /></PreviewWidget>
      <PreviewWidget title="Rata-rata Rating" size="metric"><MetricCard title="Rata-rata Rating" value={4.2} subtitle={exampleNote} icon="star" /></PreviewWidget>
    </section>

    <h2>Grafik dan tabel</h2>
    <section className={styles.chartGrid} aria-label="Contoh grafik dan tabel">
      <PreviewWidget title="Kategori - Jumlah Unit - Bar Chart" size="chart"><CategoryBarChart title="Kategori - Jumlah Unit - Bar Chart" subtitle={exampleNote} metricLabel="Jumlah Unit" data={categoryData} /></PreviewWidget>
      <PreviewWidget title="Tren Penjualan Bulanan - Line Chart" size="chart"><LineChartMonthlySales title="Tren Penjualan Bulanan" subtitle={exampleNote} data={monthlyData} /></PreviewWidget>
      <PreviewWidget title="Kategori - Jumlah Unit - Area Chart" size="chart"><AreaChart title="Kategori - Jumlah Unit - Area Chart" subtitle={exampleNote} metricLabel="Jumlah Unit" data={categoryData} /></PreviewWidget>
      <PreviewWidget title="Usia Pelanggan - Jumlah Transaksi - Scatter Chart" size="chart"><ScatterChart title="Usia Pelanggan - Jumlah Transaksi" subtitle={exampleNote} metricLabel="Jumlah Transaksi" centerLabel="USIA PELANGGAN" data={ageData} /></PreviewWidget>
      <PreviewWidget title="Kategori - Jumlah Unit - Pie Chart" size="pie"><PieChart title="Kategori - Jumlah Unit - Pie Chart" subtitle={exampleNote} metricLabel="Jumlah Unit" centerLabel="KATEGORI" data={categoryData} /></PreviewWidget>
      <PreviewWidget title="Status Pengiriman - Jumlah Transaksi - Donut Chart" size="donut"><DonutProductChart title="Status Pengiriman - Jumlah Transaksi" subtitle={exampleNote} metricLabel="Jumlah Transaksi" centerLabel="STATUS" data={statusData} /></PreviewWidget>
      <PreviewWidget title="Kategori - Jumlah Unit - Tabel Analitik" size="table"><AnalyticsTable title="Kategori - Jumlah Unit" subtitle={exampleNote} metricLabel="Jumlah Unit" data={tableData} /></PreviewWidget>
      <PreviewWidget title="Penjualan per Bulan - Bar Chart" size="chart"><BarChartMonthlySales title="Penjualan per Bulan" subtitle={exampleNote} data={monthlyData} /></PreviewWidget>
    </section>
  </main>;
}
