/**
 * @jest-environment node
 */
import { GET } from "./route";

describe("GET /api/config", () => {
  const snapshot = { ...process.env };
  afterEach(() => {
    process.env = { ...snapshot };
  });

  it("mengembalikan appName, sharedUrl, dan descriptor MFE dari env", async () => {
    process.env.SHARED_URL = "http://localhost:9000/remoteEntry.js";
    process.env.MFE_DASHBOARDBOK_URL = "http://localhost:3001/remoteEntry.js";

    const res = await GET();
    const json = await res.json();

    expect(json.appName).toBeDefined();
    expect(json.sharedUrl).toBe("http://localhost:9000/remoteEntry.js");
    expect(json.mfe.dashboardBok.url).toBe(
      "http://localhost:3001/remoteEntry.js",
    );
  });
});
