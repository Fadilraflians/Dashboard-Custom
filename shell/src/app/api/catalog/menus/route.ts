import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { serverRequestFunction } from "@/serverServices";
import type { CatalogMenusRequest } from "@/serverServices";
import { AUTH_COOKIE_NAME, getSession } from "@/lib/session";
import { logger } from "../../../../../log.js";
import { canLocalDemoAccessApplication, shouldUseLocalCatalog, isLocalDemoSession, isLocalDemoAdmin, localDemoMenus } from "@/lib/localDemo";
import { isAdminSession } from "@/lib/dbAuth";

export const dynamic = "force-dynamic";

/**
 * Menus (sidebar tree) for a given application. The client sends appId; the
 * server forwards it with the session's Bearer token. The response is a tree:
 * MENU / SECTION (with `child` SUBMENU items).
 */
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore.get(AUTH_COOKIE_NAME)?.value);

  if (!session) {
    return NextResponse.json(
      { status: "ERROR", message: "Not authenticated" },
      { status: 401 },
    );
  }

  let body: Partial<CatalogMenusRequest>;
  try {
    body = (await request.json()) as Partial<CatalogMenusRequest>;
  } catch {
    body = {};
  }

  if (body.appId === undefined || body.appId === null) {
    return NextResponse.json(
      { status: "ERROR", message: "appId wajib diisi" },
      { status: 400 },
    );
  }



  const payload: CatalogMenusRequest = {
    appId: Number(body.appId),
    search: body.search ?? "",
    sortBy: body.sortBy ?? "DISPLAY_ORDER",
    sortDirection: body.sortDirection ?? "ASC",
    pagination: {
      page: body.pagination?.page ?? 1,
      pageSize: body.pagination?.pageSize ?? 50,
    },
  };

  if (shouldUseLocalCatalog(session)) {
    // appId 4 -> org 1 (KEMENKES/fashion), appId 5 -> org 2 (KEMENKEU).
    const orgByApp: Record<number, number> = { 4: 1, 5: 2 };
    const isAdmin = isAdminSession(session, isLocalDemoAdmin(session));
    const allowed = isLocalDemoSession(session)
      ? canLocalDemoAccessApplication(session, payload.appId)
      : isAdmin || orgByApp[payload.appId] === session.organizationId;
    if (!allowed) {
      return NextResponse.json(
        { status: "ERROR", message: "Akun ini tidak memiliki akses ke portal tersebut." },
        { status: 403 },
      );
    }
    const menus = localDemoMenus(payload.appId);
    return NextResponse.json({
      status: 200,
      data: menus,
      metadata: { page: 1, pageSize: 50, totalData: menus.length, totalPages: 1 },
    });
  }

  const userTag = session.email ?? session.name;
  const { status, response } = await serverRequestFunction("catalogMenus", {
    token: session.jwt,
    user: userTag,
    body: payload,
  });

  logger.info(
    `[outgoing] [POST] [catalogMenus] @${userTag} [${status}] "${response?.message ?? ""}" (app ${payload.appId})`,
  );
  return NextResponse.json(response, { status });
}
