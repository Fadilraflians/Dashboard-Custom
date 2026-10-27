-- =====================================================================
-- 20_grants.sql
-- ---------------------------------------------------------------------
-- JALANKAN SEBAGAI user AUTH_SYSTEM (pemilik tabel), SETELAH tabel dibuat.
--
-- Tujuan: memberi hak DML terbatas ke akun backend yang akan membaca/
-- menulis data RBAC, TANPA memberi hak DDL atau hak administratif.
--
-- Ganti <BACKEND_APP_USER> dengan nama akun yang dipakai backend untuk
-- konek. Pilihan aman: buat akun khusus (mis. AUTH_APP) oleh DBA, bukan
-- memakai FASHION_APP / KEMENKEUDB.
--
-- Prinsip least privilege:
--   - Hanya SELECT/INSERT/UPDATE/DELETE pada tabel yang benar-benar perlu.
--   - TIDAK ada GRANT ... WITH GRANT OPTION.
--   - TIDAK ada hak ALTER/DROP ke akun backend.
-- =====================================================================

-- Baca untuk semua tabel (dibutuhkan untuk login & resolusi menu).
GRANT SELECT ON MASTER_USER              TO <BACKEND_APP_USER>;
GRANT SELECT ON MASTER_ROLE              TO <BACKEND_APP_USER>;
GRANT SELECT ON MASTER_APPLICATION       TO <BACKEND_APP_USER>;
GRANT SELECT ON APPLICATION_WIDGETS      TO <BACKEND_APP_USER>;
GRANT SELECT ON MAPPING_USER_ROLE        TO <BACKEND_APP_USER>;
GRANT SELECT ON MAPPING_APPLICATION_ROLE TO <BACKEND_APP_USER>;

-- Tulis hanya pada tabel yang memang dikelola lewat aplikasi.
-- (Sesuaikan: jika administrasi user/role dilakukan lewat tool DBA,
--  cukup beri SELECT saja dan hapus baris INSERT/UPDATE/DELETE di bawah.)
GRANT INSERT, UPDATE, DELETE ON MASTER_USER              TO <BACKEND_APP_USER>;
GRANT INSERT, UPDATE, DELETE ON MASTER_ROLE              TO <BACKEND_APP_USER>;
GRANT INSERT, UPDATE, DELETE ON MASTER_APPLICATION       TO <BACKEND_APP_USER>;
GRANT INSERT, UPDATE, DELETE ON APPLICATION_WIDGETS      TO <BACKEND_APP_USER>;
GRANT INSERT, UPDATE, DELETE ON MAPPING_USER_ROLE        TO <BACKEND_APP_USER>;
GRANT INSERT, UPDATE, DELETE ON MAPPING_APPLICATION_ROLE TO <BACKEND_APP_USER>;

-- Opsional: sinonim agar backend bisa akses tanpa prefix skema.
-- CREATE PUBLIC SYNONYM MASTER_USER FOR AUTH_SYSTEM.MASTER_USER;
-- ...dst. (lebih aman pakai private synonym di akun backend.)
