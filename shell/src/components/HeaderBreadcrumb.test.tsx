import { render, screen } from "@testing-library/react";
import HeaderBreadcrumb from "./HeaderBreadcrumb";
import { useAppChrome } from "@/context/AppChromeContext";

jest.mock("@/context/AppChromeContext", () => ({
  useAppChrome: jest.fn(),
}));
// next/link renders a plain anchor in tests.
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockUseAppChrome = useAppChrome as jest.Mock;

describe("HeaderBreadcrumb", () => {
  it("tidak merender apa pun bila tanpa breadcrumb & tanpa sidebar (landing)", () => {
    mockUseAppChrome.mockReturnValue({
      breadcrumb: null,
      hasSidebar: false,
      toggleCollapsed: jest.fn(),
    });
    const { container } = render(<HeaderBreadcrumb />);
    expect(container).toBeEmptyDOMElement();
  });

  it("menampilkan Home + menu aktif saat ada breadcrumb", () => {
    mockUseAppChrome.mockReturnValue({
      breadcrumb: "Dashboard BOK",
      hasSidebar: true,
      toggleCollapsed: jest.fn(),
    });
    render(<HeaderBreadcrumb />);
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Dashboard BOK")).toBeInTheDocument();
  });

  it("hamburger memanggil toggleCollapsed", () => {
    const toggle = jest.fn();
    mockUseAppChrome.mockReturnValue({
      breadcrumb: "X",
      hasSidebar: true,
      toggleCollapsed: toggle,
    });
    render(<HeaderBreadcrumb />);
    screen.getByLabelText(/sidebar/i).click();
    expect(toggle).toHaveBeenCalledTimes(1);
  });
});
