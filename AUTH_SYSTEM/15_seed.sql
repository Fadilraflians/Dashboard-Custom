-- =====================================================================
-- 15_seed.sql
-- ---------------------------------------------------------------------
-- Jalankan sebagai user AUTH_SYSTEM, SETELAH 10_create_tables.sql.
--
-- Data contoh (seed) untuk 2 kementerian: KEMENKEU & FASHION.
-- Tiap kementerian punya 1 Admin + 1 User biasa.
--
-- PENTING soal password:
--   - Kolom PASSWORD_HASH diisi HASH, bukan teks asli.
--   - Placeholder di bawah ('$2b$10$REPLACE_WITH_BCRYPT_HASH...') HARUS
--     diganti dengan hash bcrypt/argon2 yang dihasilkan backend.
--   - Password asli TIDAK boleh ditulis di skrip ini maupun di laporan.
--   - Cara aman: generate hash di aplikasi (mis. bcrypt.hash(...)) lalu
--     tempel hasil hash-nya ke sini sebelum dijalankan.
--
-- Idempotensi ringan: pakai MERGE pada natural key agar aman dijalankan
-- ulang tanpa menduplikasi baris.
-- =====================================================================

-- ---------------------------------------------------------------------
-- A. ROLES (per kementerian)
-- ---------------------------------------------------------------------
MERGE INTO MASTER_ROLE t
USING (
  SELECT 'KEMENKEU_ADMIN' CODE, 'Administrator Kemenkeu' NAME, 'KEMENKEU' MINISTRY_CODE FROM DUAL UNION ALL
  SELECT 'KEMENKEU_USER',  'Pengguna Kemenkeu',          'KEMENKEU'               FROM DUAL UNION ALL
  SELECT 'FASHION_ADMIN',  'Administrator Fashion',      'FASHION'                FROM DUAL UNION ALL
  SELECT 'FASHION_USER',   'Pengguna Fashion',           'FASHION'                FROM DUAL
) s
ON (t.CODE = s.CODE)
WHEN NOT MATCHED THEN
  INSERT (CODE, NAME, MINISTRY_CODE, CREATED_BY)
  VALUES (s.CODE, s.NAME, s.MINISTRY_CODE, 'SEED');

-- ---------------------------------------------------------------------
-- B. USERS (ganti PASSWORD_HASH dengan hash asli sebelum jalan)
-- ---------------------------------------------------------------------
-- Catatan OTP (pilihan X: OTP WAJIB untuk SEMUA akun):
--   - Keempat akun IS_TOTP_ENABLED = 1 → semua wajib OTP saat login.
--   - PASSWORD_HASH dan TOTP_SECRET diisi oleh tools/generate-credentials.cjs
--     (jalankan UPDATE hasil generate SETELAH seed ini). Placeholder di bawah
--     tidak valid untuk login sampai di-UPDATE dengan nilai asli.
MERGE INTO MASTER_USER t
USING (
  SELECT 'admin.kemenkeu' USERNAME, 'Admin Kemenkeu' NAME, 'admin.kemenkeu@example.go.id' EMAIL,
         'KEMENKEU' MINISTRY_CODE, 1 IS_ADMIN,
         '$2b$10$REPLACE_WITH_BCRYPT_HASH_ADMIN_KEMENKEU' PASSWORD_HASH,
         'REPLACE_WITH_TOTP_SECRET_BASE32' TOTP_SECRET, 1 IS_TOTP_ENABLED FROM DUAL UNION ALL
  SELECT 'user.kemenkeu',  'User Kemenkeu',  'user.kemenkeu@example.go.id',
         'KEMENKEU', 0, '$2b$10$REPLACE_WITH_BCRYPT_HASH_USER_KEMENKEU',
         'REPLACE_WITH_TOTP_SECRET_BASE32', 1 FROM DUAL UNION ALL
  SELECT 'admin.fashion',  'Admin Fashion',  'admin.fashion@example.go.id',
         'FASHION', 1, '$2b$10$REPLACE_WITH_BCRYPT_HASH_ADMIN_FASHION',
         'REPLACE_WITH_TOTP_SECRET_BASE32', 1 FROM DUAL UNION ALL
  SELECT 'user.fashion',   'User Fashion',   'user.fashion@example.go.id',
         'FASHION', 0, '$2b$10$REPLACE_WITH_BCRYPT_HASH_USER_FASHION',
         'REPLACE_WITH_TOTP_SECRET_BASE32', 1 FROM DUAL
) s
ON (t.USERNAME = s.USERNAME)
WHEN NOT MATCHED THEN
  INSERT (USERNAME, NAME, EMAIL, MINISTRY_CODE, IS_ADMIN, PASSWORD_HASH,
          TOTP_SECRET, IS_TOTP_ENABLED, CREATED_BY)
  VALUES (s.USERNAME, s.NAME, s.EMAIL, s.MINISTRY_CODE, s.IS_ADMIN, s.PASSWORD_HASH,
          s.TOTP_SECRET, s.IS_TOTP_ENABLED, 'SEED');

