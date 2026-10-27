"use client";

import React, { useState } from "react";
import { LineChart as LineChartIcon, TrendingUp, X } from "lucide-react";
import styles from "./LineChartMonthlySales.module.css";

export interface MonthlySalesPoint {
  period: string; // e.g. "2025-01"
  label: string;  // e.g. "Jan"
  sales: number;  // e.g. 609042300
  qty: number;    // e.g. 2250
  orders?: number;// e.g. 1273
}

export interface LineChartMonthlySalesProps {
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

export default function LineChartMonthlySales({
  title = "Line Chart Penjualan Perbulan (2025)",
  subtitle = "Tren Penjualan Bulanan (Total Sales IDR) · Oracle FASHION_SALES",
  data = DEFAULT_DATA,
  summary,
  onRemove,
}: LineChartMonthlySalesProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const points = data;
  const totalSales =
    summary?.totalSales || points.reduce((acc, p) => acc + p.sales, 0);
  const avgSales =
    summary?.avgMonthlySales || Math.round(totalSales / points.length);

  // SVG dimensions
  const svgWidth = 800;
  const svgHeight = 220;
  const paddingLeft = 60;
  const paddingRight = 40;
  const paddingTop = 25;
  const paddingBottom = 40;

  const chartAreaWidth = svgWidth - paddingLeft - paddingRight;
  const chartAreaHeight = svgHeight - paddingTop - paddingBottom;

  // Min and max for scale
  const minVal = 500000000; // Rp 500 Jt baseline
  const maxVal = 650000000; // Rp 650 Jt ceiling

  // Compute (x, y) for each point
  const coords = points.map((p, idx) => {
    const x = paddingLeft + (idx / (points.length - 1)) * chartAreaWidth;
    const clampedSales = Math.max(minVal, Math.min(maxVal, p.sales));
    const ratio = (clampedSales - minVal) / (maxVal - minVal);
    const y = paddingTop + chartAreaHeight - ratio * chartAreaHeight;
    return { ...p, x, y };
  });

  // Build smooth bezier path
  let pathD = "";
  if (coords.length > 0) {
    pathD = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i];
      const p1 = coords[i + 1];
      const cx = (p0.x + p1.x) / 2;
      pathD += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
    }
  }

  // Area fill path (closes down to baseline)
  const baselineY = paddingTop + chartAreaHeight;
  const areaD = pathD
    ? `${pathD} L ${coords[coords.length - 1].x} ${baselineY} L ${coords[0].x} ${baselineY} Z`
    : "";

  return (
    <article className={styles.chartCard} aria-label={title}>
      {/* Top Header */}
      <div className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <div className={styles.iconCircle}>
            <LineChartIcon size={18} color="#005e54" />
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

      {/* SVG Line Chart Container */}
      <div className={styles.svgWrapper}>
        <svg
          className={styles.chartSvg}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#007d79" stopOpacity="0.32" />
              <stop offset="85%" stopColor="#005e54" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#005e54" stopOpacity="0" />
            </linearGradient>
            <filter id="pointShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#005e54" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Horizontal Gridlines */}
          {[650000000, 600000000, 550000000, 500000000].map((val) => {
            const ratio = (val - minVal) / (maxVal - minVal);
            const y = paddingTop + chartAreaHeight - ratio * chartAreaHeight;
            return (
              <g key={val}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="#eaecf0"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className={styles.yAxisText}
                >
                  {(val / 1000000).toFixed(0)} Jt
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          {areaD && <path d={areaD} fill="url(#lineAreaGrad)" />}

          {/* Smooth line */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#007d79"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data Points and X labels */}
          {coords.map((pt, idx) => {
            const isHovered = hoveredIdx === idx;
            const isPeak = pt.period === "2025-10";

            return (
              <g key={pt.period} className={styles.pointGroup}>
                {/* Vertical hover guide */}
                {isHovered && (
                  <line
                    x1={pt.x}
                    y1={paddingTop}
                    x2={pt.x}
                    y2={baselineY}
                    stroke="#0284c7"
                    strokeDasharray="2 2"
                    strokeWidth="1.2"
                  />
                )}

                {/* Point circle */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 7 : isPeak ? 6 : 4.5}
                  fill={isPeak ? "#0284c7" : "#005e54"}
                  stroke="#ffffff"
                  strokeWidth={isHovered ? 2.5 : 2}
                  filter="url(#pointShadow)"
                  className={styles.dataPointCircle}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />

                {/* Amount label above point */}
                <text
                  x={pt.x}
                  y={pt.y - 10}
                  textAnchor="middle"
                  className={`${styles.pointValueText} ${isPeak ? styles.pointValuePeak : ""}`}
                >
                  {(pt.sales / 1000000).toFixed(0)}M
                </text>

                {/* X-Axis Month Label */}
                <text
                  x={pt.x}
                  y={baselineY + 18}
                  textAnchor="middle"
                  className={`${styles.xAxisText} ${isPeak ? styles.xAxisTextPeak : ""}`}
                >
                  {pt.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Popup Overlay */}
        {hoveredIdx !== null && coords[hoveredIdx] && (
          <div
            className={styles.tooltipPopup}
            style={{
              left: `${(coords[hoveredIdx].x / svgWidth) * 100}%`,
              top: `${(coords[hoveredIdx].y / svgHeight) * 100 - 15}%`,
            }}
          >
            <strong>{coords[hoveredIdx].label} 2025</strong>
            <div>Penjualan: <b>{formatFullRupiah(coords[hoveredIdx].sales)}</b></div>
            <div>Volume: <b>{coords[hoveredIdx].qty.toLocaleString("id-ID")} unit</b></div>
            {coords[hoveredIdx].orders && (
              <div>Pesanan: <b>{coords[hoveredIdx].orders?.toLocaleString("id-ID")} order</b></div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
