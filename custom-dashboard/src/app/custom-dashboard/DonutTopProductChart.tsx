"use client";

import React from "react";
import { PieChart, X } from "lucide-react";
import styles from "./DonutProduct.module.css";

export interface ProductDonutItem {
  name: string;
  sales: number;
  qty: number;
  percent: number;
  color: string;
}

export interface DonutTopProductChartProps {
  title?: string;
  subtitle?: string;
  data?: ProductDonutItem[];
  onRemove?: () => void;
}

const DEFAULT_PRODUCTS: ProductDonutItem[] = [
  { name: "Gamis", sales: 619178000, qty: 1191, percent: 22.2, color: "#005e54" },
  { name: "Jaket Denim", sales: 478830300, qty: 1117, percent: 17.1, color: "#0ea5e9" },
  { name: "Celana Jeans", sales: 477506000, qty: 1163, percent: 17.1, color: "#f59e0b" },
  { name: "Dress Formal", sales: 427203100, qty: 716, percent: 15.3, color: "#8b5cf6" },
  { name: "Jaket Bomber", sales: 406594800, qty: 1132, percent: 14.6, color: "#ec4899" },
  { name: "Rok Midi", sales: 385007200, qty: 1375, percent: 13.8, color: "#10b981" },
];

function formatRupiahJt(val: number): string {
  return `Rp ${(val / 1000000).toFixed(1)} Jt`;
}

export default function DonutTopProductChart({
  title = "Proporsi Produk Fashion Terlaris",
  subtitle = "Top 6 Produk Berdasarkan Omzet Penjualan Oracle FASHION_SALES",
  data = DEFAULT_PRODUCTS,
  onRemove,
}: DonutTopProductChartProps) {
  const items = data;
  const totalTopSales = items.reduce((acc, p) => acc + p.sales, 0);

  // SVG Donut calculation
  const radius = 64;
  const circumference = 2 * Math.PI * radius; // ~402.12
  let accumulatedOffset = 0;

  return (
    <article className={styles.chartCard} aria-label={title}>
      {/* Top Header */}
      <div className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <div className={styles.iconCircle}>
            <PieChart size={18} color="#005e54" />
          </div>
          <div>
            <h3 className={styles.cardTitle}>{title}</h3>
            <p className={styles.cardSubtitle}>{subtitle}</p>
          </div>
        </div>

        <div className={styles.headerRight}>
          <span className={styles.badgeTop}>
            Total Top 6: <strong>{formatRupiahJt(totalTopSales)}</strong>
          </span>
          {onRemove && (
            <button
              type="button"
              className={styles.btnRemove}
              onClick={onRemove}
              title="Hapus widget ini"
              aria-label="Hapus widget"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Main Donut + Legend */}
      <div className={styles.contentRow}>
        {/* SVG Donut */}
        <div className={styles.donutContainer}>
          <svg className={styles.donutSvg} viewBox="0 0 160 160">
            <circle
              cx="80"
              cy="80"
              r={radius}
              className={styles.donutBgTrack}
              strokeWidth="20"
              fill="transparent"
            />
            {items.map((item) => {
              const strokeLength = (item.percent / 100) * circumference;
              const strokeDasharray = `${strokeLength} ${circumference - strokeLength}`;
              const strokeDashoffset = -accumulatedOffset;
              accumulatedOffset += strokeLength;

              return (
                <circle
                  key={item.name}
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke={item.color}
                  strokeWidth="20"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  fill="transparent"
                  className={styles.donutSegment}
                />
              );
            })}
          </svg>
          <div className={styles.donutCenterText}>
            <span className={styles.centerSmall}>TOP 6</span>
            <span className={styles.centerVal}>PRODUK</span>
          </div>
        </div>

        {/* Legend List */}
        <div className={styles.legendList}>
          {items.map((item) => (
            <div key={item.name} className={styles.legendItem}>
              <div className={styles.legendLeft}>
                <span
                  className={styles.legendDot}
                  style={{ backgroundColor: item.color }}
                />
                <span className={styles.legendName}>{item.name}</span>
              </div>
              <div className={styles.legendRight}>
                <span className={styles.legendAmount}>{formatRupiahJt(item.sales)}</span>
                <span className={styles.legendPercent}>{item.percent}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
