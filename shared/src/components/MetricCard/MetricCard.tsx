import React from "react";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeftRight,
  BarChart3,
  Landmark,
  Package,
  Percent,
  ShieldCheck,
  Star,
  Truck,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";
// Same stylesheet as the "Total Penjualan" card, so every metric card on the
// dashboard shares one look. Only the icon, label and value differ.
import styles from "../TotalPendapatanFashionCard/TotalPendapatanFashionCard.module.css";

type IconComponent = React.ComponentType<{ size?: number; color?: string }>;

const ICONS: Record<string, IconComponent> = {
  wallet: Wallet,
  "arrow-left-right": ArrowLeftRight,
  star: Star,
  truck: Truck,
  percent: Percent,
  package: Package,
  users: Users,
  "trending-up": TrendingUp,
  "shield-check": ShieldCheck,
  landmark: Landmark,
  "bar-chart": BarChart3,
};

/** "ArrowLeftRight" / "arrow_left_right" / "arrow-left-right" -> "arrow-left-right" */
function normalizeIconName(name: string): string {
  return name
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[_\s]+/g, "-")
    .toLowerCase();
}

/**
 * Icon comes from the widget (`icon`). When a widget has none (for example one
 * created from a free-form question), it is derived from the card title.
 */
function resolveIcon(icon: string | undefined, title: string): IconComponent {
  if (icon) {
    const byName = ICONS[normalizeIconName(icon)];
    if (byName) return byName;
  }
  const text = title.toLowerCase();
  if (/rating|bintang|ulasan/.test(text)) return Star;
  if (/ongkir|ongkos|kirim|shipping|pengiriman/.test(text)) return Truck;
  if (/diskon|discount|potongan/.test(text)) return Percent;
  if (/pelanggan|customer|member/.test(text)) return Users;
  if (/unit|kuantitas|quantity|barang|stok/.test(text)) return Package;
  if (/transaksi|pesanan|pemesanan|order/.test(text)) return ArrowLeftRight;
  if (/penjualan|pendapatan|omzet|revenue|sales|pembayaran|harga|subtotal|profit|laba/.test(text)) return Wallet;
  return BarChart3;
}

const plainNumber = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });
const rupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

function isMoneyTitle(title: string): boolean {
  return /penjualan|pendapatan|omzet|revenue|sales|pembayaran|harga|subtotal|diskon|ongkir|ongkos|profit|laba|dana/i.test(title);
}

/**
 * Count-up animation for a numeric display. Given the final formatted string
 * and the raw number, it animates from 0 to the number once (on mount when
 * `enabled`), formatting every frame so prefixes/suffixes (Rp, %, "unit") and
 * the number style are preserved. Returns the string to render.
 */
function useCountUp(finalText: string, rawValue: number | null, enabled: boolean): string {
  const [text, setText] = useState(finalText);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    // Nothing to animate: no number, or disabled -> show the final text as-is.
    if (!enabled || rawValue == null || !Number.isFinite(rawValue)) {
      setText(finalText);
      return;
    }
    // Split the final text around the numeric part so we can rebuild each frame
    // keeping the prefix (e.g. "Rp ") and suffix (e.g. "%").
    const match = finalText.match(/^(\D*)([\d.,]+)(.*)$/s);
    if (!match) {
      setText(finalText);
      return;
    }
    const [, prefix, numStr, suffix] = match;
    // Detect decimals from the final formatted number (id-ID uses "," decimal).
    const decimals = (() => {
      const dec = numStr.split(",")[1];
      return dec ? Math.min(dec.replace(/\D/g, "").length, 2) : 0;
    })();
    const fmt = new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

    const duration = 1200;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      // easeOutCubic for a natural "settling" feel.
      const eased = 1 - Math.pow(1 - p, 3);
      const current = rawValue * eased;
      setText(`${prefix}${fmt.format(current)}${suffix}`);
      if (p < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setText(finalText); // snap to the exact final formatting
      }
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
    };
    // Re-run only when the target or enablement changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalText, rawValue, enabled]);

  return text;
}

export interface MetricCardProps {
  title?: string;
  subtitle?: string;
  /** Raw number. Used only when `formattedValue` is not provided. */
  value?: number | string;
  /** Display string prepared by the API (preferred; already formatted). */
  formattedValue?: string;
  /** Lucide icon name, e.g. "wallet", "arrow-left-right", "star", "truck". */
  icon?: string;
  /** Short status text shown top-right (for example "+100% target"). */
  badge?: string;
  delta?: number;
  onRemove?: () => void;
  /** Play a one-time count-up animation on mount when true. */
  animateOnce?: boolean;
}

export default function MetricCard({
  title = "Metrik",
  subtitle,
  value,
  formattedValue,
  icon,
  badge,
  delta,
  onRemove,
  animateOnce = false,
}: MetricCardProps) {
  const Icon = resolveIcon(icon, title);
  const up = (delta ?? 0) >= 0;

  let displayValue = "—";
  if (typeof formattedValue === "string" && formattedValue.trim() !== "") {
    displayValue = formattedValue;
  } else if (typeof value === "number" && Number.isFinite(value)) {
    displayValue = isMoneyTitle(title) ? rupiah.format(value) : plainNumber.format(value);
  } else if (typeof value === "string" && value.trim() !== "") {
    displayValue = value;
  }

  // Raw number for the count-up: prefer numeric `value`; otherwise parse the
  // digits out of the display string (handles "Rp 5.677.025.000", "2,97", "0,49%").
  const rawForCountUp: number | null = (() => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const digits = displayValue.replace(/[^\d.,-]/g, "").replace(/\./g, "").replace(",", ".");
    const n = parseFloat(digits);
    return Number.isFinite(n) ? n : null;
  })();
  const animatedValue = useCountUp(displayValue, rawForCountUp, animateOnce);

  return (
    <article className={styles.cardContainer} aria-label={title}>
      <div className={styles.topRow}>
        <div className={styles.iconBox}>
          <Icon size={20} color="#005e54" />
        </div>

        <div className={styles.topRightActions}>
          {badge && (
            <span className={`${styles.deltaBadge} ${styles.deltaUp}`}>
              <span>{badge}</span>
            </span>
          )}
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

      <p className={styles.cardLabel}>{title}</p>
      <div className={styles.cardValue}>{animatedValue}</div>
      {subtitle && <p className={styles.cardSubtitle}>{subtitle}</p>}
    </article>
  );
}
