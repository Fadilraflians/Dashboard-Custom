/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

jest.mock("../../../../../../log.js", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { GET, POST } from "./route";

function makeReq(method: string, body?: string): NextRequest {
  return new NextRequest("http://localhost/api/gateway/dashboardBok/data", {
    method,
    ...(body ? { body } : {}),
    headers: { "Content-Type": "application/json", Authorization: "Bearer T" },
  });
}
function ctx(app: string, path: string[]) {
  return { params: Promise.resolve({ app, path }) };
}

describe("gateway /api/gateway/[app]/[...path]", () => {
  const snapshot = { ...process.env };
  afterEach(() => {
    process.env = { ...snapshot };
    jest.restoreAllMocks();
  });

  it("meneruskan ke backend yang teresolusi + relay Authorization", async () => {
    process.env.BACKEND_URL = "http://backend.local";
    const fetchMock = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const res = await POST(makeReq("POST", JSON.stringify({ a: 1 })), ctx("dashboardBok", ["data"]));
    expect(res.status).toBe(200);
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toBe("http://backend.local/data");
    const opts = fetchMock.mock.calls[0][1] as RequestInit;
    expect((opts.headers as Record<string, string>).Authorization).toBe("Bearer T");
  });

  it("balas 501 saat tidak ada backend terkonfigurasi", async () => {
    delete process.env.BACKEND_URL;
    delete process.env.API_BASE_URL;
    const res = await GET(makeReq("GET"), ctx("unknownApp", ["x"]));
    expect(res.status).toBe(501);
  });

  it("fallback ke API_BASE_URL bila BACKEND_URL tidak di-set", async () => {
    delete process.env.BACKEND_URL;
    process.env.API_BASE_URL = "http://api.local";
    const fetchMock = jest.fn().mockResolvedValue(
      new Response("{}", {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;
    const res = await GET(makeReq("GET"), ctx("dashboardBok", ["x"]));
    expect(res.status).toBe(200);
    expect(fetchMock.mock.calls[0][0]).toBe("http://api.local/x");
  });

  it("balas 502 saat backend tidak tersedia (fetch throw)", async () => {
    process.env.BACKEND_URL = "http://backend.local";
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error("conn refused")) as unknown as typeof fetch;
    const res = await GET(makeReq("GET"), ctx("dashboardBok", ["x"]));
    expect(res.status).toBe(502);
  });
});
