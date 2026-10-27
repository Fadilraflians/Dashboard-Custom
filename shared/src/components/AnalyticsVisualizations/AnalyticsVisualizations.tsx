import React, { useId, useState } from "react";
import ChartValueDetail, { ChartHoverTooltip, chartRootProps, selectableProps, toggleIndex, useChartHover } from "../ChartValueDetail/ChartValueDetail";
import styles from "./AnalyticsVisualizations.module.css";

type Row = Record<string, unknown>;
type Point = { label: string; value: number; row: Row; x?: number; y?: number };

const COLORS = ["#087f73", "#149bd7", "#f59e0b", "#805ad5", "#e64b8a", "#0eaa76", "#64748b", "#cf5a36"];
const numberFormat = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });

function rowsOf(data: unknown): Row[] {
  return Array.isArray(data) ? data.filter((row): row is Row => Boolean(row) && typeof row === "object") : [];
}

function first(row: Row, keys: string[]): unknown {
  for (const key of keys) {
    const actualKey = Object.keys(row).find((candidate) => candidate.toLowerCase() === key.toLowerCase());
    if (actualKey && row[actualKey] !== undefined && row[actualKey] !== null) return row[actualKey];
  }
  return undefined;
}

function pointsOf(data: unknown): Point[] {
  return rowsOf(data).map((row, index) => {
    const rawValue = first(row, ["value", "sales", "total", "count", "quantity"]) ?? Object.entries(row).find(([key, value]) => !["x", "x_value", "xvalue", "label", "name", "period"].includes(key.toLowerCase()) && value !== "" && Number.isFinite(Number(value)))?.[1];
    const parsed = Number(rawValue);
    const rawX = Number(first(row, ["x", "x_value", "xValue", "X"]));
    const rawY = Number(first(row, ["y", "y_value", "yValue", "Y"]));
    const value = Number.isFinite(parsed) ? parsed : Number.isFinite(rawY) ? rawY : 0;
    return {
      row,
      label: String(first(row, ["label", "name", "period", "platform", "city", "product_name", "LABEL", "NAME"]) ?? `Data ${index + 1}`),
      value,
      x: Number.isFinite(rawX) ? rawX : index + 1,
      y: Number.isFinite(rawY) ? rawY : value,
    };
  });
}

function isMoney(metricLabel: string): boolean {
  return /penjualan|omzet|revenue|rupiah|pembayaran|harga|diskon|ongkir|pendapatan|sales/i.test(metricLabel);
}

function format(value: number, metricLabel: string): string {
  const formatted = numberFormat.format(value);
  return isMoney(metricLabel) ? `Rp ${formatted}` : formatted;
}

function Header({ title, subtitle, metricLabel }: { title: string; subtitle?: string; metricLabel?: string }) {
  return <header className={styles.header}>
    <div className={styles.headerIcon} aria-hidden="true">▥</div>
    <div className={styles.headerText}>
      <h3>{title}</h3>
      {subtitle && <p>{subtitle}</p>}
    </div>
    {metricLabel && <span className={styles.metric}>{metricLabel}</span>}
  </header>;
}

function Empty() {
  return <div className={styles.empty}>Data belum tersedia untuk divisualisasikan.</div>;
}

export interface AnalyticsChartProps {
  title: string;
  subtitle?: string;
  metricLabel?: string;
  centerLabel?: string;
  data?: unknown;
}

