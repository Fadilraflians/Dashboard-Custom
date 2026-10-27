# Panduan Lengkap — Aktifkan Login Database AUTH_SYSTEM

Ikuti berurutan. Setelah selesai, kamu bisa login shell pakai 4 akun DB + OTP.

---

## Ringkasan 4 akun

| Username | Password | Peran | Data |
|----------|----------|-------|------|
| `admin.kemenkeu` | `kemenkeuadmin1231` | Admin | KEMENKEU (e-commerce) |
| `user.kemenkeu`  | `kemenkeuuser1231`  | User  | KEMENKEU (e-commerce) |
| `admin.fashion`  | `fashionadmin1231`  | Admin | FASHION |
| `user.fashion`   | `fashionuser1231`   | User  | FASHION |

Secret OTP (daftarkan ke Google Authenticator):

| Username | Secret OTP |
|----------|-----------|
| `admin.kemenkeu` | `GNAWC4AOCEOG2FRF` |
| `user.kemenkeu`  | `ME3WW4B6MIOCODQN` |
| `admin.fashion`  | `EE7BGCYQFMIQIXLX` |
| `user.fashion`   | `CNGWQ3JHCNMHIKA7` |

---

## LANGKAH 1 — Buat skema (sudah selesai)

Skema `AUTH_SYSTEM` sudah ada di DBeaver (kamu sudah jalankan `00`). Ingat/catat
**password `AUTH_SYSTEM`** yang kamu ketik saat itu — dipakai di Langkah 4.

> Jika belum: buka `00_create_schema_DBA_ONLY.sql` sebagai user **SYSTEM**,
> ganti `<PASSWORD_KUAT_DI_SINI>`, jalankan.

## LANGKAH 2 — Buat tabel + akun + kredensial (SATU FILE)

1. Di DBeaver, pastikan koneksi aktif sebagai **AUTH_SYSTEM**
   (atau SYSTEM; file tidak menyebut nama skema, jadi objek dibuat di skema
   yang sedang aktif — pastikan itu AUTH_SYSTEM).
2. Menu **SQL Editor → Open SQL script** → pilih:
   `e:\BNI MagangHub\Dasboard\AUTH_SYSTEM\setup\run_all.sql`
3. Jalankan seluruh skrip: **Alt+X** (Execute SQL Script), bukan Ctrl+Enter.
4. Klik **Refresh** pada Tables. Harus muncul 6 tabel, dan `MASTER_USER`
   berisi 4 akun dengan PASSWORD_HASH terisi (bukan 'PENDING').

Verifikasi cepat — jalankan:
```sql
SELECT USERNAME, MINISTRY_CODE, IS_ADMIN, IS_TOTP_ENABLED,
       CASE WHEN PASSWORD_HASH='PENDING' THEN 'BELUM' ELSE 'OK' END AS PASS
  FROM MASTER_USER ORDER BY USERNAME;
```
Semua baris harus `PASS = OK` dan `IS_TOTP_ENABLED = 1`.

## LANGKAH 3 — Daftarkan OTP ke Google Authenticator

Untuk tiap akun: buka Google Authenticator → **+ → Enter a setup key** →
Account = username (mis. `admin.kemenkeu`), Key = secret OTP dari tabel di atas,
Type = Time based. Ulangi untuk 4 akun (atau cukup akun yang akan kamu pakai).

## LANGKAH 4 — Aktifkan flag di .env shell

Buka `e:\BNI MagangHub\Dasboard\shell\.env`, tambahkan / sesuaikan:
```
AUTH_SOURCE=db
AUTH_DB_USER=AUTH_SYSTEM
AUTH_DB_PASS=<password AUTH_SYSTEM dari Langkah 1>
AUTH_DB_HOST=localhost
AUTH_DB_PORT=1522
AUTH_DB_SERVICE=DASHBOARDDB
```
> `AUTH_DB_PASS` = password skema **AUTH_SYSTEM**, BUKAN password SYSTEM.

## LANGKAH 5 — Restart shell & login

1. Hentikan dev server shell yang berjalan, jalankan lagi: `pnpm dev`
   (di folder `shell`).
2. Buka portal, login:
   - Username + password (tabel akun di atas) → Masuk.
   - Masukkan 6 digit OTP dari Google Authenticator → Verifikasi.
3. Login sebagai **admin.\*** → tombol "Detail" dashboard muncul.
   Login sebagai **user.\*** → tombol "Detail" tidak muncul. (RBAC bekerja.)

## ROLLBACK (kembali ke login lama IFP)

Set `AUTH_SOURCE=ifp` di `.env` shell, restart. Login DB nonaktif; sistem lama
aktif lagi. Tidak perlu ubah kode.

---

## Troubleshooting

- **"name is already used by an existing object"** saat Langkah 2: tabel sudah
  pernah dibuat. Aman — bagian seed/update tetap jalan. Atau drop tabel dulu.
- **Login gagal "Gagal memverifikasi kredensial. Periksa koneksi database"**:
  cek `AUTH_DB_*` di `.env` (terutama `AUTH_DB_PASS`) dan Oracle menyala di
  localhost:1522/DASHBOARDDB.
- **"Kode OTP tidak valid"**: pastikan jam perangkat/server sinkron, dan secret
  yang didaftarkan cocok dengan username.
- **Tombol Detail tetap muncul untuk user biasa**: hard refresh browser; pastikan
  `/api/ai/context` mengembalikan `isAdmin:false` untuk akun user.

## Keamanan
- `run_all.sql` dan `16_set_credentials.sql` berisi hash + secret OTP → JANGAN
  commit ke git. Password mengikuti pola mudah ditebak; ganti untuk produksi
  (edit `tools/generate-credentials.cjs`, jalankan ulang, pakai output baru).
