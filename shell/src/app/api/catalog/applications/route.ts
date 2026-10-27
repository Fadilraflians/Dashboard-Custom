import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { serverRequestFunction } from "@/serverServices";
import type { CatalogApplicationsRequest } from "@/serverServices";
import { AUTH_COOKIE_NAME, getSession } from "@/lib/session";
import { logger } from "../../../../../log.js";
import { canLocalDemoAccessOrganization, shouldUseLocalCatalog, isLocalDemoAdmin, isLocalDemoSession, localDemoApplications } from "@/lib/localDemo";
import { isAdminSession } from "@/lib/dbAuth";

export const dynamic = "force-dynamic";

/**
 * Applications (sub-portals) for a given organization. Fetched lazily when a
 * landing card is expanded. `appType` is always 2 (external). The client sends
 * the organizationId; the server forwards it with the session's Bearer token.
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

  let body: Partial<CatalogApplicationsRequest>;
  try {
    body = (await request.json()) as Partial<CatalogApplicationsRequest>;
  } catch {
    body = {};
  }

  if (body.organizationId === undefined || body.organizationId === null) {
    return NextResponse.json(
      { status: "ERROR", message: "organizationId wajib diisi" },
      { status: 400 },
    );
  }

  const payload: CatalogApplicationsRequest = {
    appType: 2,
    organizationId: Number(body.organizationId),
    search: body.search ?? "",
    sortBy: body.sortBy ?? "DISPLAY_ORDER",
    sortDirection: body.sortDirection ?? "ASC",
    pagination: {
      page: body.pagination?.page ?? 1,
      pageSize: body.pagination?.pageSize ?? 10,
    },
  };

  if (shouldUseLocalCatalog(session)) {
    // Portal metadata is visible in the directory, but `accessAllowed` is only
    // a UI hint. The select/resolve routes continue to enforce authorization.
    const isAdmin = isAdminSession(session, isLocalDemoAdmin(session));
    const canAccessOrg = isLocalDemoSession(session)
      ? canLocalDemoAccessOrganization(session, payload.organizationId)
      : session.organizationId === payload.organizationId;
    const matches = localDemoApplications(payload.organizationId, payload.search).map((application) => ({
      ...application,
      accessAllowed: canAccessOrg || isAdmin,
    }));
    const page = payload.pagination?.page ?? 1;
    const pageSize = payload.pagination?.pageSize ?? 10;
    const start = (page - 1) * pageSize;
    return NextResponse.json({
      status: 200,
      data: matches.slice(start, start + pageSize),
      metadata: { page, pageSize, totalData: matches.length, totalPages: Math.ceil(matches.length / pageSize) },
    });
  }

  const userTag = session.email ?? session.name;
  const { status, response } = await serverRequestFunction(
    "catalogApplications",
    { token: session.jwt, user: userTag, body: payload },
  );

  logger.info(
    `[outgoing] [POST] [catalogApplications] @${userTag} [${status}] "${response?.message ?? ""}" (org ${payload.organizationId})`,
  );
  return NextResponse.json(response, { status });
}
