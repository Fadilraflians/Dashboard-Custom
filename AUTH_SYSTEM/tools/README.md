# tools/ — alat bantu kredensial AUTH_SYSTEM

## generate-credentials.cjs

Menghasilkan hash bcrypt + secret TOTP untuk 4 akun dan mencetak blok SQL
`UPDATE` siap tempel ke `MASTER_USER`. Tidak menyentuh database.

### Prasyarat
`bcryptjs` dan `otplib@12` terpasang di folder `AiGovtech` (sudah dilakukan).

### Cara pakai
1. Buka `generate-credentials.cjs`, ganti nilai `password` tiap akun di array
   `ACCOUNTS` dengan password asli yang kuat. Atur `enableTotp` (true/false).
2. Jalankan dari folder AiGovtech:
   ```powershell
   $env:NODE_PATH = "e:\BNI MagangHub\Dasboard\AiGovtech\node_modules"
   node ../AUTH_SYSTEM/tools/generate-credentials.cjs
   ```
3. Salin output:
   - **Blok SQL UPDATE** → jalankan sebagai user `AUTH_SYSTEM` SETELAH `15_seed.sql`.
   - **otpauth URL / secret** → daftarkan ke Google Authenticator / Authy untuk
     akun yang OTP-nya aktif (admin).

### Urutan eksekusi penuh (oleh DBA / pemilik skema)
```
00_create_schema_DBA_ONLY.sql   (sebagai DBA)
10_create_tables.sql            (sebagai AUTH_SYSTEM)
15_seed.sql                     (sebagai AUTH_SYSTEM — insert 4 akun, hash placeholder)
<output UPDATE dari generate-credentials.cjs>  (sebagai AUTH_SYSTEM — isi hash & secret asli)
20_grants.sql                   (sebagai AUTH_SYSTEM — bila pakai akun backend terpisah)
```

### Keamanan
- Password mentah hanya ada di dalam skrip saat dijalankan; tidak ditulis ke file.
- Jangan commit output generate (berisi hash & secret) ke git.
- Simpan secret TOTP di tempat aman; itu kunci OTP akun admin.
