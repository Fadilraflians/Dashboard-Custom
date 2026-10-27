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
// Mock factory must not reference outer variables (hoisting). Grab the mock
// fns from the mocked module after import.
jest.mock("../../../../log.js", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { POST } from "./route";
import { logger } from "../../../../log.js";

const logInfo = logger.info as jest.Mock;
const logError = logger.error as jest.Mock;

function req(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/client-log", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/client-log", () => {
  beforeEach(() => {
    getCookie.mockReset();
    getSession.mockReset();
    logInfo.mockClear();
    logError.mockClear();
  });

  it("menulis log level error dan membalas ok", async () => {
    getCookie.mockReturnValue(undefined);
    getSession.mockResolvedValue(null);

    const res = await POST(
      req({
        level: "error",
        category: "LOAD_MFE",
        event: "MFE_LOAD_FAIL",
        service: "MFE:dashboardBok",
        message: "gagal load",
      }),
    );
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(logError).toHaveBeenCalledTimes(1);
    // user anon karena tanpa session
    expect(logError.mock.calls[0][0]).toContain("?anon");
  });

  it("menyertakan tag user @sub bila ada session", async () => {
    getCookie.mockReturnValue({ value: "s" });
    getSession.mockResolvedValue({ sub: "3" });

    await POST(req({ level: "info", event: "OK", service: "SHELL" }));
    expect(logInfo).toHaveBeenCalled();
    expect(logInfo.mock.calls[0][0]).toContain("@3");
  });

  it("balas 400 untuk body non-JSON", async () => {
    const bad = new NextRequest("http://localhost/api/client-log", {
      method: "POST",
      body: "bukan json",
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(bad);
    expect(res.status).toBe(400);
  });
});
