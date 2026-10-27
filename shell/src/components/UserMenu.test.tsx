import { render, screen, act, waitFor } from "@testing-library/react";
import UserMenu from "./UserMenu";

const replace = jest.fn();
const refresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
}));

describe("UserMenu", () => {
  beforeEach(() => {
    replace.mockReset();
    refresh.mockReset();
    global.fetch = jest.fn().mockResolvedValue({ ok: true }) as unknown as typeof fetch;
  });

  it("menampilkan inisial, nama, dan email", () => {
    render(<UserMenu name="Irfan Rabbani" email="irfan@bni.co.id" />);
    expect(screen.getByText("Irfan Rabbani")).toBeInTheDocument();
    expect(screen.getByText("irfan@bni.co.id")).toBeInTheDocument();
    expect(screen.getByText("IR")).toBeInTheDocument(); // initials
  });

  it("dropdown tertutup secara default, terbuka saat diklik", () => {
    render(<UserMenu name="Irfan" />);
    expect(screen.queryByRole("menuitem")).not.toBeInTheDocument();
    act(() => screen.getByRole("button", { name: /irfan/i }).click());
    expect(screen.getByRole("menuitem", { name: /keluar/i })).toBeInTheDocument();
  });

  it("klik Keluar memanggil logout API lalu redirect ke /login", async () => {
    render(<UserMenu name="Irfan" />);
    act(() => screen.getByRole("button", { name: /irfan/i }).click());
    act(() => screen.getByRole("menuitem", { name: /keluar/i }).click());

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/auth/logout",
      expect.objectContaining({ method: "POST" }),
    );
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(refresh).toHaveBeenCalled();
  });
});
