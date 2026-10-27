"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2,
  PanelRightOpen,
  PlugZap,
  Sparkles,
  X,
} from "lucide-react";
import Sidebar, { type SelectedMenu } from "@/components/Sidebar";
import { LazyMFE } from "@/components/LazyMFE";
import { useAppChrome } from "@/context/AppChromeContext";
import type { MfeDescriptor } from "@/types";
import "./app-layout.css";

interface AppWorkspaceProps {
  userName?: string;
  role?: string;
  /** Base URL for backend-hosted assets (prefix for appIcon paths). */
  iconBase?: string;
}

interface ResolvedRemote extends MfeDescriptor {
  sharedUrl?: string;
}

/**
 * App work area: sidebar (dynamic menus) + MFE host. The breadcrumb and the
 * collapse toggle live in the shell HEADER (single bar) via AppChromeContext;
 * this component only pushes the active menu label + collapsed state there.
 */
export default function AppWorkspace({
  userName,
  role,
  iconBase = "",
}: AppWorkspaceProps) {
  const { setBreadcrumb, collapsed, toggleCollapsed, hasSidebar, setHasSidebar, setAppBrand } = useAppChrome();

  // Selected application context, carried from the landing page via query.
  const router = useRouter();
  const params = useSearchParams();
  const appId = Number(params.get("appId") || 0);
  const appName = params.get("appName") || "Aplikasi";
  const orgName = params.get("orgName") || "";
  const appIconPath = params.get("appIcon") || "";
  // Prefix a relative backend path (e.g. "/icons/app/x.svg") with the base.
  const appIcon =
    appIconPath && appIconPath.startsWith("/")
      ? `${iconBase}${appIconPath}`
      : appIconPath;
  const orgLine = orgName ? `${orgName} · BNI` : "BNI";

  const [selected, setSelected] = useState<SelectedMenu | null>(null);
  const [remote, setRemote] = useState<ResolvedRemote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatRemote, setChatRemote] = useState<ResolvedRemote | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatPanelOpen, setChatPanelOpen] = useState(false);
  const [checkedAppId, setCheckedAppId] = useState<number | null>(null);
  const restoredMenuRef = useRef(false);

  // Do not render a tenant's app chrome or request its menus until the
  // server confirms that the signed-in user's organization matches appId.
  useEffect(() => {
    if (appId !== 4 && appId !== 5) {
      setCheckedAppId(appId);
      return;
    }
    let active = true;
    void fetch(`/api/ai/context?appId=${appId}`, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          router.replace("/landing");
          return;
        }
        if (active) setCheckedAppId(appId);
      })
      .catch(() => {
        if (active) router.replace("/landing");
      });
    return () => {
      active = false;
    };
  }, [appId, router]);

  // Announce that a sidebar exists so the header shows the hamburger, and push
  // the app identity into the header (replacing the logo). Clear both on
  // unmount (e.g. navigating back to landing → header shows the logo again).
  useEffect(() => {
    setHasSidebar(true);
    return () => {
      setHasSidebar(false);
      setBreadcrumb(null);
      setAppBrand(null);
    };
  }, [setHasSidebar, setBreadcrumb, setAppBrand]);

  // Keep the header app-brand in sync with the selected application.
  useEffect(() => {
    setAppBrand({ name: appName, org: orgLine, icon: appIcon || undefined });
  }, [appName, orgLine, appIcon, setAppBrand]);

  // Keep the header breadcrumb in sync with the active menu.
  useEffect(() => {
    setBreadcrumb(selected?.menuName ?? null);
  }, [selected, setBreadcrumb]);

  const loadRemote = useCallback(async (menu: SelectedMenu) => {
    setLoading(true);
    setError(null);
    setRemote(null);
    try {
      await fetch("/api/mfe/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app: menu.menuCode, appId }),
      }).catch(() => {
        /* non-fatal */
      });

      const res = await fetch("/api/mfe/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuCode: menu.menuCode, appId }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.status === "SUCCESS" && data?.data?.url) {
        setRemote(data.data as ResolvedRemote);
      } else {
        setError(
          data?.message || `MFE untuk menu "${menu.menuName}" belum tersedia.`,
        );
      }
    } catch {
      setError("Tidak dapat memuat aplikasi.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadChatRemote = useCallback(async (menu: SelectedMenu) => {
    setChatLoading(true);
    setChatError(null);
    setChatRemote(null);
    try {
      const res = await fetch("/api/mfe/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuCode: menu.menuCode, appId }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.status === "SUCCESS" && data?.data?.url) {
        setChatRemote(data.data as ResolvedRemote);
      } else {
        setChatError(
          data?.message || `MFE untuk menu "${menu.menuName}" belum tersedia.`,
        );
      }
    } catch {
      setChatError("Tidak dapat memuat AIGovtech.");
    } finally {
      setChatLoading(false);
    }
  }, []);

  function onSelect(menu: SelectedMenu) {
    setSelected(menu);
    try {
      localStorage.setItem(`shell:selected-menu:${appId}`, menu.menuCode);
    } catch {}
    if (menu.menuCode === "AIGOVTECH_CHAT") {
      setChatPanelOpen(true);
      if (!chatRemote && !chatLoading) loadChatRemote(menu);
      return;
    }
    setChatPanelOpen(false);
    loadRemote(menu);
  }

  function onLoaded(first: SelectedMenu | null) {
    if (restoredMenuRef.current) return;
    if (first && !selected) {
      setSelected(first);
      loadRemote(first);
    }
  }

  function onMenusLoaded(menus: SelectedMenu[]) {
    let savedMenuCode = "";
    try {
      savedMenuCode = localStorage.getItem(`shell:selected-menu:${appId}`) || "";
    } catch {}
    const savedMenu = menus.find((menu) => menu.menuCode === savedMenuCode);
    if (savedMenu) {
      restoredMenuRef.current = true;
      onSelect(savedMenu);
    }
  }

  function toggleChatPanel() {
    if (selected?.menuCode === "BOK_CUSTOM_DASHBOARD") {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("custom-dashboard:toggle-chatbot"));
      }
      setChatPanelOpen(false);
      return;
    }
    if (!chatPanelOpen && !chatRemote && !chatLoading) {
      loadChatRemote({
        menuCode: "AIGOVTECH_CHAT",
        menuName: "AIGovtech",
        routePath: null,
      });
    }
    setChatPanelOpen((open) => !open);
  }

  // hasSidebar is read by the header; referenced here to keep lint happy.
  void hasSidebar;
  const isCustomDashboard = selected?.menuCode === "BOK_CUSTOM_DASHBOARD";

  if (checkedAppId !== appId) {
    return (
      <div className="appHostState">
        <Loader2 size={26} className="appHostSpin" />
        <span>Memeriksa akses aplikasi...</span>
      </div>
    );
  }

  return (
    <div className="appShellRow">
      <Sidebar
        onToggleCollapse={toggleCollapsed}
        appId={appId}
        userName={userName}
        role={role}
        collapsed={collapsed}
        activeMenuCode={selected?.menuCode ?? null}
        chatOpen={chatPanelOpen}
        onToggleChat={toggleChatPanel}
        onSelect={onSelect}
        onLoaded={onLoaded}
        onMenusLoaded={onMenusLoaded}
      />

      <div className="appColumn">
        <div className="appWorkspaceBody">
        <main className={`appMain${isCustomDashboard ? " appMainCustomDashboard" : ""}`}>
          <div className={`appHostCard${isCustomDashboard ? " appHostCardCustomDashboard" : ""}`}>

              {loading ? (
                <div className="appHostState">
                  <Loader2 size={26} className="appHostSpin" />
                  <span>Memuat aplikasi...</span>
                </div>
              ) : error ? (
                <div className="appHostState appHostError">
                  <PlugZap size={26} />
                  <span>{error}</span>
                </div>
              ) : remote ? (
                <LazyMFE
                  key={remote.scope + remote.url}
                  scope={remote.scope}
                  module={remote.module}
                  url={remote.url}
                  sharedUrl={remote.sharedUrl}
                  fill={isCustomDashboard}
                />
              ) : (
                <div className="appHostState">
                  <span>Pilih menu untuk membuka aplikasi.</span>
                </div>
              )}
            </div>
          </main>
          {chatPanelOpen && !isCustomDashboard && (
            <aside
              className="aiChatPanel aiChatPanelOpen"
              id="aigovtech-chat-panel"
              aria-label="Chatbot AIGovtech"
            >
              <div className="aiChatHeader">
                <span className="aiChatBrandIcon"><Sparkles size={18} /></span>
                <span className="aiChatBrandText">
                  <strong>AIGovtech</strong>
                  <small>Asisten digital Anda</small>
                </span>
                <button
                  type="button"
                  className="aiChatClose"
                  onClick={toggleChatPanel}
                  aria-expanded={chatPanelOpen}
                  aria-controls="aigovtech-chat-panel"
                  aria-label={chatPanelOpen ? "Tutup sidebar chatbot" : "Buka sidebar chatbot"}
                  title={chatPanelOpen ? "Tutup sidebar" : "Buka sidebar"}
                >
                  {chatPanelOpen ? <X size={18} /> : <PanelRightOpen size={18} />}
                </button>
              </div>
              <div className="aiChatContent">
              {chatLoading ? (
                <div className="appHostState">
                  <Loader2 size={24} className="appHostSpin" />
                  <span>Memuat AIGovtech...</span>
                </div>
              ) : chatError ? (
                <div className="appHostState appHostError">
                  <PlugZap size={24} />
                  <span>{chatError}</span>
                </div>
              ) : chatRemote ? (
                <LazyMFE
                  key={chatRemote.scope + chatRemote.url}
                  scope={chatRemote.scope}
                  module={chatRemote.module}
                  url={chatRemote.url}
                  sharedUrl={chatRemote.sharedUrl}
                  fill
                />
              ) : null}
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
