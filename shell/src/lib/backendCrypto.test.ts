jest.mock("server-only", () => ({}));

const serverRequestFunction = jest.fn();
jest.mock("@/serverServices", () => ({
  serverRequestFunction: (...a: unknown[]) => serverRequestFunction(...a),
}));

const encryptForBackend = jest.fn(() => "ENCRYPTED_B64");
jest.mock("@/lib/rsa", () => ({
  encryptForBackend: (...a: unknown[]) => encryptForBackend(...a),
}));

import { encryptPasswordForBackend } from "./backendCrypto";

describe("encryptPasswordForBackend", () => {
  beforeEach(() => {
    serverRequestFunction.mockReset();
    encryptForBackend.mockClear();
  });

  it("ambil public key backend lalu encrypt password", async () => {
    serverRequestFunction.mockResolvedValue({
      status: 200,
      response: { status: "SUCCESS", data: { publicKeyPem: "PEM" } },
    });

    const result = await encryptPasswordForBackend("rahasia");

    expect(result).toBe("ENCRYPTED_B64");
    expect(encryptForBackend).toHaveBeenCalledWith("rahasia", "PEM");
  });

  it("melempar bila status non-2xx", async () => {
    serverRequestFunction.mockResolvedValue({
      status: 500,
      response: { status: "ERROR" },
    });
    await expect(encryptPasswordForBackend("x")).rejects.toThrow(
      /public key backend/i,
    );
  });

  it("melempar bila publicKeyPem tidak ada", async () => {
    serverRequestFunction.mockResolvedValue({
      status: 200,
      response: { status: "SUCCESS", data: {} },
    });
    await expect(encryptPasswordForBackend("x")).rejects.toThrow();
  });
});
