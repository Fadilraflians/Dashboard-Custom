import React, { useEffect, useId, useState } from "react";
import ChartValueDetail, { ChartHoverTooltip, chartRootProps, selectableProps, toggleIndex, useChartHover } from "../ChartValueDetail/ChartValueDetail";
import styles from "./CategoryBarChart.module.css";

export interface CategoryBarPoint {
  label?: string;
  name?: string;
  value?: number | string;
  sales?: number | string;
  [key: string]: unknown;
}

export interface CategoryBarChartProps {
  title?: string;
  subtitle?: string;
  metricLabel?: string;
  data?: unknown;
  /** Play a one-time grow-up animation on mount when true. */
  animateOnce?: boolean;
}

function normalizeData(data: unknown): { label: string; value: number }[] {
  if (!Array.isArray(data)) return [];
  return data
    .filter((row): row is CategoryBarPoint => Boolean(row) && typeof row === "object")
    .map((row, index) => {
      const labelKey = Object.keys(row).find((key) =>
        ["label", "name", "period", "platform", "city", "product_name"].includes(key.toLowerCase()),
      );
      const valueKey = Object.keys(row).find((key) =>
        ["value", "sales", "total", "count", "quantity"].includes(key.toLowerCase()),
      );
      const rawValue = valueKey
        ? row[valueKey]
        : Object.values(row).find((value) => value !== "" && Number.isFinite(Number(value)));
      const numericValue = Number(rawValue);
      return {
        label: String(labelKey ? row[labelKey] : `Kategori ${index + 1}`),
        value: Number.isFinite(numericValue) ? numericValue : 0,
      };
    });
}

function isCurrency(metric: string): boolean {
  return /penjualan|omzet|revenue|rupiah|pembayaran|harga|diskon|ongkir|pendapatan|sales/i.test(metric);
}

export default function CategoryBarChart({
  title = "Grafik Data",
  subtitle = "",
  metricLabel = "Nilai",
  data = [],
  animateOnce = false,
}: CategoryBarChartProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const { hover, hoverHandlers } = useChartHover();
  const [grown, setGrown] = useState(!animateOnce);
  useEffect(() => {
    if (!animateOnce) { setGrown(true); return; }
    setGrown(false);
    const r = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(r);
  }, [animateOnce]);
  const points = normalizeData(data);
  const gradientId = `bar-${useId().replace(/:/g, "")}`;
  const maxValue = Math.max(...points.map((point) => point.value), 0);
  const axisMax = maxValue > 0 ? maxValue * 1.14 : 1;
  const width = Math.max(680, points.length * 62 + 76);
  const height = 300;
  const left = 66;
  const right = 22;
  const top = 26;
  const bottom = 62;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const slotWidth = points.length ? plotWidth / points.length : plotWidth;
  const barWidth = Math.min(34, slotWidth * 0.56);
  const compact = new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 });
  const formatAxis = (value: number) => `${isCurrency(metricLabel) ? "Rp " : ""}${compact.format(value)}`;
  const formatValue = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });

  return (
    <article className={styles.chartCard} {...chartRootProps}>
      <header className={styles.chartHeader}>
        <span className={styles.chartIcon} aria-hidden="true">▥</span>
        <div className={styles.chartHeading}>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <span className={styles.metricTag}>{metricLabel}</span>
      </header>
      {!points.length ? (
        <div className={styles.empty}>Data belum tersedia untuk divisualisasikan.</div>
      ) : (
        <div className={styles.chartViewport}>
          <svg
            className={styles.chartSvg}
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={`${title}, diagram batang vertikal`}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#12a594" />
                <stop offset="100%" stopColor="#006b62" />
              </linearGradient>
            </defs>
            {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
              const y = top + plotHeight - fraction * plotHeight;
              return (
                <g key={fraction}>
                  <line
                    x1={left}
                    y1={y}
                    x2={width - right}
                    y2={y}
                    className={styles.gridLine}
                  />
                  <text x={left - 10} y={y + 4} textAnchor="end" className={styles.axisText}>
                    {formatAxis(axisMax * fraction)}
                  </text>
                </g>
              );
            })}
            <line x1={left} y1={top + plotHeight} x2={width - right} y2={top + plotHeight} className={styles.baseline} />
            {points.map((point, index) => {
              const barHeight = Math.max(2, point.value / axisMax * plotHeight);
              const x = left + index * slotWidth + (slotWidth - barWidth) / 2;
              const y = top + plotHeight - barHeight;
              const label = point.label.length > 12 ? `${point.label.slice(0, 11)}…` : point.label;
              const interact = selectableProps(
                `${point.label}: ${formatValue.format(point.value)} ${metricLabel}`,
                selected === index,
                () => setSelected((current) => toggleIndex(current, index)),
              );
              return (
                <g
                  key={`${point.label}-${index}`}
                  className={styles.barGroup}
                  opacity={selected !== null && selected !== index ? 0.5 : 1}
                  {...interact}
                  {...hoverHandlers({
                    title: point.label,
                    color: "#087f73",
                    rows: [{ label: metricLabel, value: `${isCurrency(metricLabel) ? "Rp " : ""}${formatValue.format(point.value)}` }],
                  })}
                >
                  {/* Wider invisible hit area so thin bars are easy to hover and click. */}
                  <rect x={left + index * slotWidth} y={top} width={slotWidth} height={plotHeight} fill="transparent" />
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx="6"
                    fill={`url(#${gradientId})`}
                    stroke={selected === index ? "#172b4d" : "none"}
                    strokeWidth="2"
                    style={{
                      transform: grown ? "scaleY(1)" : "scaleY(0)",
                      transformOrigin: `center ${top + plotHeight}px`,
                      transition: "transform 0.9s cubic-bezier(0.22, 1, 0.36, 1)",
                      transitionDelay: animateOnce ? `${index * 55}ms` : "0ms",
                    }}
                  />
                  <text x={x + barWidth / 2} y={Math.max(top + 11, y - 8)} textAnchor="middle" className={styles.valueText}>
                    {compact.format(point.value)}
                  </text>
                  <text x={x + barWidth / 2} y={top + plotHeight + 22} textAnchor="middle" className={styles.categoryText}>
                    <title>{point.label}</title>{label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
      {selected !== null && points[selected] && (
        <ChartValueDetail
          title={points[selected].label}
          color="#087f73"
          rows={[{ label: metricLabel, value: `${isCurrency(metricLabel) ? "Rp " : ""}${formatValue.format(points[selected].value)}` }]}
          onClose={() => setSelected(null)}
        />
      )}
      <ChartHoverTooltip hover={hover} />
    </article>
  );
}
