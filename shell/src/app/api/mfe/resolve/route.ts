import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, getSession } from "@/lib/session";
import { resolveMfeByMenuCode, getSharedUrl } from "@/lib/mfeResolve";
import { canLocalDemoAccessApplication, isLocalDemoSession } from "@/lib/localDemo";
import { logger } from "../../../../../log.js";

export const dynamic = "force-dynamic";

/**
 * Resolves a menu's MFE remote by menuCode (map by env MFE_<menuCode>_*).
 * Returns { scope, module, url, sharedUrl } or 404 when the menu has no remote
 * configured (e.g. a SECTION, or an MFE not yet set up).
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

  let body: { menuCode?: string; appId?: number };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const menuCode = body.menuCode ?? "";
  if (!menuCode) {
    return NextResponse.json(
      { status: "ERROR", message: "menuCode wajib diisi" },
      { status: 400 },
    );
  }

  if (isLocalDemoSession(session) && !canLocalDemoAccessApplication(session, Number(body.appId))) {
    return NextResponse.json(
      { status: "ERROR", message: "Akun ini tidak memiliki akses ke portal tersebut." },
      { status: 403 },
    );
  }

  const descriptor = resolveMfeByMenuCode(menuCode);
  if (!descriptor) {
    logger.warn(`[mfeResolve] no remote configured for menuCode="${menuCode}"`);
    return NextResponse.json(
      {
        status: "ERROR",
        message: `MFE untuk menu "${menuCode}" belum dikonfigurasi.`,
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    status: "SUCCESS",
    data: { ...descriptor, sharedUrl: getSharedUrl() },
  });
}
