/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

const getCookie = jest.fn();
jest.mock("next/headers", () => ({ cookies: async () => ({ get: getCookie }) }));
const getSession = jest.fn();
jest.mock("@/lib/session", () => ({
  AUTH_COOKIE_NAME: "shell_session",
  MFE_COOKIE_NAME: "mfe_context",
  COOKIE_SECURE: false,
  SESSION_ABSOLUTE_TTL_SECONDS: 3600,
  getSession: (...a: unknown[]) => getSession(...a),
}));

import { POST } from "./route";

function req(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/mfe/select", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/mfe/select", () => {
  beforeEach(() => {
    getCookie.mockReset();
    getSession.mockReset();
  });

  it("set cookie mfe_context dengan konteks app", async () => {
    getCookie.mockReturnValue({ value: "s" });
    getSession.mockResolvedValue({ sub: "3", name: "Irfan", role: "ADMIN" });

    const res = await POST(req({ app: "BOK_DASHBOARD" }));
    const json = await res.json();
    expect(json).toEqual({ ok: true, app: "BOK_DASHBOARD" });

    const cookie = res.cookies.get("mfe_context");
    expect(cookie).toBeDefined();
    const ctx = JSON.parse(cookie!.value);
    expect(ctx.app).toBe("BOK_DASHBOARD");
    expect(ctx.userId).toBe("3");
  });

  it("balas 401 tanpa session", async () => {
    getCookie.mockReturnValue(undefined);
    getSession.mockResolvedValue(null);
    const res = await POST(req({ app: "X" }));
    expect(res.status).toBe(401);
  });
});
