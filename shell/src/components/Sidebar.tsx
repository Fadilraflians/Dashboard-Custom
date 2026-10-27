"use client";

import { useEffect, useState } from "react";
import {
  Bot,
  ChevronRight,
  ChevronDown,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  UserRound,
} from "lucide-react";
import type { CatalogMenu } from "@/serverServices";
import DynamicIcon from "./DynamicIcon";
import "./sidebar.css";

export interface SelectedMenu {
  menuCode: string;
  menuName: string;
  routePath?: string | null;
}

interface SidebarProps {
  appId: number;
  userName?: string;
  role?: string;
  collapsed?: boolean;
  activeMenuCode?: string | null;
  chatOpen?: boolean;
  onToggleChat?: () => void;
  onToggleCollapse?: () => void;
  onSelect?: (menu: SelectedMenu) => void;
  onLoaded?: (first: SelectedMenu | null) => void;
  onMenusLoaded?: (menus: SelectedMenu[]) => void;
}

/**
 * Shell sidebar. Loads the (nested) menu tree for the current application:
 *   - SECTION          -> category label (not clickable)
 *   - node with child  -> expandable group (toggle open/close)
 *   - node with route  -> leaf, clickable -> loads its MFE (onSelect)
 * Icons come from the backend `icon` field (lucide kebab-case).
 */
export default function Sidebar({
  appId,
  userName,
  role,
  collapsed = false,
  activeMenuCode,
  chatOpen = false,
  onToggleChat,
  onToggleCollapse,
  onSelect,
  onLoaded,
  onMenusLoaded,
}: SidebarProps) {
  const [menus, setMenus] = useState<CatalogMenu[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<Record<number, boolean>>({});

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await fetch("/api/catalog/menus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appId,
            search: "",
            sortBy: "DISPLAY_ORDER",
            sortDirection: "ASC",
            pagination: { page: 1, pageSize: 50 },
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && Array.isArray(data?.data)) {
          const tree = data.data as CatalogMenu[];
          setMenus(tree);
          // Expand groups that lead to the first clickable leaf.
          const toOpen: Record<number, boolean> = {};
          const first = firstClickable(tree, toOpen);
          setOpen(toOpen);
          onMenusLoaded?.(clickableMenus(tree));
          onLoaded?.(first);
        } else {
          setMenus([]);
          setError(data?.message || "Gagal memuat menu");
        }
      } catch {
        if (active) {
          setMenus([]);
          setError("Tidak dapat terhubung ke server");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId]);

  function toggle(id: number) {
    setOpen((cur) => ({ ...cur, [id]: !cur[id] }));
  }

  return (
    <aside className={`sidebar${collapsed ? " sidebarCollapsed" : ""}`}>
      {/* Tombol Buka / Tutup Sidebar Navigasi Utama */}
      <div className={`sidebarCollapseBar${collapsed ? " sidebarCollapseBarCollapsed" : ""}`}>
        {!collapsed && <span className="sidebarNavLabel">Menu Navigasi</span>}
        {onToggleCollapse && (
          <button
            type="button"
            className="sidebarToggleBtn"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Buka Sidebar Navigasi" : "Tutup Sidebar Navigasi"}
            title={collapsed ? "Buka Sidebar (Expand)" : "Tutup Sidebar (Collapse)"}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        )}
      </div>
      {userName && !collapsed && (
        <div className="sidebarUserCard">
          <span className="sidebarUserAvatar">
            <UserRound size={18} />
          </span>
          <span className="sidebarUserText">
            <span className="sidebarUserName">{userName}</span>
            {role && (
              <span className="sidebarUserRole">
                <span className="sidebarUserDot" />
                {role}
              </span>
            )}
          </span>
        </div>
      )}

      <nav className="sidebarNav">
        {loading ? (
          <div className="sidebarLoading">
            <Loader2 size={16} className="sidebarSpin" />
            {!collapsed && <span>Memuat...</span>}
          </div>
        ) : error ? (
          <div className="sidebarError">{error}</div>
        ) : menus && menus.length > 0 ? (
          menus.map((m) => (
            <MenuNode
              key={m.menuId}
              node={m}
              depth={0}
              collapsed={collapsed}
              activeMenuCode={activeMenuCode}
              open={open}
              onToggle={toggle}
              onSelect={onSelect}
            />
          ))
        ) : (
          <div className="sidebarError">Tidak ada menu.</div>
        )}
      </nav>
    </aside>
  );
}

