import { render, screen } from "@testing-library/react";
import HomeButton from "./HomeButton";
import { usePathname } from "next/navigation";

jest.mock("next/navigation", () => ({ usePathname: jest.fn() }));
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockPathname = usePathname as jest.Mock;

describe("HomeButton", () => {
  it("menampilkan 'Daftar Aplikasi' saat di dalam /app", () => {
    mockPathname.mockReturnValue("/app/dashboard");
    render(<HomeButton />);
    expect(screen.getByText("Daftar Aplikasi")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/landing");
  });

  it("tidak merender di halaman landing", () => {
    mockPathname.mockReturnValue("/landing");
    const { container } = render(<HomeButton />);
    expect(container).toBeEmptyDOMElement();
  });
});
