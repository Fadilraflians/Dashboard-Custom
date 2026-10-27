-- =====================================================================
-- 00_create_schema_DBA_ONLY.sql
-- ---------------------------------------------------------------------
-- JALANKAN BAGIAN INI SEBAGAI DBA (akun SYSTEM/SYS), BUKAN akun aplikasi.
--
-- Akun aplikasi (FASHION_APP, KEMENKEUDB) TIDAK punya hak CREATE USER,
-- jadi pembuatan skema harus dilakukan oleh DBA satu kali saja.
--
-- Ganti '<PASSWORD_KUAT_DI_SINI>' dengan password yang kuat dan simpan
-- di tempat rahasia (jangan commit ke git).
-- =====================================================================

-- 1. Buat skema sentral (di Oracle, "skema" = "user").
CREATE USER AUTH_SYSTEM IDENTIFIED BY "<PASSWORD_KUAT_DI_SINI>"
  DEFAULT TABLESPACE USERS
  TEMPORARY TABLESPACE TEMP
  QUOTA UNLIMITED ON USERS;

-- 2. Hak minimum yang dibutuhkan skema ini untuk mengelola tabelnya sendiri.
GRANT CREATE SESSION   TO AUTH_SYSTEM;
GRANT CREATE TABLE     TO AUTH_SYSTEM;
GRANT CREATE SEQUENCE  TO AUTH_SYSTEM;
GRANT CREATE VIEW      TO AUTH_SYSTEM;

-- 3. (Opsional) Jika backend akan konek memakai akun aplikasi terpisah,
--    buat akun read/write khusus dan beri hak SELECT/INSERT/UPDATE/DELETE
--    ke tabel AUTH_SYSTEM setelah tabel dibuat (lihat 20_grants.sql).
--    JANGAN beri DBA ke akun aplikasi.

-- Catatan keamanan:
-- - Jangan pernah memberi CREATE USER / DBA / CREATE ANY TABLE ke akun
--   aplikasi (FASHION_APP, KEMENKEUDB, atau akun backend).
-- - Skema AUTH_SYSTEM sepenuhnya terpisah dari skema transaksional,
--   sehingga tabel DATA_ECOMMERS, FASHION_SALES, DASHBOARDS,
--   DASHBOARD_WIDGETS yang sudah ada TIDAK tersentuh sama sekali.
