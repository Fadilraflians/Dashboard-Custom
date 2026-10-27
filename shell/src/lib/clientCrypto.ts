"use client";

/**
 * Browser-side RSA encryption (FE layer) using the Web Crypto API.
 *
 * Fields leaving the browser are encrypted PER-FIELD with the FE public key
 * (RSA-OAEP SHA-256). The matching private key lives only on the Next server,
 * which decrypts them. No third-party crypto library is needed.
 */

let cachedKey: CryptoKey | null = null;

/** Strips the PEM header/footer and decodes the base64 body into bytes. */
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const body = pem
    .replace(/-----BEGIN PUBLIC KEY-----/, "")
    .replace(/-----END PUBLIC KEY-----/, "")
    .replace(/\s+/g, "");
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** Fetches the FE public key from the server and imports it (cached). */
async function getPublicKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;

  const res = await fetch("/api/crypto/public-key");
  if (!res.ok) {
    throw new Error("Gagal mengambil kunci enkripsi");
  }
  const data = (await res.json()) as { publicKeyPem?: string };
  if (!data.publicKeyPem) {
    throw new Error("Kunci enkripsi tidak tersedia");
  }

  cachedKey = await crypto.subtle.importKey(
    "spki",
    pemToArrayBuffer(data.publicKeyPem),
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"],
  );
  return cachedKey;
}

/** Encrypts a single string field, returning base64 ciphertext. */
export async function encryptField(plaintext: string): Promise<string> {
  const key = await getPublicKey();
  const encrypted = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    key,
    new TextEncoder().encode(plaintext),
  );
  return bufferToBase64(encrypted);
}

/** Encrypts several fields in parallel, preserving keys. */
export async function encryptFields<K extends string>(
  fields: Record<K, string>,
): Promise<Record<K, string>> {
  const entries = Object.entries(fields) as [K, string][];
  const encrypted = await Promise.all(
    entries.map(async ([k, v]) => [k, await encryptField(v)] as const),
  );
  return Object.fromEntries(encrypted) as Record<K, string>;
}
