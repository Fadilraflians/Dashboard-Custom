import { render, screen, act, waitFor } from "@testing-library/react";
import Sidebar from "./Sidebar";

// DynamicIcon just needs to render something harmless.
jest.mock("./DynamicIcon", () => ({
  __esModule: true,
  default: () => <span data-testid="icon" />,
}));

const menusTree = [
  {
    menuId: 1,
    menuCode: "BOK_UTAMA",
    menuName: "Utama",
    menuType: "SECTION",
    child: [
      {
        menuId: 2,
        menuCode: "BOK_DASHBOARD",
        menuName: "Dashboard BOK",
        menuType: "MENU",
        routePath: "/dashboard-bok",
      },
      {
        menuId: 3,
        menuCode: "BOK_SUMMARY",
        menuName: "Summary Dashboard",
        menuType: "MENU",
        child: [
          {
            menuId: 4,
            menuCode: "BOK_SUMMARY_VA",
            menuName: "Level VA",
            menuType: "SUBMENU",
            routePath: "/summary/va",
          },
        ],
      },
    ],
  },
];

function mockMenusFetch(ok = true, data: unknown = menusTree) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    json: async () => ({ status: 200, data }),
  }) as unknown as typeof fetch;
}

describe("Sidebar", () => {
  afterEach(() => jest.clearAllMocks());

  it("memuat menu dan merender label SECTION + item leaf", async () => {
    mockMenusFetch();
    render(<Sidebar appId={4} />);

    expect(await screen.findByText("Dashboard BOK")).toBeInTheDocument();
    expect(screen.getByText("Utama")).toBeInTheDocument(); // section label
    expect(screen.getByText("Summary Dashboard")).toBeInTheDocument(); // expandable
    // fetch dipanggil dengan appId
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/catalog/menus",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("memanggil onLoaded dengan leaf pertama", async () => {
    mockMenusFetch();
    const onLoaded = jest.fn();
    render(<Sidebar appId={4} onLoaded={onLoaded} />);
    await waitFor(() =>
      expect(onLoaded).toHaveBeenCalledWith(
        expect.objectContaining({ menuCode: "BOK_DASHBOARD" }),
      ),
    );
  });

  it("klik item leaf memanggil onSelect", async () => {
    mockMenusFetch();
    const onSelect = jest.fn();
    render(<Sidebar appId={4} onSelect={onSelect} />);
    const item = await screen.findByText("Dashboard BOK");
    act(() => item.click());
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ menuCode: "BOK_DASHBOARD" }),
    );
  });

  it("node ber-child bisa di-expand untuk menampilkan submenu", async () => {
    mockMenusFetch();
    render(<Sidebar appId={4} />);
    const parent = await screen.findByText("Summary Dashboard");
    // Submenu auto-opened menuju leaf pertama? leaf pertama = BOK_DASHBOARD,
    // jadi Summary belum tentu terbuka. Klik untuk toggle.
    act(() => parent.click());
    expect(await screen.findByText("Level VA")).toBeInTheDocument();
  });

  it("menampilkan AIGovtech setelah Dashboard BOK diklik", async () => {
    mockMenusFetch();
    const onSelect = jest.fn();
    render(<Sidebar appId={4} onSelect={onSelect} />);

    expect(await screen.findByText("Dashboard BOK")).toBeInTheDocument();
    expect(screen.queryByText("AIGovtech")).not.toBeInTheDocument();

    act(() => screen.getByText("Dashboard BOK").click());
    const chatbotMenu = await screen.findByText("AIGovtech");
    act(() => chatbotMenu.click());

    expect(onSelect).toHaveBeenLastCalledWith(
      expect.objectContaining({
        menuCode: "AIGOVTECH_CHAT",
        menuName: "AIGovtech",
      }),
    );
  });

  it("menampilkan error saat fetch gagal", async () => {
    mockMenusFetch(false, null);
    render(<Sidebar appId={4} />);
    expect(await screen.findByText(/gagal memuat menu/i)).toBeInTheDocument();
  });
});
