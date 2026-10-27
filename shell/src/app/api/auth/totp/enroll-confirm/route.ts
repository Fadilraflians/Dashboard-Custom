import { NextRequest, NextResponse } from "next/server";
import { serverRequestFunction } from "@/serverServices";
import { decryptField } from "@/lib/rsa";
import { encryptPasswordForBackend } from "@/lib/backendCrypto";
import { logger } from "../../../../../../log.js";

export const dynamic = "force-dynamic";

/**
 * TOTP enrollment — confirm. Submits the first authenticator code to finish
 * enrollment.
 *
 * Request (FE-encrypted per field):
 *   { username: <RSA_FE>, password: <RSA_FE>, code: <RSA_FE> }
 * Server decrypts, re-encrypts the password for the backend, then calls
 * POST /auth/api/v1/auth/totp/enroll-confirm-login.
 *
 * Success response carries NO token — just a confirmation message:
 *   { status: "SUCCESS", message: "TOTP enrolled successfully. You can now log in." }
 * So enrollment does NOT create a session. The client returns to the login
 * step and the user signs in again (which will then require mfaRequired=totp).
 */
export async function POST(request: NextRequest) {
  let body: { username?: string; password?: string; code?: string };
  try {
    body = await request.json();
  } catch {
    logger.error(`[incoming] [POST] [enrollConfirm] [400] invalid request body`);
    return NextResponse.json(
      { status: "ERROR", message: "Invalid request body" },
      { status: 400 },
    );
  }

  let username: string;
  let password: string;
  let code: string;
  try {
    username = decryptField(body.username);
    password = decryptField(body.password);
    code = decryptField(body.code);
  } catch (err) {
    logger.error(`[incoming] [POST] [enrollConfirm] [400] decrypt failed: ${err}`);
    return NextResponse.json(
      { status: "ERROR", message: "Gagal mendekripsi data permintaan" },
      { status: 400 },
    );
  }

  logger.info(`[incoming] [POST] [enrollConfirm] ?${username}`);

  if (!username || !password || !code) {
    return NextResponse.json(
      { status: "ERROR", message: "Username, password, dan kode wajib diisi" },
      { status: 400 },
    );
  }

  let encryptedPassword: string;
  try {
    encryptedPassword = await encryptPasswordForBackend(password);
  } catch (err) {
    logger.error(`[outgoing] [POST] [enrollConfirm] ?${username} key error: ${err}`);
    return NextResponse.json(
      { status: "ERROR", message: "Gagal menyiapkan enkripsi. Coba lagi." },
      { status: 502 },
    );
  }

  const { status, response } = await serverRequestFunction("totpEnrollConfirm", {
    body: { username, password: encryptedPassword, code },
  });

  logger.info(
    `[outgoing] [POST] [enrollConfirm] ?${username} [${status}] "${response?.message ?? ""}"`,
  );
  // Forward verbatim — enrollment issues no session; the client sends the user
  // back to login to sign in again.
  return NextResponse.json(response, { status });
}
