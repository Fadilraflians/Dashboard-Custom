import type { ServiceKey, ServiceUrlAndMethod } from "./ServiceType";

/**
 * Backend endpoint map (key -> { urlEndpoint, method }). Endpoints are relative
 * to API_BASE_URL (the IFP auth gateway). All auth endpoints are POST.
 */
export const SERVER_URL_MAP: Record<ServiceKey, ServiceUrlAndMethod> = {
  publicKey: { urlEndpoint: "/auth/api/v1/auth/public-key", method: "POST" },
  login: { urlEndpoint: "/auth/api/v1/auth/login", method: "POST" },
  totpEnrollBegin: {
    urlEndpoint: "/auth/api/v1/auth/totp/enroll-begin-login",
    method: "POST",
  },
  totpEnrollConfirm: {
    urlEndpoint: "/auth/api/v1/auth/totp/enroll-confirm-login",
    method: "POST",
  },
  verifyOtp: { urlEndpoint: "/auth/api/v1/auth/verify-totp", method: "POST" },
  logout: { urlEndpoint: "/auth/api/v1/auth/logout", method: "POST" },
  profile: { urlEndpoint: "/auth/api/v1/auth/profile", method: "POST" },
  catalogSummary: {
    urlEndpoint: "/app-registry/api/v1/catalog/summary",
    method: "POST",
  },
  catalogOrganizations: {
    urlEndpoint: "/app-registry/api/v1/catalog/organizations",
    method: "POST",
  },
  catalogApplications: {
    urlEndpoint: "/app-registry/api/v1/catalog/applications",
    method: "POST",
  },
  catalogMenus: {
    urlEndpoint: "/app-registry/api/v1/catalog/menus",
    method: "POST",
  },
};
