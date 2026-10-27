import { render, screen } from "@testing-library/react";
import HeaderBrand from "./HeaderBrand";
import { useAppChrome } from "@/context/AppChromeContext";

jest.mock("@/context/AppChromeContext", () => ({
  useAppChrome: jest.fn(),
}));

const mockUseAppChrome = useAppChrome as jest.Mock;

describe("HeaderBrand", () => {
  it("menampilkan logo GovTech saat tidak ada appBrand (landing)", () => {
    mockUseAppChrome.mockReturnValue({ appBrand: null });
    render(<HeaderBrand />);
    expect(screen.getByText("GovTech")).toBeInTheDocument();
    expect(screen.getByText("Access Service")).toBeInTheDocument();
  });

  it("menampilkan identitas app saat appBrand di-set", () => {
    mockUseAppChrome.mockReturnValue({
      appBrand: { name: "Dashboard BOK", org: "Kemenkes · BNI", icon: "" },
    });
    render(<HeaderBrand />);
    expect(screen.getByText("Dashboard BOK")).toBeInTheDocument();
    expect(screen.getByText("Kemenkes · BNI")).toBeInTheDocument();
    // logo pill tidak muncul
    expect(screen.queryByText("Access Service")).not.toBeInTheDocument();
  });

  it("merender img ikon app saat icon tersedia", () => {
    mockUseAppChrome.mockReturnValue({
      appBrand: { name: "BOK", icon: "http://x/icon.svg" },
    });
    render(<HeaderBrand />);
    const img = screen.getByAltText("BOK") as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toContain("/icon.svg");
  });
});
