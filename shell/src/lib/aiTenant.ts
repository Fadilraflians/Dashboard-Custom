import { isLocalDemoAdmin } from "@/lib/localDemo";
import type { SessionRecord } from "@/lib/session";

export type AiTenant = "fashion" | "kemenkeu";

export const AI_TENANTS: Record<AiTenant, {
  organizationCode: string;
  organizationName: string;
  databaseLabel: string;
  table: string;
}> = {
  fashion: {
    organizationCode: "KEMENKES",
    organizationName: "Kementerian Kesehatan",
    databaseLabel: "Fashion",
    table: "FASHION_APP.FASHION_SALES",
  },
  kemenkeu: {
    organizationCode: "KEMENKEU",
    organizationName: "Kementerian Keuangan",
    databaseLabel: "E-commerce",
    table: "KEMENKEUDB.DATA_ECOMMERS",
  },
};

export function resolveOrganizationAiTenant(
  session: Pick<SessionRecord, "organizationCode" | "organizationName" | "organizationId">,
): AiTenant | null {
  const identity = `${session.organizationCode || ""} ${session.organizationName || ""}`.toLowerCase();
  if (/kemenkes|kementerian\s+kesehatan/.test(identity) || session.organizationId === 1) {
    return "fashion";
  }
  if (/kemenkeu|kementerian\s+keuangan/.test(identity) || session.organizationId === 2) {
    return "kemenkeu";
  }
  return null;
}

export function resolveAiTenant(
  session: SessionRecord,
  appId?: number,
): AiTenant | null {
  if (isLocalDemoAdmin(session)) {
    return appId === 4 ? "fashion" : appId === 5 ? "kemenkeu" : null;
  }
  const organizationTenant = resolveOrganizationAiTenant(session);
  // The selected application is part of the tenant boundary. A stale or
  // forged appId must not make a Kemenkes user appear inside the Kemenkeu app
  // (or allow requests to its menus and AI dataset).
  if (appId === 4 && organizationTenant !== "fashion") return null;
  if (appId === 5 && organizationTenant !== "kemenkeu") return null;
  return organizationTenant;
}
