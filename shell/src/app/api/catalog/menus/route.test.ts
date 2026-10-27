/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

const getCookie = jest.fn();
jest.mock("next/headers", () => ({ cookies: async () => ({ get: getCookie }) }));
const serverRequestFunction = jest.fn();
jest.mock("@/serverServices", () => ({
  serverRequestFunction: (...a: unknown[]) => serverRequestFunction(...a),
}));
const getSession = jest.fn();
jest.mock("@/lib/session", () => ({
  AUTH_COOKIE_NAME: "shell_session",
  getSession: (...a: unknown[]) => getSession(...a),
}));
jest.mock("../../../../../log.js", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { POST } from "./route";

function req(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/catalog/menus", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/catalog/menus", () => {
  beforeEach(() => {
    getCookie.mockReset();
    serverRequestFunction.mockReset();
    getSession.mockReset();
  });

  it("meneruskan appId + default sort/pagination (pageSize 50)", async () => {
    getCookie.mockReturnValue({ value: "s" });
    getSession.mockResolvedValue({ jwt: "jwt", name: "Irfan" });
    serverRequestFunction.mockResolvedValue({
      status: 200,
      response: { status: 200, data: [] },
    });

    await POST(req({ appId: 4 }));
    expect(serverRequestFunction).toHaveBeenCalledWith(
      "catalogMenus",
      expect.objectContaining({
        body: expect.objectContaining({
          appId: 4,
          sortBy: "DISPLAY_ORDER",
          pagination: { page: 1, pageSize: 50 },
        }),
      }),
    );
  });

  it("balas 400 bila appId tidak ada", async () => {
    getCookie.mockReturnValue({ value: "s" });
    getSession.mockResolvedValue({ jwt: "jwt", name: "Irfan" });
    const res = await POST(req({}));
    expect(res.status).toBe(400);
  });

  it("balas 401 tanpa session", async () => {
    getCookie.mockReturnValue(undefined);
    getSession.mockResolvedValue(null);
    const res = await POST(req({ appId: 1 }));
    expect(res.status).toBe(401);
  });
});
