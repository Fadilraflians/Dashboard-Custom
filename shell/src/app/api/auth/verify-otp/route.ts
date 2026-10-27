import { NextRequest, NextResponse } from "next/server";
import { serverRequestFunction } from "@/serverServices";
import {
  AUTH_COOKIE_NAME,
  COOKIE_SECURE,
  SESSION_ABSOLUTE_TTL_SECONDS,
  createSession,
} from "@/lib/session";
import { decryptField } from "@/lib/rsa";
import { fetchProfile } from "@/lib/profile";
import { logger } from "../../../../../log.js";
import {
  findLocalDemoOtpAccount,
  isLocalDemoEnabled,
  LOCAL_DEMO_TOKEN,
} from "@/lib/localDemo";
import { isDbAuthEnabled } from "@/lib/authDb";
import { verifyDbTotpAndBuildUser } from "@/lib/dbAuth";

export const dynamic = "force-dynamic";

/**
 * Verify the authenticator (TOTP) code. Reached when login returned
 * mfaRequired = "totp".
 *
 * Request (FE-encrypted per field): { username: <RSA_FE>, otp: <RSA_FE> }
 * Server decrypts and calls POST /auth/api/v1/auth/verify-otp { username, otp }.
 *
 * Success response:
 *   { status: "SUCCESS", data: { token, expiresIn, sessionId } }
 * Only `token` (the JWT) is used — we store it in Redis under our own opaque
 * session id and set that id as the HttpOnly cookie. The backend's `expiresIn`
 * and `sessionId` are ignored: the shell manages its own session lifetime
 * (idle 15m sliding + absolute 60m hard cap).
 */
export async function POST(request: NextRequest) {
  let body: { username?: string; otp?: string };
  try {
    body = await request.json();
  } catch {
    logger.error(`[incoming] [POST] [verifyOtp] [400] invalid request body`);
    return NextResponse.json(
      { status: "ERROR", message: "Invalid request body" },
      { status: 400 },
    );
  }

  let username: string;
  let otp: string;
  try {
    username = decryptField(body.username);
    otp = decryptField(body.otp);
  } catch (err) {
    logger.error(`[incoming] [POST] [verifyOtp] [400] decrypt failed: ${err}`);
    return NextResponse.json(
      { status: "ERROR", message: "Gagal mendekripsi data permintaan" },
      { status: 400 },
    );
  }

  logger.info(`[incoming] [POST] [verifyOtp] ?${username}`);

  if (!username || !otp) {
    return NextResponse.json(
      { status: "ERROR", message: "Username dan OTP wajib diisi" },
      { status: 400 },
    );
  }

  if (isLocalDemoEnabled()) {
    const account = findLocalDemoOtpAccount(username, otp);
    if (!account) {
      return NextResponse.json(
        { status: "ERROR", message: "Kode OTP demo lokal salah" },
        { status: 401 },
      );
    }

    const demoUser = {
      sub: account.sub,
      name: account.name,
      role: account.role,
      email: account.email,
      username: account.username,
      localDemoRole: account.localDemoRole,
      ...(account.organizationId ? { organizationId: account.organizationId } : {}),
    };
    let sessionId: string;
    try {
      sessionId = await createSession(demoUser, LOCAL_DEMO_TOKEN);
    } catch (err) {
      logger.error(`[verifyOtp] local demo session create failed: ${err}`);
      return NextResponse.json(
        { status: "ERROR", message: "Gagal membuat sesi. Jalankan Redis lokal." },
        { status: 503 },
      );
    }

    const res = NextResponse.json({
      status: "SUCCESS",
      message: "Login demo lokal berhasil",
      user: { id: demoUser.sub, name: demoUser.name, role: demoUser.role },
    });
    res.cookies.set(AUTH_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: COOKIE_SECURE,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_ABSOLUTE_TTL_SECONDS,
    });
    return res;
  }

  // Database-backed OTP verification (B1-penuh). Active only when AUTH_SOURCE=db.
  if (isDbAuthEnabled()) {
    let dbUser;
    try {
      dbUser = await verifyDbTotpAndBuildUser(username, otp);
    } catch (err) {
      logger.error(`[verifyOtp] db auth error: ${err}`);
      return NextResponse.json(
        { status: "ERROR", message: "Gagal memverifikasi OTP. Periksa koneksi database." },
        { status: 503 },
      );
    }
    if (!dbUser) {
      return NextResponse.json(
        { status: "ERROR", message: "Kode OTP tidak valid" },
        { status: 401 },
      );
    }

    let sessionId: string;
    try {
      // No external JWT in the DB flow; store a marker token.
      sessionId = await createSession(dbUser, "authdb-session");
    } catch (err) {
      logger.error(`@${dbUser.name} [verifyOtp] db session create failed: ${err}`);
      return NextResponse.json(
        { status: "ERROR", message: "Gagal membuat sesi. Periksa koneksi Redis." },
        { status: 503 },
      );
    }

    logger.info(`[outgoing] [POST] [verifyOtp] @${dbUser.name} [200] "Login berhasil (db auth)"`);
    const res = NextResponse.json({
      status: "SUCCESS",
      message: "Login berhasil",
      user: { id: dbUser.sub, name: dbUser.name, role: dbUser.role },
    });
    res.cookies.set(AUTH_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: COOKIE_SECURE,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_ABSOLUTE_TTL_SECONDS,
    });
    return res;
  }

  const { status, response } = await serverRequestFunction("verifyOtp", {
    body: { username, otp },
  });

  const token = response?.data?.token;
  const ok =
    status >= 200 && status < 300 && response?.status === "SUCCESS" && !!token;

  if (!ok) {
    logger.warn(
      `[outgoing] [POST] [verifyOtp] ?${username} [${status || 401}] "${response?.message ?? "OTP tidak valid"}"`,
    );
    return NextResponse.json(response ?? { status: "ERROR" }, {
      status: status || 401,
    });
  }

  // Resolve the user id + display context from the PROFILE API (never decoded
  // from the JWT). The userId drives single-active-session enforcement.
  const profile = await fetchProfile(token, username);
  if (!profile) {
    logger.error(`?${username} [verifyOtp] profile fetch failed after login`);
    return NextResponse.json(
      { status: "ERROR", message: "Gagal mengambil profil pengguna." },
      { status: 502 },
    );
  }

  const user = {
    sub: profile.userId,
    name: profile.name,
    role: profile.role,
    email: profile.email,
    organizationId: profile.organizationId,
    organizationCode: profile.organizationCode,
    organizationName: profile.organizationName,
  };

  // createSession also revokes any existing session for this user (so logging
  // in on another device signs the previous one out).
  let sessionId: string;
  try {
    sessionId = await createSession(user, token);
  } catch (err) {
    logger.error(`@${user.name} [verifyOtp] session create failed: ${err}`);
    return NextResponse.json(
      { status: "ERROR", message: "Gagal membuat sesi. Periksa koneksi Redis." },
      { status: 503 },
    );
  }

  logger.info(
    `[outgoing] [POST] [verifyOtp] @${user.name} [${status}] "Login berhasil"`,
  );

  const res = NextResponse.json({
    status: "SUCCESS",
    message: response?.message ?? "Login berhasil",
    user: { id: user.sub, name: user.name, role: user.role },
  });
  res.cookies.set(AUTH_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: "lax",
    path: "/",
    // Cookie max-age = absolute cap. Idle expiry is enforced server-side via
    // the Redis key TTL; the cookie merely bounds the browser's retention.
    maxAge: SESSION_ABSOLUTE_TTL_SECONDS,
  });
  return res;
}
