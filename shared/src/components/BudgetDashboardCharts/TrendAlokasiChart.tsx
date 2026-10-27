"use client";

import React, { useState } from "react";
import { BarChart3, Info } from "lucide-react";
import ChartValueDetail, { ChartHoverTooltip, chartRootProps, selectableProps, useChartHover } from "../ChartValueDetail/ChartValueDetail";
import styles from "./BudgetDashboardCharts.module.css";

export interface QuarterData {
  quarter: string;
  pagu: number; // in Millions
  sp2d: number; // in Millions
  realisasi: number; // in Millions
  label: string;
  active?: boolean;
}

interface TrendAlokasiChartProps {
  quarters?: QuarterData[];
  cumulativePagu?: string | number | null;
  infoBanner?: string;
  title?: string;
  subtitle?: string;
  onRemove?: () => void;
}

export default function TrendAlokasiChart({
  quarters = [],
  cumulativePagu,
  infoBanner = "",
  title = "Tren Alokasi Pagu, SP2D, dan Realisasi",
  subtitle = "Perbandingan periode yang tersedia pada data",
  onRemove,
}: TrendAlokasiChartProps) {
  const [hoveredQuarter, setHoveredQuarter] = useState<string | null>(null);
  const [selectedQuarter, setSelectedQuarter] = useState<string | null>(null);
  const { hover, hoverHandlers } = useChartHover();
  const chosen = quarters.find((row) => row.quarter === selectedQuarter);
  const formatJt = (value: number) => `Rp ${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(value)} Jt`;

  const rawMax = Math.max(...quarters.flatMap((row) => [row.pagu, row.sp2d, row.realisasi]), 0);
  const tickStep = 10 ** Math.floor(Math.log10(rawMax || 1)) / 4;
  const maxY = Math.max(tickStep, Math.ceil(rawMax / tickStep) * tickStep);
  const svgWidth = 620;
  const svgHeight = 260;
  const chartTop = 30;
  const chartBottom = 220;
  const chartHeight = chartBottom - chartTop;
  const chartLeft = 55;
  const chartRight = 600;
  const chartWidth = chartRight - chartLeft;

  const yTicks = Array.from({ length: 5 }, (_, index) => {
    const value = maxY * (4 - index) / 4;
    return { value, label: `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(value)} Jt` };
  });

  const colWidth = chartWidth / Math.max(quarters.length, 1);
  const barWidth = 14;
  const barGap = 3;

  // Calculate points for trend line over SP2D points
  const linePoints = quarters.map((q, idx) => {
    const groupCenterX = chartLeft + idx * colWidth + colWidth / 2;
    // SP2D is the middle bar in the group of 3 bars
    const sp2dX = groupCenterX;
    const sp2dY = chartBottom - (q.sp2d / maxY) * chartHeight;
    return { x: sp2dX, y: sp2dY, q };
  });

  const lineD = linePoints
    .map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`)
    .join(" ");

  return (
    <div className={styles.chartCard} {...chartRootProps}>
      {/* Chart Header */}
      <div className={styles.chartHeader}>
        <div className={styles.chartHeaderLeft}>
          <div className={styles.chartIconBadge}>
            <BarChart3 size={17} color="#005e54" />
          </div>
          <div>
            <h3 className={styles.chartTitle}>
              {title}
            </h3>
            <p className={styles.chartSubtitle}>
              {subtitle}
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className={styles.chartLegend}>
          <div className={styles.legendItem}>
            <span className={styles.legendColor} style={{ backgroundColor: "#dce5ea" }} />
            <span>Pagu RPD</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendColor} style={{ backgroundColor: "#005e54" }} />
            <span>SP2D Cair</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendColor} style={{ backgroundColor: "#00b074" }} />
            <span>Realisasi</span>
          </div>
          {onRemove && (
            <button
              type="button"
              className={styles.widgetRemoveBtn}
              onClick={onRemove}
              title="Hapus grafik ini dari dashboard"
            >
              Ã—
            </button>
          )}
        </div>
      </div>

      {/* SVG Visualization */}
      <div className={styles.svgContainer}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className={styles.trendSvg}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Horizontal Gridlines & Y-labels */}
          {yTicks.map(({ value, label }) => {
            const y = chartBottom - (value / maxY) * chartHeight;
            return (
              <g key={value}>
                <line
                  x1={chartLeft}
                  y1={y}
                  x2={chartRight}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray={value === 0 ? "0" : "3 3"}
                  strokeWidth={value === 0 ? "1.5" : "1"}
                />
                <text
                  x={chartLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="#94a3b8"
                  fontWeight="600"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {quarters.length === 0 && <text x="310" y="125" textAnchor="middle" fill="#667085" fontSize="13">Data periode tidak tersedia.</text>}

          {/* Grouped Bars */}
          {quarters.map((q, idx) => {
            const groupCenterX = chartLeft + idx * colWidth + colWidth / 2;
            const paguHeight = (q.pagu / maxY) * chartHeight;
            const sp2dHeight = (q.sp2d / maxY) * chartHeight;
            const realisasiHeight = (q.realisasi / maxY) * chartHeight;

            const paguX = groupCenterX - barWidth * 1.5 - barGap;
            const sp2dX = groupCenterX - barWidth / 2;
            const realisasiX = groupCenterX + barWidth / 2 + barGap;

            const isHovered = hoveredQuarter === q.quarter;

            return (
              <g
                key={q.quarter}
                {...hoverHandlers(
                  {
                    title: `${q.quarter}${q.active ? " (Aktif)" : ""}`,
                    color: "#005e54",
                    rows: [
                      { label: "Pagu RPD", value: formatJt(q.pagu) },
                      { label: "SP2D Cair", value: formatJt(q.sp2d) },
                      { label: "Realisasi", value: formatJt(q.realisasi) },
                    ],
                  },
                  { onEnter: () => setHoveredQuarter(q.quarter), onLeave: () => setHoveredQuarter(null) },
                )}
                opacity={selectedQuarter !== null && selectedQuarter !== q.quarter ? 0.5 : 1}
                {...selectableProps(
                  `${q.quarter}: pagu ${formatJt(q.pagu)}, SP2D ${formatJt(q.sp2d)}, realisasi ${formatJt(q.realisasi)}`,
                  selectedQuarter === q.quarter,
                  () => setSelectedQuarter((current) => (current === q.quarter ? null : q.quarter)),
                )}
              >
                {/* Background highlight on hover */}
                {isHovered && (
                  <rect
                    x={groupCenterX - colWidth / 2 + 5}
                    y={chartTop}
                    width={colWidth - 10}
                    height={chartHeight}
                    fill="rgba(0, 94, 84, 0.04)"
                    rx="6"
                  />
                )}

                {/* Pagu Bar (Light blue-gray) */}
                <rect
                  x={paguX}
                  y={chartBottom - paguHeight}
                  width={barWidth}
                  height={paguHeight}
                  fill="#dce5ea"
                  rx="3"
                />

                {/* SP2D Cair Bar (Dark Teal) */}
                <rect
                  x={sp2dX}
                  y={chartBottom - sp2dHeight}
                  width={barWidth}
                  height={sp2dHeight}
                  fill="#005e54"
                  rx="3"
                />

                {/* Realisasi Bar (Emerald Green) */}
                <rect
                  x={realisasiX}
                  y={chartBottom - realisasiHeight}
                  width={barWidth}
                  height={realisasiHeight}
                  fill="#00b074"
                  rx="3"
                />

                {/* X-axis Label */}
                <text
                  x={groupCenterX}
                  y={chartBottom + 20}
                  textAnchor="middle"
                  fontSize="11.5"
                  fontWeight={q.active ? "800" : "600"}
                  fill={q.active ? "#005e54" : "#475467"}
                >
                  {q.quarter} {q.active ? "(Aktif)" : ""}
                </text>
              </g>
            );
          })}

          {/* Dotted Orange Trend Line */}
          <path
            d={lineD}
            fill="none"
            stroke="#ff6b00"
            strokeWidth="2.2"
            strokeDasharray="4 3"
          />

          {/* Trend Line Nodes & Labels */}
          {linePoints.map(({ x, y, q }) => {
            const isTarget = Boolean(q.active);
            return (
              <g key={`point-${q.quarter}`}>
                {/* Outer Glow Node */}
                <circle
                  cx={x}
                  cy={y}
                  r="4.5"
                  fill="#ff6b00"
                  stroke="#ffffff"
                  strokeWidth="2"
                />

                {/* Value Badge on top */}
                <g transform={`translate(${x}, ${y - 14})`}>
                  <rect
                    x="-26"
                    y="-14"
                    width="68"
                    height="18"
                    rx="4"
                    fill="#ffffff"
                    stroke="#ff6b00"
                    strokeWidth="1.2"
                    filter="drop-shadow(0px 1px 2px rgba(0,0,0,0.08))"
                  />
                  <text
                    x="8"
                    y="-2"
                    textAnchor="middle"
                    fontSize="9.5"
                    fontWeight="800"
                    fill="#ff6b00"
                  >
                    {q.label}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Footer Banner */}
      <div className={styles.chartFooter}>
        <div className={styles.chartFooterLeft}>
          <span className={styles.greenPulseDot} />
          <span>{infoBanner}</span>
        </div>
        <div className={styles.chartFooterRight}>
          <small>Pagu Kumulatif:</small>
          <strong>{typeof cumulativePagu === "number" ? `Rp ${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(cumulativePagu)}` : cumulativePagu || "â€”"}</strong>
        </div>
      </div>

      {chosen && (
        <ChartValueDetail
          title={`${chosen.quarter}${chosen.active ? " (Aktif)" : ""}`}
          rows={[
            { label: "Pagu RPD", value: formatJt(chosen.pagu) },
            { label: "SP2D Cair", value: formatJt(chosen.sp2d) },
            { label: "Realisasi", value: formatJt(chosen.realisasi) },
          ]}
          onClose={() => setSelectedQuarter(null)}
        />
      )}
      <ChartHoverTooltip hover={hover} />
    </div>
  );
}

