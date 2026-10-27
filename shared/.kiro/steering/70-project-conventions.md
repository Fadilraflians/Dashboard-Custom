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

- **Webpack + React + TypeScript** adalah engine frontend remote.
- Komponen di shared adalah building block presentasional (lihat
  `10-shared-components.md` & `20-shared.md`). Bila membuat komponen baru di
  sini, pakai **shadcn/ui (Radix UI)**; jika tidak memungkinkan, buat sendiri
  dengan pola konsisten.
- **Styling — urutan prioritas:**
  1. **TailwindCSS** (class prefix `tw-` untuk isolasi antar MFE).
  2. Baru `*.module.css` bila Tailwind tidak praktis.
- Ikon: **lucide-react** (bukan PrimeIcons — sudah dihapus dari project).

## Sebelum mengubah

- Baca steering yang relevan di `.kiro/steering/` lebih dulu dan ikuti.
- Jika instruksi steering saling bertentangan, SAMPAIKAN konfliknya dan minta
  klarifikasi — jangan diam-diam memilih.
- Ikuti pola yang sudah ada; jalankan test terkait bila memungkinkan.
