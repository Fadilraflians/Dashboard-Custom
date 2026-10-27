"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Toast message shape used across the app: show({severity,summary,detail,life}).
 */
export interface ToastMessage {
  severity?: "success" | "info" | "warn" | "warning" | "error" | "danger";
  summary?: string;
  detail?: string;
  /** Auto-dismiss duration in ms (default 4000). */
  life?: number;
}

interface ToastContextValue {
  show: (message: ToastMessage | ToastMessage[]) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

interface ActiveToast extends ToastMessage {
  id: number;
}

const severityStyle: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; cls: string }
> = {
  success: { icon: CheckCircle2, cls: "tw-text-success" },
  info: { icon: Info, cls: "tw-text-primary" },
  warn: { icon: AlertTriangle, cls: "tw-text-warning" },
  warning: { icon: AlertTriangle, cls: "tw-text-warning" },
  error: { icon: XCircle, cls: "tw-text-danger" },
  danger: { icon: XCircle, cls: "tw-text-danger" },
};

let seq = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ActiveToast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: ToastMessage | ToastMessage[]) => {
      const list = Array.isArray(message) ? message : [message];
      for (const m of list) {
        const id = ++seq;
        setToasts((prev) => [...prev, { ...m, id }]);
        const life = m.life ?? 4000;
        window.setTimeout(() => dismiss(id), life);
      }
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="tw-fixed tw-right-4 tw-top-4 tw-z-[9999] tw-flex tw-flex-col tw-gap-2">
        {toasts.map((t) => {
          const sev = severityStyle[t.severity ?? "info"] ?? severityStyle.info;
          const Icon = sev.icon;
          return (
            <div
              key={t.id}
              role="alert"
              className={cn(
                "tw-flex tw-w-80 tw-items-start tw-gap-3 tw-rounded-md tw-border tw-border-border",
                "tw-bg-card tw-p-3 tw-text-card-foreground tw-shadow-lg",
              )}
            >
              <Icon className={cn("tw-mt-0.5 tw-h-5 tw-w-5 tw-shrink-0", sev.cls)} />
              <div className="tw-flex-1 tw-text-sm">
                {t.summary && (
                  <p className="tw-font-semibold tw-leading-tight">{t.summary}</p>
                )}
                {t.detail && (
                  <p className="tw-mt-0.5 tw-text-muted-foreground">{t.detail}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="tw-text-muted-foreground hover:tw-text-foreground"
                aria-label="Tutup"
              >
                <XCircle className="tw-h-4 tw-w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
