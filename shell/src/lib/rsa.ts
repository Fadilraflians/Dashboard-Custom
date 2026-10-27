import "server-only";
import {
  constants,
  createPrivateKey,
  createPublicKey,
  privateDecrypt,
  publicEncrypt,
  type KeyObject,
} from "crypto";

/**
 * RSA helpers for the two-layer encryption scheme.
 *
 * Layer 1 (FE <-> this Next server): the browser encrypts each field with the
 * FE PUBLIC key (derived from FE_RSA_PRIVATE_KEY and served via
 * /api/crypto/public-key). This server decrypts with the FE PRIVATE key.
 *
 * Layer 2 (this server -> backend gateway): the plaintext password is
 * re-encrypted with the BACKEND public key (fetched at runtime from
 * /auth/api/v1/auth/public-key) before being forwarded.
 *
 * Both layers use RSA-OAEP with SHA-256 to match the backend's declared
 * algorithm ("RSA-OAEP-SHA256").
 */

const OAEP_SHA256 = {
  padding: constants.RSA_PKCS1_OAEP_PADDING,
  oaepHash: "sha256",
} as const;

/** Normalizes an env-stored PEM: converts literal "\n" into real newlines. */
function normalizePem(pem: string): string {
  return pem.includes("-----BEGIN") && pem.includes("\\n")
    ? pem.replace(/\\n/g, "\n")
    : pem;
}

let cachedPrivateKey: KeyObject | null = null;
let cachedPublicKeyPem: string | null = null;

/** Loads (and caches) the FE RSA private key from FE_RSA_PRIVATE_KEY. */
function getFePrivateKey(): KeyObject {
  if (cachedPrivateKey) return cachedPrivateKey;

  const raw = process.env.FE_RSA_PRIVATE_KEY;
  if (!raw) {
    throw new Error("FE_RSA_PRIVATE_KEY is not set");
  }
  cachedPrivateKey = createPrivateKey(normalizePem(raw));
  return cachedPrivateKey;
}

/**
 * Returns the FE PUBLIC key in SPKI PEM form, derived from the private key.
 * This is what the browser imports to encrypt fields.
 */
export function getFePublicKeyPem(): string {
  if (cachedPublicKeyPem) return cachedPublicKeyPem;

  const pub = createPublicKey(getFePrivateKey());
  cachedPublicKeyPem = pub.export({ type: "spki", format: "pem" }).toString();
  return cachedPublicKeyPem;
}

/**
 * Decrypts a base64 ciphertext produced by the browser (FE layer) back into
 * its plaintext string. Throws on malformed/invalid input.
 */
export function decryptFromFe(ciphertextB64: string): string {
  const buf = Buffer.from(ciphertextB64, "base64");
  const decrypted = privateDecrypt({ key: getFePrivateKey(), ...OAEP_SHA256 }, buf);
  return decrypted.toString("utf8");
}

/**
 * Decrypts a field that MAY be FE-encrypted. If decryption fails (e.g. a plain
 * value slipped through in a non-encrypted context), returns the input as-is
 * only when `allowPlainFallback` is true; otherwise rethrows.
 */
export function decryptField(
  value: string | undefined,
  allowPlainFallback = false,
): string {
  if (!value) return "";
  try {
    return decryptFromFe(value);
  } catch (err) {
    if (allowPlainFallback) return value;
    throw err;
  }
}

/**
 * Encrypts a plaintext with the BACKEND's RSA public key (PEM) using
 * RSA-OAEP-SHA256, returning base64. Used to protect the password on the
 * server -> gateway hop.
 */
export function encryptForBackend(
  plaintext: string,
  backendPublicKeyPem: string,
): string {
  const key = createPublicKey(normalizePem(backendPublicKeyPem));
  const encrypted = publicEncrypt(
    { key, ...OAEP_SHA256 },
    Buffer.from(plaintext, "utf8"),
  );
  return encrypted.toString("base64");
}
