/// <reference types="jest" />

import { render, screen } from "@testing-library/react";
import CountUp from "./CountUp";

/** Force reduced-motion so CountUp jumps straight to the final value. */
function mockReducedMotion(reduce: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: reduce,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
  });
}

describe("CountUp", () => {
  it("menampilkan nilai akhir langsung saat prefers-reduced-motion", () => {
    mockReducedMotion(true);
    render(<CountUp value={124} />);
    expect(screen.getByText("124")).toBeInTheDocument();
  });

  it("menampilkan 0 untuk nilai 0 (tanpa animasi)", () => {
    mockReducedMotion(true);
    render(<CountUp value={0} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("memformat ribuan sesuai locale id-ID saat format=true", () => {
    mockReducedMotion(true);
    render(<CountUp value={1234} format />);
    expect(screen.getByText("1.234")).toBeInTheDocument();
  });

  it("tidak memformat saat format=false", () => {
    mockReducedMotion(true);
    render(<CountUp value={1234} format={false} />);
    expect(screen.getByText("1234")).toBeInTheDocument();
  });
});
