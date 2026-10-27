import "server-only";
import { serverRequestFunction } from "@/serverServices";
import { encryptForBackend } from "@/lib/rsa";

/**
 * Fetches the backend's RSA public key (POST /auth/api/v1/auth/public-key) and
 * encrypts the given plaintext password for the server -> gateway hop.
 *
 * The key is fetched fresh per login attempt (keys can rotate and the call is
 * cheap). Throws if the key cannot be retrieved so the caller can fail loudly.
 */
export async function encryptPasswordForBackend(
  plainPassword: string,
): Promise<string> {
  const { status, response } = await serverRequestFunction("publicKey", {});
  const pem = response?.data?.publicKeyPem;

  if (status < 200 || status >= 300 || !pem) {
    throw new Error(
      `Gagal mengambil public key backend (status ${status})`,
    );
  }

  return encryptForBackend(plainPassword, pem);
}
