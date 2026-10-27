#!/usr/bin/env node
/**
 * generate-credentials.cjs
 * -------------------------------------------------------------------------
 * Alat bantu Tahap 1 (B1-penuh). Menghasilkan:
 *   1. Hash bcrypt untuk PASSWORD_HASH tiap akun.
 *   2. Secret TOTP (base32) + otpauth URL untuk didaftarkan ke
 *      Google Authenticator / Authy (hanya akun yang OTP-nya aktif).
 *   3. Blok SQL UPDATE siap tempel untuk mengisi MASTER_USER.
 *
 * Skrip ini TIDAK menyentuh database. Ia hanya mencetak nilai & SQL ke layar.
 * Password mentah hanya ada di dalam skrip ini sementara dijalankan, tidak
 * ditulis ke file apa pun.
 *
 * Cara pakai (dari folder AiGovtech yang punya bcryptjs & otplib):
 *   node ../AUTH_SYSTEM/tools/generate-credentials.cjs
 *
 * GANTI password di bawah sebelum dijalankan. Simpan output SQL-nya di tempat
 * aman; jangan commit hasil generate ke git.
 */

const bcrypt = require("bcryptjs");
const { authenticator } = require("otplib");

const BCRYPT_ROUNDS = 10;
const ISSUER = "AiGovtech";

// -------------------------------------------------------------------------
// GANTI nilai password di sini. username HARUS sama dengan yang di 15_seed.sql.
// enableTotp: true  -> OTP wajib, secret TOTP akan dibuat.
//             false -> tanpa OTP (TOTP_SECRET = NULL, IS_TOTP_ENABLED = 0).
// -------------------------------------------------------------------------
// Pilihan X: OTP wajib untuk SEMUA akun -> enableTotp: true untuk keempatnya.
// Pola password: <kementerian><peran>1231.
const ACCOUNTS = [
  { username: "admin.kemenkeu", password: "kemenkeuadmin1231", enableTotp: true },
  { username: "user.kemenkeu",  password: "kemenkeuuser1231",  enableTotp: true },
  { username: "admin.fashion",  password: "fashionadmin1231",  enableTotp: true },
  { username: "user.fashion",   password: "fashionuser1231",   enableTotp: true },
];

function sqlString(value) {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
}

async function main() {
  const lines = [];
  const enrollNotes = [];

  for (const acc of ACCOUNTS) {
    const passwordHash = await bcrypt.hash(acc.password, BCRYPT_ROUNDS);
    let totpSecret = null;
    if (acc.enableTotp) {
      totpSecret = authenticator.generateSecret(); // base32
      const otpauth = authenticator.keyuri(acc.username, ISSUER, totpSecret);
      enrollNotes.push(
        `  ${acc.username}\n    secret : ${totpSecret}\n    otpauth: ${otpauth}`,
      );
    }
    lines.push(
      `UPDATE MASTER_USER SET\n` +
        `    PASSWORD_HASH   = ${sqlString(passwordHash)},\n` +
        `    TOTP_SECRET     = ${sqlString(totpSecret)},\n` +
        `    IS_TOTP_ENABLED = ${acc.enableTotp ? 1 : 0},\n` +
        `    UPDATED_BY      = 'GENERATOR', UPDATED_TIME = SYSTIMESTAMP\n` +
        `  WHERE USERNAME = ${sqlString(acc.username)};`,
    );
  }

  console.log("\n===== SQL UPDATE (jalankan sebagai AUTH_SYSTEM setelah 15_seed.sql) =====\n");
  console.log(lines.join("\n\n"));
  console.log("\nCOMMIT;\n");

  if (enrollNotes.length) {
    console.log("===== TOTP enrollment (daftarkan ke Google Authenticator) =====");
    console.log("Scan otpauth URL sebagai QR, atau masukkan secret base32 manual.\n");
    console.log(enrollNotes.join("\n\n"));
    console.log("");
  }

  console.log("Catatan: jangan commit output ini. Password mentah tidak disimpan ke file.");
}

main().catch((err) => {
  console.error("Gagal generate kredensial:", err);
  process.exit(1);
});
