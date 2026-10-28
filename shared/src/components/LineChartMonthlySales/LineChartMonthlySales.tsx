import React, { useEffect, useState } from "react";
import { TrendingUp, X } from "lucide-react";
import ChartValueDetail, { ChartHoverTooltip, chartRootProps, selectableProps, toggleIndex, useChartHover } from "../ChartValueDetail/ChartValueDetail";
import styles from "./LineChartMonthlySales.module.css";

export interface MonthlySalesPoint {
  period: string; // e.g. "2025-01"
  label: string;  // e.g. "Jan"
  sales: number;  // e.g. 609042300
  qty: number;    // e.g. 2250
  orders?: number;// e.g. 1273
}

export interface CategoryLinePoint {
  label?: string;
  name?: string;
  period?: string;
  value?: number | string;
  sales?: number | string;
  [key: string]: unknown;
}

export interface LineChartMonthlySalesProps {
  title?: string;
  subtitle?: string;
  data?: MonthlySalesPoint[] | CategoryLinePoint[];
  chartMode?: "monthly" | "category";
  metricLabel?: string;
  summary?: {
    totalSales?: number;
    avgMonthlySales?: number;
    peakMonth?: string;
    lowestMonth?: string;
  };
  onRemove?: () => void;
  /** Play a one-time line-draw animation on mount when true. */
  animateOnce?: boolean;
}

function readField(row: CategoryLinePoint, ...names: string[]): unknown {
  const key = Object.keys(row).find((candidate) => names.includes(candidate.toLowerCase()));
  return key ? row[key] : undefined;
}

function formatRupiahJt(val: number): string {
  const jt = val / 1000000;
  return `Rp ${jt.toFixed(1)} Jt`;
}

function formatFullRupiah(val: number): string {
  return "Rp " + new Intl.NumberFormat("id-ID").format(val);
}

