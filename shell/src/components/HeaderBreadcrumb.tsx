"use client";

import Link from "next/link";
import { Menu, Home, ChevronRight } from "lucide-react";
import { useAppChrome } from "@/context/AppChromeContext";
import "./header-breadcrumb.css";

/**
 * Breadcrumb that lives INSIDE the shell header (single header bar). Shows the
 * sidebar-collapse hamburger + "Home / <active menu>". Renders nothing when no
 * breadcrumb is set (e.g. on the landing page), avoiding a second header row.
 */
export default function HeaderBreadcrumb() {
  const { breadcrumb, toggleCollapsed, hasSidebar } = useAppChrome();

  // Not inside an app (landing) — show nothing.
  if (!breadcrumb && !hasSidebar) return null;

  return (
    <div className="headerCrumb">
      {hasSidebar && (
        <button
          type="button"
          className="headerCrumbToggle"
          onClick={toggleCollapsed}
          aria-label="Perkecil / perlebar sidebar"
        >
          <Menu size={18} />
        </button>
      )}
      <Link href="/landing" className="headerCrumbHome">
        <Home size={15} />
        <span>Home</span>
      </Link>
      {breadcrumb && (
        <>
          <ChevronRight size={14} className="headerCrumbSep" />
          <span className="headerCrumbCurrent">{breadcrumb}</span>
        </>
      )}
    </div>
  );
}
