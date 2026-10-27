"use client";

import { icons, Dot, type LucideProps } from "lucide-react";

interface DynamicIconProps extends Omit<LucideProps, "name"> {
  /** Icon name from the backend, in lucide kebab-case (e.g. "layout-grid"). */
  name?: string | null;
  /** Rendered when `name` is empty or not a known lucide icon. */
  fallback?: keyof typeof icons;
}

/** kebab-case ("layout-grid") -> PascalCase ("LayoutGrid"). */
function toPascalCase(kebab: string): string {
  return kebab
    .trim()
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
}

/**
 * Renders a lucide icon by its backend-provided name (kebab-case). Resolves
 * dynamically against lucide's full icon map, so any valid lucide name works
 * without a hand-maintained mapping. Falls back to a dot/placeholder when the
 * name is missing or unknown.
 */
export default function DynamicIcon({
  name,
  fallback,
  ...props
}: DynamicIconProps) {
  const pascal = name ? toPascalCase(name) : "";
  const Resolved =
    (pascal && (icons as Record<string, React.ComponentType<LucideProps>>)[pascal]) ||
    (fallback && icons[fallback]) ||
    Dot;
  return <Resolved {...props} />;
}
