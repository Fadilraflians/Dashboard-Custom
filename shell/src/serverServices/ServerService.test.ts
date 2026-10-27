/**
 * @jest-environment node
 */
jest.mock("server-only", () => ({}));

// next/headers.headers() is used for IP/UA; stub it.
jest.mock("next/headers", () => ({
  headers: async () => ({ get: () => "" }),
}));

jest.mock("../../log.js", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { serverRequestFunction } from "./ServerService";

describe("serverRequestFunction", () => {
  const snapshot = { ...process.env };
  afterEach(() => {
    process.env = { ...snapshot };
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    process.env.API_BASE_URL = "http://gw.local";
  });

  it("memanggil URL yang teresolusi + mengembalikan JSON backend", async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "SUCCESS", data: { x: 1 } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const { status, response } = await serverRequestFunction("login", {
      body: { username: "u", password: "p", loginType: "2" },
    });

    expect(status).toBe(200);
    expect(response.status).toBe("SUCCESS");
    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://gw.local/auth/api/v1/auth/login",
    );
  });

  it("menyertakan Authorization Bearer saat token diberikan", async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      new Response("{}", {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    await serverRequestFunction("profile", { token: "jwt-token" });
    const opts = fetchMock.mock.calls[0][1] as RequestInit;
    expect((opts.headers as Record<string, string>).Authorization).toBe(
      "Bearer jwt-token",
    );
  });

  it("mengembalikan 500 + pesan error saat fetch gagal", async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error("down")) as unknown as typeof fetch;
    const { status, response } = await serverRequestFunction("profile", {});
    expect(status).toBe(500);
    expect((response as { success?: boolean }).success).toBe(false);
  });

  it("mengembalikan 400 untuk service key tidak valid", async () => {
    const { status } = await serverRequestFunction(
      // @ts-expect-error — key tak dikenal untuk menguji guard
      "ngaco",
      {},
    );
    expect(status).toBe(400);
  });
});
