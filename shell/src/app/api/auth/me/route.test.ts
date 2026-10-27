/**
 * @jest-environment node
 */

const getCookie = jest.fn();
jest.mock("next/headers", () => ({
  cookies: async () => ({ get: getCookie }),
}));

const getSession = jest.fn();
jest.mock("@/lib/session", () => ({
  AUTH_COOKIE_NAME: "shell_session",
  getSession: (...a: unknown[]) => getSession(...a),
}));

import { GET } from "./route";

describe("GET /api/auth/me", () => {
  beforeEach(() => {
    getCookie.mockReset();
    getSession.mockReset();
  });

  it("mengembalikan identitas user saat ada session", async () => {
    getCookie.mockReturnValue({ value: "sess-1" });
    getSession.mockResolvedValue({ sub: "3", name: "Irfan", role: "ADMIN" });

    const res = await GET();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json).toEqual({ id: "3", name: "Irfan", role: "ADMIN" });
  });

  it("balas 401 saat tidak ada session", async () => {
    getCookie.mockReturnValue(undefined);
    getSession.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });
});
