/**
 * @jest-environment node
 */
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

describe("POST /api/catalog/summary", () => {
  beforeEach(() => {
    getCookie.mockReset();
    serverRequestFunction.mockReset();
    getSession.mockReset();
  });

  it("meneruskan summary backend saat ada session", async () => {
    getCookie.mockReturnValue({ value: "s" });
    getSession.mockResolvedValue({ jwt: "jwt", name: "Irfan" });
    serverRequestFunction.mockResolvedValue({
      status: 200,
      response: { status: 200, data: { activeOrganizations: 4 } },
    });
    const res = await POST();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.data.activeOrganizations).toBe(4);
    expect(serverRequestFunction).toHaveBeenCalledWith(
      "catalogSummary",
      expect.objectContaining({ token: "jwt" }),
    );
  });

  it("balas 401 tanpa session", async () => {
    getCookie.mockReturnValue(undefined);
    getSession.mockResolvedValue(null);
    const res = await POST();
    expect(res.status).toBe(401);
  });
});
