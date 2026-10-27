import React from "react";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "../../lib/utils";

// Tailwind layer (prefixed `tw-`) + shadcn tokens. Imported here so the card is
// style-self-sufficient when consumed via Module Federation (the host does not
// need to import any CSS for this card to look right).
import "../../styles/tailwind.css";

export interface TotalPendapatanCardProps {
  /** Raw amount in IDR; the card formats it as currency. */
  value: number;
  /** Period-over-period delta in %. Positive = up (green), negative = down. */
  delta?: number;
  /** Loading state — shows a shimmer in place of the value. */
  loading?: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * "Total Pendapatan" card — standalone, self-contained. Restyled with Tailwind
 * (shadcn-style tokens). Label, icon, color and currency formatting are fixed
 * inside this component; the consuming MFE only supplies the raw `value`
 * (and optional `delta`) from its own API. Props/export are unchanged so the
 * Module Federation contract stays identical.
 */
export default function TotalPendapatanCard({
  value,
  delta,
  loading = false,
}: TotalPendapatanCardProps) {
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
          <Wallet className="tw-h-5 tw-w-5" />
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

      <p className="tw-text-sm tw-text-muted-foreground">Total Pendapatan</p>
      {loading ? (
        <span className="tw-h-7 tw-w-32 tw-animate-pulse tw-rounded tw-bg-muted" aria-hidden />
      ) : (
        <p className="tw-text-2xl tw-font-semibold tw-text-foreground">
          {formatCurrency(value)}
        </p>
      )}
    </div>
  );
}
