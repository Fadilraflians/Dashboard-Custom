import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, getSession } from "@/lib/session";
import { AI_TENANTS, resolveAiTenant } from "@/lib/aiTenant";
import { isLocalDemoAdmin } from "@/lib/localDemo";
import { isAdminSession } from "@/lib/dbAuth";

export const dynamic = "force-dynamic";

/** Returns the signed-in tenant's display-safe AI database context. */
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore.get(AUTH_COOKIE_NAME)?.value);
  if (!session) {
    return NextResponse.json({ message: "Sesi pengguna tidak valid." }, { status: 401 });
  }

  const appId = Number(request.nextUrl.searchParams.get("appId") || 0);
  const tenant = resolveAiTenant(session, appId || undefined);
  if (!tenant) {
    return NextResponse.json({ message: "Perusahaan untuk konteks AI tidak dikenali." }, { status: 403 });
  }

  const tenantInfo = AI_TENANTS[tenant];
  // RBAC: an admin is either a DB-auth user with IS_ADMIN=1 (session.isAdmin)
  // or the local demo admin. Used by the MFE to gate admin-only UI.
  const isAdmin = isAdminSession(session, isLocalDemoAdmin(session));
  return NextResponse.json({
    tenant,
    organizationCode: isLocalDemoAdmin(session)
      ? tenantInfo.organizationCode
      : session.organizationCode || tenantInfo.organizationCode,
    organizationName: isLocalDemoAdmin(session)
      ? tenantInfo.organizationName
      : session.organizationName || tenantInfo.organizationName,
    databaseLabel: tenantInfo.databaseLabel,
    table: tenantInfo.table,
    isAdmin,
  });
}
