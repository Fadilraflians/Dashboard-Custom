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
  return new NextRequest("http://localhost/api/auth/totp/enroll-begin", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/auth/totp/enroll-begin", () => {
  beforeEach(() => {
    serverRequestFunction.mockReset();
    encryptPasswordForBackend.mockClear();
  });

  it("meneruskan ke backend dan balas secret + otpauthUri", async () => {
    serverRequestFunction.mockResolvedValue({
      status: 200,
      response: {
        status: "SUCCESS",
        data: { secret: "ABC", otpauthUri: "otpauth://x" },
      },
    });
    const res = await POST(req({ username: "enc:u", password: "enc:p" }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.data.secret).toBe("ABC");
    expect(serverRequestFunction).toHaveBeenCalledWith(
      "totpEnrollBegin",
      expect.objectContaining({ body: { username: "u", password: "BE_ENC" } }),
    );
  });

  it("balas 400 bila field kosong", async () => {
    const res = await POST(req({ username: "", password: "" }));
    expect(res.status).toBe(400);
  });
});
