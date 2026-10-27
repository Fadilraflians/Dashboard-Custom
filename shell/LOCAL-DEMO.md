# Login demo lokal

Mode ini hanya aktif saat `NODE_ENV=development` dan `LOCAL_DEMO_AUTH=true`.
Login demo membuat sesi di Redis lokal, lalu memakai katalog contoh agar daftar
portal dan menu dapat dibuka tanpa akun atau database Oracle. Token demo ditolak
oleh gateway shell sehingga tidak digunakan untuk mengakses backend.

Kredensial default (di `shell/.env.local`, yang diabaikan Git):

- Username: `demo`
- Password: `Demo123!`
- OTP: `123456`

Sudah ada Valkey/Redis lokal di `127.0.0.1:6379`? Langsung jalankan shell.
Kalau belum ada, jalankan Redis dari folder `shell`:

```powershell
docker compose -f docker-compose.demo.yml up -d
```

Lalu jalankan shell seperti biasa (`pnpm dev`). Pastikan MFE BOK dan shared UI
yang ingin dibuka juga sedang berjalan pada port yang dikonfigurasi di
`.env`. Katalog demo menampilkan menu yang memiliki pasangan `MFE_BOK_*_SCOPE`
dan `MFE_BOK_*_URL` di env lokal.

Mode demo hanya menyediakan data navigasi. Operasi yang memerlukan data BE
akan gagal dengan sengaja; tidak ada data produksi yang dibaca atau diubah.
Untuk kembali ke login BE, ubah `LOCAL_DEMO_AUTH=false` atau hapus nilainya
dari `.env.local`, lalu restart shell.
