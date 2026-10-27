import React from "react";
import { render, screen } from "@testing-library/react";
import TotalPendapatanCard from "./TotalPendapatanCard";

describe("TotalPendapatanCard", () => {
  it("menampilkan label dan nilai terformat sebagai Rupiah", () => {
    render(<TotalPendapatanCard value={10000} />);
    expect(screen.getByText("Total Pendapatan")).toBeInTheDocument();
    expect(screen.getByText(/Rp.*10\.000/)).toBeInTheDocument();
  });

  it("menampilkan delta positif dengan warna sukses (naik)", () => {
    render(<TotalPendapatanCard value={5000} delta={12.4} />);
    const delta = screen.getByText(/12\.4%/);
    expect(delta).toBeInTheDocument();
    // Ikon lucide (SVG) + warna sukses menandakan tren naik.
    expect(delta.className).toContain("tw-text-success");
  });

  it("menampilkan delta negatif dengan warna danger (turun)", () => {
    render(<TotalPendapatanCard value={5000} delta={-3.2} />);
    const delta = screen.getByText(/3\.2%/);
    expect(delta).toBeInTheDocument();
    expect(delta.className).toContain("tw-text-danger");
  });

  it("menyembunyikan nilai saat loading (menampilkan shimmer)", () => {
    const { container } = render(
      <TotalPendapatanCard value={9999} loading />,
    );
    // Nilai tidak dirender saat loading.
    expect(screen.queryByText(/Rp.*9\.999/)).not.toBeInTheDocument();
    // Ada elemen shimmer (aria-hidden).
    expect(container.querySelector("[aria-hidden]")).toBeInTheDocument();
  });

  it("tidak menampilkan delta jika prop delta tidak diberikan", () => {
    render(<TotalPendapatanCard value={1000} />);
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });
});
