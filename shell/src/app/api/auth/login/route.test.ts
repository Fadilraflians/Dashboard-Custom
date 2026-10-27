/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

// --- mocks ---
const serverRequestFunction = jest.fn();
jest.mock("@/serverServices", () => ({
  serverRequestFunction: (...a: unknown[]) => serverRequestFunction(...a),
}));

const decryptField = jest.fn((v: string) => (v ? v.replace("enc:", "") : ""));
jest.mock("@/lib/rsa", () => ({
  decryptField: (...a: unknown[]) => decryptField(...(a as [string])),
}));

const encryptPasswordForBackend = jest.fn(async () => "BACKEND_ENC");
jest.mock("@/lib/backendCrypto", () => ({
  encryptPasswordForBackend: (...a: unknown[]) =>
    encryptPasswordForBackend(...a),
}));

jest.mock("../../../../../log.js", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { POST } from "./route";

function req(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    serverRequestFunction.mockReset();
    decryptField.mockClear();
    encryptPasswordForBackend.mockClear();
  });

  it("decrypt field FE, encrypt password backend, forward, balas mfaRequired", async () => {
    serverRequestFunction.mockResolvedValue({
      status: 200,
      response: { status: "SUCCESS", data: { mfaRequired: "totp" } },
    });

    const res = await POST(req({ username: "enc:irfan", password: "enc:secret" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.mfaRequired).toBe("totp");
    // password dikirim ke backend dalam bentuk ter-encrypt
    expect(encryptPasswordForBackend).toHaveBeenCalledWith("secret");
    expect(serverRequestFunction).toHaveBeenCalledWith(
      "login",
      expect.objectContaining({
        body: { username: "irfan", password: "BACKEND_ENC", loginType: "2" },
      }),
    );
  });

  it("balas 400 bila username/password kosong setelah decrypt", async () => {
    const res = await POST(req({ username: "", password: "" }));
    expect(res.status).toBe(400);
    expect(serverRequestFunction).not.toHaveBeenCalled();
  });

  it("balas 400 bila decrypt gagal", async () => {
    decryptField.mockImplementationOnce(() => {
      throw new Error("bad cipher");
    });
    const res = await POST(req({ username: "x", password: "y" }));
    expect(res.status).toBe(400);
  });

  it("balas 502 bila enkripsi backend gagal", async () => {
    encryptPasswordForBackend.mockRejectedValueOnce(new Error("key down"));
    const res = await POST(req({ username: "enc:a", password: "enc:b" }));
    expect(res.status).toBe(502);
  });
});
