import "server-only";
import { serverRequestFunction } from "@/serverServices";
import type { ProfileData } from "@/serverServices";

export interface ResolvedProfile {
  /** Stable numeric user id from the backend profile (NOT decoded from JWT). */
  userId: string;
  name: string;
  role: string;
  email?: string;
  organizationId?: number;
  organizationCode?: string;
  organizationName?: string;
  raw: ProfileData;
}

/**
 * Fetches the authenticated user's profile from the backend
 * (POST /auth/api/v1/auth/profile) using the given Bearer token, and resolves
 * the fields the shell needs (user id + display context).
 *
 * The user id is taken from the profile API — never decoded from the JWT.
 * Returns null if the profile cannot be retrieved or has no userId.
 */
export async function fetchProfile(
  token: string,
  userTag?: string,
): Promise<ResolvedProfile | null> {
  const { status, response } = await serverRequestFunction("profile", {
    token,
    user: userTag,
  });

  const data = response?.data;
  if (
    status < 200 ||
    status >= 300 ||
    response?.status !== "SUCCESS" ||
    !data ||
    data.userId === undefined ||
    data.userId === null
  ) {
    return null;
  }

  return {
    userId: String(data.userId),
    name: data.fullName || data.username || String(data.userId),
    // Prefer the human-readable role name (e.g. "Administrator") over the code.
    role: data.roles?.[0]?.roleName || data.roles?.[0]?.roleCode || "user",
    email: data.email,
    organizationId: data.organizationId,
    organizationCode: data.organizationCode,
    organizationName: data.organizationName,
    raw: data,
  };
}
