import "./env-config.js";

/** @type {import('next').NextConfig} */

export const customNextConfig = {
  compiler: {
    removeConsole: process.env.NODE_ENV !== "development",
  },
  serverExternalPackages: ["winston", "winston-daily-rotate-file"],
  reactStrictMode: false,
  output:
    process.env.NEXT_OUTPUT_STANDALONE === "true" ||
    process.env.CI ||
    process.platform !== "win32"
      ? "standalone"
      : undefined,
  productionBrowserSourceMaps: false,
  typescript: {
    ignoreBuildErrors: false,
  },
  // Next's dev static-paths worker defaults to child_process.fork(). On some
  // Windows setups that call fails with EPERM, which makes dynamic routes such
  // as /app/[menu] return 500. Use Node worker_threads for that worker instead.
  experimental: {
    workerThreads: true,
  },
  poweredByHeader: false,
  reactProductionProfiling: false,
  devIndicators: false,
};
