"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Shared "app chrome" state between the shell header and the /app workspace.
 *
 * The header (owned by the protected layout) renders the breadcrumb and the
 * sidebar-collapse toggle, but the *values* (active menu label, collapsed
 * state) live in the workspace. This context bridges them so the breadcrumb
 * can sit inside the single shell header instead of a second bar.
 *
 * On the landing page nothing sets a breadcrumb, so the header shows none.
 * MFEs can later push their own breadcrumb label through the same setter
 * ("render into the shell header").
 */
/** Selected-application identity shown in the shell header (replaces the logo). */
export interface AppBrand {
  name: string;
  org?: string;
  icon?: string;
}

interface AppChromeState {
  /** Active menu/breadcrumb label (null = not inside an app). */
  breadcrumb: string | null;
  setBreadcrumb: (label: string | null) => void;
  /** Whether the sidebar is collapsed. */
  collapsed: boolean;
  toggleCollapsed: () => void;
  /** Whether a sidebar is present (controls the hamburger visibility). */
  hasSidebar: boolean;
  setHasSidebar: (v: boolean) => void;
  /** App identity for the header; null on landing (header shows the logo). */
  appBrand: AppBrand | null;
  setAppBrand: (b: AppBrand | null) => void;
}

const AppChromeContext = createContext<AppChromeState | null>(null);

export function AppChromeProvider({ children }: { children: ReactNode }) {
  const [breadcrumb, setBreadcrumb] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [hasSidebar, setHasSidebar] = useState(false);
  const [appBrand, setAppBrand] = useState<AppBrand | null>(null);

  const value = useMemo<AppChromeState>(
    () => ({
      breadcrumb,
      setBreadcrumb,
      collapsed,
      toggleCollapsed: () => setCollapsed((v) => !v),
      hasSidebar,
      setHasSidebar,
      appBrand,
      setAppBrand,
    }),
    [breadcrumb, collapsed, hasSidebar, appBrand],
  );

  return (
    <AppChromeContext.Provider value={value}>
      {children}
    </AppChromeContext.Provider>
  );
}

export function useAppChrome(): AppChromeState {
  const ctx = useContext(AppChromeContext);
  if (!ctx) {
    throw new Error("useAppChrome must be used within AppChromeProvider");
  }
  return ctx;
}
