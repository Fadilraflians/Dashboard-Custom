import { randomUUID } from "crypto";
import { getRedis, keyPrefix } from "./redis";

/**
 * Reference-token (opaque session) model.
 *
 * On login the shell stores the real JWT (from verify-otp) plus user info in
 * Redis under a random session id, and sets an HttpOnly cookie containing only
 * that session id. The JWT never reaches the browser. The gateway swaps the
 * session id for the JWT when calling the backend. Logout deletes the key, so
 * sessions can be revoked instantly.
 *
 * Lifetime policy (two independent limits):
 *   - IDLE    : the Redis key TTL is the idle window (default 15 min). Every
 *               successful access refreshes it (sliding), so inactivity longer
 *               than the window expires the session.
 *   - ABSOLUTE: a hard cap (default 60 min) stored in the record as `absExp`.
 *               Never extended, regardless of activity.
 *
 * Single active session per user:
 *   A pointer key `user:<userId>` holds the session id that is currently active
 *   for that user. Logging in elsewhere overwrites the pointer and DELETES the
 *   previous session, so the older device is signed out on its next request
 *   (getSession also verifies the session id still matches the pointer).
 */

export interface SessionUser {
  sub: string; // user id (from the profile API, not decoded from the JWT)
  name: string;
  role: string;
  email?: string;
  username?: string;
  organizationId?: number;
  organizationCode?: string;
  organizationName?: string;
  localDemoRole?: "admin" | "company";
  /** RBAC: true when the user is an administrator (from AUTH_SYSTEM.IS_ADMIN). */
  isAdmin?: boolean;
  /** Ministry/tenant code from AUTH_SYSTEM.MASTER_USER (e.g. KEMENKEU/FASHION). */
  ministryCode?: string;
}

export interface SessionRecord extends SessionUser {
  jwt: string; // the real backend access token (JWT from verify-otp)
  iat: number; // issued-at (epoch seconds)
  absExp: number; // absolute expiry (epoch seconds) — hard cap, never extended
}

/** HttpOnly cookie holding the opaque session id. */
export const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "shell_session";

/**
 * Non-HttpOnly cookie the MFE remotes can read for user/app context. It
 * carries no token — only display context.
 */
export const MFE_COOKIE_NAME = "mfe_context";

/** Idle window (seconds): inactivity longer than this expires the session. */
export const SESSION_IDLE_TTL_SECONDS = Number(
  process.env.SESSION_IDLE_TTL || process.env.SESSION_TTL || 900,
);

/** Absolute lifetime (seconds): hard cap, cannot be extended. */
export const SESSION_ABSOLUTE_TTL_SECONDS = Number(
  process.env.SESSION_ABSOLUTE_TTL || 3600,
);

/**
 * Whether auth cookies get the `Secure` flag. Secure cookies are only sent over
 * HTTPS; keep false for plain-HTTP deployments to avoid a 302 login loop.
 */
export const COOKIE_SECURE = process.env.COOKIE_SECURE === "true";

function redisKey(sessionId: string): string {
  return `${keyPrefix()}${sessionId}`;
}

/** Pointer key: user id -> currently active session id. */
function userKey(userId: string): string {
  return `${keyPrefix()}user:${userId}`;
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * The effective TTL to apply now: the idle window, clamped so it never pushes
 * the key past the absolute cap. Returns 0 or less when the cap is reached.
 */
function effectiveTtl(absExp: number): number {
  const remainingAbsolute = absExp - nowSeconds();
  if (remainingAbsolute <= 0) return 0;
  return Math.min(SESSION_IDLE_TTL_SECONDS, remainingAbsolute);
}

/**
 * Creates a session and enforces single-active-session for the user:
 *   1. Store the new session record (key TTL = idle window).
 *   2. If the user had a different active session, delete that old session so
 *      the previous device is logged out.
 *   3. Point `user:<userId>` at the new session id (TTL = absolute lifetime).
 *
 * `user.sub` MUST be the stable user id resolved from the profile API.
 */
export async function createSession(
  user: SessionUser,
  jwt: string,
): Promise<string> {
  const sessionId = randomUUID();
  const iat = nowSeconds();
  const absExp = iat + SESSION_ABSOLUTE_TTL_SECONDS;
  const record: SessionRecord = { ...user, jwt, iat, absExp };

  const redis = await getRedis();

  // 1. Store the new session.
  await redis.set(redisKey(sessionId), JSON.stringify(record), {
    EX: effectiveTtl(absExp),
  });

  // 2 + 3. Swap the user's active-session pointer, revoking the previous one.
  if (user.sub) {
    const uKey = userKey(user.sub);
    const previousId = await redis.get(uKey);
    if (previousId && previousId !== sessionId) {
      await redis.del(redisKey(previousId));
    }
    await redis.set(uKey, sessionId, { EX: SESSION_ABSOLUTE_TTL_SECONDS });
  }

  return sessionId;
}

/**
 * Returns the stored session record, or null if missing/expired/invalid or if
 * it has been superseded by a newer login elsewhere.
 *
 * On a valid read this performs the sliding idle refresh (clamped to the
 * absolute cap). If the absolute cap has passed, or the session id no longer
 * matches the user's active-session pointer, the key is deleted and null is
 * returned.
 */
export async function getSession(
  sessionId: string | undefined | null,
): Promise<SessionRecord | null> {
  if (!sessionId) return null;

  try {
    const redis = await getRedis();
    const key = redisKey(sessionId);
    const raw = await redis.get(key);
    if (!raw) return null;

    const record = JSON.parse(raw) as SessionRecord;

    // Backward-compat: records without absExp get one derived from iat.
    const absExp =
      typeof record.absExp === "number"
        ? record.absExp
        : (record.iat || nowSeconds()) + SESSION_ABSOLUTE_TTL_SECONDS;

    // Absolute cap reached — expire immediately.
    const ttl = effectiveTtl(absExp);
    if (ttl <= 0) {
      await redis.del(key);
      return null;
    }

    // Superseded by a newer login on another device — expire this one.
    if (record.sub) {
      const activeId = await redis.get(userKey(record.sub));
      if (activeId && activeId !== sessionId) {
        await redis.del(key);
        return null;
      }
    }

    // Sliding idle refresh, clamped to the absolute cap.
    await redis.expire(key, ttl);
    return { ...record, absExp };
  } catch (err) {
    console.error("[session] getSession failed:", err);
    return null;
  }
}

/**
 * Deletes a session (logout / revoke). Also clears the user's active-session
 * pointer when it still points at this session.
 */
export async function destroySession(
  sessionId: string | undefined | null,
): Promise<void> {
  if (!sessionId) return;
  try {
    const redis = await getRedis();
    const raw = await redis.get(redisKey(sessionId));
    await redis.del(redisKey(sessionId));

    if (raw) {
      try {
        const record = JSON.parse(raw) as SessionRecord;
        if (record.sub) {
          const uKey = userKey(record.sub);
          const activeId = await redis.get(uKey);
          if (activeId === sessionId) {
            await redis.del(uKey);
          }
        }
      } catch {
        // Malformed record — nothing more to clean up.
      }
    }
  } catch (err) {
    console.error("[session] destroySession failed:", err);
  }
}
