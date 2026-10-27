import React, { useState } from "react";
import { TrendingUp, X } from "lucide-react";
import ChartValueDetail, { ChartHoverTooltip, chartRootProps, toggleIndex, useChartHover } from "../ChartValueDetail/ChartValueDetail";
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

function formatRupiahJt(val: number): string {
  const jt = val / 1000000;
  return `Rp ${jt.toFixed(1)} Jt`;
}

function formatFullRupiah(val: number): string {
  return "Rp " + new Intl.NumberFormat("id-ID").format(val);
}

export default function BarChartMonthlySales({
  title = "Bar Chart Penjualan Per Bulan",
  subtitle = "Ringkasan data transaksi",
  data = [],
  summary,
  onRemove,
}: BarChartMonthlySalesProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const { hover, hoverHandlers } = useChartHover();

  const points = data;
  const chosen = selectedIdx !== null ? points[selectedIdx] : undefined;
  const peak = points.reduce((best, point) => point.sales > (best?.sales ?? -Infinity) ? point : best, null as MonthlySalesPoint | null);
  const low = points.reduce((worst, point) => point.sales < (worst?.sales ?? Infinity) ? point : worst, null as MonthlySalesPoint | null);
  const maxSales = Math.max(...points.map((p) => p.sales), 1);
  const totalSales = summary?.totalSales ?? points.reduce((acc, p) => acc + p.sales, 0);
  const avgSales = summary?.avgMonthlySales ?? (points.length ? Math.round(totalSales / points.length) : 0);
  const formatPointMonth = (point: MonthlySalesPoint | null) => point ? `${point.label} ${point.period.slice(0, 4)} (Rp ${new Intl.NumberFormat("id-ID").format(point.sales)})` : "-";
  const avgUnits = points.length ? Math.round(points.reduce((sum, point) => sum + point.qty, 0) / points.length) : 0;

  return (
    <article className={styles.chartCard} aria-label={title} {...chartRootProps}>
      {/* Top Header */}
      <div className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <div className={styles.iconCircle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#005e54" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="20" x2="12" y2="10" />
              <line x1="18" y1="20" x2="18" y2="4" />
              <line x1="6" y1="20" x2="6" y2="16" />
            </svg>
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
          <span>Tertinggi: <strong>{formatPointMonth(peak)}</strong></span>
        </div>
        <div className={styles.highlightTag}>
          <span className={styles.dotOrange} />
          <span>Terendah: <strong>{formatPointMonth(low)}</strong></span>
        </div>
        <div className={styles.highlightGrowth}>
          <TrendingUp size={13} color="#027a48" />
          <span>Rata-rata volume: <strong>{new Intl.NumberFormat("id-ID").format(avgUnits)} unit/bln</strong></span>
        </div>
      </div>

      {/* Chart Body */}
      <div className={styles.chartContainer}>
        {/* Y-Axis Guidelines */}
        <div className={styles.gridLines}>
          {[1, 0.66, 0.33, 0].map((fraction) => <div key={fraction} className={styles.gridLine}><span>{formatRupiahJt(maxSales * fraction)}</span></div>)}
        </div>

        {/* Bars Flex */}
        <div className={styles.barsFlex}>
          {points.map((p, idx) => {
            const heightPercent = Math.round((p.sales / (maxSales * 1.08)) * 100);
            const isHovered = hoveredIdx === idx;
            const isPeak = p.period === peak?.period;

            return (
              <div
                key={p.period}
                className={styles.barCol}
                role="button"
                tabIndex={0}
                aria-pressed={selectedIdx === idx}
                aria-label={`${p.label} ${p.period.slice(0, 4)}: ${formatFullRupiah(p.sales)}`}
                style={{ cursor: "pointer", opacity: selectedIdx !== null && selectedIdx !== idx ? 0.5 : 1 }}
                onClick={() => setSelectedIdx((current) => toggleIndex(current, idx))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedIdx((current) => toggleIndex(current, idx));
                  }
                }}
                {...hoverHandlers(
                  {
                    title: `${p.label} ${p.period.slice(0, 4)}`,
                    color: "#005e54",
                    rows: [
                      { label: "Penjualan", value: formatFullRupiah(p.sales) },
                      { label: "Volume", value: `${p.qty.toLocaleString("id-ID")} unit` },
                      ...(p.orders ? [{ label: "Pesanan", value: `${p.orders.toLocaleString("id-ID")} order` }] : []),
                    ],
                  },
                  { onEnter: () => setHoveredIdx(idx), onLeave: () => setHoveredIdx(null) },
                )}
              >

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

      {chosen && (
        <ChartValueDetail
          title={`${chosen.label} ${chosen.period.slice(0, 4)}`}
          rows={[
            { label: "Penjualan", value: formatFullRupiah(chosen.sales) },
            { label: "Volume", value: `${chosen.qty.toLocaleString("id-ID")} unit` },
            ...(chosen.orders ? [{ label: "Pesanan", value: `${chosen.orders.toLocaleString("id-ID")} order` }] : []),
          ]}
          onClose={() => setSelectedIdx(null)}
        />
      )}
      <ChartHoverTooltip hover={hover} />
    </article>
  );
}