-- ---------------------------------------------------------------------
-- C. MAPPING USER -> ROLE
-- ---------------------------------------------------------------------
MERGE INTO MAPPING_USER_ROLE t
USING (
  SELECT 'KEMENKEU_ADMIN' ROLE_CODE, 'admin.kemenkeu' USERNAME FROM DUAL UNION ALL
  SELECT 'KEMENKEU_USER',  'user.kemenkeu'  FROM DUAL UNION ALL
  SELECT 'FASHION_ADMIN',  'admin.fashion'  FROM DUAL UNION ALL
  SELECT 'FASHION_USER',   'user.fashion'   FROM DUAL
) s
ON (t.ROLE_CODE = s.ROLE_CODE AND t.USERNAME = s.USERNAME)
WHEN NOT MATCHED THEN
  INSERT (ROLE_CODE, USERNAME, CREATED_BY)
  VALUES (s.ROLE_CODE, s.USERNAME, 'SEED');

-- ---------------------------------------------------------------------
-- D. APPLICATIONS (katalog dashboard contoh, satu per kementerian)
--    CODE harus cocok dengan identitas dashboard di aplikasi.
-- ---------------------------------------------------------------------
MERGE INTO MASTER_APPLICATION t
USING (
  SELECT 'DASH_KEMENKEU_ECOMMERCE' CODE, 'Dashboard E-Commerce Kemenkeu' NAME,
         'E-Commerce' CATEGORY, 'KEMENKEU' MINISTRY_CODE, 1 ORDER_BY FROM DUAL UNION ALL
  SELECT 'DASH_FASHION_SALES', 'Dashboard Penjualan Fashion',
         'Retail', 'FASHION', 1 FROM DUAL
) s
ON (t.CODE = s.CODE)
WHEN NOT MATCHED THEN
  INSERT (CODE, NAME, CATEGORY, MINISTRY_CODE, ORDER_BY, CREATED_BY)
  VALUES (s.CODE, s.NAME, s.CATEGORY, s.MINISTRY_CODE, s.ORDER_BY, 'SEED');

-- ---------------------------------------------------------------------
-- E. MAPPING APPLICATION -> ROLE (role mana boleh lihat dashboard mana)
-- ---------------------------------------------------------------------
MERGE INTO MAPPING_APPLICATION_ROLE t
USING (
  SELECT 'KEMENKEU_ADMIN' ROLE_CODE, 'DASH_KEMENKEU_ECOMMERCE' APPS_CODE FROM DUAL UNION ALL
  SELECT 'KEMENKEU_USER',  'DASH_KEMENKEU_ECOMMERCE' FROM DUAL UNION ALL
  SELECT 'FASHION_ADMIN',  'DASH_FASHION_SALES'      FROM DUAL UNION ALL
  SELECT 'FASHION_USER',   'DASH_FASHION_SALES'      FROM DUAL
) s
ON (t.ROLE_CODE = s.ROLE_CODE AND t.APPS_CODE = s.APPS_CODE)
WHEN NOT MATCHED THEN
  INSERT (ROLE_CODE, APPS_CODE, CREATED_BY)
  VALUES (s.ROLE_CODE, s.APPS_CODE, 'SEED');

COMMIT;
