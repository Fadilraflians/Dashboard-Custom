import React from "react";
import { ArrowLeftRight, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "../../lib/utils";

// Tailwind layer (prefixed `tw-`) + shadcn tokens. Imported here so the card is
// style-self-sufficient when consumed via Module Federation.
import "../../styles/tailwind.css";

export interface TransaksiCardProps {
  /** Raw transaction count; the card formats it with thousands separators. */
  value: number;
  /** Period-over-period delta in %. Positive = up (green), negative = down. */
  delta?: number;
  /** Loading state — shows a shimmer in place of the value. */
  loading?: boolean;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

/**
 * "Transaksi" card — standalone, self-contained. Restyled with Tailwind
 * (shadcn-style tokens). Label, icon, color and number formatting are fixed
 * inside this component; the consuming MFE only supplies the raw `value`
 * (and optional `delta`) from its own API. Props/export are unchanged so the
 * Module Federation contract stays identical.
 */
export default function TransaksiCard({
  value,
  delta,
  loading = false,
}: TransaksiCardProps) {
  const hasDelta = typeof delta === "number";
  const up = (delta ?? 0) >= 0;

  return (
    <div
      className={cn(
        "tw-flex tw-flex-col tw-gap-3 tw-rounded-lg tw-border tw-border-border",
        "tw-bg-card tw-p-5 tw-text-card-foreground tw-shadow-sm",
      )}
    >
      <div className="tw-flex tw-items-center tw-justify-between">
        <span className="tw-inline-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-md tw-bg-primary/10 tw-text-primary">
          <ArrowLeftRight className="tw-h-5 tw-w-5" />
        </span>
        {hasDelta && (
          <span
            className={cn(
              "tw-inline-flex tw-items-center tw-gap-1 tw-text-sm tw-font-medium",
              up ? "tw-text-success" : "tw-text-danger",
            )}
          >
            {up ? (
              <TrendingUp className="tw-h-4 tw-w-4" />
            ) : (
              <TrendingDown className="tw-h-4 tw-w-4" />
            )}
            {Math.abs(delta as number)}%
          </span>
        )}
      </div>

      <p className="tw-text-sm tw-text-muted-foreground">Transaksi</p>
      {loading ? (
        <span className="tw-h-7 tw-w-32 tw-animate-pulse tw-rounded tw-bg-muted" aria-hidden />
      ) : (
        <p className="tw-text-2xl tw-font-semibold tw-text-foreground">
          {formatNumber(value)}
        </p>
      )}
    </div>
  );
}
