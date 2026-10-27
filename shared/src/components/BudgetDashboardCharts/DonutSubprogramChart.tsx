"use client";

import React, { useState } from "react";
import { PieChart } from "lucide-react";
import ChartValueDetail, { ChartHoverTooltip, chartRootProps, selectableProps, toggleIndex, useChartHover } from "../ChartValueDetail/ChartValueDetail";
import styles from "./BudgetDashboardCharts.module.css";

export interface ProgramItem {
  name: string;
  amount: string;
  percentage: string;
  color: string;
}

interface DonutSubprogramChartProps {
  programs?: ProgramItem[];
  title?: string;
  centerTitle?: string;
  centerAmount?: string;
  centerSubtitle?: string;
  badge?: string;
  subtitle?: string;
  onRemove?: () => void;
}

export default function DonutSubprogramChart({
  programs = [],
  title = "Proporsi Alokasi Sub-Program",
  centerTitle = "Total Alokasi",
  centerAmount = "â€”",
  centerSubtitle,
  badge,
  subtitle = "Distribusi berdasarkan alokasi yang tercatat",
  onRemove,
}: DonutSubprogramChartProps) {
  const [activeSegment, setActiveSegment] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const { hover, hoverHandlers } = useChartHover();
  const chosen = selected !== null ? programs[selected] : undefined;
  const tipFor = (program: ProgramItem, index: number) =>
    hoverHandlers(
      {
        title: program.name,
        color: program.color,
        rows: [
          { label: "Alokasi", value: program.amount },
          { label: "Porsi", value: program.percentage },
        ],
      },
      { onEnter: () => setActiveSegment(index), onLeave: () => setActiveSegment(null) },
    );

  // SVG Donut calculation
  const size = 180;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Compute strokeDasharray and strokeDashoffset
  let accumulatedOffset = 0;
  const slices = programs.map((p, index) => {
    const numericPercent = parseFloat(p.percentage.replace("%", "")) || 0;
    const strokeDasharray = `${(numericPercent / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedOffset;
    accumulatedOffset += (numericPercent / 100) * circumference;
    return { ...p, strokeDasharray, strokeDashoffset, index };
  });

  return (
    <div className={styles.donutCard} {...chartRootProps}>
      {/* Header */}
      <div className={styles.donutHeader}>
        <div className={styles.donutHeaderLeft}>
          <div className={styles.donutIconBadge}>
            <PieChart size={17} color="#005e54" />
          </div>
          <div>
            <div className={styles.donutTitleRow}>
              <h3 className={styles.donutTitle}>{title}</h3>
              {badge && <span className={styles.donutQuarterBadge}>{badge}</span>}
            </div>
            <p className={styles.donutSubtitle}>{subtitle}</p>
          </div>
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

      {/* Donut Chart Visual */}
      <div className={styles.donutGraphicArea}>
        <div className={styles.donutWrapper}>
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className={styles.donutSvg}
          >
            {/* Background ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#f1f5f9"
              strokeWidth={strokeWidth}
            />

            {/* Colored Segment Slices */}
            {slices.map((slice) => {
              const isHovered = activeSegment === slice.index;
              return (
                <circle
                  key={slice.name}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={slice.strokeDasharray}
                  strokeDashoffset={slice.strokeDashoffset}
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                  className={styles.donutSlice}
                  opacity={selected !== null && selected !== slice.index ? 0.45 : 1}
                  {...tipFor(slice, slice.index)}
                  {...selectableProps(
                    `${slice.name}: ${slice.amount} (${slice.percentage})`,
                    selected === slice.index,
                    () => setSelected((current) => toggleIndex(current, slice.index)),
                  )}
                />
              );
            })}
          </svg>

          {/* Donut Center Hole Text */}
          <div className={styles.donutCenter}>
            <span className={styles.donutCenterSub}>{centerTitle}</span>
            <strong className={styles.donutCenterAmount}>{centerAmount}</strong>
            <span className={styles.donutCenterCount}>{centerSubtitle || `${programs.length} Program`}</span>
          </div>
        </div>
      </div>

      {/* Legend Breakdown */}
      <div className={styles.donutLegendList}>
        {programs.map((p, index) => {
          const isHovered = activeSegment === index;
          return (
            <div
              key={p.name}
              className={`${styles.donutLegendRow} ${isHovered ? styles.donutLegendRowHovered : ""}`}
              role="button"
              tabIndex={0}
              aria-pressed={selected === index}
              style={{ cursor: "pointer" }}
              onClick={() => setSelected((current) => toggleIndex(current, index))}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelected((current) => toggleIndex(current, index));
                }
              }}
              {...tipFor(p, index)}
            >
              <div className={styles.donutLegendNameArea}>
                <span
                  className={styles.donutDot}
                  style={{ backgroundColor: p.color }}
                />
                <span className={styles.donutProgramName}>{p.name}</span>
              </div>
              <div className={styles.donutLegendValueArea}>
                <strong className={styles.donutProgramAmount}>{p.amount}</strong>
                <span className={styles.donutProgramPercent}>({p.percentage})</span>
              </div>
            </div>
          );
        })}
      </div>

      {chosen && (
        <ChartValueDetail
          title={chosen.name}
          color={chosen.color}
          rows={[
            { label: "Alokasi", value: chosen.amount },
            { label: "Porsi", value: chosen.percentage },
          ]}
          onClose={() => setSelected(null)}
        />
      )}
      <ChartHoverTooltip hover={hover} />
    </div>
  );
}

