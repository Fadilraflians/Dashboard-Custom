import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/session";

/**
 * Proxy (Next.js 16 request-interception entry, formerly "middleware").
 *
 * Next.js 16 reads `src/proxy.ts` and runs the exported `proxy` function for
 * every matched request. Auth gate: unauthenticated GET requests to protected
 * routes are redirected to /login (with a callbackUrl); other methods get 401.
 *
 * This runs in the lightweight middleware runtime, which cannot talk to Redis
 * (the node client is unavailable there). So the proxy only checks for the
 * presence of the session-id cookie as a cheap first gate. Authoritative
 * validation (does the session id actually exist in Redis?) happens in the
 * server components and API routes, which run in the Node runtime.
 */

// Public paths (no shell session cookie required):
//  - login page / static assets
//  - pre-login auth endpoints: credentials, TOTP enroll + verify, and the
//    FE encryption public key (needed by the login page before any session)
//  - config endpoint
//  - /api/gateway/*: called server-to-server by an MFE's BFF with a Bearer
//    token (not the shell cookie); the backend validates the token.
const PUBLIC_PATH =
  /^\/(login|favicon\.svg|favicon\.ico|assets|api\/auth\/login|api\/auth\/verify-otp|api\/auth\/totp|api\/crypto\/public-key|api\/config|api\/gateway|mfe-api)/;

// Static assets in /public (images, fonts, etc.) must be reachable without a
// session — e.g. the BNI logo on the login page. Matched by file extension.
const PUBLIC_ASSET =
  /\.(webp|png|jpe?g|gif|svg|ico|avif|woff2?|ttf|otf|css|js|map)$/i;

function isPublic(pathname: string): boolean {
  return PUBLIC_PATH.test(pathname) || PUBLIC_ASSET.test(pathname);
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Root handles its own redirect; allow public paths through.
  if (pathname === "/" || isPublic(pathname)) {
    return NextResponse.next();
  }

  const hasSessionCookie = Boolean(
    request.cookies.get(AUTH_COOKIE_NAME)?.value,
  );

  if (!hasSessionCookie) {
    // API calls get a JSON 401; page navigations get redirected to login.
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (request.method === "GET") {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
