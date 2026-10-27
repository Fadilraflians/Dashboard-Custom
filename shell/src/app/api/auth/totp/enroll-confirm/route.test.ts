/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

const serverRequestFunction = jest.fn();
jest.mock("@/serverServices", () => ({
  serverRequestFunction: (...a: unknown[]) => serverRequestFunction(...a),
}));
const decryptField = jest.fn((v: string) => (v ? v.replace("enc:", "") : ""));
jest.mock("@/lib/rsa", () => ({
  decryptField: (...a: unknown[]) => decryptField(...(a as [string])),
}));
const encryptPasswordForBackend = jest.fn(async () => "BE_ENC");
jest.mock("@/lib/backendCrypto", () => ({
  encryptPasswordForBackend: (...a: unknown[]) =>
    encryptPasswordForBackend(...a),
}));
jest.mock("../../../../../../log.js", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { POST } from "./route";

function req(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/auth/totp/enroll-confirm", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/auth/totp/enroll-confirm", () => {
  beforeEach(() => {
    serverRequestFunction.mockReset();
    encryptPasswordForBackend.mockClear();
  });

  it("meneruskan username/password(enc)/code ke backend", async () => {
    serverRequestFunction.mockResolvedValue({
      status: 200,
      response: { status: "SUCCESS", message: "TOTP enrolled" },
    });
    const res = await POST(
      req({ username: "enc:u", password: "enc:p", code: "enc:123456" }),
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.status).toBe("SUCCESS");
    expect(serverRequestFunction).toHaveBeenCalledWith(
      "totpEnrollConfirm",
      expect.objectContaining({
        body: { username: "u", password: "BE_ENC", code: "123456" },
      }),
    );
  });

  it("balas 400 bila ada field yang kosong", async () => {
    const res = await POST(
      req({ username: "enc:u", password: "enc:p", code: "" }),
    );
    expect(res.status).toBe(400);
  });
});
