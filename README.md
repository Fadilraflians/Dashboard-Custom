# Dashboard Custom — Monorepo MFE (BNI GovTech)

Monorepo micro-frontend untuk portal dashboard pemerintahan, dengan chatbot
analitik AiGovtech dan sistem RBAC login database (AUTH_SYSTEM).

## Folder utama

| Folder | Isi |
|--------|-----|
| `shell` | Host Next.js (login, sesi, gateway, landing). Login DB via skema AUTH_SYSTEM (flag `AUTH_SOURCE=db`). |
| `shared` | Library komponen UI via Module Federation (port 9000). |
| `custom-dashboard` | MFE dashboard kustom + chatbot AiGovtech (port 3025). Detail dashboard + manajemen member (Step 2). |
| `AiGovtech` | Backend chatbot (Express + Oracle + Ollama, port 3125). Text-to-SQL read-only. |
| `AUTH_SYSTEM` | Skrip DDL + tooling skema RBAC Oracle (user/role/application/widget/mapping + dashboard member). |

## Autentikasi (RBAC B1)

- `AUTH_SOURCE=db` → login diverifikasi ke `AUTH_SYSTEM.MASTER_USER`
  (username + password bcrypt + OTP/TOTP). Admin (`IS_ADMIN=1`) melihat tombol
  Detail/Member dashboard; user biasa tidak.
- `AUTH_SOURCE=ifp` → login lama lewat gateway IFP (default/rollback).

Lihat `AUTH_SYSTEM/INTEGRATION.md` dan `AUTH_SYSTEM/setup/PANDUAN.md` untuk
langkah menjalankan skema dan mengaktifkan login database.

## Menjalankan (ringkas)

Tiap folder punya `package.json` sendiri. Umumnya:

```bash
pnpm install
pnpm dev
```

Buat file `.env` di tiap service dari `.env.example` yang tersedia (nilai
rahasia TIDAK disertakan di repo).

## Catatan keamanan

File `.env`, `.env.local`, kunci RSA, dan `AUTH_SYSTEM/16_set_credentials.sql`
sengaja di-ignore (lihat `.gitignore`). Jangan pernah commit kredensial.
