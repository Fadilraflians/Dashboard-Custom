"use client";

import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={cn(
        "tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-md tw-px-2.5 tw-py-1.5",
        "tw-text-sm tw-font-medium tw-text-muted-foreground",
        "hover:tw-bg-muted hover:tw-text-foreground disabled:tw-opacity-60",
      )}
    >
      {loading ? (
        <Loader2 className="tw-h-4 tw-w-4 tw-animate-spin" />
      ) : (
        <LogOut className="tw-h-4 tw-w-4" />
      )}
      Keluar
    </button>
  );
}
