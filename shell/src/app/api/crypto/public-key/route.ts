import { NextResponse } from "next/server";
import { getFePublicKeyPem } from "@/lib/rsa";
import { logger } from "../../../../../log.js";

export const dynamic = "force-dynamic";

/**
 * Exposes the FE-layer RSA public key (SPKI PEM) to the browser. The browser
 * uses it to encrypt each outgoing field (username, password, otp, ...). The
 * matching private key never leaves the server.
 */
export async function GET() {
  try {
    const publicKeyPem = getFePublicKeyPem();
    return NextResponse.json({
      algorithm: "RSA-OAEP-SHA256",
      publicKeyPem,
    });
  } catch (err) {
    logger.error(`[incoming] [GET] [cryptoPublicKey] [500] ${err}`);
    return NextResponse.json(
      { message: "Kunci enkripsi belum dikonfigurasi" },
      { status: 500 },
    );
  }
}
