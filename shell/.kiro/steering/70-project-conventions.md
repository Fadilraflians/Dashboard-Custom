# Konvensi Project (rnd-template-*)

Aturan dasar coding + techstack. Disalin ke tiap repo; sinkronkan jika diubah.
Pelengkap steering lain — tidak menduplikasi isinya.

## Prinsip kode

- Ikuti gaya codebase yang sudah ada. Jangan memperkenalkan pola/alat baru tanpa
  alasan kuat.
- Utamakan KESEDERHANAAN & keterbacaan. JANGAN overengineering.
- Komentar singkat dan menjelaskan ALASAN (why), bukan menarasikan kode.
- (Detail lint/SonarQube/test di `50-code-quality.md` & `60-testing.md`.)

## Techstack & urutan pilihan

- **Webpack + React + TypeScript** adalah engine frontend (shell: Next.js).
  Jangan ganti engine tanpa diskusi (lihat catatan Vite/webpack bila relevan).
- **Komponen UI — urutan prioritas:**
  1. Pakai komponen dari **shared remote** (`sharedUi`) jika sudah ada
     (lihat `10-shared-components.md`).
  2. Jika belum ada → pakai **shadcn/ui (Radix UI)**.
  3. Jika shadcn tidak memungkinkan → buat komponen sendiri dengan pola yang
     konsisten.
- **Styling — urutan prioritas:**
  1. **TailwindCSS** (class prefix `tw-` untuk isolasi antar MFE).
  2. Baru `*.module.css` bila Tailwind tidak praktis (mis. layout struktural
     kompleks yang sudah ada).
- Ikon: **lucide-react** (bukan PrimeIcons — sudah dihapus dari project).

## Sebelum mengubah

- Baca steering yang relevan di `.kiro/steering/` lebih dulu dan ikuti.
- Jika instruksi steering saling bertentangan, SAMPAIKAN konfliknya dan minta
  klarifikasi — jangan diam-diam memilih.
- Ikuti pola yang sudah ada; jalankan test terkait bila memungkinkan.