/** Renders one node (recursive): SECTION label / expandable group / leaf. */
function MenuNode({
  node,
  depth,
  collapsed,
  activeMenuCode,
  open,
  onToggle,
  onSelect,
}: {
  node: CatalogMenu;
  depth: number;
  collapsed: boolean;
  activeMenuCode?: string | null;
  open: Record<number, boolean>;
  onToggle: (id: number) => void;
  onSelect?: (m: SelectedMenu) => void;
}) {
  const hasChild = Array.isArray(node.child) && node.child.length > 0;

  // SECTION = category label with its children listed below.
  if (node.menuType === "SECTION") {
    return (
      <div className="sidebarGroup">
        {!collapsed && (
          <span className="sidebarGroupLabel">{node.menuName}</span>
        )}
        {(node.child ?? []).map((c) => (
          <MenuNode
            key={c.menuId}
            node={c}
            depth={depth}
            collapsed={collapsed}
            activeMenuCode={activeMenuCode}
            open={open}
            onToggle={onToggle}
            onSelect={onSelect}
          />
        ))}
      </div>
    );
  }

  // Expandable node (has children, no own route).
  if (hasChild) {
    const isOpen = open[node.menuId] ?? false;
    return (
      <div className="sidebarBranch">
        <button
          type="button"
          className="sidebarItem"
          style={depthStyle(depth)}
          onClick={() => {
            onToggle(node.menuId);
            if (node.routePath) {
              onSelect?.({
                menuCode: node.menuCode,
                menuName: node.menuName,
                routePath: node.routePath,
              });
            }
          }}
          aria-expanded={isOpen}
          title={node.menuName}
        >
          <span className="sidebarItemIcon">
            <DynamicIcon
              name={node.icon}
              size={16}
              fallback={menuIconFor(node.menuCode)}
            />
          </span>
          {!collapsed && <span>{node.menuName}</span>}
          {!collapsed &&
            (isOpen ? (
              <ChevronDown size={15} className="sidebarItemChev" />
            ) : (
              <ChevronRight size={15} className="sidebarItemChev" />
            ))}
        </button>
        {isOpen &&
          !collapsed &&
          (node.child ?? []).map((c) => (
            <MenuNode
              key={c.menuId}
              node={c}
              depth={depth + 1}
              collapsed={collapsed}
              activeMenuCode={activeMenuCode}
              open={open}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
      </div>
    );
  }

  // Leaf (clickable → loads MFE).
  const active = activeMenuCode === node.menuCode;
  return (
    <button
      type="button"
      className={`sidebarItem${active ? " sidebarItemActive" : ""}`}
      style={depthStyle(depth)}
      onClick={() =>
        onSelect?.({
          menuCode: node.menuCode,
          menuName: node.menuName,
          routePath: node.routePath,
        })
      }
      title={node.menuName}
    >
      <span className="sidebarItemIcon">
        <DynamicIcon
          name={node.icon}
          size={16}
          fallback={menuIconFor(node.menuCode)}
        />
      </span>
      {!collapsed && <span>{node.menuName}</span>}
    </button>
  );
}

function depthStyle(depth: number): React.CSSProperties | undefined {
  return depth > 0 ? { paddingLeft: `${0.75 + depth * 0.9}rem` } : undefined;
}

const MENU_ICONS = {
  BOK_DASHBOARD: "LayoutDashboard",
  BOK_BUKTI_KIRIM_JASA_GIRO: "ReceiptText",
  BOK_CHECK_DUPLIKASI_RPD: "CopyCheck",
  BOK_CUSTOM_DASHBOARD: "LayoutGrid",
  BOK_DOWNLOAD_FILE: "Download",
  BOK_KOREKSI_GIRO: "FilePenLine",
  BOK_KOREKSI_VA: "FilePenLine",
  BOK_MUTASI_BUNGA: "Coins",
  BOK_MUTASI_GIRO: "ArrowLeftRight",
  BOK_MUTASI_RKUD: "ArrowLeftRight",
  BOK_MUTASI_VA: "CreditCard",
  BOK_PEMBAYARAN_BUNGA: "CircleDollarSign",
  BOK_POSISI_SALDO_GIRO: "Landmark",
  BOK_POSISI_SALDO_VA: "Wallet",
  BOK_PRINT_DGO: "Printer",
  BOK_PUSAT_INFORMASI: "Newspaper",
  BOK_REKAP_BUNGA: "ChartColumnIncreasing",
  BOK_REKAP_KABUPATEN_KOTA: "MapPinned",
  BOK_REKAP_PROVINSI: "Map",
  BOK_REKAP_PUSKESMAS: "Hospital",
  BOK_SUMMARY_GIRO: "ChartColumn",
  BOK_SUMMARY_VA: "ChartColumn",
  BOK_UPLOAD_PAGU: "Upload",
  BOK_USER_MANUAL: "BookOpen",
} as const;

function menuIconFor(menuCode: string): keyof typeof import("lucide-react").icons {
  return (
    MENU_ICONS[menuCode as keyof typeof MENU_ICONS] ?? "LayoutGrid"
  ) as keyof typeof import("lucide-react").icons;
}

/**
 * Finds the first clickable (routed, no-child) menu, descending into SECTION
 * and expandable nodes. Records the ids of ancestor branches to pre-open.
 */
function firstClickable(
  tree: CatalogMenu[],
  openAcc: Record<number, boolean>,
): SelectedMenu | null {
  for (const m of tree) {
    const hasChild = Array.isArray(m.child) && m.child.length > 0;
    if (m.menuType === "SECTION") {
      const found = firstClickable(m.child ?? [], openAcc);
      if (found) return found;
    } else if (m.routePath) {
      return {
        menuCode: m.menuCode,
        menuName: m.menuName,
        routePath: m.routePath,
      };
    } else if (hasChild) {
      const found = firstClickable(m.child ?? [], openAcc);
      if (found) {
        openAcc[m.menuId] = true;
        return found;
      }
    }
  }
  return null;
}

function clickableMenus(tree: CatalogMenu[]): SelectedMenu[] {
  return tree.flatMap((menu) => {
    if (menu.routePath) {
      return [{ menuCode: menu.menuCode, menuName: menu.menuName, routePath: menu.routePath }];
    }
    return Array.isArray(menu.child) ? clickableMenus(menu.child) : [];
  });
}

