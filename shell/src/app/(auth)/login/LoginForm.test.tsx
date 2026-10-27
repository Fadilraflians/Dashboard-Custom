import { render, screen, act, waitFor, fireEvent } from "@testing-library/react";
import LoginForm from "./LoginForm";

const replace = jest.fn();
const refresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
  useSearchParams: () => new URLSearchParams(""),
}));

// Encrypt is identity in tests (pass field values through unchanged).
jest.mock("@/lib/clientCrypto", () => ({
  encryptFields: jest.fn(async (f: Record<string, string>) => f),
}));

// ThemeToggle touches matchMedia/localStorage; stub it out.
jest.mock("@/components/ThemeToggle", () => ({
  __esModule: true,
  default: () => <button aria-label="tema" />,
}));

// QRCode (used in enroll step) — avoid real canvas work.
jest.mock("qrcode", () => ({ toDataURL: jest.fn(async () => "data:image/png;base64,AAA") }));

function typeCreds() {
  fireEvent.change(screen.getByPlaceholderText(/username/i), {
    target: { value: "irfan" },
  });
  fireEvent.change(screen.getByPlaceholderText(/password/i), {
    target: { value: "secret" },
  });
}

describe("LoginForm", () => {
  beforeEach(() => {
    replace.mockReset();
    refresh.mockReset();
  });

  it("menampilkan judul GovTech Access dan field login", () => {
    render(<LoginForm />);
    // "GovTech Access" muncul di beberapa tempat (judul + brand pane); pastikan
    // minimal satu ada.
    expect(screen.getAllByText("GovTech Access").length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
  });

  it("toggle password mengubah type input", () => {
    render(<LoginForm />);
    const pwd = screen.getByPlaceholderText(/password/i) as HTMLInputElement;
    expect(pwd.type).toBe("password");
    act(() => screen.getByLabelText(/tampilkan password/i).click());
    expect(pwd.type).toBe("text");
  });

  it("mfaRequired=totp → pindah ke step verifikasi OTP", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "SUCCESS",
        data: { mfaRequired: "totp", message: "Masukkan kode" },
      }),
    }) as unknown as typeof fetch;

    render(<LoginForm />);
    typeCreds();
    fireEvent.submit(screen.getByRole("button", { name: /masuk/i }).closest("form")!);

    expect(await screen.findByText("Verifikasi OTP")).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/auth/login",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("mfaRequired=enroll → memulai enrollment (QR)", async () => {
    const calls: string[] = [];
    global.fetch = jest.fn().mockImplementation((url: string) => {
      calls.push(url);
      if (url === "/api/auth/login") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: "SUCCESS", data: { mfaRequired: "enroll" } }),
        });
      }
      if (url === "/api/auth/totp/enroll-begin") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            status: "SUCCESS",
            data: { secret: "ABC123", otpauthUri: "otpauth://x" },
          }),
        });
      }
      return Promise.resolve({ ok: false, json: async () => ({}) });
    }) as unknown as typeof fetch;

    render(<LoginForm />);
    typeCreds();
    fireEvent.submit(screen.getByRole("button", { name: /masuk/i }).closest("form")!);

    expect(await screen.findByText("Daftarkan Authenticator")).toBeInTheDocument();
    expect(screen.getByText("ABC123")).toBeInTheDocument(); // manual secret
    expect(calls).toContain("/api/auth/totp/enroll-begin");
  });

  it("menampilkan pesan error saat login gagal", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ status: "ERROR", message: "Kredensial salah" }),
    }) as unknown as typeof fetch;

    render(<LoginForm />);
    typeCreds();
    fireEvent.submit(screen.getByRole("button", { name: /masuk/i }).closest("form")!);

    expect(await screen.findByText("Kredensial salah")).toBeInTheDocument();
  });
});