export default function LineChartMonthlySales({
  title = "Line Chart Penjualan Per Bulan",
  subtitle = "Tren Penjualan Bulanan (Total Sales IDR) · Oracle FASHION_SALES",
  data = [],
  chartMode = "monthly",
  metricLabel = "Penjualan",
  summary,
  onRemove,
  animateOnce = false,
}: LineChartMonthlySalesProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const { hover, hoverHandlers } = useChartHover();
  const [grown, setGrown] = useState(!animateOnce);
  useEffect(() => {
    if (!animateOnce) { setGrown(true); return; }
    setGrown(false);
    const r = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(r);
  }, [animateOnce]);

  const isCategoryChart = chartMode === "category";
  const points: MonthlySalesPoint[] = isCategoryChart
    ? (data as CategoryLinePoint[]).map((point, index) => ({
        period: String(readField(point, "period") ?? index),
        label: String(readField(point, "label", "name", "period", "platform", "city", "product_name") ?? `Kategori ${index + 1}`),
        sales: Number(readField(point, "value", "sales", "total", "count", "quantity") ?? 0) || 0,
        qty: 0,
      }))
    : (data as MonthlySalesPoint[]);
  const peak = points.reduce((best, point) => point.sales > (best?.sales ?? -Infinity) ? point : best, null as MonthlySalesPoint | null);
  const low = points.reduce((worst, point) => point.sales < (worst?.sales ?? Infinity) ? point : worst, null as MonthlySalesPoint | null);
  const totalSales = summary?.totalSales ?? points.reduce((acc, p) => acc + p.sales, 0);
  const avgSales = summary?.avgMonthlySales ?? (points.length ? Math.round(totalSales / points.length) : 0);
  const maxPointSales = Math.max(...points.map((point) => point.sales), 1);
  const minVal = 0;
  const maxVal = maxPointSales * 1.1;
  const formatPointMonth = (point: MonthlySalesPoint | null) => point ? `${point.label} ${point.period.slice(0, 4)} (Rp ${new Intl.NumberFormat("id-ID").format(point.sales)})` : "-";
  const avgUnits = points.length ? Math.round(points.reduce((sum, point) => sum + point.qty, 0) / points.length) : 0;

  // SVG dimensions
  const svgWidth = 800;
  const svgHeight = isCategoryChart ? 260 : 220;
  const paddingLeft = 60;
  const paddingRight = 40;
  const paddingTop = 25;
  const paddingBottom = isCategoryChart && points.length > 7 ? 76 : 40;

  const chartAreaWidth = svgWidth - paddingLeft - paddingRight;
  const chartAreaHeight = svgHeight - paddingTop - paddingBottom;

  const coords = points.map((p, idx) => {
    const x = paddingLeft + (points.length <= 1 ? 0.5 : idx / (points.length - 1)) * chartAreaWidth;
    const ratio = p.sales / maxVal;
    const y = paddingTop + chartAreaHeight - ratio * chartAreaHeight;
    return { ...p, x, y };
  });

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

  const baselineY = paddingTop + chartAreaHeight;
  const areaD = pathD
    ? `${pathD} L ${coords[coords.length - 1].x} ${baselineY} L ${coords[0].x} ${baselineY} Z`
    : "";

  return (
    <article className={styles.chartCard} aria-label={title} {...chartRootProps}>
      {/* Top Header */}
      <div className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <div className={styles.iconCircle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#005e54" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
          </div>
          <div>
            <h3 className={styles.cardTitle}>{title}</h3>
            <p className={styles.cardSubtitle}>{subtitle}</p>
          </div>
        </div>
        <div className={styles.headerRight}>
          {!isCategoryChart && <div className={styles.kpiPills}>
            <span className={styles.totalPill}>
              Total: <strong>{formatRupiahJt(totalSales)}</strong>
            </span>
            <span className={styles.avgPill}>
              Rata-rata: <strong>{formatRupiahJt(avgSales)}/bln</strong>
            </span>
          </div>}
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
      {!isCategoryChart && <div className={styles.highlightsBar}>
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
      </div>}

      {/* SVG Line Chart Container */}
      <div className={styles.svgWrapper}>
        <svg
          className={styles.chartSvg}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="sharedLineAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#007d79" stopOpacity="0.32" />
              <stop offset="85%" stopColor="#005e54" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#005e54" stopOpacity="0" />
            </linearGradient>
            <filter id="sharedPointShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#005e54" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Horizontal Gridlines */}
          {[1, 0.75, 0.5, 0.25, 0].map((fraction) => {
            const val = maxVal * fraction;
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
                  {isCategoryChart
                    ? new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(val)
                    : `${(val / 1000000).toFixed(0)} Jt`}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          {areaD && <path d={areaD} fill="url(#sharedLineAreaGrad)" style={{ opacity: grown ? 1 : 0, transition: "opacity 0.9s ease 0.3s" }} />}

          {/* Smooth line */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#007d79"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              style={{
                strokeDasharray: 1,
                strokeDashoffset: grown ? 0 : 1,
                transition: "stroke-dashoffset 1.1s ease",
              }}
            />
          )}

          {/* Data Points and X labels */}
          {coords.map((pt, idx) => {
            const isHovered = hoveredIdx === idx;
            const isPeak = pt.period === peak?.period;

            return (
              <g key={pt.period} className={styles.pointGroup}>
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

                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered || selectedIdx === idx ? 7 : isPeak ? 6 : 4.5}
                  fill={isPeak ? "#0284c7" : "#005e54"}
                  stroke={selectedIdx === idx ? "#172b4d" : "#ffffff"}
                  strokeWidth={isHovered || selectedIdx === idx ? 2.5 : 2}
                  filter="url(#sharedPointShadow)"
                  className={styles.dataPointCircle}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
                {/* Larger transparent hit area: easier to click than the small dot. */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="14"
                  fill="transparent"
                  {...hoverHandlers(
                    {
                      title: `${pt.label}${!isCategoryChart ? ` ${pt.period.slice(0, 4)}` : ""}`,
                      color: "#005e54",
                      rows: [
                        {
                          label: isCategoryChart ? metricLabel : "Penjualan",
                          value: isCategoryChart ? new Intl.NumberFormat("id-ID").format(pt.sales) : formatFullRupiah(pt.sales),
                        },
                        ...(!isCategoryChart ? [{ label: "Volume", value: `${pt.qty.toLocaleString("id-ID")} unit` }] : []),
                        ...(pt.orders ? [{ label: "Pesanan", value: `${pt.orders.toLocaleString("id-ID")} order` }] : []),
                      ],
                    },
                    { onEnter: () => setHoveredIdx(idx), onLeave: () => setHoveredIdx(null) },
                  )}
                  {...selectableProps(
                    `${pt.label}: ${isCategoryChart ? new Intl.NumberFormat("id-ID").format(pt.sales) : formatFullRupiah(pt.sales)}`,
                    selectedIdx === idx,
                    () => setSelectedIdx((current) => toggleIndex(current, idx)),
                  )}
                />

                <text
                  x={pt.x}
                  y={pt.y - 10}
                  textAnchor="middle"
                  className={`${styles.pointValueText} ${isPeak ? styles.pointValuePeak : ""}`}
                >
                  {!isCategoryChart && `${(pt.sales / 1000000).toFixed(0)}M`}
                </text>

                <text
                  x={pt.x}
                  y={baselineY + (isCategoryChart && points.length > 7 ? 10 : 18)}
                  textAnchor={isCategoryChart && points.length > 7 ? "end" : "middle"}
                  transform={isCategoryChart && points.length > 7 ? `rotate(-40 ${pt.x} ${baselineY + 10})` : undefined}
                  className={`${styles.xAxisText} ${isPeak ? styles.xAxisTextPeak : ""}`}
                >
                  {pt.label}
                </text>
              </g>
            );
          })}
        </svg>

      </div>

      {selectedIdx !== null && coords[selectedIdx] && (
        <ChartValueDetail
          title={`${coords[selectedIdx].label}${!isCategoryChart ? ` ${coords[selectedIdx].period.slice(0, 4)}` : ""}`}
          rows={[
            {
              label: isCategoryChart ? metricLabel : "Penjualan",
              value: isCategoryChart
                ? new Intl.NumberFormat("id-ID").format(coords[selectedIdx].sales)
                : formatFullRupiah(coords[selectedIdx].sales),
            },
            ...(!isCategoryChart ? [{ label: "Volume", value: `${coords[selectedIdx].qty.toLocaleString("id-ID")} unit` }] : []),
            ...(coords[selectedIdx].orders ? [{ label: "Pesanan", value: `${coords[selectedIdx].orders?.toLocaleString("id-ID")} order` }] : []),
          ]}
          onClose={() => setSelectedIdx(null)}
        />
      )}
      <ChartHoverTooltip hover={hover} />
    </article>
  );
}
