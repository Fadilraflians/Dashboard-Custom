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

const fetchProfile = jest.fn();
jest.mock("@/lib/profile", () => ({
  fetchProfile: (...a: unknown[]) => fetchProfile(...a),
}));

const createSession = jest.fn(async () => "sess-id-123");
jest.mock("@/lib/session", () => ({
  AUTH_COOKIE_NAME: "shell_session",
  COOKIE_SECURE: false,
  SESSION_ABSOLUTE_TTL_SECONDS: 3600,
  createSession: (...a: unknown[]) => createSession(...a),
}));

jest.mock("../../../../../log.js", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { POST } from "./route";

function req(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/auth/verify-otp", () => {
  beforeEach(() => {
    serverRequestFunction.mockReset();
    fetchProfile.mockReset();
    createSession.mockClear();
  });

  it("sukses: ambil profil, buat session, set cookie", async () => {
    serverRequestFunction.mockResolvedValue({
      status: 200,
      response: { status: "SUCCESS", data: { token: "jwt-token" } },
    });
    fetchProfile.mockResolvedValue({
      userId: "3",
      name: "Irfan",
      role: "Administrator",
      email: "a@b.c",
    });

    const res = await POST(req({ username: "enc:irfan", otp: "enc:123456" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.status).toBe("SUCCESS");
    expect(createSession).toHaveBeenCalledWith(
      expect.objectContaining({ sub: "3", name: "Irfan" }),
      "jwt-token",
    );
    // Set-Cookie di-set
    expect(res.cookies.get("shell_session")?.value).toBe("sess-id-123");
  });

  it("balas error bila OTP tidak valid (tanpa token)", async () => {
    serverRequestFunction.mockResolvedValue({
      status: 401,
      response: { status: "ERROR", message: "OTP salah" },
    });
    const res = await POST(req({ username: "enc:x", otp: "enc:000" }));
    expect(res.status).toBe(401);
    expect(createSession).not.toHaveBeenCalled();
  });

  it("balas 400 bila username/otp kosong", async () => {
    const res = await POST(req({ username: "", otp: "" }));
    expect(res.status).toBe(400);
  });

  it("balas 502 bila profil gagal diambil setelah login", async () => {
    serverRequestFunction.mockResolvedValue({
      status: 200,
      response: { status: "SUCCESS", data: { token: "jwt" } },
    });
    fetchProfile.mockResolvedValue(null);
    const res = await POST(req({ username: "enc:a", otp: "enc:1" }));
    expect(res.status).toBe(502);
  });
});
