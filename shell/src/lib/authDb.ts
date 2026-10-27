import oracledb from "oracledb";

/**
 * Oracle connection pool for the AUTH_SYSTEM schema (login source for the
 * database-backed auth flow, B1-penuh). Server-side only.
 *
 * This is used ONLY when AUTH_SOURCE=db. When AUTH_SOURCE is unset or "ifp"
 * (the default), the shell keeps using the existing IFP gateway login and this
 * module is never touched.
 *
 * Lazy singleton so Next.js hot reload in dev does not open a new pool on every
 * request (mirrors the pattern in redis.ts).
 */

declare global {
  // eslint-disable-next-line no-var
  var __authDbPool: oracledb.Pool | undefined;
  // eslint-disable-next-line no-var
  var __authDbConnecting: Promise<oracledb.Pool> | undefined;
}

/** Whether the database-backed auth flow is enabled. */
export function isDbAuthEnabled(): boolean {
  return (process.env.AUTH_SOURCE || "ifp").toLowerCase() === "db";
}

function connectString(): string {
  // Accept either a full connect string (AUTH_DB_CONNECT_STRING) or
  // host/port/service parts, matching the AiGovtech .env convention.
  const explicit = process.env.AUTH_DB_CONNECT_STRING;
  if (explicit) return explicit;
  const host = process.env.AUTH_DB_HOST || "localhost";
  const port = process.env.AUTH_DB_PORT || "1521";
  const service = process.env.AUTH_DB_SERVICE || "DASHBOARDDB";
  return `${host}:${port}/${service}`;
}

async function buildPool(): Promise<oracledb.Pool> {
  const user = process.env.AUTH_DB_USER || "AUTH_SYSTEM";
  const password = process.env.AUTH_DB_PASS;
  if (!password) {
    throw new Error("AUTH_DB_PASS is not set — cannot connect to AUTH_SYSTEM.");
  }
  return oracledb.createPool({
    user,
    password,
    connectString: connectString(),
    poolMin: 0,
    poolMax: 4,
    poolTimeout: 60,
  });
}

/** Returns the shared AUTH_SYSTEM pool, reused across requests and hot reloads. */
export async function getAuthPool(): Promise<oracledb.Pool> {
  if (globalThis.__authDbPool) {
    return globalThis.__authDbPool;
  }
  if (globalThis.__authDbConnecting) {
    return globalThis.__authDbConnecting;
  }

  globalThis.__authDbConnecting = (async () => {
    try {
      const pool = await buildPool();
      globalThis.__authDbPool = pool;
      return pool;
    } catch (error) {
      globalThis.__authDbPool = undefined;
      throw error;
    } finally {
      globalThis.__authDbConnecting = undefined;
    }
  })();

  return globalThis.__authDbConnecting;
}

/** A single user row from MASTER_USER, as needed for login + role resolution. */
export interface AuthUserRow {
  id: number;
  name: string;
  username: string;
  email: string | null;
  passwordHash: string;
  ministryCode: string;
  isAdmin: boolean;
  totpSecret: string | null;
  isTotpEnabled: boolean;
}

/**
 * Looks up an active, non-deleted user by username. Returns null when no
 * matching user exists. Uses a bind variable (no string interpolation).
 */
export async function findAuthUserByUsername(
  username: string,
): Promise<AuthUserRow | null> {
  const pool = await getAuthPool();
  const connection = await pool.getConnection();
  try {
    const result = await connection.execute<{
      ID: number;
      NAME: string;
      USERNAME: string;
      EMAIL: string | null;
      PASSWORD_HASH: string;
      MINISTRY_CODE: string;
      IS_ADMIN: number;
      TOTP_SECRET: string | null;
      IS_TOTP_ENABLED: number;
    }>(
      `SELECT ID, NAME, USERNAME, EMAIL, PASSWORD_HASH, MINISTRY_CODE,
              IS_ADMIN, TOTP_SECRET, IS_TOTP_ENABLED
         FROM MASTER_USER
        WHERE USERNAME = :username
          AND IS_ACTIVE = 1
          AND IS_DELETED = 0`,
      { username },
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );

    const row = result.rows?.[0];
    if (!row) return null;

    return {
      id: row.ID,
      name: row.NAME,
      username: row.USERNAME,
      email: row.EMAIL,
      passwordHash: row.PASSWORD_HASH,
      ministryCode: row.MINISTRY_CODE,
      isAdmin: Number(row.IS_ADMIN) === 1,
      totpSecret: row.TOTP_SECRET,
      isTotpEnabled: Number(row.IS_TOTP_ENABLED) === 1,
    };
  } finally {
    await connection.close();
  }
}

/**
 * Maps a MASTER_USER.MINISTRY_CODE to the shell's organization identity so the
 * existing tenant resolver (aiTenant.ts) keeps working unchanged. The AI tenant
 * boundary is driven by organizationCode / organizationId.
 *
 *   KEMENKEU            -> Kementerian Keuangan  (org 2, code KEMENKEU) -> kemenkeu
 *   FASHION / KEMENKES  -> Kementerian Kesehatan (org 1, code KEMENKES) -> fashion
 */
export function ministryToOrganization(ministryCode: string): {
  organizationId: number;
  organizationCode: string;
  organizationName: string;
} | null {
  const code = (ministryCode || "").trim().toUpperCase();
  if (code === "KEMENKEU") {
    return {
      organizationId: 2,
      organizationCode: "KEMENKEU",
      organizationName: "Kementerian Keuangan",
    };
  }
  if (code === "FASHION" || code === "KEMENKES") {
    return {
      organizationId: 1,
      organizationCode: "KEMENKES",
      organizationName: "Kementerian Kesehatan",
    };
  }
  return null;
}

