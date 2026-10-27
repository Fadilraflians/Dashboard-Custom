"use client";

import React, { useState } from "react";
import { BarChart3, TrendingUp, X } from "lucide-react";
import styles from "./BarChartMonthlySales.module.css";

export interface MonthlySalesPoint {
  period: string; // e.g. "2025-01"
  label: string;  // e.g. "Jan"
  sales: number;  // e.g. 609042300
  qty: number;    // e.g. 2250
  orders?: number;// e.g. 1273
}

export interface BarChartMonthlySalesProps {
  title?: string;
  subtitle?: string;
  data?: MonthlySalesPoint[];
  summary?: {
    totalSales?: number;
    avgMonthlySales?: number;
    peakMonth?: string;
    lowestMonth?: string;
  };
  onRemove?: () => void;
}

const DEFAULT_DATA: MonthlySalesPoint[] = [
  { period: "2025-01", label: "Jan", sales: 609042300, qty: 2250, orders: 1273 },
  { period: "2025-02", label: "Feb", sales: 542703600, qty: 2118, orders: 1188 },
  { period: "2025-03", label: "Mar", sales: 590462400, qty: 2293, orders: 1279 },
  { period: "2025-04", label: "Apr", sales: 581873600, qty: 2180, orders: 1247 },
  { period: "2025-05", label: "Mei", sales: 603705500, qty: 2297, orders: 1306 },
  { period: "2025-06", label: "Jun", sales: 617871300, qty: 2349, orders: 1337 },
  { period: "2025-07", label: "Jul", sales: 567159800, qty: 2142, orders: 1213 },
  { period: "2025-08", label: "Agu", sales: 552094900, qty: 2118, orders: 1207 },
  { period: "2025-09", label: "Sep", sales: 542245500, qty: 2034, orders: 1172 },
  { period: "2025-10", label: "Okt", sales: 619206200, qty: 2286, orders: 1288 },
  { period: "2025-11", label: "Nov", sales: 577520800, qty: 2187, orders: 1247 },
  { period: "2025-12", label: "Des", sales: 571918500, qty: 2199, orders: 1243 },
];

function formatRupiahJt(val: number): string {
  const jt = val / 1000000;
  return `Rp ${jt.toFixed(1)} Jt`;
}

function formatFullRupiah(val: number): string {
  return "Rp " + new Intl.NumberFormat("id-ID").format(val);
}

export default function BarChartMonthlySales({
  title = "Bar Chart Penjualan Perbulan (2025)",
  subtitle = "FASHION_APP.FASHION_SALES · 12 Bulan Transaksi Oracle DB",
  data = DEFAULT_DATA,
  summary,
  onRemove,
}: BarChartMonthlySalesProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const points = data;
  const maxSales = Math.max(...points.map((p) => p.sales), 1);
  const totalSales =
    summary?.totalSales || points.reduce((acc, p) => acc + p.sales, 0);
  const avgSales =
    summary?.avgMonthlySales || Math.round(totalSales / points.length);

  return (
    <article className={styles.chartCard} aria-label={title}>
      {/* Top Header */}
      <div className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <div className={styles.iconCircle}>
            <BarChart3 size={18} color="#005e54" />
          </div>
          <div>
            <h3 className={styles.cardTitle}>{title}</h3>
            <p className={styles.cardSubtitle}>{subtitle}</p>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.kpiPills}>
            <span className={styles.totalPill}>
              Total: <strong>{formatRupiahJt(totalSales)}</strong>
            </span>
            <span className={styles.avgPill}>
              Rata-rata: <strong>{formatRupiahJt(avgSales)}/bln</strong>
            </span>
          </div>
          {onRemove && (
            <button
              type="button"
              className={styles.btnRemove}
              onClick={onRemove}
              title="Hapus widget ini dari dashboard"
              aria-label="Hapus widget"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Highlights Bar */}
      <div className={styles.highlightsBar}>
        <div className={styles.highlightTag}>
          <span className={styles.dotGreen} />
          <span>Tertinggi: <strong>Okt (Rp 619,2 Jt)</strong></span>
        </div>
        <div className={styles.highlightTag}>
          <span className={styles.dotOrange} />
          <span>Terendah: <strong>Sep (Rp 542,2 Jt)</strong></span>
        </div>
        <div className={styles.highlightGrowth}>
          <TrendingUp size={13} color="#027a48" />
          <span>Stabilitas Volume: <strong>&gt;2.000 unit/bln</strong></span>
        </div>
      </div>

      {/* Chart Body */}
      <div className={styles.chartContainer}>
        {/* Y-Axis Guidelines */}
        <div className={styles.gridLines}>
          <div className={styles.gridLine}><span>Rp 650 Jt</span></div>
          <div className={styles.gridLine}><span>Rp 500 Jt</span></div>
          <div className={styles.gridLine}><span>Rp 350 Jt</span></div>
          <div className={styles.gridLine}><span>Rp 0</span></div>
        </div>

        {/* Bars Flex */}
        <div className={styles.barsFlex}>
          {points.map((p, idx) => {
            const heightPercent = Math.round((p.sales / (maxSales * 1.08)) * 100);
            const isHovered = hoveredIdx === idx;
            const isPeak = p.period === "2025-10";

            return (
              <div
                key={p.period}
                className={styles.barCol}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Tooltip on hover */}
                {isHovered && (
                  <div className={styles.tooltipPopup}>
                    <strong>{p.label} 2025</strong>
                    <div>Penjualan: <b>{formatFullRupiah(p.sales)}</b></div>
                    <div>Volume: <b>{p.qty.toLocaleString("id-ID")} unit</b></div>
                    {p.orders && <div>Pesanan: <b>{p.orders.toLocaleString("id-ID")} order</b></div>}
                  </div>
                )}

                {/* Amount Label on top of bar */}
                <span className={`${styles.barValText} ${isPeak ? styles.barValPeak : ""}`}>
                  {(p.sales / 1000000).toFixed(0)}M
                </span>

                {/* The Bar Track + Fill */}
                <div className={styles.barTrack}>
                  <div
                    className={`${styles.barFill} ${isPeak ? styles.barFillPeak : ""}`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>

                {/* Month Label */}
                <span className={`${styles.barLabel} ${isPeak ? styles.barLabelPeak : ""}`}>
                  {p.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}
