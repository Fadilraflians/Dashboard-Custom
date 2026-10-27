/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

const getCookie = jest.fn();
jest.mock("next/headers", () => ({ cookies: async () => ({ get: getCookie }) }));
jest.mock("@/lib/session", () => ({ AUTH_COOKIE_NAME: "shell_session" }));

import { GET, POST } from "./route";

function makeReq(method: string, body?: string): NextRequest {
  return new NextRequest("http://localhost/mfe-api/BOK_DASHBOARD/data", {
    method,
    ...(body ? { body } : {}),
    headers: { "Content-Type": "application/json" },
  });
}
function ctx(app: string, path: string[]) {
  return { params: Promise.resolve({ app, path }) };
}

describe("mfe-api proxy /mfe-api/[app]/[...path]", () => {
  const snapshot = { ...process.env };
  afterEach(() => {
    process.env = { ...snapshot };
    jest.restoreAllMocks();
  });

  it("meneruskan ke BFF + relay cookie session", async () => {
    process.env.MFE_BOK_DASHBOARD_BFF_URL = "http://bff.local";
    getCookie.mockReturnValue({ value: "sess-1" });
    const fetchMock = jest.fn().mockResolvedValue(
      new Response("{}", {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const res = await POST(makeReq("POST", "{}"), ctx("BOK_DASHBOARD", ["data"]));
    expect(res.status).toBe(200);
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toBe("http://bff.local/api/data");
    const opts = fetchMock.mock.calls[0][1] as RequestInit;
    expect((opts.headers as Record<string, string>).Cookie).toContain("sess-1");
  });

  it("balas 501 saat tidak ada BFF terkonfigurasi", async () => {
    delete process.env.MFE_BOK_DASHBOARD_BFF_URL;
    delete process.env.BFF_URL;
    getCookie.mockReturnValue(undefined);
    const res = await GET(makeReq("GET"), ctx("BOK_DASHBOARD", ["x"]));
    expect(res.status).toBe(501);
  });
});
