import { NextRequest, NextResponse } from "next/server";
import { serverRequestFunction } from "@/serverServices";
import { decryptField } from "@/lib/rsa";
import { encryptPasswordForBackend } from "@/lib/backendCrypto";
import { logger } from "../../../../../../log.js";

export const dynamic = "force-dynamic";

/**
 * TOTP enrollment — begin. Reached when login returned mfaRequired = "enroll".
 *
 * Request (FE-encrypted per field): { username: <RSA_FE>, password: <RSA_FE> }
 * Server decrypts, re-encrypts the password for the backend, then calls
 * POST /auth/api/v1/auth/totp/enroll-begin-login.
 *
 * Response forwarded to the browser carries { data: { secret, otpauthUri } },
 * which the client turns into a QR code for the authenticator app.
 */
export async function POST(request: NextRequest) {
  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    logger.error(`[incoming] [POST] [enrollBegin] [400] invalid request body`);
    return NextResponse.json(
      { status: "ERROR", message: "Invalid request body" },
      { status: 400 },
    );
  }

  let username: string;
  let password: string;
  try {
    username = decryptField(body.username);
    password = decryptField(body.password);
  } catch (err) {
    logger.error(`[incoming] [POST] [enrollBegin] [400] decrypt failed: ${err}`);
    return NextResponse.json(
      { status: "ERROR", message: "Gagal mendekripsi data permintaan" },
      { status: 400 },
    );
  }

  logger.info(`[incoming] [POST] [enrollBegin] ?${username}`);

  if (!username || !password) {
    return NextResponse.json(
      { status: "ERROR", message: "Username dan password wajib diisi" },
      { status: 400 },
    );
  }

  let encryptedPassword: string;
  try {
    encryptedPassword = await encryptPasswordForBackend(password);
  } catch (err) {
    logger.error(`[outgoing] [POST] [enrollBegin] ?${username} key error: ${err}`);
    return NextResponse.json(
      { status: "ERROR", message: "Gagal menyiapkan enkripsi. Coba lagi." },
      { status: 502 },
    );
  }

  const { status, response } = await serverRequestFunction("totpEnrollBegin", {
    body: { username, password: encryptedPassword },
  });

  logger.info(
    `[outgoing] [POST] [enrollBegin] ?${username} [${status}] "${response?.message ?? ""}"`,
  );
  return NextResponse.json(response, { status });
}
