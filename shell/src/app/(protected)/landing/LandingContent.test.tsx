import { render, screen, act, waitFor } from "@testing-library/react";
import LandingContent from "./LandingContent";

const push = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const summary = { activeOrganizations: 4, externalApplications: 124 };
const organizations = [
  {
    organizationId: 1,
    organizationCode: "BPJS",
    organizationName: "BPJS Kesehatan",
    organizationType: "LEMBAGA",
    organizationDescription: "Badan Penyelenggara Jaminan Sosial Kesehatan",
    status: "TERVERIFIKASI",
  },
  {
    organizationId: 2,
    organizationCode: "KEMENKES",
    organizationName: "Kementerian Kesehatan",
    organizationType: "KEMENTRIAN",
    organizationDescription: "Kemenkes RI",
    status: "TERVERIFIKASI",
  },
];
const applications = [
  {
    appId: 10,
    appCode: "DASHBOARD_BOK",
    appName: "Dashboard BOK",
    appDescription: "Dashboard BOK eksternal",
    appStatus: "ACTIVE",
    appHighlightInfo: "Popular",
  },
];

function routedFetch() {
  return jest.fn().mockImplementation((url: string) => {
    if (url === "/api/catalog/summary") {
      return Promise.resolve({ ok: true, json: async () => ({ data: summary }) });
    }
    if (url === "/api/catalog/organizations") {
      return Promise.resolve({
        ok: true,
        json: async () => ({ data: organizations, metadata: { totalData: 2 } }),
      });
    }
    if (url === "/api/catalog/applications") {
      return Promise.resolve({ ok: true, json: async () => ({ data: applications }) });
    }
    return Promise.resolve({ ok: false, json: async () => ({}) });
  }) as unknown as typeof fetch;
}

function mockReducedMotion() {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: jest.fn().mockImplementation((q: string) => ({
      matches: true,
      media: q,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
  });
}

describe("LandingContent", () => {
  beforeEach(() => {
    push.mockReset();
    mockReducedMotion();
    global.fetch = routedFetch();
  });

  it("menyapa user dan menampilkan daftar organisasi dari API", async () => {
    render(<LandingContent userName="SA" />);
    expect(screen.getByText(/Halo, SA/)).toBeInTheDocument();
    expect(await screen.findByText("BPJS Kesehatan")).toBeInTheDocument();
    expect(screen.getByText("Kementerian Kesehatan")).toBeInTheDocument();
  });

  it("menampilkan angka summary (count-up langsung karena reduced-motion)", async () => {
    render(<LandingContent userName="SA" />);
    expect(await screen.findByText("124")).toBeInTheDocument();
  });

  it("filter Kementerian menyaring kartu pada halaman", async () => {
    render(<LandingContent userName="SA" />);
    await screen.findByText("BPJS Kesehatan");
    act(() => screen.getByRole("button", { name: /^Kementerian$/ }).click());
    expect(screen.queryByText("BPJS Kesehatan")).not.toBeInTheDocument();
    expect(screen.getByText("Kementerian Kesehatan")).toBeInTheDocument();
  });

  it("klik 'Lihat Daftar Portal' memuat aplikasi organisasi", async () => {
    render(<LandingContent userName="SA" />);
    await screen.findByText("BPJS Kesehatan");
    const toggles = screen.getAllByRole("button", {
      name: /Lihat Daftar Portal/i,
    });
    act(() => toggles[0].click());
    expect(await screen.findByText("Dashboard BOK")).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/catalog/applications",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("Masuk Portal menavigasi ke /app dengan query appId", async () => {
    render(<LandingContent userName="SA" />);
    await screen.findByText("BPJS Kesehatan");
    act(() =>
      screen.getAllByRole("button", { name: /Lihat Daftar Portal/i })[0].click(),
    );
    const enter = await screen.findByRole("button", { name: /Masuk Portal/i });
    act(() => enter.click());
    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(push.mock.calls[0][0]).toContain("/app/dashboard?");
    expect(push.mock.calls[0][0]).toContain("appId=10");
  });
});
