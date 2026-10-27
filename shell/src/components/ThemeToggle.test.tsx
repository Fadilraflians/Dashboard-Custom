import { render, screen, act } from "@testing-library/react";
import ThemeToggle from "./ThemeToggle";

function mockMatchMedia(darkPref: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: jest.fn().mockImplementation((q: string) => ({
      matches: darkPref,
      media: q,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
  });
}

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it("default ke light bila tidak ada preferensi tersimpan", () => {
    mockMatchMedia(false);
    render(<ThemeToggle />);
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it("mengikuti preferensi sistem dark saat pertama load", () => {
    mockMatchMedia(true);
    render(<ThemeToggle />);
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("toggle mengubah tema dan menyimpan ke localStorage", () => {
    mockMatchMedia(false);
    render(<ThemeToggle />);
    act(() => screen.getByRole("button").click());
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem("rnd-theme")).toBe("dark");

    act(() => screen.getByRole("button").click());
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(localStorage.getItem("rnd-theme")).toBe("light");
  });

  it("memakai tema tersimpan dari localStorage", () => {
    mockMatchMedia(false);
    localStorage.setItem("rnd-theme", "dark");
    render(<ThemeToggle />);
    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});
