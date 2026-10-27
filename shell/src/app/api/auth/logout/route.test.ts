/**
 * @jest-environment node
 */

const getCookie = jest.fn();
jest.mock("next/headers", () => ({
  cookies: async () => ({ get: getCookie }),
}));

const serverRequestFunction = jest.fn();
jest.mock("@/serverServices", () => ({
  serverRequestFunction: (...a: unknown[]) => serverRequestFunction(...a),
}));

const getSession = jest.fn();
const destroySession = jest.fn(async () => {});
jest.mock("@/lib/session", () => ({
  AUTH_COOKIE_NAME: "shell_session",
  MFE_COOKIE_NAME: "mfe_context",
  getSession: (...a: unknown[]) => getSession(...a),
  destroySession: (...a: unknown[]) => destroySession(...a),
}));

jest.mock("../../../../../log.js", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { POST } from "./route";

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    getCookie.mockReset();
    serverRequestFunction.mockReset();
    getSession.mockReset();
    destroySession.mockClear();
  });

  it("memanggil backend logout (Bearer) lalu revoke session + clear cookie", async () => {
    getCookie.mockReturnValue({ value: "sess-1" });
    getSession.mockResolvedValue({ jwt: "jwt-token", name: "Irfan", sub: "3" });
    serverRequestFunction.mockResolvedValue({
      status: 200,
      response: { status: "SUCCESS" },
    });

    const res = await POST();
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(serverRequestFunction).toHaveBeenCalledWith(
      "logout",
      expect.objectContaining({ token: "jwt-token" }),
    );
    expect(destroySession).toHaveBeenCalledWith("sess-1");
    // cookie dikosongkan (maxAge 0)
    expect(res.cookies.get("shell_session")?.value).toBe("");
  });

  it("tetap logout lokal walau tidak ada session (idempoten)", async () => {
    getCookie.mockReturnValue(undefined);
    getSession.mockResolvedValue(null);

    const res = await POST();
    expect(serverRequestFunction).not.toHaveBeenCalled();
    expect(destroySession).toHaveBeenCalled();
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});
