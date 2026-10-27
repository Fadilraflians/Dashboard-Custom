import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, getSession } from "@/lib/session";
import { resolveAiTenant } from "@/lib/aiTenant";
import { isLocalDemoAdmin } from "@/lib/localDemo";
import {
  isDbAuthEnabled,
  listCandidateUsers,
  listDashboardMembers,
  addDashboardMember,
  removeDashboardMember,
} from "@/lib/authDb";
import { isAdminSession } from "@/lib/dbAuth";
import { logger } from "../../../../log.js";

export const dynamic = "force-dynamic";

/**
 * Dashboard member management (Step 2). ADMIN ONLY. Scoped to the caller's
 * tenant so Fashion and Kemenkeu never see each other's members.
 *
 *   GET    ?dashboardId=&appId=   -> { members, candidates }
 *   POST   { dashboardId, username, roleAccess, unit, appId }
 *   DELETE ?id=&appId=
 */

async function resolveContext(request: NextRequest) {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore.get(AUTH_COOKIE_NAME)?.value);
  if (!session) return { error: NextResponse.json({ message: "Sesi tidak valid." }, { status: 401 }) };
  if (!isAdminSession(session, isLocalDemoAdmin(session))) {
    return { error: NextResponse.json({ message: "Akses khusus admin." }, { status: 403 }) };
  }
  if (!isDbAuthEnabled()) {
    return { error: NextResponse.json({ message: "Manajemen member hanya aktif pada mode login database." }, { status: 503 }) };
  }
  const appId = Number(request.nextUrl.searchParams.get("appId") || 0);
  const tenant = resolveAiTenant(session, appId || undefined);
  if (!tenant) return { error: NextResponse.json({ message: "Tenant tidak dikenali." }, { status: 403 }) };
  return { session, tenant };
}

export async function GET(request: NextRequest) {
  const ctx = await resolveContext(request);
  if ("error" in ctx) return ctx.error;
  const dashboardId = request.nextUrl.searchParams.get("dashboardId") || "";
  if (!dashboardId) return NextResponse.json({ message: "dashboardId wajib." }, { status: 400 });
  try {
    const [members, candidates] = await Promise.all([
      listDashboardMembers(dashboardId, ctx.tenant),
      listCandidateUsers(ctx.tenant),
    ]);
    return NextResponse.json({ members, candidates });
  } catch (err) {
    logger.error(`[dashboard-members] GET failed: ${err}`);
    return NextResponse.json({ message: "Gagal memuat member." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const ctx = await resolveContext(request);
  if ("error" in ctx) return ctx.error;
  let body: { dashboardId?: string; username?: string; roleAccess?: string; unit?: string };
  try { body = await request.json(); } catch { body = {}; }
  if (!body.dashboardId || !body.username) {
    return NextResponse.json({ message: "dashboardId dan username wajib." }, { status: 400 });
  }
  const roleAccess = ["viewer", "editor", "pengelola"].includes(body.roleAccess || "")
    ? (body.roleAccess as string) : "viewer";
  try {
    await addDashboardMember({
      dashboardId: body.dashboardId,
      tenant: ctx.tenant,
      username: body.username,
      roleAccess,
      unit: body.unit ?? null,
      createdBy: ctx.session.username || ctx.session.name,
    });
    const members = await listDashboardMembers(body.dashboardId, ctx.tenant);
    return NextResponse.json({ members });
  } catch (err) {
    logger.error(`[dashboard-members] POST failed: ${err}`);
    return NextResponse.json({ message: "Gagal menambah member." }, { status: 503 });
  }
}

export async function DELETE(request: NextRequest) {
  const ctx = await resolveContext(request);
  if ("error" in ctx) return ctx.error;
  const id = Number(request.nextUrl.searchParams.get("id") || 0);
  if (!id) return NextResponse.json({ message: "id wajib." }, { status: 400 });
  try {
    await removeDashboardMember(id, ctx.tenant);
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error(`[dashboard-members] DELETE failed: ${err}`);
    return NextResponse.json({ message: "Gagal menghapus member." }, { status: 503 });
  }
}
