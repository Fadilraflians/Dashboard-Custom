import { parseJwt } from "./jwt";

/** Build a fake JWT (header.payload.signature) with a base64url payload. */
function makeJwt(payload: Record<string, unknown>): string {
  const b64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `header.${b64}.signature`;
}

describe("parseJwt", () => {
  it("mendekode payload JWT yang valid", () => {
    const token = makeJwt({ sub: "42", name: "Irfan", role: "ADMIN" });
    const claims = parseJwt(token);
    expect(claims).toMatchObject({ sub: "42", name: "Irfan", role: "ADMIN" });
  });

  it("mengembalikan null bila bukan 3 bagian", () => {
    expect(parseJwt("hanya.dua")).toBeNull();
    expect(parseJwt("satu")).toBeNull();
  });

  it("mengembalikan null bila payload bukan JSON valid", () => {
    const bad = `header.${Buffer.from("bukan-json").toString("base64url")}.sig`;
    expect(parseJwt(bad)).toBeNull();
  });

  it("mengizinkan klaim tambahan lewat index signature", () => {
    const token = makeJwt({ sub: "1", UserId: 3, Roles: [{ roleCode: "X" }] });
    const claims = parseJwt(token);
    expect(claims?.["UserId"]).toBe(3);
  });
});
