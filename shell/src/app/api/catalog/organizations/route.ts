import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { serverRequestFunction } from "@/serverServices";
import type { CatalogOrganizationsRequest } from "@/serverServices";
import { AUTH_COOKIE_NAME, getSession } from "@/lib/session";
import { logger } from "../../../../../log.js";
import { shouldUseLocalCatalog, localDemoOrganizations, isLocalDemoAdmin, isLocalDemoSession } from "@/lib/localDemo";
import { isAdminSession } from "@/lib/dbAuth";

export const dynamic = "force-dynamic";

/**
 * Paginated list of organizations (Kementerian/Lembaga) for the landing page.
 * The client sends search/sort/pagination; the server forwards it with the
 * session's Bearer token.
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

  let body: CatalogOrganizationsRequest;
  try {
    body = (await request.json()) as CatalogOrganizationsRequest;
  } catch {
    body = {};
  }

  const payload: CatalogOrganizationsRequest = {
    search: body.search ?? "",
    sortBy: body.sortBy ?? "ORGANIZATION_NAME",
    sortDirection: body.sortDirection ?? "ASC",
    pagination: {
      page: body.pagination?.page ?? 1,
      pageSize: body.pagination?.pageSize ?? 10,
    },
  };

  if (shouldUseLocalCatalog(session)) {
    // Demo + DB-auth users see the local organization directory (IFP catalog is
    // unreachable locally).
    const isLocalDemo = isLocalDemoSession(session);
    const isAdmin = isAdminSession(session, isLocalDemoAdmin(session));

    // Tenant isolation for DB-auth sessions: a user only sees their OWN
    // ministry on the landing page (e.g. a Kemenkeu account sees only
    // Kementerian Keuangan). Local-demo admin keeps the full directory.
    // To let DB admins see every ministry instead, add `|| isAdmin` below.
    let organizations = localDemoOrganizations(payload.search);
    if (!isLocalDemo && session.organizationId !== undefined) {
      organizations = organizations.filter(
        (organization) => organization.organizationId === session.organizationId,
      );
    }

    const matches = organizations.map((organization) => ({
      ...organization,
      accessAllowed: isAdmin || organization.organizationId === session.organizationId,
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
    "catalogOrganizations",
    { token: session.jwt, user: userTag, body: payload },
  );

  logger.info(
    `[outgoing] [POST] [catalogOrganizations] @${userTag} [${status}] "${response?.message ?? ""}" (page ${payload.pagination?.page})`,
  );
  return NextResponse.json(response, { status });
}