export function PieChart({ title, subtitle, metricLabel = "Nilai", centerLabel, data }: AnalyticsChartProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const { hover, hoverHandlers } = useChartHover();
  const points = pointsOf(data).filter((point) => point.value > 0);
  const total = points.reduce((sum, point) => sum + point.value, 0);
  let angleSoFar = 0;
  const cx = 110;
  const cy = 110;
  const radius = 92;
  const polar = (angle: number) => {
    const radians = ((angle - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) };
  };
  const chosen = selected !== null ? points[selected] : undefined;
  const dim = (index: number) => (selected !== null && selected !== index ? 0.45 : 1);
  return <article className={styles.card} {...chartRootProps}>
    <Header title={title} subtitle={subtitle} metricLabel={metricLabel} />
    {!points.length ? <Empty /> : <div className={styles.pieLayout}>
      <div className={styles.pieWrap}>
        <svg viewBox="0 0 220 220" role="img" aria-label={title}>
          {points.map((point, index) => {
            const startAngle = angleSoFar;
            const slice = point.value / total * 360;
            angleSoFar += slice;
            const share = `${numberFormat.format(point.value / total * 100)}%`;
            const interact = selectableProps(`${point.label}: ${format(point.value, metricLabel)} (${share})`, selected === index, () => setSelected((current) => toggleIndex(current, index)));
            const tip = hoverHandlers({
              title: point.label,
              color: COLORS[index % COLORS.length],
              rows: [{ label: metricLabel, value: format(point.value, metricLabel) }, { label: "Porsi", value: share }],
            });
            if (slice > 359.99) return <circle key={`${point.label}-${index}`} cx={cx} cy={cy} r={radius} fill={COLORS[index % COLORS.length]} {...interact} {...tip} />;
            const start = polar(startAngle);
            const end = polar(startAngle + slice);
            const path = `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${slice > 180 ? 1 : 0} 1 ${end.x} ${end.y} Z`;
            return <path key={`${point.label}-${index}`} d={path} fill={COLORS[index % COLORS.length]} stroke={selected === index ? "#172b4d" : "white"} strokeWidth={selected === index ? 3 : 2} opacity={dim(index)} {...interact} {...tip} />;
          })}
        </svg>
      </div>
      <div className={styles.legend}>
        {points.map((point, index) => <div
          className={styles.legendRow}
          key={`${point.label}-${index}`}
          role="button"
          tabIndex={0}
          aria-pressed={selected === index}
          style={{ cursor: "pointer", opacity: dim(index), fontWeight: selected === index ? 700 : undefined }}
          onClick={() => setSelected((current) => toggleIndex(current, index))}
          onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelected((current) => toggleIndex(current, index)); } }}
          {...hoverHandlers({
            title: point.label,
            color: COLORS[index % COLORS.length],
            rows: [{ label: metricLabel, value: format(point.value, metricLabel) }, { label: "Porsi", value: `${numberFormat.format(point.value / total * 100)}%` }],
          })}
        >
          <span className={styles.legendLabel}><i style={{ background: COLORS[index % COLORS.length] }} />{point.label}</span>
          <strong>{format(point.value, metricLabel)}</strong>
          <small>{numberFormat.format(point.value / total * 100)}%</small>
        </div>)}
      </div>
      <div className={styles.totalPill}>{centerLabel || "Total"} · <strong>{format(total, metricLabel)}</strong></div>
    </div>}
    {chosen && <ChartValueDetail
      title={chosen.label}
      color={COLORS[(selected as number) % COLORS.length]}
      rows={[
        { label: metricLabel, value: format(chosen.value, metricLabel) },
        { label: "Porsi", value: `${numberFormat.format(chosen.value / total * 100)}%` },
      ]}
      onClose={() => setSelected(null)}
    />}
    <ChartHoverTooltip hover={hover} />
  </article>;
}

