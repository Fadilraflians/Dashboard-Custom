# Integrasi Login Database (B1-penuh) — AUTH_SYSTEM

Login shell diverifikasi ke skema Oracle `AUTH_SYSTEM.MASTER_USER`
(username + password bcrypt + OTP/TOTP). Diaktifkan lewat flag `AUTH_SOURCE=db`.
Saat `AUTH_SOURCE=ifp` (default), login lama lewat gateway IFP tetap jalan —
flag ini saklar untuk rollback instan tanpa mengubah kode.

> Jalur chat/analisis AI TIDAK diubah. Yang bertambah hanya login + penanda admin.

## Alur login (option X: OTP wajib untuk semua akun)

```
1) POST /api/auth/login { username, password }   (keduanya RSA FE-encrypted)
   shell: AUTH_SOURCE=db -> verifyDbPassword (bcrypt.compare vs PASSWORD_HASH)
   -> balas { mfaRequired: "totp" }
2) POST /api/auth/verify-otp { username, otp }
   shell: verifyDbTotpAndBuildUser (otplib verify vs TOTP_SECRET)
   -> createSession(user) dengan isAdmin + ministryCode, set cookie HttpOnly
3) MFE memanggil GET /api/ai/context -> balas { tenant, ..., isAdmin }
   custom-dashboard menyembunyikan tombol Detail/Member bila isAdmin=false
```

## File yang berubah di shell

| File | Peran |
|------|-------|
| `src/lib/authDb.ts` | Pool Oracle AUTH_SYSTEM + `findAuthUserByUsername` + `ministryToOrganization` + `isDbAuthEnabled()` |
| `src/lib/dbAuth.ts` | `verifyDbPassword` (bcrypt), `verifyDbTotp`/`verifyDbTotpAndBuildUser` (otplib), `buildSessionUserFromRow`, `isAdminSession` |
| `src/lib/session.ts` | `SessionUser` +`isAdmin?` +`ministryCode?` |
| `src/app/api/auth/login/route.ts` | Jalur DB di belakang flag (verifikasi password) |
| `src/app/api/auth/verify-otp/route.ts` | Jalur DB di belakang flag (verifikasi OTP + buat sesi) |
| `src/app/api/ai/context/route.ts` | Mengembalikan `isAdmin` ke MFE |

## File yang berubah di custom-dashboard

| File | Peran |
|------|-------|
| `src/app/custom-dashboard/page.tsx` | `TenantContext.isAdmin`, konstanta `isAdmin`, gating 2 tombol Detail + overlay Detail/Member |

## Pemetaan MINISTRY_CODE -> tenant

| MINISTRY_CODE | organizationCode | org id | tenant AI |
|---------------|------------------|--------|-----------|
| KEMENKEU | KEMENKEU | 2 | kemenkeu (DATA_ECOMMERS) |
| FASHION / KEMENKES | KEMENKES | 1 | fashion (FASHION_SALES) |

## Langkah menjalankan (urut)

1. **DBA** jalankan `00_create_schema_DBA_ONLY.sql` (ganti password skema).
2. Sebagai `AUTH_SYSTEM`: `10_create_tables.sql`, lalu `15_seed.sql`.
3. Generate kredensial 4 akun:
   ```powershell
   # edit dulu password di tools/generate-credentials.cjs
   $env:NODE_PATH = "e:\BNI MagangHub\Dasboard\AiGovtech\node_modules"
   node ../AUTH_SYSTEM/tools/generate-credentials.cjs
   ```
   Jalankan blok `UPDATE` hasilnya sebagai `AUTH_SYSTEM`. Daftarkan otpauth URL
   tiap akun ke Google Authenticator.
4. (Opsional) `20_grants.sql` bila backend pakai akun terpisah.
5. Set env shell: `AUTH_SOURCE=db` + `AUTH_DB_*` (lihat `.env.example`).
6. Restart shell. Login pakai salah satu dari 4 akun + OTP dari authenticator.
7. Rollback kapan saja: set `AUTH_SOURCE=ifp` dan restart.

## Dependency baru di shell
`oracledb`, `bcryptjs`, `otplib@12`, `@types/oracledb` (sudah terpasang via pnpm).

## Catatan verifikasi
- Type-check shell & custom-dashboard: lolos.
- Logika bcrypt + TOTP: diuji runtime (match benar/salah sesuai harapan).
- 3 test shell yang gagal (`clientCrypto`, `Sidebar`) bersifat pre-existing,
  tidak menyentuh modul auth DB ini.
- Belum ada endpoint "Member/Hak Akses" nyata (UI statis). Saat endpoint itu
  dibuat, pasang guard admin di proxy `gateway/[app]/[...path]/route.ts`
  memakai `isAdminSession`, jangan di jalur chat.
