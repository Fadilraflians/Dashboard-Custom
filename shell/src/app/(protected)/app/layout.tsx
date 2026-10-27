import { ReactNode, Suspense } from "react";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, getSession } from "@/lib/session";
import AppWorkspace from "./AppWorkspace";

/**
 * App shell layout — renders the work area (sidebar + MFE host) for /app/*.
 * The parent (protected) layout handles auth + header. The selected
 * application's context (appId/name/org/icon) comes from the landing page via
 * URL query params, read client-side inside AppWorkspace.
 */
export default async function AppShellLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore.get(AUTH_COOKIE_NAME)?.value);

  // Base URL for backend-hosted assets (e.g. appIcon "/icons/app/..svg").
  // API_BASE_URL is server-only; resolve the icon base here and pass it down.
  const iconBase = (process.env.API_BASE_URL || "").replace(/\/$/, "");

  return (
    <>
      <Suspense fallback={null}>
        <AppWorkspace
          userName={session?.name ?? "Pengguna"}
          role={session?.role ?? ""}
          iconBase={iconBase}
        />
      </Suspense>
      <div style={{ display: "none" }}>{children}</div>
    </>
  );
}