export function AreaChart({ title, subtitle, metricLabel = "Nilai", data }: AnalyticsChartProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const { hover, hoverHandlers } = useChartHover();
  const points = pointsOf(data);
  const gradientId = `area-${useId().replace(/:/g, "")}`;
  const width = 800;
  const height = 300;
  const left = 62;
  const right = 22;
  const top = 24;
  const bottom = points.length > 8 ? 84 : 50;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const max = Math.max(...points.map((point) => point.value), 0);
  const xLabelInterval = Math.max(1, Math.ceil(points.length / 8));
  const coords = points.map((point, index) => ({ ...point, px: left + (points.length < 2 ? chartWidth / 2 : index / (points.length - 1) * chartWidth), py: top + chartHeight - (max ? point.value / max * chartHeight : 0) }));
  const line = coords.map((point) => `${point.px},${point.py}`).join(" ");
  const area = coords.length ? `${left},${top + chartHeight} ${line} ${left + chartWidth},${top + chartHeight}` : "";
  const chosen = selected !== null ? coords[selected] : undefined;
  return <article className={styles.card} {...chartRootProps}>
    <Header title={title} subtitle={subtitle} metricLabel={metricLabel} />
    {!points.length ? <Empty /> : <div className={styles.chartScroll}><svg className={`${styles.chartSvg} ${styles.areaChartSvg}`} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={title}>
      <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity=".34"/><stop offset="100%" stopColor="#a5b4fc" stopOpacity=".04"/></linearGradient></defs>
      {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
        const y = top + chartHeight - fraction * chartHeight;
        return <g key={fraction}><line x1={left} y1={y} x2={left + chartWidth} y2={y} stroke="#e8edf2" strokeDasharray="4 5"/><text x={left - 9} y={y + 4} textAnchor="end" className={styles.axisLabel}>{format(max * fraction, metricLabel)}</text></g>;
      })}
      <polygon points={area} fill={`url(#${gradientId})`} />
      <polyline points={line} fill="none" stroke="#4f46e5" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
      {chosen && <line x1={chosen.px} y1={top} x2={chosen.px} y2={top + chartHeight} stroke="#4f46e5" strokeDasharray="3 3" strokeWidth="1.4" />}
      {coords.map((point, index) => {
        const interact = selectableProps(`${point.label}: ${format(point.value, metricLabel)}`, selected === index, () => setSelected((current) => toggleIndex(current, index)));
        return <g key={`${point.label}-${index}`}>
          <circle cx={point.px} cy={point.py} r={selected === index ? 8 : 5} fill="#4f46e5" stroke="white" strokeWidth="2" />
          <circle
            cx={point.px}
            cy={point.py}
            r="14"
            fill="transparent"
            {...interact}
            {...hoverHandlers({ title: point.label, color: "#4f46e5", rows: [{ label: metricLabel, value: format(point.value, metricLabel) }] })}
          />
          {(index % xLabelInterval === 0 || index === coords.length - 1) && <text x={point.px} y={height - bottom + (points.length > 8 ? 10 : 21)} textAnchor={points.length > 8 ? "end" : "middle"} transform={points.length > 8 ? `rotate(-40 ${point.px} ${height - bottom + 10})` : undefined} className={styles.axisLabel}>{point.label}</text>}
        </g>;
      })}
    </svg></div>}
    {chosen && <ChartValueDetail
      title={chosen.label}
      color="#4f46e5"
      rows={[{ label: metricLabel, value: format(chosen.value, metricLabel) }]}
      onClose={() => setSelected(null)}
    />}
    <ChartHoverTooltip hover={hover} />
  </article>;
}

export function ScatterChart({ title, subtitle, metricLabel = "Nilai", centerLabel = "Kategori", data }: AnalyticsChartProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const { hover, hoverHandlers } = useChartHover();
  const points = pointsOf(data);
  const width = 800;
  const height = 300;
  const left = 62;
  const right = 24;
  const top = 24;
  const bottom = 54;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  // "Sequential" X means the points are just numbered 1..n (a text category);
  // otherwise X is a real number (for example age) and gets a numeric axis that
  // starts at the smallest value instead of being squeezed in from zero.
  const sequentialX = points.length > 0 && points.every((point, index) => point.x === index + 1);
  const xValues = points.map((point) => point.x ?? 0);
  const minX = sequentialX || !xValues.length ? 0 : Math.min(...xValues);
  const maxX = Math.max(...xValues, 1);
  const minY = Math.min(...points.map((point) => point.y ?? 0), 0);
  const maxY = Math.max(...points.map((point) => point.y ?? 0), 1);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const chosen = selected !== null ? points[selected] : undefined;
  return <article className={styles.card} {...chartRootProps}>
    <Header title={title} subtitle={subtitle} metricLabel={metricLabel} />
    {!points.length ? <Empty /> : <div className={styles.chartScroll}><svg className={`${styles.chartSvg} ${styles.scatterChartSvg}`} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={title}>
      {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
        const y = top + chartHeight - fraction * chartHeight;
        return <g key={fraction}><line x1={left} y1={y} x2={left + chartWidth} y2={y} stroke="#e8edf2" strokeDasharray="4 5"/><text x={left - 9} y={y + 4} textAnchor="end" className={styles.axisLabel}>{numberFormat.format(minY + rangeY * fraction)}</text></g>;
      })}
      <line x1={left} y1={top} x2={left} y2={top + chartHeight} stroke="#cbd5e1"/><line x1={left} y1={top + chartHeight} x2={left + chartWidth} y2={top + chartHeight} stroke="#cbd5e1"/>
      {sequentialX
        ? points.length <= 12 && points.map((point, index) => <text key={`xl-${index}`} x={left + (point.x ?? 0) / rangeX * chartWidth} y={top + chartHeight + 16} textAnchor="middle" className={styles.axisLabel}>{point.label.length > 12 ? `${point.label.slice(0, 11)}…` : point.label}</text>)
        : [0, 0.25, 0.5, 0.75, 1].map((fraction) => <text key={`xt-${fraction}`} x={left + fraction * chartWidth} y={top + chartHeight + 16} textAnchor="middle" className={styles.axisLabel}>{numberFormat.format(Math.round(minX + rangeX * fraction))}</text>)}
      {points.map((point, index) => {
        const x = left + ((point.x ?? 0) - minX) / rangeX * chartWidth;
        const y = top + chartHeight - ((point.y ?? 0) - minY) / rangeY * chartHeight;
        const interact = selectableProps(`${point.label}: ${format(point.y ?? 0, metricLabel)}`, selected === index, () => setSelected((current) => toggleIndex(current, index)));
        return <g key={`${point.label}-${index}`}>
          <circle cx={x} cy={y} r={selected === index ? 9 : 6} fill={COLORS[index % COLORS.length]} fillOpacity=".85" stroke={selected === index ? "#172b4d" : "white"} strokeWidth="2" />
          <circle
            cx={x}
            cy={y}
            r="14"
            fill="transparent"
            {...interact}
            {...hoverHandlers({
              title: point.label,
              color: COLORS[index % COLORS.length],
              rows: [
                { label: centerLabel, value: numberFormat.format(point.x ?? 0) },
                { label: metricLabel, value: format(point.y ?? 0, metricLabel) },
              ],
            })}
          />
        </g>;
      })}
      <text x={left + chartWidth / 2} y={height - 9} textAnchor="middle" className={styles.axisLabel}>{centerLabel}</text>
      <text x="15" y={top + chartHeight / 2} textAnchor="middle" transform={`rotate(-90 15 ${top + chartHeight / 2})`} className={styles.axisLabel}>{metricLabel}</text>
    </svg></div>}
    {chosen && <ChartValueDetail
      title={chosen.label}
      color={COLORS[(selected as number) % COLORS.length]}
      rows={[
        { label: centerLabel, value: numberFormat.format(chosen.x ?? 0) },
        { label: metricLabel, value: format(chosen.y ?? 0, metricLabel) },
      ]}
      onClose={() => setSelected(null)}
    />}
    <ChartHoverTooltip hover={hover} />
  </article>;
}

