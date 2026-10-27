"use client";

import { useEffect, useState } from "react";
import { LazyMFE } from "@/components/LazyMFE";
import { loadConfig } from "@/lib/config";
import { clientLog } from "@/lib/clientLog";
import { SpinnerIcon } from "@/lib/piIcon";
import type { MfeDescriptor } from "@/types";

interface MenuMfeHostProps {
  /** MFE app key = config descriptor key = Module Federation scope. */
  appKey: string;
  /** Menu label (for the header + error text). */
  title: string;
}

/**
 * Loads and mounts the remote for a given menu/appKey.
 *
 * Flow: set the `mfe_context` cookie for this app (so the remote knows which
 * app/user it runs as) -> fetch /api/config -> pick cfg.mfe[appKey] -> LazyMFE.
 * Re-runs whenever the appKey changes (i.e. the user switches menus), so the
 * previous remote is unmounted and the new one mounted.
 */
export default function MenuMfeHost({ appKey, title }: MenuMfeHostProps) {
  const [remote, setRemote] = useState<MfeDescriptor | null>(null);
  const [sharedUrl, setSharedUrl] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setRemote(null);
    setError(null);

    async function run() {
      try {
        // Record the selected app context (non-HttpOnly cookie the MFE reads).
        await fetch("/api/mfe/select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ app: appKey }),
        }).catch(() => {
          /* non-fatal: continue to load the remote regardless */
        });

        const cfg = await loadConfig();
        const descriptor = cfg.mfe[appKey];
        if (!active) return;
        if (!descriptor || !descriptor.url) {
          clientLog({
            level: "error",
            category: "LOAD_MFE",
            event: "MFE_CONFIG_MISSING",
            service: `MFE:${appKey}`,
            app: appKey,
            message: `Descriptor/URL untuk "${appKey}" tidak ada di /api/config.`,
          });
          setError(`Konfigurasi MFE "${appKey}" belum tersedia.`);
          return;
        }
        setSharedUrl(cfg.sharedUrl || undefined);
        setRemote(descriptor);
      } catch (err) {
        if (active) {
          clientLog({
            level: "error",
            category: "SHELL",
            event: "CONFIG_FAIL",
            service: "SHELL",
            app: appKey,
            message: `Gagal memuat /api/config: ${
              err instanceof Error ? err.message : String(err)
            }`,
          });
          setError("Gagal memuat konfigurasi aplikasi.");
        }
      }
    }

    run();
    return () => {
      active = false;
    };
  }, [appKey]);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>
          {title}
        </h1>
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          padding: 16,
          minHeight: 320,
        }}
      >
        {error ? (
          <p style={{ color: "#ef4444" }}>{error}</p>
        ) : remote ? (
          <LazyMFE
            key={appKey}
            scope={remote.scope}
            module={remote.module}
            url={remote.url}
            sharedUrl={sharedUrl}
          />
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 200,
            }}
          >
            <SpinnerIcon
              size={28}
              style={{ color: "#4f46e5" }}
              className="tw-animate-spin"
            />
          </div>
        )}
      </div>
    </div>
  );
}
