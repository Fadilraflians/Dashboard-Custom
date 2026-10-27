import React from "react";
import { Wallet, TrendingUp, TrendingDown, X } from "lucide-react";
import styles from "./TotalPendapatanFashionCard.module.css";

export interface TotalPendapatanCardProps {
  value?: number;
  /** Pre-formatted display string (e.g. "Rp 6.975.804.400"). Preferred over
   *  `value` when provided so the card matches the number the API computed. */
  formattedValue?: string;
  delta?: number;
  title?: string;
  subtitle?: string;
  onRemove?: () => void;
}

function formatCurrency(val: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);
}

export default function TotalPendapatanFashionCard({
  value,
  formattedValue,
  delta,
  title = "Total Pendapatan",
  subtitle,
  onRemove,
}: TotalPendapatanCardProps) {
  const up = (delta ?? 0) >= 0;

  // Prefer the API-provided formatted string; fall back to formatting the
  // numeric value; show a dash only when neither is usable.
  const displayValue =
    typeof formattedValue === "string" && formattedValue.trim() !== ""
      ? formattedValue
      : typeof value === "number" && Number.isFinite(value)
        ? formatCurrency(value)
        : "—";

  return (
    <article className={styles.cardContainer} aria-label={title}>
      {/* Top row */}
      <div className={styles.topRow}>
        <div className={styles.iconBox}>
          <Wallet size={20} color="#005e54" />
        </div>

        <div className={styles.topRightActions}>
          {typeof delta === "number" && (
            <span className={`${styles.deltaBadge} ${up ? styles.deltaUp : styles.deltaDown}`}>
              {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              <span>{Math.abs(delta)}%</span>
            </span>
          )}

          {onRemove && (
            <button
              type="button"
              className={styles.btnRemove}
              onClick={onRemove}
              title="Hapus kartu ini"
              aria-label="Hapus kartu"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Label */}
      <p className={styles.cardLabel}>{title}</p>

      {/* Main value */}
      <div className={styles.cardValue}>{displayValue}</div>

      {/* Subtitle */}
      {subtitle && <p className={styles.cardSubtitle}>{subtitle}</p>}
    </article>
  );
}
