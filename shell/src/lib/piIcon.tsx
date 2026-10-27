import React from "react";
import {
  LayoutGrid,
  Users,
  Home,
  ArrowRight,
  User,
  Loader2,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";

/**
 * Maps the legacy PrimeIcons `pi pi-*` class strings (still used in the shell's
 * menu/app registry `icon` fields) to lucide-react icons, so data-driven icons
 * keep working after the PrimeIcons dependency is removed.
 */
const MAP: Record<string, LucideIcon> = {
  "pi pi-th-large": LayoutGrid,
  "pi pi-users": Users,
  "pi pi-home": Home,
  "pi pi-arrow-right": ArrowRight,
  "pi pi-user": User,
};

export function PiIcon({
  name,
  size = 18,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const Icon = MAP[name] ?? AlertTriangle;
  return <Icon size={size} className={className} />;
}

export { Loader2 as SpinnerIcon };
