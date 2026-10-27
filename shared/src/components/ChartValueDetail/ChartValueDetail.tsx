import React, { useState } from "react";

/**
 * Shared value interaction for every dashboard chart.
 *
 * - HOVER: moving the pointer over a bar, point, slice or legend row shows a
 *   small tooltip next to the pointer (`useChartHover` + `ChartHoverTooltip`).
 * - CLICK: clicking pins the same information in a panel at the bottom of the
 *   chart (`ChartValueDetail`) until it is closed or clicked again.
 *
 * The chart's root element must be `position: relative` and carry the
 * `data-chart-root` attribute: spread `chartRootProps` on it.
 */

export interface DetailRow {
  label: string;
  value: string;
}

export interface ChartValueDetailProps {
  title: string;
  rows: DetailRow[];
  color?: string;
  onClose: () => void;
}

/** Anchors the tooltip / detail panel to the chart card. */
export const chartRootStyle: React.CSSProperties = { position: "relative" };

/** Spread on the chart's root element (`<article>` or `<div>`). */
export const chartRootProps = { style: chartRootStyle, "data-chart-root": "true" } as const;

export function selectableProps(label: string, selected: boolean, onToggle: () => void) {
  return {
    role: "button" as const,
    tabIndex: 0,
    "aria-label": label,
    "aria-pressed": selected,
    style: { cursor: "pointer", outline: "none" } as React.CSSProperties,
    onClick: (event: React.MouseEvent) => {
      event.stopPropagation();
      onToggle();
    },
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onToggle();
      }
    },
  };
}

/** Toggle helper: selecting the already selected item clears the selection. */
export function toggleIndex(current: number | null, next: number): number | null {
  return current === next ? null : next;
}

/* ------------------------------------------------------------------ */
/* Hover tooltip                                                       */
/* ------------------------------------------------------------------ */

export interface HoverContent {
  title: string;
  rows: DetailRow[];
  color?: string;
}

export interface HoverState extends HoverContent {
  /** Pointer position relative to the chart card. */
  x: number;
  y: number;
  /** Chart card size, used to keep the tooltip inside the card. */
  cardWidth: number;
  cardHeight: number;
}

interface HoverCallbacks {
  /** Extra work to do on enter (for example highlighting a slice). */
  onEnter?: () => void;
  /** Extra work to do on leave. */
  onLeave?: () => void;
}

export function useChartHover() {
  const [hover, setHover] = useState<HoverState | null>(null);

  const place = (content: HoverContent) => (event: React.MouseEvent) => {
    const root = (event.currentTarget as Element).closest("[data-chart-root]");
    if (!root) return;
    const box = root.getBoundingClientRect();
    setHover({
      ...content,
      x: event.clientX - box.left,
      y: event.clientY - box.top,
      cardWidth: box.width,
      cardHeight: box.height,
    });
  };

  /** Props to spread on any element that should show a tooltip on hover. */
  const hoverHandlers = (content: HoverContent, callbacks: HoverCallbacks = {}) => {
    const show = place(content);
    return {
      onMouseEnter: (event: React.MouseEvent) => {
        callbacks.onEnter?.();
        show(event);
      },
      onMouseMove: show,
      onMouseLeave: () => {
        callbacks.onLeave?.();
        setHover(null);
      },
    };
  };

  return { hover, hoverHandlers, clearHover: () => setHover(null) };
}

const OFFSET = 14;

export function ChartHoverTooltip({ hover }: { hover: HoverState | null }) {
  if (!hover) return null;
  // Flip to the other side of the pointer near the right / bottom edge so the
  // tooltip never leaves the chart card.
  const flipX = hover.x > hover.cardWidth * 0.6;
  const flipY = hover.y > hover.cardHeight * 0.6;
  return (
    <div
      role="tooltip"
      style={{
        position: "absolute",
        left: flipX ? hover.x - OFFSET : hover.x + OFFSET,
        top: flipY ? hover.y - OFFSET : hover.y + OFFSET,
        transform: `translate(${flipX ? "-100%" : "0"}, ${flipY ? "-100%" : "0"})`,
        zIndex: 8,
        maxWidth: "70%",
        padding: "7px 10px",
        background: "#ffffff",
        border: "1px solid #cfe3df",
        borderLeft: `4px solid ${hover.color ?? "#005e54"}`,
        borderRadius: 8,
        boxShadow: "0 6px 18px rgba(16, 36, 60, 0.18)",
        color: "#172b4d",
        fontSize: 12,
        lineHeight: 1.45,
        pointerEvents: "none",
      }}
    >
      <strong style={{ display: "block", fontSize: 12.5 }}>{hover.title}</strong>
      {hover.rows.map((row) => (
        <div key={row.label} style={{ color: "#53647b" }}>
          {row.label}: <b style={{ color: "#172b4d" }}>{row.value}</b>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pinned detail panel (click)                                         */
/* ------------------------------------------------------------------ */

export default function ChartValueDetail({ title, rows, color = "#005e54", onClose }: ChartValueDetailProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "absolute",
        left: 12,
        right: 12,
        bottom: 10,
        zIndex: 5,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "4px 14px",
        padding: "8px 10px 8px 12px",
        background: "#ffffff",
        border: "1px solid #cfe3df",
        borderLeft: `4px solid ${color}`,
        borderRadius: 10,
        boxShadow: "0 6px 18px rgba(16, 36, 60, 0.16)",
        color: "#172b4d",
        fontSize: 12,
        lineHeight: 1.4,
      }}
    >
      <strong style={{ fontSize: 12.5 }}>{title}</strong>
      {rows.map((row) => (
        <span key={row.label} style={{ color: "#53647b" }}>
          {row.label}: <b style={{ color: "#172b4d" }}>{row.value}</b>
        </span>
      ))}
      <button
        type="button"
        aria-label="Tutup detail nilai"
        title="Tutup"
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        style={{
          marginLeft: "auto",
          width: 22,
          height: 22,
          border: "none",
          borderRadius: 6,
          background: "#f1f5f9",
          color: "#475467",
          cursor: "pointer",
          fontSize: 14,
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}
