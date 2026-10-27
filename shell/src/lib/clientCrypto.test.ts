import { generateKeyPairSync, privateDecrypt, constants } from "crypto";
import { encryptField, encryptFields } from "./clientCrypto";

// A keypair shared by the suite: the browser encrypts with the public PEM;
// we decrypt with the private key to prove the roundtrip (server side).
let publicKeyPem: string;
let privateKeyPem: string;

function decrypt(cipherB64: string): string {
  return privateDecrypt(
    {
      key: privateKeyPem,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    Buffer.from(cipherB64, "base64"),
  ).toString("utf8");
}

describe("clientCrypto (Web Crypto FE)", () => {
  beforeAll(() => {
    const kp = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });
    publicKeyPem = kp.publicKey as string;
    privateKeyPem = kp.privateKey as string;
  });

  beforeEach(() => {
    // Serve the FE public key from /api/crypto/public-key.
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ publicKeyPem }),
    }) as unknown as typeof fetch;
    jest.resetModules();
  });

  it("encryptField menghasilkan ciphertext yang bisa didekripsi private key", async () => {
    const { encryptField: fresh } = await import("./clientCrypto");
    const cipher = await fresh("rahasia-123");
    expect(typeof cipher).toBe("string");
    expect(decrypt(cipher)).toBe("rahasia-123");
  });

  it("encryptFields meng-encrypt tiap field secara terpisah", async () => {
    const { encryptFields: fresh } = await import("./clientCrypto");
    const enc = await fresh({ username: "irfan", password: "P@ss" });

    expect(Object.keys(enc)).toEqual(["username", "password"]);
    expect(decrypt(enc.username)).toBe("irfan");
    expect(decrypt(enc.password)).toBe("P@ss");
  });

  it("melempar bila endpoint public key gagal", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: false }) as unknown as typeof fetch;
    const { encryptField: fresh } = await import("./clientCrypto");
    await expect(fresh("x")).rejects.toThrow(/kunci enkripsi/i);
  });

  // Keep static imports referenced so the module is loaded for coverage.
  it("mengekspor encryptField & encryptFields", () => {
    expect(typeof encryptField).toBe("function");
    expect(typeof encryptFields).toBe("function");
  });
});
