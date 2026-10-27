/**
 * @jest-environment node
 */
const getFePublicKeyPem = jest.fn();
jest.mock("@/lib/rsa", () => ({
  getFePublicKeyPem: (...a: unknown[]) => getFePublicKeyPem(...a),
}));
jest.mock("../../../../../log.js", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { GET } from "./route";

describe("GET /api/crypto/public-key", () => {
  beforeEach(() => getFePublicKeyPem.mockReset());

  it("mengembalikan public key PEM + algoritma", async () => {
    getFePublicKeyPem.mockReturnValue("-----BEGIN PUBLIC KEY-----\n...");
    const res = await GET();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.algorithm).toBe("RSA-OAEP-SHA256");
    expect(json.publicKeyPem).toContain("BEGIN PUBLIC KEY");
  });

  it("balas 500 bila key belum dikonfigurasi", async () => {
    getFePublicKeyPem.mockImplementation(() => {
      throw new Error("FE_RSA_PRIVATE_KEY is not set");
    });
    const res = await GET();
    expect(res.status).toBe(500);
  });
});
