import { render, screen, act, waitFor } from "@testing-library/react";
import LogoutButton from "./LogoutButton";

const replace = jest.fn();
const refresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
}));

describe("LogoutButton", () => {
  beforeEach(() => {
    replace.mockReset();
    refresh.mockReset();
    global.fetch = jest.fn().mockResolvedValue({ ok: true }) as unknown as typeof fetch;
  });

  it("menampilkan tombol Keluar", () => {
    render(<LogoutButton />);
    expect(screen.getByRole("button", { name: /keluar/i })).toBeInTheDocument();
  });

  it("klik memanggil logout API lalu redirect ke /login", async () => {
    render(<LogoutButton />);
    act(() => screen.getByRole("button", { name: /keluar/i }).click());
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/auth/logout",
      expect.objectContaining({ method: "POST" }),
    );
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(refresh).toHaveBeenCalled();
  });
});
