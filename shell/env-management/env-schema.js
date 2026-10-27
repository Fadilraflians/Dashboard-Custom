import { ENV_TYPES } from "./env-types.js";

// Maps each env var to { required, type|pattern, description }.
// Priority: explicit `pattern` > `type`.

export const envSchema = {
  // --- Server ---
  SERVER_PORT: {
    required: false,
    type: "number",
    description: "Port the custom Node server listens on.",
  },
  NODE_ENV: {
    required: false,
    type: "node-env",
    description: "Node environment.",
  },
  LOG_LEVEL: {
    required: false,
    type: "string",
    description: "Winston log level.",
  },

  // --- Auth (reference-token session) ---
  AUTH_COOKIE_NAME: {
    required: false,
    type: "string",
    description: "Name of the HttpOnly cookie holding the opaque session id.",
  },
  SESSION_IDLE_TTL: {
    required: false,
    type: "number",
    description: "Idle window in seconds (sliding Redis key TTL).",
  },
  SESSION_ABSOLUTE_TTL: {
    required: false,
    type: "number",
    description: "Absolute session lifetime in seconds (hard cap, no extend).",
  },
  FE_RSA_PRIVATE_KEY: {
    required: false,
    type: "string",
    description: "RSA private key (PKCS8 PEM) for the FE<->server field encryption layer.",
  },
  COOKIE_SECURE: {
    required: false,
    type: "boolean",
    description: "Secure flag on auth cookies. false for HTTP, true for HTTPS.",
  },
  API_BASE_URL: {
    required: true,
    type: "url",
    description: "Base URL of the backend API gateway (login/verify-otp).",
  },

  // --- Redis / Valkey (session store) ---
  REDIS_HOST: {
    required: true,
    type: "host",
    description: "Redis/Valkey host.",
  },
  REDIS_PORT: {
    required: true,
    type: "number",
    description: "Redis/Valkey port.",
  },
  REDIS_USERNAME: {
    required: false,
    type: "string",
    description: "Redis username (default: default).",
  },
  REDIS_PASSWORD: {
    required: false,
    type: "string",
    description: "Redis password (empty if the instance has no auth).",
  },
  REDIS_KEY_PREFIX: {
    required: false,
    type: "string",
    description: "Prefix applied to every session key.",
  },

  // --- Backend (gateway target) ---
  // Optional/deprecated: the gateway now falls back to API_BASE_URL. Still
  // honoured when set (per-env override) for backward-compat.
  BACKEND_URL: {
    required: false,
    type: "url-optional",
    description: "Deprecated. Gateway falls back to API_BASE_URL; set only to override.",
  },

  // --- MFE per MENU (map by menuCode) ---
  // Config per MFE grouped under MFE_<menuCode>_* (menuCode from catalog/menus,
  // e.g. BOK_DASHBOARD). SCOPE + URL + BFF_URL per menu; MODULE defaults to
  // MFE_DEFAULT_MODULE; backend is shared via API_BASE_URL. SECTION menus have
  // no remote/env. Validated loosely since menus are dynamic.
  MFE_DEFAULT_MODULE: { required: false, type: "string", description: "Default exposed module for all MFEs (e.g. ./mount)." },

  MFE_BOK_DASHBOARD_SCOPE: { required: false, type: "string", description: "Scope of BOK_DASHBOARD remote." },
  MFE_BOK_DASHBOARD_URL: { required: false, type: "url", description: "remoteEntry.js URL of BOK_DASHBOARD." },
  MFE_BOK_DASHBOARD_BFF_URL: { required: false, type: "url-optional", description: "BFF URL for BOK_DASHBOARD." },

  MFE_BOK_POSISI_SALDO_SCOPE: { required: false, type: "string", description: "Scope of BOK_POSISI_SALDO remote." },
  MFE_BOK_POSISI_SALDO_URL: { required: false, type: "url", description: "remoteEntry.js URL of BOK_POSISI_SALDO." },
  MFE_BOK_POSISI_SALDO_BFF_URL: { required: false, type: "url-optional", description: "BFF URL for BOK_POSISI_SALDO." },

  MFE_BOK_MUTASI_VA_SCOPE: { required: false, type: "string", description: "Scope of BOK_MUTASI_VA remote." },
  MFE_BOK_MUTASI_VA_URL: { required: false, type: "url", description: "remoteEntry.js URL of BOK_MUTASI_VA." },
  MFE_BOK_MUTASI_VA_BFF_URL: { required: false, type: "url-optional", description: "BFF URL for BOK_MUTASI_VA." },

  MFE_BOK_MUTASI_GIRO_SCOPE: { required: false, type: "string", description: "Scope of BOK_MUTASI_GIRO remote." },
  MFE_BOK_MUTASI_GIRO_URL: { required: false, type: "url", description: "remoteEntry.js URL of BOK_MUTASI_GIRO." },
  MFE_BOK_MUTASI_GIRO_BFF_URL: { required: false, type: "url-optional", description: "BFF URL for BOK_MUTASI_GIRO." },
};

export { ENV_TYPES };