// =====================================================================
// Dashboard member management (Step 2 "Informasi Member & Hak Akses").
// Members are chosen from MASTER_USER (option B) and stored per dashboard
// in DASHBOARD_MEMBER, isolated by tenant.
// =====================================================================

/** ministry code per AI tenant, used to scope candidate users. */
function ministryCodesForTenant(tenant: "fashion" | "kemenkeu"): string[] {
  return tenant === "kemenkeu" ? ["KEMENKEU"] : ["FASHION", "KEMENKES"];
}

export interface CandidateUser {
  username: string;
  name: string;
  email: string | null;
  isAdmin: boolean;
}

/** Active users in the same ministry/tenant — candidates to add as members. */
export async function listCandidateUsers(
  tenant: "fashion" | "kemenkeu",
): Promise<CandidateUser[]> {
  const pool = await getAuthPool();
  const connection = await pool.getConnection();
  try {
    const codes = ministryCodesForTenant(tenant);
    const binds: Record<string, string> = {};
    const placeholders = codes.map((code, i) => {
      binds[`m${i}`] = code;
      return `:m${i}`;
    });
    const result = await connection.execute<{
      USERNAME: string; NAME: string; EMAIL: string | null; IS_ADMIN: number;
    }>(
      `SELECT USERNAME, NAME, EMAIL, IS_ADMIN
         FROM MASTER_USER
        WHERE IS_ACTIVE = 1 AND IS_DELETED = 0
          AND MINISTRY_CODE IN (${placeholders.join(", ")})
        ORDER BY NAME`,
      binds,
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );
    return (result.rows || []).map((r) => ({
      username: r.USERNAME, name: r.NAME, email: r.EMAIL, isAdmin: Number(r.IS_ADMIN) === 1,
    }));
  } finally {
    await connection.close();
  }
}

export interface DashboardMember {
  id: number;
  username: string;
  name: string;
  email: string | null;
  roleAccess: string;
  unit: string | null;
}

/** Members assigned to a dashboard (joined with MASTER_USER for display). */
export async function listDashboardMembers(
  dashboardId: string,
  tenant: "fashion" | "kemenkeu",
): Promise<DashboardMember[]> {
  const pool = await getAuthPool();
  const connection = await pool.getConnection();
  try {
    const result = await connection.execute<{
      ID: number; USERNAME: string; NAME: string; EMAIL: string | null;
      ROLE_ACCESS: string; UNIT: string | null;
    }>(
      `SELECT m.ID, m.USERNAME, u.NAME, u.EMAIL, m.ROLE_ACCESS, m.UNIT
         FROM DASHBOARD_MEMBER m
         JOIN MASTER_USER u ON u.USERNAME = m.USERNAME
        WHERE m.DASHBOARD_ID = :d AND m.TENANT = :t
          AND m.IS_DELETED = 0
        ORDER BY u.NAME`,
      { d: dashboardId, t: tenant },
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );
    return (result.rows || []).map((r) => ({
      id: r.ID, username: r.USERNAME, name: r.NAME, email: r.EMAIL,
      roleAccess: r.ROLE_ACCESS, unit: r.UNIT,
    }));
  } finally {
    await connection.close();
  }
}

/** Add a member to a dashboard. Idempotent via MERGE on the unique key. */
export async function addDashboardMember(params: {
  dashboardId: string;
  tenant: "fashion" | "kemenkeu";
  username: string;
  roleAccess: string;
  unit?: string | null;
  createdBy?: string;
}): Promise<void> {
  const pool = await getAuthPool();
  const connection = await pool.getConnection();
  try {
    await connection.execute(
      `MERGE INTO DASHBOARD_MEMBER t
         USING (SELECT :d DASHBOARD_ID, :t TENANT, :u USERNAME FROM DUAL) s
         ON (t.DASHBOARD_ID = s.DASHBOARD_ID AND t.TENANT = s.TENANT AND t.USERNAME = s.USERNAME)
       WHEN MATCHED THEN
         UPDATE SET ROLE_ACCESS = :r, UNIT = :unit, IS_DELETED = 0,
                    UPDATED_BY = :by, UPDATED_TIME = SYSTIMESTAMP
       WHEN NOT MATCHED THEN
         INSERT (DASHBOARD_ID, TENANT, USERNAME, ROLE_ACCESS, UNIT, CREATED_BY)
         VALUES (:d, :t, :u, :r, :unit, :by)`,
      {
        d: params.dashboardId, t: params.tenant, u: params.username,
        r: params.roleAccess, unit: params.unit ?? null, by: params.createdBy ?? "APP",
      },
      { autoCommit: true },
    );
  } finally {
    await connection.close();
  }
}

/** Soft-delete a member from a dashboard (scoped by tenant for safety). */
export async function removeDashboardMember(
  id: number,
  tenant: "fashion" | "kemenkeu",
): Promise<void> {
  const pool = await getAuthPool();
  const connection = await pool.getConnection();
  try {
    await connection.execute(
      `UPDATE DASHBOARD_MEMBER
          SET IS_DELETED = 1, UPDATED_TIME = SYSTIMESTAMP
        WHERE ID = :id AND TENANT = :t`,
      { id, t: tenant },
      { autoCommit: true },
    );
  } finally {
    await connection.close();
  }
}
