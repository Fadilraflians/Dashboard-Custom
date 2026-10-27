// `server-only` throws if imported outside a React Server Component. In unit
// tests we exercise the module directly, so stub it to a no-op.
jest.mock("server-only", () => ({}));

import { generateKeyPairSync } from "crypto";
import {
  getFePublicKeyPem,
  decryptFromFe,
  decryptField,
  encryptForBackend,
} from "./rsa";

/** Encrypt a value the way the browser does (FE public key, RSA-OAEP SHA-256). */
function encryptWithPublicKey(plaintext: string, publicKeyPem: string): string {
  // Lazy require so the mock above is applied first.
  const { publicEncrypt, constants, createPublicKey } = require("crypto");
  const buf = publicEncrypt(
    {
      key: createPublicKey(publicKeyPem),
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    Buffer.from(plaintext, "utf8"),
  );
  return buf.toString("base64");
}

describe("rsa (FE layer)", () => {
  const originalKey = process.env.FE_RSA_PRIVATE_KEY;

  beforeAll(() => {
    // Deterministic keypair for the whole suite.
    const { privateKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
      publicKeyEncoding: { type: "spki", format: "pem" },
    });
    // Store as a one-line \n-escaped PEM to mirror how .env holds it.
    process.env.FE_RSA_PRIVATE_KEY = (privateKey as string).replace(
      /\r?\n/g,
      "\\n",
    );
  });

  afterAll(() => {
    process.env.FE_RSA_PRIVATE_KEY = originalKey;
  });

  it("menurunkan public key SPKI PEM dari private key", () => {
    const pem = getFePublicKeyPem();
    expect(pem).toContain("-----BEGIN PUBLIC KEY-----");
    expect(pem).toContain("-----END PUBLIC KEY-----");
  });

  it("decryptFromFe mengembalikan plaintext asli (roundtrip)", () => {
    const pem = getFePublicKeyPem();
    const secret = "P@ssw0rd!123";
    const cipher = encryptWithPublicKey(secret, pem);

    expect(decryptFromFe(cipher)).toBe(secret);
  });

  it("decryptField mengembalikan string kosong untuk input kosong", () => {
    expect(decryptField("")).toBe("");
    expect(decryptField(undefined)).toBe("");
  });

  it("decryptField melempar untuk ciphertext tidak valid (tanpa fallback)", () => {
    expect(() => decryptField("bukan-ciphertext-valid")).toThrow();
  });

  it("decryptField mengembalikan nilai asli bila allowPlainFallback=true", () => {
    expect(decryptField("plain-value", true)).toBe("plain-value");
  });
});

describe("rsa (backend layer)", () => {
  it("encryptForBackend menghasilkan base64 yang bisa didekripsi private backend", () => {
    const { generateKeyPairSync: gen } = require("crypto");
    const { privateKey, publicKey } = gen("rsa", {
      modulusLength: 2048,
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
      publicKeyEncoding: { type: "spki", format: "pem" },
    });

    const plaintext = "rahasia-untuk-backend";
    const cipherB64 = encryptForBackend(plaintext, publicKey as string);

    const { privateDecrypt, constants, createPrivateKey } = require("crypto");
    const decrypted = privateDecrypt(
      {
        key: createPrivateKey(privateKey as string),
        padding: constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
      },
      Buffer.from(cipherB64, "base64"),
    ).toString("utf8");

    expect(decrypted).toBe(plaintext);
  });
});