export function AnalyticsTable({ title, subtitle, metricLabel, data }: AnalyticsChartProps) {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const rows = rowsOf(data);
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(pageIndex, pageCount - 1);
  const pageRows = rows.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  return <article className={styles.card}>
    <Header title={title} subtitle={subtitle} metricLabel={metricLabel} />
    {!rows.length || !columns.length ? <Empty /> : <div className={styles.tableScroll}><table className={styles.table}>
      <thead><tr>{columns.map((column) => <th key={column}>{column.replace(/_/g, " ")}</th>)}</tr></thead>
      <tbody>{pageRows.map((row, index) => <tr key={currentPage * pageSize + index}>{columns.map((column) => <td key={column}>{row[column] == null ? "—" : String(row[column])}</td>)}</tr>)}</tbody>
    </table></div>}
    {rows.length > 0 && columns.length > 0 && <nav className={styles.tablePagination} aria-label="Navigasi halaman tabel">
      <span>{currentPage * pageSize + 1}–{Math.min((currentPage + 1) * pageSize, rows.length)} dari {new Intl.NumberFormat("id-ID").format(rows.length)} baris</span>
      <label>Baris<select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPageIndex(0); }} aria-label="Jumlah baris per halaman">{[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}</select></label>
      <button type="button" onClick={() => setPageIndex((page) => Math.max(0, page - 1))} disabled={currentPage === 0}>Sebelumnya</button>
      <span>Halaman {currentPage + 1} dari {pageCount}</span>
      <button type="button" onClick={() => setPageIndex((page) => Math.min(pageCount - 1, page + 1))} disabled={currentPage >= pageCount - 1}>Selanjutnya</button>
    </nav>}
  </article>;
}

export function AnalyticsMetricCard({ title, subtitle, metricLabel, value, formattedValue, badge }: { title: string; subtitle?: string; metricLabel?: string; value?: number | string; formattedValue?: string; badge?: string }) {
  const displayValue = formattedValue ?? (typeof value === "number" ? format(value, metricLabel || "") : value ?? "—");
  return <article className={styles.metricCard}>
    <span className={styles.metricIcon} aria-hidden="true">↗</span>
    {metricLabel && <span className={styles.metricTag}>{metricLabel}</span>}
    <p>{title}</p>
    <strong>{displayValue}</strong>
    {(subtitle || badge) && <footer>{subtitle && <span>{subtitle}</span>}{badge && <span className={styles.metricBadge}>{badge}</span>}</footer>}
  </article>;
}
