import { render, screen, act } from "@testing-library/react";
import { AppChromeProvider, useAppChrome } from "./AppChromeContext";

function Probe() {
  const c = useAppChrome();
  return (
    <div>
      <span data-testid="crumb">{c.breadcrumb ?? "-"}</span>
      <span data-testid="collapsed">{String(c.collapsed)}</span>
      <span data-testid="hasSidebar">{String(c.hasSidebar)}</span>
      <span data-testid="brand">{c.appBrand?.name ?? "-"}</span>
      <button onClick={() => c.setBreadcrumb("Dashboard")}>crumb</button>
      <button onClick={() => c.toggleCollapsed()}>toggle</button>
      <button onClick={() => c.setHasSidebar(true)}>sidebar</button>
      <button onClick={() => c.setAppBrand({ name: "BOK" })}>brand</button>
    </div>
  );
}

describe("AppChromeContext", () => {
  it("menyediakan nilai default", () => {
    render(
      <AppChromeProvider>
        <Probe />
      </AppChromeProvider>,
    );
    expect(screen.getByTestId("crumb")).toHaveTextContent("-");
    expect(screen.getByTestId("collapsed")).toHaveTextContent("false");
    expect(screen.getByTestId("hasSidebar")).toHaveTextContent("false");
    expect(screen.getByTestId("brand")).toHaveTextContent("-");
  });

  it("setter memperbarui state", () => {
    render(
      <AppChromeProvider>
        <Probe />
      </AppChromeProvider>,
    );
    act(() => screen.getByText("crumb").click());
    act(() => screen.getByText("toggle").click());
    act(() => screen.getByText("sidebar").click());
    act(() => screen.getByText("brand").click());

    expect(screen.getByTestId("crumb")).toHaveTextContent("Dashboard");
    expect(screen.getByTestId("collapsed")).toHaveTextContent("true");
    expect(screen.getByTestId("hasSidebar")).toHaveTextContent("true");
    expect(screen.getByTestId("brand")).toHaveTextContent("BOK");
  });

  it("useAppChrome melempar error di luar provider", () => {
    // Silence the expected React error log for this assertion.
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/AppChromeProvider/);
    spy.mockRestore();
  });
});
