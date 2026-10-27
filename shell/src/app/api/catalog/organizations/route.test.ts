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
  return new NextRequest("http://localhost/api/catalog/organizations", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/catalog/organizations", () => {
  beforeEach(() => {
    getCookie.mockReset();
    serverRequestFunction.mockReset();
    getSession.mockReset();
  });

  it("mengisi default sort/pagination dan meneruskan ke backend", async () => {
    getCookie.mockReturnValue({ value: "s" });
    getSession.mockResolvedValue({ jwt: "jwt", name: "Irfan" });
    serverRequestFunction.mockResolvedValue({
      status: 200,
      response: { status: 200, data: [] },
    });

    const res = await POST(req({ search: "bpjs" }));
    expect(res.status).toBe(200);
    expect(serverRequestFunction).toHaveBeenCalledWith(
      "catalogOrganizations",
      expect.objectContaining({
        body: expect.objectContaining({
          search: "bpjs",
          sortBy: "ORGANIZATION_NAME",
          sortDirection: "ASC",
          pagination: { page: 1, pageSize: 10 },
        }),
      }),
    );
  });

  it("balas 401 tanpa session", async () => {
    getCookie.mockReturnValue(undefined);
    getSession.mockResolvedValue(null);
    const res = await POST(req({}));
    expect(res.status).toBe(401);
  });
});
