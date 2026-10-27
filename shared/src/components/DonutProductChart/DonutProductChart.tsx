import React, { useState } from "react";
import { X } from "lucide-react";
import ChartValueDetail, { ChartHoverTooltip, chartRootProps, selectableProps, toggleIndex, useChartHover } from "../ChartValueDetail/ChartValueDetail";
import styles from "./DonutProductChart.module.css";

export interface ProductDonutItem {
  name: string;
  sales: number;
  qty: number;
  percent: number;
  color: string;
}

export interface DonutProductChartProps {
  title?: string;
  subtitle?: string;
  data?: ProductDonutItem[];
  metricLabel?: string;
  centerLabel?: string;
  onRemove?: () => void;
}

function formatValue(val: number, metricLabel: string): string {
  const formatted = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(val);
  return /sales|penjualan|omzet|revenue|grand total|subtotal|rupiah|harga/i.test(metricLabel)
    ? `Rp ${formatted}`
    : formatted;
}

export default function DonutProductChart({
  title = "Proporsi Produk Fashion Terlaris",
  subtitle = "Top 6 Produk Berdasarkan Omzet Penjualan Oracle FASHION_SALES",
  data = [],
  metricLabel = "penjualan",
  centerLabel = "PRODUK",
  onRemove,
}: DonutProductChartProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const { hover, hoverHandlers } = useChartHover();
  const tipFor = (item: ProductDonutItem) =>
    hoverHandlers({
      title: item.name,
      color: item.color,
      rows: [
        { label: metricLabel, value: formatValue(item.sales, metricLabel) },
        { label: "Porsi", value: `${item.percent}%` },
        ...(item.qty > 0 && item.qty !== item.sales
          ? [{ label: "Unit", value: new Intl.NumberFormat("id-ID").format(item.qty) }]
          : []),
      ],
    });
  const items = data;
  const totalTopSales = items.reduce((acc, p) => acc + p.sales, 0);

  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  let accumulatedOffset = 0;
  const chosen = selected !== null ? items[selected] : undefined;
  const dimmed = (index: number) => selected !== null && selected !== index;

  return (
    <article className={styles.chartCard} aria-label={title} {...chartRootProps}>
      {/* Top Header */}
      <div className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <div className={styles.iconCircle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#005e54" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
              <path d="M22 12A10 10 0 0 0 12 2v10z" />
            </svg>
          </div>
          <div>
            <h3 className={styles.cardTitle}>{title}</h3>
            <p className={styles.cardSubtitle}>{subtitle}</p>
          </div>
        </div>

        <div className={styles.headerRight}>
          <span className={styles.badgeTop}>
            Total: <strong>{formatValue(totalTopSales, metricLabel)}</strong>
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
            {items.map((item, index) => {
              const strokeLength = (item.percent / 100) * circumference;
              const strokeDasharray = `${strokeLength} ${circumference - strokeLength}`;
              const strokeDashoffset = -accumulatedOffset;
              accumulatedOffset += strokeLength;
              const interact = selectableProps(
                `${item.name}: ${formatValue(item.sales, metricLabel)} (${item.percent}%)`,
                selected === index,
                () => setSelected((current) => toggleIndex(current, index)),
              );

              return (
                <circle
                  key={item.name}
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke={item.color}
                  strokeWidth={selected === index ? 26 : 20}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  fill="transparent"
                  className={styles.donutSegment}
                  opacity={dimmed(index) ? 0.45 : 1}
                  {...interact}
                  {...tipFor(item)}
                />
              );
            })}
          </svg>
          <div className={styles.donutCenterText}>
            <span className={styles.centerSmall}>PROPORSI</span>
            <span className={styles.centerVal}>{centerLabel}</span>
          </div>
        </div>

        <div className={styles.legendList}>
          {items.map((item, index) => (
            <div
              key={item.name}
              className={styles.legendItem}
              role="button"
              tabIndex={0}
              aria-pressed={selected === index}
              style={{ cursor: "pointer", opacity: dimmed(index) ? 0.45 : 1 }}
              {...tipFor(item)}
              onClick={() => setSelected((current) => toggleIndex(current, index))}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelected((current) => toggleIndex(current, index));
                }
              }}
            >
              <div className={styles.legendLeft}>
                <span
                  className={styles.legendDot}
                  style={{ backgroundColor: item.color }}
                />
                <span className={styles.legendName}>{item.name}</span>
              </div>
              <div className={styles.legendRight}>
                <span className={styles.legendAmount}>{formatValue(item.sales, metricLabel)}</span>
                <span className={styles.legendPercent}>{item.percent}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {chosen && (
        <ChartValueDetail
          title={chosen.name}
          color={chosen.color}
          rows={[
            { label: metricLabel, value: formatValue(chosen.sales, metricLabel) },
            { label: "Porsi", value: `${chosen.percent}%` },
            ...(chosen.qty > 0 && chosen.qty !== chosen.sales
              ? [{ label: "Unit", value: new Intl.NumberFormat("id-ID").format(chosen.qty) }]
              : []),
          ]}
          onClose={() => setSelected(null)}
        />
      )}
      <ChartHoverTooltip hover={hover} />
    </article>
  );
}
