export const dynamic = "force-dynamic";

/**
 * The /app/<menu> route exists so navigation targets resolve, but the actual
 * work area (sidebar + MFE host) is rendered by the app layout's AppWorkspace,
 * which owns menu selection and remote mounting. This page renders nothing.
 */
export default function AppMenuPage() {
  return null;
}
