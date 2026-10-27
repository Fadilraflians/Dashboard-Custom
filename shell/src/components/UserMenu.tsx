"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Loader2 } from "lucide-react";
import "./user-menu.css";

interface UserMenuProps {
  name: string;
  email?: string;
}

/**
 * Header user chip: avatar (initials) + name + email, with a dropdown that
 * contains the Logout action. Closes on outside click or Escape.
 */
export default function UserMenu({ name, email }: UserMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  const initials = name.slice(0, 2).toUpperCase();

  return (
    <div className="userMenu" ref={ref}>
      <button
        type="button"
        className="userMenuTrigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="userMenuAvatar">{initials}</span>
        <span className="userMenuInfo">
          <span className="userMenuName">{name}</span>
          {email && <span className="userMenuEmail">{email}</span>}
        </span>
        <ChevronDown
          size={16}
          className={`userMenuChevron ${open ? "isOpen" : ""}`}
        />
      </button>

      {open && (
        <div className="userMenuDropdown" role="menu">
          <div className="userMenuHeader">
            <span className="userMenuAvatar userMenuAvatarLg">{initials}</span>
            <span className="userMenuInfo">
              <span className="userMenuName">{name}</span>
              {email && <span className="userMenuEmail">{email}</span>}
            </span>
          </div>
          <button
            type="button"
            className="userMenuItem"
            onClick={handleLogout}
            disabled={loading}
            role="menuitem"
          >
            {loading ? (
              <Loader2 size={16} className="userMenuSpin" />
            ) : (
              <LogOut size={16} />
            )}
            Keluar
          </button>
        </div>
      )}
    </div>
  );
}
