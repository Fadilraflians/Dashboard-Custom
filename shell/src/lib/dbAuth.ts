import bcrypt from "bcryptjs";
import { authenticator } from "otplib";
import { findAuthUserByUsername, ministryToOrganization, type AuthUserRow } from "./authDb";
import type { SessionUser } from "./session";

/**
 * Database-backed auth helpers (B1-penuh, used only when AUTH_SOURCE=db).
 *
 * Login is a two-step flow mirroring the existing IFP contract:
 *   1. verifyPassword(username, password) at /api/auth/login
 *      -> on success returns mfaRequired = "totp" (OTP is required for all
 *         accounts under option X).
 *   2. verifyTotpAndBuildUser(username, otp) at /api/auth/verify-otp
 *      -> on success returns the SessionUser to hand to createSession.
 *
 * OTP window tolerance: allow the current step plus one before/after to absorb
 * minor clock drift between the server and the authenticator app.
 */
authenticator.options = { window: 1 };

/** Verify a plaintext password against the stored bcrypt hash. */
export async function verifyDbPassword(
  username: string,
  password: string,
): Promise<{ ok: boolean; user: AuthUserRow | null }> {
  const user = await findAuthUserByUsername(username);
  if (!user || !user.passwordHash) return { ok: false, user: null };
  const ok = await bcrypt.compare(password, user.passwordHash);
  return { ok, user: ok ? user : null };
}

/** TOTP issuer label shown in the authenticator app. */
const TOTP_ISSUER = "AiGovtech";

/**
 * Builds the otpauth:// URL for an authenticated user so the login page can
 * render it as a QR code. MUST be called only AFTER the password is verified,
 * because it exposes the TOTP secret. Returns null if the user has no secret.
 */
export function buildOtpauthUri(user: AuthUserRow): string | null {
  if (!user.totpSecret) return null;
  return authenticator.keyuri(user.username, TOTP_ISSUER, user.totpSecret);
}

/** Verify a TOTP code against the user's stored secret. */
export function verifyDbTotp(secret: string, code: string): boolean {
  if (!secret || !code) return false;
  try {
    return authenticator.verify({ token: code.trim(), secret });
  } catch {
    return false;
  }
}

/**
 * Builds the SessionUser from a MASTER_USER row, mapping MINISTRY_CODE to the
 * shell's organization identity so the existing tenant resolver keeps working.
 * isAdmin and ministryCode are carried for RBAC gating.
 */
export function buildSessionUserFromRow(user: AuthUserRow): SessionUser {
  const org = ministryToOrganization(user.ministryCode);
  return {
    sub: `authdb-${user.id}`,
    name: user.name,
    role: user.isAdmin ? "Administrator" : "User",
    email: user.email || undefined,
    username: user.username,
    organizationId: org?.organizationId,
    organizationCode: org?.organizationCode,
    organizationName: org?.organizationName,
    isAdmin: user.isAdmin,
    ministryCode: user.ministryCode,
  };
}

/**
 * Full verify-otp step for the DB flow: re-check the user, verify the OTP, and
 * return the SessionUser. Password is NOT re-checked here (it was checked at
 * the login step); this follows the existing IFP two-step contract.
 */
export async function verifyDbTotpAndBuildUser(
  username: string,
  otp: string,
): Promise<SessionUser | null> {
  const user = await findAuthUserByUsername(username);
  if (!user) return null;
  // Under option X every account has OTP enabled; require a valid secret+code.
  if (!user.isTotpEnabled || !user.totpSecret) return null;
  if (!verifyDbTotp(user.totpSecret, otp)) return null;
  return buildSessionUserFromRow(user);
}

/**
 * Central admin check for RBAC gating. A user is admin when:
 *   - the session carries isAdmin = true (DB-auth user with IS_ADMIN=1), or
 *   - they are the local demo admin.
 *
 * Keep ALL admin decisions going through this helper so that, if the admin
 * source changes later, only this function needs updating.
 */
export function isAdminSession(
  session: { isAdmin?: boolean } | null | undefined,
  isLocalDemoAdmin: boolean,
): boolean {
  return session?.isAdmin === true || isLocalDemoAdmin;
}
