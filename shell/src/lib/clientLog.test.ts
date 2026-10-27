import { clientLog, type ClientLogEvent } from "./clientLog";

const baseEvent: ClientLogEvent = {
  category: "LOAD_MFE",
  event: "MFE_MOUNT_OK",
  service: "MFE:dashboardBok",
};

describe("clientLog", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    // reset the module-level dedup map between tests
    jest.resetModules();
  });

  it("mengirim via sendBeacon bila tersedia", async () => {
    const beacon = jest.fn().mockReturnValue(true);
    Object.defineProperty(navigator, "sendBeacon", {
      value: beacon,
      configurable: true,
    });

    const { clientLog: fresh } = await import("./clientLog");
    fresh({ ...baseEvent, event: "EV_BEACON" });

    expect(beacon).toHaveBeenCalledTimes(1);
    expect(beacon.mock.calls[0][0]).toBe("/api/client-log");
  });

  it("fallback ke fetch bila sendBeacon tidak ada", async () => {
    Object.defineProperty(navigator, "sendBeacon", {
      value: undefined,
      configurable: true,
    });
    const fetchMock = jest
      .fn()
      .mockResolvedValue({ ok: true }) as unknown as typeof fetch;
    global.fetch = fetchMock;

    const { clientLog: fresh } = await import("./clientLog");
    fresh({ ...baseEvent, event: "EV_FETCH" });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/client-log",
      expect.objectContaining({ method: "POST", keepalive: true }),
    );
  });

  it("men-dedup event identik dalam window singkat", async () => {
    const beacon = jest.fn().mockReturnValue(true);
    Object.defineProperty(navigator, "sendBeacon", {
      value: beacon,
      configurable: true,
    });

    const { clientLog: fresh } = await import("./clientLog");
    const e = { ...baseEvent, event: "EV_DEDUP" };
    fresh(e);
    fresh(e); // identik, dalam window → di-skip

    expect(beacon).toHaveBeenCalledTimes(1);
  });
});
