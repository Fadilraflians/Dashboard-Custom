import { loadConfig } from "./config";

describe("loadConfig", () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
    jest.resetModules();
  });

  it("mengambil /api/config dan mengembalikan JSON", async () => {
    const cfg = { appName: "GovTech", sharedUrl: "u", mfe: {} };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => cfg,
    }) as unknown as typeof fetch;

    const result = await loadConfig();
    expect(result).toEqual(cfg);
    expect(global.fetch).toHaveBeenCalledWith("/api/config");
  });

  it("melempar error bila response tidak ok", async () => {
    // Fresh module so the cached config from the previous test is cleared.
    jest.resetModules();
    const { loadConfig: fresh } = await import("./config");
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: false }) as unknown as typeof fetch;

    await expect(fresh()).rejects.toThrow(/Failed to load app config/i);
  });
});
