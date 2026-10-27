import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { serverRequestFunction } from "@/serverServices";
import { AUTH_COOKIE_NAME, getSession } from "@/lib/session";
import { logger } from "../../../../../log.js";
import { shouldUseLocalCatalog, isLocalDemoSession } from "@/lib/localDemo";

export const dynamic = "force-dynamic";

/**
 * Catalog summary for the landing page (counts of organizations + sub-portals).
 * Server-to-backend with the session's Bearer token; no request body.
 */
export async function POST() {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore.get(AUTH_COOKIE_NAME)?.value);

  if (!session) {
    return NextResponse.json(
      { status: "ERROR", message: "Not authenticated" },
      { status: 401 },
    );
  }

  if (shouldUseLocalCatalog(session)) {
    // DB-auth sessions are scoped to their own ministry (1 org, 1 portal);
    // local-demo keeps the full directory counts.
    const scopedToOwnMinistry =
      !isLocalDemoSession(session) && session.organizationId !== undefined;
    return NextResponse.json({
      status: 200,
      data: scopedToOwnMinistry
        ? { activeOrganizations: 1, externalApplications: 1 }
        : { activeOrganizations: 2, externalApplications: 2 },
    });
  }

  const userTag = session.email ?? session.name;
  const { status, response } = await serverRequestFunction("catalogSummary", {
    token: session.jwt,
    user: userTag,
  });

  logger.info(
    `[outgoing] [POST] [catalogSummary] @${userTag} [${status}] "${response?.message ?? ""}"`,
  );
  return NextResponse.json(response, { status });
}
