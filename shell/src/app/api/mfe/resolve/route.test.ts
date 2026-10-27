/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

const getCookie = jest.fn();
jest.mock("next/headers", () => ({ cookies: async () => ({ get: getCookie }) }));
const getSession = jest.fn();
jest.mock("@/lib/session", () => ({
  AUTH_COOKIE_NAME: "shell_session",
  getSession: (...a: unknown[]) => getSession(...a),
}));
const resolveMfeByMenuCode = jest.fn();
const getSharedUrl = jest.fn(() => "http://localhost:9000/remoteEntry.js");
jest.mock("@/lib/mfeResolve", () => ({
  resolveMfeByMenuCode: (...a: unknown[]) => resolveMfeByMenuCode(...a),
  getSharedUrl: () => getSharedUrl(),
}));
jest.mock("../../../../../log.js", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { POST } from "./route";

function req(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/mfe/resolve", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/mfe/resolve", () => {
  beforeEach(() => {
    getCookie.mockReset();
    getSession.mockReset();
    resolveMfeByMenuCode.mockReset();
  });

  it("mengembalikan descriptor + sharedUrl untuk menuCode terdaftar", async () => {
    getCookie.mockReturnValue({ value: "s" });
    getSession.mockResolvedValue({ name: "Irfan" });
    resolveMfeByMenuCode.mockReturnValue({
      scope: "dashboardBok",
      module: "./mount",
      url: "http://localhost:3001/remoteEntry.js",
    });

    const res = await POST(req({ menuCode: "BOK_DASHBOARD" }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.data.scope).toBe("dashboardBok");
    expect(json.data.sharedUrl).toContain("9000");
  });

  it("balas 404 bila menu tidak punya remote (null)", async () => {
    getCookie.mockReturnValue({ value: "s" });
    getSession.mockResolvedValue({ name: "Irfan" });
    resolveMfeByMenuCode.mockReturnValue(null);
    const res = await POST(req({ menuCode: "BOK_UTAMA" }));
    expect(res.status).toBe(404);
  });

  it("balas 400 bila menuCode kosong", async () => {
    getCookie.mockReturnValue({ value: "s" });
    getSession.mockResolvedValue({ name: "Irfan" });
    const res = await POST(req({}));
    expect(res.status).toBe(400);
  });

  it("balas 401 tanpa session", async () => {
    getCookie.mockReturnValue(undefined);
    getSession.mockResolvedValue(null);
    const res = await POST(req({ menuCode: "X" }));
    expect(res.status).toBe(401);
  });
});
