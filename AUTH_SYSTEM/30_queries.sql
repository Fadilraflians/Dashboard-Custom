-- =====================================================================
-- 30_queries.sql
-- ---------------------------------------------------------------------
-- BUKAN skrip DDL. Ini kumpulan query referensi untuk logika backend
-- (login, resolusi menu dashboard, validasi akses). Dipakai sebagai
-- template; backend sebaiknya memakai bind variable (:username, dst.)
-- dan melakukan verifikasi password di aplikasi, bukan di SQL.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Q1. LOGIN — ambil data user aktif berdasarkan username.
--     Verifikasi PASSWORD_HASH dilakukan di backend (bcrypt.compare),
--     JANGAN membandingkan password mentah di dalam SQL.
-- ---------------------------------------------------------------------
SELECT ID, NAME, USERNAME, EMAIL, PASSWORD_HASH, MINISTRY_CODE, IS_ADMIN,
       TOTP_SECRET, IS_TOTP_ENABLED
FROM   MASTER_USER
WHERE  USERNAME  = :username
AND    IS_ACTIVE = 1
AND    IS_DELETED = 0;
-- Alur login di backend:
--   1) Cari user (query ini).
--   2) bcrypt.compare(passwordInput, PASSWORD_HASH) -> harus cocok.
--   3) Jika IS_TOTP_ENABLED = 1: minta kode OTP, verifikasi dengan
--      TOTP_SECRET (mis. speakeasy.totp.verify). Jika gagal, tolak login.
--   4) Jika semua lolos, buat sesi/token.

-- ---------------------------------------------------------------------
-- Q2. ROLE milik user (dipakai untuk membangun konteks sesi).
-- ---------------------------------------------------------------------
SELECT r.CODE, r.NAME, r.MINISTRY_CODE
FROM   MAPPING_USER_ROLE m
JOIN   MASTER_ROLE r ON r.CODE = m.ROLE_CODE
WHERE  m.USERNAME  = :username
AND    m.IS_ACTIVE = 1 AND m.IS_DELETED = 0
AND    r.IS_ACTIVE = 1 AND r.IS_DELETED = 0;

-- ---------------------------------------------------------------------
-- Q3. MENU DASHBOARD untuk USER BIASA (IS_ADMIN = 0).
--     Hanya dashboard yang dipetakan ke role yang dimiliki user,
--     dan dibatasi pada kementerian user (isolasi tenant).
-- ---------------------------------------------------------------------
SELECT DISTINCT a.CODE, a.NAME, a.CATEGORY, a.TAGS, a.DESCRIPTION, a.ORDER_BY
FROM   MASTER_APPLICATION a
JOIN   MAPPING_APPLICATION_ROLE ar ON ar.APPS_CODE = a.CODE
JOIN   MAPPING_USER_ROLE        ur ON ur.ROLE_CODE = ar.ROLE_CODE
WHERE  ur.USERNAME     = :username
AND    a.MINISTRY_CODE = :ministryCode
AND    a.IS_ACTIVE = 1 AND a.IS_DELETED = 0
AND    ar.IS_ACTIVE = 1 AND ar.IS_DELETED = 0
AND    ur.IS_ACTIVE = 1 AND ur.IS_DELETED = 0
ORDER BY a.ORDER_BY, a.NAME;

-- ---------------------------------------------------------------------
-- Q4. MENU DASHBOARD untuk ADMIN (IS_ADMIN = 1).
--     Admin melihat SEMUA dashboard di kementeriannya tanpa perlu
--     pemetaan role per dashboard.
-- ---------------------------------------------------------------------
SELECT a.CODE, a.NAME, a.CATEGORY, a.TAGS, a.DESCRIPTION, a.ORDER_BY
FROM   MASTER_APPLICATION a
WHERE  a.MINISTRY_CODE = :ministryCode
AND    a.IS_ACTIVE = 1 AND a.IS_DELETED = 0
ORDER BY a.ORDER_BY, a.NAME;

-- ---------------------------------------------------------------------
-- Q5. VALIDASI AKSES — apakah user boleh membuka dashboard tertentu?
--     Mengembalikan 1 baris (bernilai 1) jika boleh, 0 baris jika tidak.
--     Admin: cukup satu kementerian yang sama. User: harus via mapping role.
-- ---------------------------------------------------------------------
SELECT 1 AS ALLOWED
FROM   DUAL
WHERE  EXISTS (
         -- jalur admin
         SELECT 1
         FROM   MASTER_USER u
         JOIN   MASTER_APPLICATION a ON a.MINISTRY_CODE = u.MINISTRY_CODE
         WHERE  u.USERNAME = :username
         AND    u.IS_ADMIN = 1 AND u.IS_ACTIVE = 1 AND u.IS_DELETED = 0
         AND    a.CODE = :appsCode
         AND    a.IS_ACTIVE = 1 AND a.IS_DELETED = 0
       )
OR     EXISTS (
         -- jalur user biasa via role mapping
         SELECT 1
         FROM   MAPPING_USER_ROLE        ur
         JOIN   MAPPING_APPLICATION_ROLE ar ON ar.ROLE_CODE = ur.ROLE_CODE
         JOIN   MASTER_APPLICATION       a  ON a.CODE       = ar.APPS_CODE
         JOIN   MASTER_USER              u  ON u.USERNAME   = ur.USERNAME
         WHERE  ur.USERNAME = :username
         AND    ar.APPS_CODE = :appsCode
         AND    a.MINISTRY_CODE = u.MINISTRY_CODE
         AND    ur.IS_ACTIVE = 1 AND ur.IS_DELETED = 0
         AND    ar.IS_ACTIVE = 1 AND ar.IS_DELETED = 0
         AND    a.IS_ACTIVE = 1 AND a.IS_DELETED = 0
       );

-- ---------------------------------------------------------------------
-- Q6. ISI DASHBOARD — ambil widget untuk sebuah dashboard.
--     Panggil HANYA setelah Q5 memastikan user berhak.
-- ---------------------------------------------------------------------
SELECT w.ID, w.TYPE, w.TITLE, w.COMPONENT_NAME, w.DATA, w.LAYOUT
FROM   APPLICATION_WIDGETS w
WHERE  w.APPS_CODE = :appsCode
AND    w.IS_ACTIVE = 1 AND w.IS_DELETED = 0
ORDER BY w.ID;
