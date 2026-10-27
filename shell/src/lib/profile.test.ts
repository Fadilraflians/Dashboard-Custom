jest.mock("server-only", () => ({}));

// Mock the service layer so fetchProfile is deterministic (no network).
const serverRequestFunction = jest.fn();
jest.mock("@/serverServices", () => ({
  serverRequestFunction: (...args: unknown[]) =>
    serverRequestFunction(...args),
}));

import { fetchProfile } from "./profile";

function okResponse(data: unknown) {
  return { status: 200, response: { status: "SUCCESS", data } };
}

describe("fetchProfile", () => {
  beforeEach(() => serverRequestFunction.mockReset());

  it("memetakan userId, nama (fullName), dan role (roleName)", async () => {
    serverRequestFunction.mockResolvedValue(
      okResponse({
        userId: 3,
        username: "IrfanAdmin",
        fullName: "Irfan Rabbani",
        email: "irfan@bni.co.id",
        roles: [{ roleCode: "ADMIN", roleName: "Administrator" }],
      }),
    );

    const p = await fetchProfile("jwt");
    expect(p).toEqual({
      userId: "3",
      name: "Irfan Rabbani",
      role: "Administrator",
      email: "irfan@bni.co.id",
      raw: expect.any(Object),
    });
  });

  it("fallback nama ke username bila fullName kosong", async () => {
    serverRequestFunction.mockResolvedValue(
      okResponse({ userId: 5, username: "user5", roles: [] }),
    );
    const p = await fetchProfile("jwt");
    expect(p?.name).toBe("user5");
    expect(p?.role).toBe("user"); // default saat roles kosong
  });

  it("memakai roleCode bila roleName tidak ada", async () => {
    serverRequestFunction.mockResolvedValue(
      okResponse({ userId: 7, fullName: "X", roles: [{ roleCode: "VIEWER" }] }),
    );
    expect((await fetchProfile("jwt"))?.role).toBe("VIEWER");
  });

  it("mengembalikan null saat status non-2xx", async () => {
    serverRequestFunction.mockResolvedValue({
      status: 500,
      response: { status: "ERROR" },
    });
    expect(await fetchProfile("jwt")).toBeNull();
  });

  it("mengembalikan null saat userId tidak ada", async () => {
    serverRequestFunction.mockResolvedValue(
      okResponse({ fullName: "Tanpa Id" }),
    );
    expect(await fetchProfile("jwt")).toBeNull();
  });

  it("mengembalikan null saat status bukan SUCCESS", async () => {
    serverRequestFunction.mockResolvedValue({
      status: 200,
      response: { status: "FAILED", data: { userId: 1 } },
    });
    expect(await fetchProfile("jwt")).toBeNull();
  });
});
