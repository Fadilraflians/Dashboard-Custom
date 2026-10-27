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
jest.mock("@/lib/session", () => ({
  AUTH_COOKIE_NAME: "shell_session",
  getSession: (...a: unknown[]) => getSession(...a),
}));

jest.mock("../../../../../log.js", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { GET } from "./route";

describe("GET /api/auth/profile", () => {
  beforeEach(() => {
    getCookie.mockReset();
    serverRequestFunction.mockReset();
    getSession.mockReset();
  });

  it("meneruskan profil backend (Bearer dari session)", async () => {
    getCookie.mockReturnValue({ value: "sess-1" });
    getSession.mockResolvedValue({ jwt: "jwt-token", name: "Irfan" });
    serverRequestFunction.mockResolvedValue({
      status: 200,
      response: { status: "SUCCESS", data: { userId: 3 } },
    });

    const res = await GET();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.data.userId).toBe(3);
    expect(serverRequestFunction).toHaveBeenCalledWith(
      "profile",
      expect.objectContaining({ token: "jwt-token" }),
    );
  });

  it("balas 401 saat tidak ada session", async () => {
    getCookie.mockReturnValue(undefined);
    getSession.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
    expect(serverRequestFunction).not.toHaveBeenCalled();
  });
});
