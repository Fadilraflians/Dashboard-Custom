import "server-only";
import type { MfeDescriptor } from "@/types";

/**
 * Resolves a menu's MFE remote from env, keyed by `menuCode`.
 *
 * Convention: env vars are named MFE_<menuCode>_<FIELD>, where <menuCode> is
 * the UPPER_SNAKE code from the catalog/menus API (e.g. BOK_DASHBOARD). Only
 * clickable menus (MENU/SUBMENU with a routePath) have a remote; SECTION menus
 * are groups and have no env.
 *
 *   MFE_BOK_DASHBOARD_SCOPE  = dashboardBok
 *   MFE_BOK_DASHBOARD_MODULE = ./mount
 *   MFE_BOK_DASHBOARD_URL    = http://localhost:3001/remoteEntry.js
 */
export function resolveMfeByMenuCode(
  menuCode: string,
): MfeDescriptor | null {
  // Sanitize: only A-Z, 0-9 and underscore are valid in an env key segment.
  const key = menuCode.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "");
  if (!key) return null;

  // Per-menu override wins; otherwise fall back to the global default module.
  const module =
    process.env[`MFE_${key}_MODULE`] ||
    process.env.MFE_DEFAULT_MODULE ||
    "./mount";
  const isLocalAIGovtech =
    key === "AIGOVTECH_CHAT" && process.env.NODE_ENV !== "production";
  const scope =
    process.env[`MFE_${key}_SCOPE`] ||
    (isLocalAIGovtech ? "aiGovtech" : undefined);
  const url =
    process.env[`MFE_${key}_URL`] ||
    (isLocalAIGovtech ? "http://localhost:3024/remoteEntry.js" : undefined);

  if (!scope || !url) return null;

  return { scope, module, url };
}

/** URL of the shared UI remote (same for all MFEs). */
export function getSharedUrl(): string {
  return process.env.SHARED_URL || "";
}
