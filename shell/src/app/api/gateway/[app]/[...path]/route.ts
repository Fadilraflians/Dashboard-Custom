import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { logger } from "../../../../../../log.js";
import { AUTH_COOKIE_NAME, getSession } from "@/lib/session";
import { isLocalDemoEnabled, LOCAL_DEMO_TOKEN } from "@/lib/localDemo";
import { resolveAiTenant } from "@/lib/aiTenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Gateway — pure forwarder.
 *
 * An MFE's own BFF resolves the session token from Redis and calls this
 * endpoint with `Authorization: Bearer <jwt>`. The gateway does NOT look at
 * Redis, does NOT read cookies, and does NOT verify the JWT — it only routes
 * the request to the backend configured for <app> and passes the token
 * through. The backend is responsible for validating the JWT.
 *
 * Responsibility split:
 *   - MFE BFF  : session cookie -> token (Redis readonly)
 *   - gateway  : app -> backend routing + forward (this file)
 *   - backend  : validate JWT, authorize, respond
 */

/**
 * Resolves the backend base URL for an app key. Each MFE's backend is grouped
 * under `MFE_<APP>_BACKEND_URL` (e.g. MFE_DASHBOARDBOK_BACKEND_URL), falling
 * back to the shared `BACKEND_URL`. Only keys that resolve to a configured URL
 * are allowed, preventing arbitrary/forged app keys from reaching unknown
 * hosts.
 */
function resolveBackend(app: string): string | null {
  const key = `MFE_${app.toUpperCase()}_BACKEND_URL`;
    if (app.toLowerCase() === "aigovtech") {
      return (
        process.env[key] ||
        (process.env.NODE_ENV !== "production"
          ? "http://localhost:3125"
          : null)
      );
    }
  // Per-MFE override wins; otherwise fall back to the single shared gateway
  // base (API_BASE_URL). BACKEND_URL is still honoured for backward-compat.
  return (
    process.env[key] ||
    process.env.BACKEND_URL ||
    process.env.API_BASE_URL ||
    null
  );
}

async function handle(
  request: NextRequest,
  ctx: { params: Promise<{ app: string; path?: string[] }> },
) {
  const { app, path } = await ctx.params;

  const method = request.method;
  const suffix = (path ?? []).join("/");
  const backend = resolveBackend(app);

  // Which env var the base URL came from (so you can see pointing config).
  const backendEnvKey = `MFE_${app.toUpperCase()}_BACKEND_URL`;
  const baseSource = process.env[backendEnvKey]
    ? backendEnvKey
    : process.env.BACKEND_URL
      ? "BACKEND_URL"
      : process.env.API_BASE_URL
        ? "API_BASE_URL"
        : "(none)";

  if (!backend) {
    // No backend wired yet → let the caller fall back to mock data.
    logger.warn(
      `[CAT:FETCH_API] [outgoing] [${method}] [GATEWAY:${app}] [501] ` +
        `"no backend configured" base=${baseSource}=<empty> path=/${suffix}`,
    );
    return NextResponse.json(
      { message: `No backend configured for app "${app}"` },
      { status: 501 },
    );
  }

  const search = request.nextUrl.search || "";
  const base = backend.replace(/\/$/, "");
  const targetUrl = `${base}/${suffix}${search}`;

  const hasBody = !["GET", "HEAD"].includes(method);
  let forwardBody: string | undefined;
  let tenantContext: { tenant: "fashion" | "kemenkeu"; secret: string } | null = null;

  if (app.toLowerCase() === "aigovtech") {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore.get(AUTH_COOKIE_NAME)?.value);
    if (!session) {
      return NextResponse.json({ message: "Sesi pengguna tidak valid." }, { status: 401 });
    }

    if (hasBody) {
      forwardBody = await request.text();
    }
    let requestBody: Record<string, unknown> = {};
    try {
      requestBody = forwardBody ? JSON.parse(forwardBody) : {};
    } catch {
      return NextResponse.json({ message: "Format permintaan AI tidak valid." }, { status: 400 });
    }

    const appId = Number(request.nextUrl.searchParams.get("appId") || requestBody.appId || 0);
    const tenant = resolveAiTenant(session, appId || undefined);
    const appTenant = appId === 4 ? "fashion" : appId === 5 ? "kemenkeu" : null;
    if (!tenant || (appTenant && tenant !== appTenant)) {
      return NextResponse.json({ message: "Akun ini tidak memiliki akses ke data AI perusahaan tersebut." }, { status: 403 });
    }

    const secret = process.env.AIGOVTECH_GATEWAY_SECRET;
    if (!secret) {
      return NextResponse.json({ message: "Koneksi aman AIGovtech belum dikonfigurasi." }, { status: 503 });
    }
    tenantContext = { tenant, secret };
  }

  // Pass the caller's Authorization header straight through (the token the
  // MFE BFF fetched from Redis). The gateway does not inspect or verify it.
  const authorization = request.headers.get("authorization") ?? "";

  let isLocalAiGovtechBackend = false;
  try {
    const backendUrl = new URL(base);
    isLocalAiGovtechBackend =
      app.toLowerCase() === "aigovtech" &&
      backendUrl.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(backendUrl.hostname) &&
      backendUrl.port === "3125" &&
      backendUrl.pathname === "/";
  } catch {
    // Invalid or non-local backend URLs remain blocked for local demo users.
  }

  if (
    isLocalDemoEnabled() &&
    authorization === `Bearer ${LOCAL_DEMO_TOKEN}` &&
    !isLocalAiGovtechBackend
  ) {
    return NextResponse.json(
      { message: "Backend API dinonaktifkan dalam mode demo lokal." },
      { status: 501 },
    );
  }

  const start = Date.now();
  // Log the base URL + full target so you can verify the pointing is correct.
  logger.info(
    `[CAT:FETCH_API] [request] [${method}] [GATEWAY:${app}] ` +
      `base=${baseSource}=<${base}> target=<${targetUrl}>`,
  );

  try {
    const upstream = await fetch(targetUrl, {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(authorization ? { Authorization: authorization } : {}),
        ...(tenantContext
          ? {
              "x-aigovtech-tenant": tenantContext.tenant,
              "x-aigovtech-gateway-secret": tenantContext.secret,
            }
          : {}),
      },
      body: hasBody ? (forwardBody ?? await request.text()) : undefined,
    });

    const text = await upstream.text();
    const contentType =
      upstream.headers.get("content-type") || "application/json";
    const duration = Date.now() - start;

    const line =
      `[CAT:FETCH_API] [response] [${method}] [GATEWAY:${app}] ` +
      `[${upstream.status}] target=<${targetUrl}> [${duration}ms]`;
    if (upstream.ok) logger.info(line);
    else logger.error(line);

    return new NextResponse(text, {
      status: upstream.status,
      headers: { "content-type": contentType },
    });
  } catch (err) {
    const duration = Date.now() - start;
    logger.error(
      `[CAT:FETCH_API] [response] [${method}] [GATEWAY:${app}] [502] ` +
        `target=<${targetUrl}> "${err instanceof Error ? err.message : String(err)}" [${duration}ms]`,
    );
    return NextResponse.json(
      { message: "Backend unavailable" },
      { status: 502 },
    );
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
