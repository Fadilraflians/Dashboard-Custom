"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  /** Target value to count up to. */
  value: number;
  /** Animation duration in ms. */
  duration?: number;
  /** Locale-aware thousands formatting. */
  format?: boolean;
  className?: string;
}

/**
 * Animated number that eases from 0 up to `value`. Respects
 * prefers-reduced-motion (jumps straight to the value). Re-runs when `value`
 * changes (e.g. once the API data arrives).
 */
export default function CountUp({
  value,
  duration = 1200,
  format = true,
  className,
}: CountUpProps) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const target = Number.isFinite(value) ? value : 0;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || target === 0) {
      setDisplay(target);
      return;
    }

    const start = performance.now();
    // easeOutCubic for a natural settle.
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      setDisplay(Math.round(ease(progress) * target));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [value, duration]);

  return (
    <span className={className}>
      {format ? display.toLocaleString("id-ID") : display}
    </span>
  );
}
