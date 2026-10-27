import { NextRequest, NextResponse } from "next/server";
import { serverRequestFunction } from "@/serverServices";
import { decryptField } from "@/lib/rsa";
import { encryptPasswordForBackend } from "@/lib/backendCrypto";
import { findLocalDemoCredentials, isLocalDemoEnabled } from "@/lib/localDemo";
import { isDbAuthEnabled } from "@/lib/authDb";
import { verifyDbPassword, buildOtpauthUri } from "@/lib/dbAuth";
import { logger } from "../../../../../log.js";

export const dynamic = "force-dynamic";

/**
 * Step 1 of login (TOTP flow).
 *
 * Request (from browser, FE-encrypted per field):
 *   { username: <RSA_FE>, password: <RSA_FE> }
 *
 * Server:
 *   1. Decrypt username & password with the FE private key.
 *   2. Re-encrypt password with the BACKEND public key (RSA-OAEP-SHA256).
 *   3. POST /auth/api/v1/auth/login { username, password: <RSA_BE> }.
 *
 * Response forwarded to the browser carries `data.mfaRequired`:
 *   "enroll" -> client must run the TOTP enrollment flow
 *   "totp"   -> client must submit the authenticator code (verify-otp)
 */
export async function POST(request: NextRequest) {
  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    logger.error(`[incoming] [POST] [login] [400] invalid request body`);
    return NextResponse.json(
      { status: "ERROR", message: "Invalid request body" },
      { status: 400 },
    );
  }

  // Layer 1: decrypt the FE-encrypted fields.
  let username: string;
  let password: string;
  try {
    username = decryptField(body.username);
    password = decryptField(body.password);
  } catch (err) {
    logger.error(`[incoming] [POST] [login] [400] field decrypt failed: ${err}`);
    return NextResponse.json(
      { status: "ERROR", message: "Gagal mendekripsi data permintaan" },
      { status: 400 },
    );
  }

  logger.info(`[incoming] [POST] [login] ?${username}`);

  if (!username || !password) {
    return NextResponse.json(
      { status: "ERROR", message: "Username dan password wajib diisi" },
      { status: 400 },
    );
  }

  if (isLocalDemoEnabled()) {
    if (!findLocalDemoCredentials(username, password)) {
      return NextResponse.json(
        { status: "ERROR", message: "Username atau password demo lokal salah" },
        { status: 401 },
      );
    }
    return NextResponse.json({
      status: "SUCCESS",
      message: "Login demo lokal. Masukkan OTP demo untuk melanjutkan.",
      data: { mfaRequired: "totp", message: "Masukkan OTP demo lokal." },
    });
  }

  // Database-backed login (B1-penuh). Active only when AUTH_SOURCE=db;
  // otherwise this block is skipped and the IFP gateway flow below runs.
  if (isDbAuthEnabled()) {
    try {
      const { ok, user } = await verifyDbPassword(username, password);
      if (!ok || !user) {
        return NextResponse.json(
          { status: "ERROR", message: "Username atau password salah" },
          { status: 401 },
        );
      }
      // Option X: OTP required for all accounts -> always go to the TOTP step.
      // Include the otpauth URI so the login page can show a QR to scan.
      const otpauthUri = buildOtpauthUri(user);
      logger.info(`[outgoing] [POST] [login] ?${username} [200] (db auth, mfa: "totp")`);
      return NextResponse.json({
        status: "SUCCESS",
        message: "Masukkan kode dari aplikasi authenticator.",
        data: { mfaRequired: "totp", otpauthUri },
      });
    } catch (err) {
      logger.error(`[outgoing] [POST] [login] ?${username} db auth error: ${err}`);
      return NextResponse.json(
        { status: "ERROR", message: "Gagal memverifikasi kredensial. Periksa koneksi database." },
        { status: 503 },
      );
    }
  }

  // Layer 2: encrypt the password for the backend gateway.
  let encryptedPassword: string;
  try {
    encryptedPassword = await encryptPasswordForBackend(password);
  } catch (err) {
    logger.error(`[outgoing] [POST] [login] ?${username} backend key error: ${err}`);
    return NextResponse.json(
      { status: "ERROR", message: "Gagal menyiapkan enkripsi. Coba lagi." },
      { status: 502 },
    );
  }

  const { status, response } = await serverRequestFunction("login", {
    body: { username, password: encryptedPassword, loginType: "2" },
  });

  logger.info(
    `[outgoing] [POST] [login] ?${username} [${status}] "${response?.message ?? ""}" (mfa: "${response?.data?.mfaRequired ?? "-"}")`,
  );
  return NextResponse.json(response, { status });
}
