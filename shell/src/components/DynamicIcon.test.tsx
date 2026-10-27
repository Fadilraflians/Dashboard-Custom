import { render } from "@testing-library/react";
import DynamicIcon from "./DynamicIcon";

describe("DynamicIcon", () => {
  it("merender ikon lucide dari nama kebab-case", () => {
    const { container } = render(<DynamicIcon name="layout-grid" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass("lucide-layout-grid");
  });

  it("memakai fallback saat nama kosong", () => {
    const { container } = render(
      <DynamicIcon name="" fallback="LayoutGrid" />,
    );
    const svg = container.querySelector("svg");
    expect(svg).toHaveClass("lucide-layout-grid");
  });

  it("memakai fallback saat nama tidak dikenal lucide", () => {
    const { container } = render(
      <DynamicIcon name="ikon-ngaco-xyz" fallback="Wallet" />,
    );
    const svg = container.querySelector("svg");
    expect(svg).toHaveClass("lucide-wallet");
  });

  it("meneruskan size sebagai atribut svg", () => {
    const { container } = render(<DynamicIcon name="wallet" size={30} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "30");
  });
});
