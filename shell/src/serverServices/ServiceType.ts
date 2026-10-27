// Service registry. Maps a logical service key to its backend endpoint/method
// and its request/response shapes. The shell talks to a single backend (the
// IFP API gateway), so there is just one base URL (API_BASE_URL).

export type FetchMethod = "POST" | "GET" | "PUT" | "DELETE" | "PATCH";

export interface ServiceUrlAndMethod {
  urlEndpoint: string;
  method: FetchMethod;
  /** If true, `urlEndpoint` is used as-is (not prefixed with the base URL). */
  useAbsoluteUrl?: boolean;
}

// ─── Shared envelope ───

/**
 * Standard backend envelope. `status` is "SUCCESS"/... and `data` carries the
 * step-specific payload.
 */
export interface BackendEnvelope<T> {
  /** "SUCCESS" for auth endpoints; a numeric HTTP-style code for catalog. */
  status?: string | number;
  message?: string;
  data?: T | null;
  metadata?: unknown;
}

export interface PaginationMeta {
  page?: number;
  pageSize?: number;
  totalData?: number;
  totalItems?: number | null;
  totalPages?: number | null;
}

// ─── public-key ───

export interface PublicKeyData {
  algorithm?: string;
  publicKeyPem?: string;
}
export type PublicKeyResponse = BackendEnvelope<PublicKeyData>;

// ─── login ───

export interface LoginRequest {
  username: string;
  /** RSA-encrypted (backend public key) password. */
  password: string;
  /** User type for the backend (fixed "2" = external user). */
  loginType: string;
}

export type MfaRequired = "enroll" | "totp";

export interface LoginData {
  mfaRequired?: MfaRequired;
  otpExpiresIn?: number;
  message?: string;
}
export type LoginResponse = BackendEnvelope<LoginData>;

// ─── totp enroll ───

export interface TotpEnrollBeginRequest {
  username: string;
  password: string;
}
export interface TotpEnrollBeginData {
  secret?: string;
  otpauthUri?: string;
}
export type TotpEnrollBeginResponse = BackendEnvelope<TotpEnrollBeginData>;

export interface TotpEnrollConfirmRequest {
  username: string;
  password: string;
  code: string;
}
// Response shape TBD (to be inspected via logs). Keep it open.
export type TotpEnrollConfirmResponse = BackendEnvelope<Record<string, unknown>>;

// ─── verify-otp ───

export interface VerifyOtpRequest {
  username: string;
  otp: string;
}
export interface VerifyOtpData {
  /** The real backend access token (JWT). Stored in Redis, never sent to the browser. */
  token?: string;
  /** Backend's own expiry (ms) — IGNORED; the shell manages its own lifetime. */
  expiresIn?: number;
  /** Backend's own session id — IGNORED; the shell uses its own opaque id. */
  sessionId?: string;
}
export type VerifyOtpResponse = BackendEnvelope<VerifyOtpData>;

// ─── profile / logout (unchanged shells) ───

export interface ProfileRole {
  appCode?: string;
  appName?: string;
  roleCode?: string;
  roleName?: string;
}
export interface ProfileData {
  userId?: number;
  username?: string;
  userCode?: string;
  fullName?: string;
  email?: string;
  userType?: number;
  organizationId?: number;
  organizationCode?: string;
  organizationName?: string;
  roles?: ProfileRole[];
}
export type ProfileResponse = BackendEnvelope<ProfileData>;

// Logout takes no body — only the Bearer token (JWT) identifies the session.
export type LogoutResponse = BackendEnvelope<Record<string, unknown>>;

// ─── catalog (landing) ───

export interface CatalogSummaryData {
  activeOrganizations?: number;
  externalApplications?: number;
}
export type CatalogSummaryResponse = BackendEnvelope<CatalogSummaryData>;

export type SortDirection = "ASC" | "DESC";

export interface CatalogOrganizationsRequest {
  search?: string;
  sortBy?: string;
  sortDirection?: SortDirection;
  pagination?: { page?: number; pageSize?: number };
}

export interface CatalogOrganization {
  organizationId: number;
  organizationCode: string;
  organizationName: string;
  organizationType: string;
  organizationDescription?: string;
  organizationIcon?: string;
  status?: string;
  accessAllowed?: boolean;
}

export interface CatalogOrganizationsResponse
  extends BackendEnvelope<CatalogOrganization[]> {
  metadata?: PaginationMeta;
}

// ─── catalog applications (per organization) ───

export interface CatalogApplicationsRequest {
  appType?: number;
  organizationId: number;
  search?: string;
  sortBy?: string;
  sortDirection?: SortDirection;
  pagination?: { page?: number; pageSize?: number };
}

export interface CatalogApplication {
  appId: number;
  appCode: string;
  appName: string;
  appDescription?: string;
  appStatus?: string;
  appIcon?: string;
  appHighlightInfo?: string;
  displayOrder?: number;
  accessAllowed?: boolean;
  // `organization` is intentionally ignored per product decision.
}

export interface CatalogApplicationsResponse
  extends BackendEnvelope<CatalogApplication[]> {
  metadata?: PaginationMeta;
}

// ─── catalog menus (per application) ───

export interface CatalogMenusRequest {
  appId: number;
  search?: string;
  sortBy?: string;
  sortDirection?: SortDirection;
  pagination?: { page?: number; pageSize?: number };
}

export type MenuType = "MENU" | "SECTION" | "SUBMENU";

export interface CatalogMenu {
  menuId: number;
  parentMenuId?: number;
  menuCode: string;
  menuName: string;
  menuType: MenuType;
  routePath?: string | null;
  icon?: string | null;
  displayOrder?: number;
  child?: CatalogMenu[];
}

export interface CatalogMenusResponse extends BackendEnvelope<CatalogMenu[]> {
  metadata?: PaginationMeta;
}

export interface ServiceMapping {
  publicKey: { body?: undefined; response: PublicKeyResponse };
  login: { body: LoginRequest; response: LoginResponse };
  totpEnrollBegin: {
    body: TotpEnrollBeginRequest;
    response: TotpEnrollBeginResponse;
  };
  totpEnrollConfirm: {
    body: TotpEnrollConfirmRequest;
    response: TotpEnrollConfirmResponse;
  };
  verifyOtp: { body: VerifyOtpRequest; response: VerifyOtpResponse };
  profile: { body?: undefined; response: ProfileResponse };
  logout: { body?: undefined; response: LogoutResponse };
  catalogSummary: { body?: undefined; response: CatalogSummaryResponse };
  catalogOrganizations: {
    body: CatalogOrganizationsRequest;
    response: CatalogOrganizationsResponse;
  };
  catalogApplications: {
    body: CatalogApplicationsRequest;
    response: CatalogApplicationsResponse;
  };
  catalogMenus: {
    body: CatalogMenusRequest;
    response: CatalogMenusResponse;
  };
}

export type ServiceKey = keyof ServiceMapping;

export interface CustomRequestInit<T extends ServiceKey>
  extends Omit<RequestInit, "method" | "body"> {
  body?: ServiceMapping[T]["body"];
  queryParams?: Record<string, string>;
  pathParams?: Record<string, string>;
  /** Extra bearer token override (login/verify-otp need none). */
  token?: string;
}
