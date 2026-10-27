import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names with Tailwind-aware conflict resolution (shadcn convention).
 * Note: Tailwind is configured with the `tw-` prefix in this remote, so
 * tailwind-merge is set up to respect that prefix below.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
