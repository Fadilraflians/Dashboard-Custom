jest.mock("server-only", () => ({}));

import { resolveMfeByMenuCode, getSharedUrl } from "./mfeResolve";

describe("resolveMfeByMenuCode", () => {
  const snapshot = { ...process.env };

  afterEach(() => {
    process.env = { ...snapshot };
  });

  it("meresolusi scope/module/url dari env MFE_<menuCode>_*", () => {
    process.env.MFE_BOK_DASHBOARD_SCOPE = "dashboardBok";
    process.env.MFE_BOK_DASHBOARD_URL = "http://localhost:3001/remoteEntry.js";
    delete process.env.MFE_BOK_DASHBOARD_MODULE;
    process.env.MFE_DEFAULT_MODULE = "./mount";

    const d = resolveMfeByMenuCode("BOK_DASHBOARD");
    expect(d).toEqual({
      scope: "dashboardBok",
      module: "./mount",
      url: "http://localhost:3001/remoteEntry.js",
    });
  });

  it("memakai MFE_DEFAULT_MODULE saat module per-menu tidak di-set", () => {
    process.env.MFE_X_SCOPE = "xScope";
    process.env.MFE_X_URL = "http://localhost:9/remoteEntry.js";
    delete process.env.MFE_X_MODULE;
    process.env.MFE_DEFAULT_MODULE = "./expose";

    expect(resolveMfeByMenuCode("X")?.module).toBe("./expose");
  });

  it("override module per-menu menang atas default", () => {
    process.env.MFE_Y_SCOPE = "yScope";
    process.env.MFE_Y_URL = "http://localhost:9/remoteEntry.js";
    process.env.MFE_Y_MODULE = "./custom";
    process.env.MFE_DEFAULT_MODULE = "./mount";

    expect(resolveMfeByMenuCode("Y")?.module).toBe("./custom");
  });

  it("mengembalikan null bila scope atau url tidak ada (mis. SECTION)", () => {
    delete process.env.MFE_BOK_UTAMA_SCOPE;
    delete process.env.MFE_BOK_UTAMA_URL;
    expect(resolveMfeByMenuCode("BOK_UTAMA")).toBeNull();
  });

  it("mengembalikan null untuk menuCode kosong", () => {
    expect(resolveMfeByMenuCode("")).toBeNull();
  });

  it("menormalkan menuCode (lowercase/karakter aneh) ke key env", () => {
    process.env.MFE_BOK_DASHBOARD_SCOPE = "dashboardBok";
    process.env.MFE_BOK_DASHBOARD_URL = "http://localhost:3001/remoteEntry.js";
    // lowercase input tetap resolve ke MFE_BOK_DASHBOARD_*
    expect(resolveMfeByMenuCode("bok_dashboard")?.scope).toBe("dashboardBok");
  });
});

describe("getSharedUrl", () => {
  const original = process.env.SHARED_URL;
  afterEach(() => {
    process.env.SHARED_URL = original;
  });

  it("mengembalikan SHARED_URL dari env", () => {
    process.env.SHARED_URL = "http://localhost:9000/remoteEntry.js";
    expect(getSharedUrl()).toBe("http://localhost:9000/remoteEntry.js");
  });

  it("mengembalikan string kosong bila tidak di-set", () => {
    delete process.env.SHARED_URL;
    expect(getSharedUrl()).toBe("");
  });
});
