"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import {
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  User,
  Lock,
  KeyRound,
  ShieldCheck,
  Landmark,
} from "lucide-react";
import { encryptFields } from "@/lib/clientCrypto";
import ThemeToggle from "@/components/ThemeToggle";
import styles from "./login.module.css";

type Step = "credentials" | "totp" | "enroll";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/landing";

  const [step, setStep] = useState<Step>("credentials");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  // Enrollment data (from totp/enroll-begin).
  const [enrollSecret, setEnrollSecret] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Render the QR code whenever an otpauth URI arrives.
  async function renderQr(otpauthUri: string) {
    try {
      const url = await QRCode.toDataURL(otpauthUri, {
        margin: 1,
        width: 220,
        color: { dark: "#0f172a", light: "#ffffff" },
      });
      setQrDataUrl(url);
    } catch {
      setQrDataUrl("");
    }
  }

  // Step 1: submit credentials. Branches on mfaRequired.
  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const enc = await encryptFields({ username, password });
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(enc),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.status !== "SUCCESS") {
        setError(data.message || "Login gagal");
        setLoading(false);
        return;
      }

      const mfa = data.data?.mfaRequired as "enroll" | "totp" | undefined;
      if (mfa === "enroll") {
        await beginEnrollment();
        return;
      }
      // Default: existing TOTP user. If the server sent an otpauth URI
      // (DB-auth flow), render it as a QR so the user can scan it into their
      // authenticator app before entering the 6-digit code.
      const otpauthUri = data.data?.otpauthUri as string | undefined;
      if (otpauthUri) {
        await renderQr(otpauthUri);
      } else {
        setQrDataUrl("");
      }
      setStep("totp");
      setInfo(data.data?.message || "Masukkan kode dari aplikasi authenticator.");
      setLoading(false);
    } catch {
      setError("Tidak dapat terhubung ke server");
      setLoading(false);
    }
  }

  // Enrollment begin: fetch secret + otpauth URI, render QR, move to enroll step.
  async function beginEnrollment() {
    setError(null);
    try {
      const enc = await encryptFields({ username, password });
      const res = await fetch("/api/auth/totp/enroll-begin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(enc),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.status !== "SUCCESS") {
        setError(data.message || "Gagal memulai pendaftaran TOTP");
        setStep("credentials");
        setLoading(false);
        return;
      }

      setEnrollSecret(data.data?.secret || "");
      if (data.data?.otpauthUri) {
        await renderQr(data.data.otpauthUri);
      }
      setStep("enroll");
      setInfo("Pindai QR dengan aplikasi authenticator, lalu masukkan kodenya.");
      setLoading(false);
    } catch {
      setError("Tidak dapat terhubung ke server");
      setStep("credentials");
      setLoading(false);
    }
  }

  // Enrollment confirm.
  async function handleEnrollConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const enc = await encryptFields({ username, password, code: otpCode });
      const res = await fetch("/api/auth/totp/enroll-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(enc),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.status !== "SUCCESS") {
        setError(data.message || "Kode tidak valid");
        setLoading(false);
        return;
      }

      // Enrollment issues no session/token — the user must sign in again.
      // Return to the credentials step with a success note and clear the
      // password so they re-enter it fresh.
      setStep("credentials");
      setPassword("");
      setOtpCode("");
      setEnrollSecret("");
      setQrDataUrl("");
      setError(null);
      setInfo(
        data.message ||
          "TOTP berhasil didaftarkan. Silakan login kembali menggunakan kode authenticator.",
      );
      setLoading(false);
    } catch {
      setError("Tidak dapat terhubung ke server");
      setLoading(false);
    }
  }

  // Verify OTP (existing TOTP user).
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const enc = await encryptFields({ username, otp: otpCode });
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(enc),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.status !== "SUCCESS") {
        setError(data.message || "OTP tidak valid");
        setLoading(false);
        return;
      }

      router.replace(callbackUrl);
      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server");
      setLoading(false);
    }
  }

  function handleForgotPassword(e: React.MouseEvent) {
    e.preventDefault();
    setError(null);
    setInfo(
      "Reset password: hubungi Administrator IT Kementerian/Lembaga Anda atau Helpdesk BNI untuk pembaruan kredensial.",
    );
  }

  function resetToCredentials() {
    setStep("credentials");
    setOtpCode("");
    setEnrollSecret("");
    setQrDataUrl("");
    setError(null);
    setInfo(null);
  }

  // Clear transient info when switching steps.
  useEffect(() => {
    setOtpCode("");
  }, [step]);

  const cardTitle =
    step === "credentials"
      ? "Selamat Datang di GovTech Access"
      : step === "enroll"
        ? "Daftarkan Authenticator"
        : "Verifikasi OTP";
  const cardSubtitle =
    step === "credentials"
      ? "Masuk untuk mengakses layanan digital pemerintah."
      : step === "enroll"
        ? "Aktifkan autentikasi dua faktor untuk akun Anda."
        : "Masukkan kode dari aplikasi authenticator Anda.";

  return (
    <div className={styles.wrapper}>
      {/* ============================================================
       * LEFT: Brand / story pane
       * ============================================================ */}
      <section className={styles.brandPane}>
        <div className={styles.brandPattern} />

        <div className={styles.brandTop}>
          <div className={styles.brandRow}>
            <div className={styles.logoPill}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-bni.webp"
                alt="BNI"
                className={styles.logoImg}
                width={44}
                height={30}
              />
              <span className={styles.logoDivider} />
              <span className={styles.logoText}>
                <span className={styles.logoTextTop}>GovTech</span>
                <span className={styles.logoTextSub}>Access Service</span>
              </span>
            </div>

            <span className={styles.statusChip}>
              <span className={styles.statusDot} />
              Gov Network Active
            </span>
          </div>

          <div className={styles.brandBody}>
            <span className={styles.eyebrow}>GovTech Access</span>
            <h1 className={styles.brandHeadline}>
              Satu Akses, Berbagai Layanan.
            </h1>
            <p className={styles.brandTagline}>
              One Access. Connected Government Services.
            </p>
            <p className={styles.brandText}>
              Akses berbagai aplikasi dan layanan digital Kementerian/Lembaga
              melalui satu portal yang aman, terstandarisasi, dan terintegrasi
              dalam ekosistem BNI GovTech.
            </p>
          </div>
        </div>

        <div className={styles.illustration}>
          <div className={styles.illustrationInner}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/login-web.svg"
              alt="Ilustrasi layanan digital pemerintah GovTech"
              className={styles.illoImage}
            />
          </div>
        </div>

        <div className={styles.brandFoot} />
      </section>

      {/* ============================================================
       * RIGHT: Form pane
       * ============================================================ */}
      <section className={styles.formPane}>
        <div className={styles.topBar}>
          <div className={styles.topStatus}>
            <span className={styles.topStatusDot} />
            <span>Sistem Operasional Normal</span>
          </div>
          <div className={styles.topRight}>
            <div className={styles.topVersion}>
              <span>Versi Portal</span>
              <span className={styles.versionTag}>v1.0.0</span>
            </div>
            <ThemeToggle />
          </div>
        </div>

        <div className={styles.cardWrap}>
          <div className={styles.card}>
            <div className={styles.stepFade} key={step}>
            <div className={styles.cardHead}>
              <div className={styles.cardMark}>
                {step === "credentials" ? (
                  <Landmark size={22} strokeWidth={2} />
                ) : (
                  <ShieldCheck size={22} strokeWidth={2} />
                )}
              </div>
              {step === "credentials" ? (
                <h1 className={styles.title}>
                  Selamat Datang di
                  <br />
                  <span className={styles.titleBrand}>GovTech Access</span>
                </h1>
              ) : (
                <h1 className={styles.title}>{cardTitle}</h1>
              )}
              <p className={styles.subtitle}>{cardSubtitle}</p>
            </div>

            {error && (
              <div role="alert" className={styles.alert}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            {!error && info && (
              <div className={`${styles.alert} ${styles.alertSuccess}`}>
                <CheckCircle2 size={16} />
                <span>{info}</span>
              </div>
            )}

            {/* ----- Step: credentials ----- */}
            {step === "credentials" && (
              <form onSubmit={handleCredentials} noValidate>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="username">
                    Username / User ID <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.inputWrap}>
                    <span className={styles.inputIcon}>
                      <User size={18} strokeWidth={1.8} />
                    </span>
                    <input
                      id="username"
                      type="text"
                      className={styles.input}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Masukkan username Anda"
                      autoComplete="username"
                      required
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="password">
                    Password <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.inputWrap}>
                    <span className={styles.inputIcon}>
                      <Lock size={18} strokeWidth={1.8} />
                    </span>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      className={`${styles.input} ${styles.inputPassword}`}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan password Anda"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={
                        showPassword
                          ? "Sembunyikan password"
                          : "Tampilkan password"
                      }
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <div className={styles.forgotRow}>
                    <button
                      type="button"
                      className={styles.forgot}
                      onClick={handleForgotPassword}
                    >
                      Lupa password?
                    </button>
                  </div>
                </div>

                <div className={styles.checkRow}>
                  <label className={styles.checkLabel}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span className={styles.checkText}>
                      Ingat saya pada perangkat ini
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  className={styles.submit}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className={styles.spin} />
                      Memverifikasi...
                    </>
                  ) : (
                    <>
                      Masuk
                      <ArrowRight size={16} className={styles.submitArrow} />
                    </>
                  )}
                </button>

                <div className={styles.secureBox}>
                  <CheckCircle2 size={18} className={styles.secureBoxIcon} />
                  <div>
                    <p className={styles.secureBoxTitle}>
                      Akses Digital yang Aman
                    </p>
                    <p className={styles.secureBoxText}>
                      Gunakan akun resmi Anda untuk mengakses layanan digital
                      pemerintah yang terintegrasi.
                    </p>
                  </div>
                </div>

                <div className={styles.helpdesk}>
                  <p className={styles.helpdeskText}>
                    Mengalami kendala saat masuk?
                    <button
                      type="button"
                      className={styles.helpdeskLink}
                      onClick={() => {
                        setError(null);
                        setInfo(
                          "Helpdesk BNI GovTech: 1500046 · govtech.support@bni.co.id · 24/7",
                        );
                      }}
                    >
                      Hubungi Helpdesk BNI
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* ----- Step: enroll (QR + confirm) ----- */}
            {step === "enroll" && (
              <form onSubmit={handleEnrollConfirm} noValidate>
                {qrDataUrl && (
                  <div className={styles.qrWrap}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrDataUrl}
                      alt="QR code TOTP"
                      className={styles.qrImage}
                      width={200}
                      height={200}
                    />
                  </div>
                )}

                {enrollSecret && (
                  <div className={styles.secretBox}>
                    <span className={styles.secretLabel}>
                      Atau masukkan kode ini secara manual
                    </span>
                    <code className={styles.secretCode}>{enrollSecret}</code>
                  </div>
                )}

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="enrollCode">
                    Kode Authenticator{" "}
                    <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.inputWrap}>
                    <span className={styles.inputIcon}>
                      <KeyRound size={18} strokeWidth={1.8} />
                    </span>
                    <input
                      id="enrollCode"
                      className={styles.input}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="Masukkan 6 digit kode"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className={styles.submit}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className={styles.spin} />
                      Memverifikasi...
                    </>
                  ) : (
                    <>
                      Konfirmasi &amp; Masuk
                      <ArrowRight size={16} className={styles.submitArrow} />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className={styles.backBtn}
                  onClick={resetToCredentials}
                >
                  ← Kembali ke login
                </button>
              </form>
            )}

            {/* ----- Step: totp (existing user) ----- */}
            {step === "totp" && (
              <form onSubmit={handleVerifyOtp} noValidate>
                {qrDataUrl && (
                  <>
                    <div className={styles.qrWrap}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrDataUrl}
                        alt="QR code untuk aplikasi authenticator"
                        className={styles.qrImage}
                        width={200}
                        height={200}
                      />
                    </div>
                    <p className={styles.subtitle} style={{ textAlign: "center", marginTop: 0 }}>
                      Scan QR ini dengan Google Authenticator / Authy, lalu masukkan
                      6 digit kode yang muncul.
                    </p>
                  </>
                )}

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="otp">
                    Kode OTP <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.inputWrap}>
                    <span className={styles.inputIcon}>
                      <KeyRound size={18} strokeWidth={1.8} />
                    </span>
                    <input
                      id="otp"
                      className={styles.input}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="Masukkan 6 digit OTP"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className={styles.submit}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className={styles.spin} />
                      Memverifikasi...
                    </>
                  ) : (
                    <>
                      Verifikasi
                      <ArrowRight size={16} className={styles.submitArrow} />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className={styles.backBtn}
                  onClick={resetToCredentials}
                >
                  ← Kembali ke login
                </button>
              </form>
            )}
            </div>
          </div>
        </div>

        <footer className={styles.footer}>
          <div>© {new Date().getFullYear()} GovTech Access · BNI GovTech</div>
          <div className={styles.footerLinks}>
            <button type="button" className={styles.footerLink}>
              Kebijakan Privasi
            </button>
            <span className={styles.dotSep}>•</span>
            <button type="button" className={styles.footerLink}>
              Bantuan
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
