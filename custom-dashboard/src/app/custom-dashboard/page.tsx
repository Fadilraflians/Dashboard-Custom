"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  FolderPlus,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Wallet,
  ArrowLeftRight,
  TrendingUp,
  LayoutGrid,
  Trash2,
  Check,
  ArrowLeft,
  Send,
  Bot,
  Database,
  Layers,
  LayoutDashboard,
  GripVertical,
  Pencil,
  Eye,
  Info,
  X,
  UsersRound,
  UserPlus,
} from "lucide-react";

import DraggableResizableWidget from "./DraggableResizableWidget";
import { computeGridLayout } from "./gridLayout";
import styles from "./page.module.css";

function SharedUiUnavailable() {
  return <div style={{ padding: 16, color: "#667085" }}>Komponen visual shared UI tidak tersedia.</div>;
}

const SharedBarChartMonthlySales = React.lazy(async () => {
  try {
    const remote = await import("sharedUi/BarChartMonthlySales");
    if (typeof remote.default === "function") return remote;
  } catch {}
  return { default: SharedUiUnavailable };
});
const SharedLineChartMonthlySales = React.lazy(async () => {
  try {
    const remote = await import("sharedUi/LineChartMonthlySales");
    if (typeof remote.default === "function") return remote;
  } catch {}
  return { default: SharedUiUnavailable };
});
const SharedMetricCard = React.lazy(async () => {
  try {
    const remote = await import("sharedUi/MetricCard");
    if (typeof remote.default === "function") return remote;
  } catch {}
  return { default: SharedUiUnavailable };
});
const SharedDonutProductChart = React.lazy(async () => {
  try {
    const remote = await import("sharedUi/DonutProductChart");
    if (typeof remote.default === "function") return remote;
  } catch {}
  return { default: SharedUiUnavailable };
});
const SharedCategoryBarChart = React.lazy(async () => {
  try {
    const remote = await import("sharedUi/CategoryBarChart");
    if (typeof remote.default === "function") return remote;
  } catch {}
  return { default: SharedUiUnavailable };
});
const SharedAnalyticsPieChart = React.lazy(async () => {
  try {
    const remote = await import("sharedUi/AnalyticsPieChart");
    if (typeof remote.default === "function") return remote;
  } catch {}
  return { default: SharedUiUnavailable };
});
const SharedAnalyticsAreaChart = React.lazy(async () => {
  try {
    const remote = await import("sharedUi/AnalyticsAreaChart");
    if (typeof remote.default === "function") return remote;
  } catch {}
  return { default: SharedUiUnavailable };
});
const SharedAnalyticsScatterChart = React.lazy(async () => {
  try {
    const remote = await import("sharedUi/AnalyticsScatterChart");
    if (typeof remote.default === "function") return remote;
  } catch {}
  return { default: SharedUiUnavailable };
});
const SharedAnalyticsDataTable = React.lazy(async () => {
  try {
    const remote = await import("sharedUi/AnalyticsDataTable");
    if (typeof remote.default === "function") return remote;
  } catch {}
  return { default: SharedUiUnavailable };
});
const TrendAlokasiChart = React.lazy(async () => {
  try {
    const remote = await import("sharedUi/TrendAlokasiChart");
    if (typeof remote.default === "function") return remote;
  } catch {}
  return { default: SharedUiUnavailable };
});
const DonutSubprogramChart = React.lazy(async () => {
  try {
    const remote = await import("sharedUi/DonutSubprogramChart");
    if (typeof remote.default === "function") return remote;
  } catch {}
  return { default: SharedUiUnavailable };
});

// Fields the API recalculates when the source data changes. Everything else
// (title, position, size) stays exactly as the user left it.
const REFRESHED_WIDGET_FIELDS = [
  "data", "summary", "value", "formattedValue", "metricLabel", "centerLabel", "delta", "badge", "sub", "subtitle", "source",
] as const;

export interface WidgetItem {
  id: string;
  type: "card" | "chart";
  cardType?: "total-pendapatan" | "transaksi" | "kpi-card";
  /** Lucide icon name chosen by the API, for example "wallet" or "star". */
  icon?: string;
  /**
   * How the numbers were calculated: the question that created the widget and
   * the state of the source data at that time. The API uses it to recalculate
   * the widget when the source data changes.
   */
  source?: { question: string; fingerprint?: string | null; at?: string; note?: string };
  componentName?: string;
  chartType?: "bar-monthly" | "line-monthly" | "line-category" | "bar-category" | "donut-product" | "pie-category" | "area-category" | "scatter" | "table" | "tren-sp2d" | "proporsi-program" | "line" | "bar" | "pie" | "area";
  title: string;
  subtitle?: string;
  value?: number;
  formattedValue?: string;
  sub?: string;
  badge?: string;
  delta?: number;
  data?: any;
  metricLabel?: string;
  centerLabel?: string;
  summary?: any;
  width?: string;
  height?: number;
  x?: number;
  y?: number;
}

export interface DashboardItem {
  id: string;
  databaseId?: string;
  title: string;
  category: string;
  badge: string;
  badgeTone?: "green" | "teal" | "orange" | "gray";
  subtitle: string;
  metricText: string;
  widgets: WidgetItem[];
  /** RBAC: the signed-in user's role on this dashboard (viewer/editor/pengelola/admin). */
  roleAccess?: string;
  /** Saved description (DASHBOARDS.DESCRIPTION); null when not set. */
  description?: string | null;
}

export interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  widget?: WidgetItem;
  widgets?: WidgetItem[];
}

const FASHION_STARTER_PROMPTS = [
  "Apa saja header dan nilai yang tersedia di database?",
  "Buatkan line chart berdasarkan data penjualan perbulan",
  "Buatkan bar chart berdasarkan data penjualan perbulan",
  "Tampilkan kartu Total Pendapatan dan Transaksi",
  "Tampilkan produk fashion terlaris",
  "Terapkan semua widget rekomendasi fashion",
];

const KEMENKEU_STARTER_PROMPTS = [
  "Apa saja kolom dan nilai yang tersedia di database?",
  "Buatkan bar chart jumlah transaksi berdasarkan platform e-commerce",
  "Buatkan line chart total pembayaran per bulan",
  "Tampilkan kartu total pembayaran dan jumlah transaksi",
  "Bandingkan profit berdasarkan kategori produk",
  "Tampilkan metode pembayaran yang paling sering digunakan",
];

interface TenantContext {
  tenant: "fashion" | "kemenkeu";
  organizationCode: string;
  organizationName: string;
  databaseLabel: string;
  table: string;
  /** RBAC: true for admin users. Admin-only UI (dashboard detail/member) is gated on this. */
  isAdmin?: boolean;
}

interface DashboardMember {
  id: number;
  username: string;
  name: string;
  email: string | null;
  roleAccess: string;
  unit: string | null;
}

interface CandidateUser {
  username: string;
  name: string;
  email: string | null;
  isAdmin: boolean;
}

/** Turns a dashboard stored in the database into a sidebar entry. */
function dashboardFromPersisted(
  context: TenantContext,
  entry: { dashboardId: string | number; name?: string; dashboardName?: string; widgets?: WidgetItem[]; roleAccess?: string | null; description?: string | null },
): DashboardItem {
  const widgets = Array.isArray(entry.widgets) ? entry.widgets.map(normalizeWidgetSubtitle) : [];
  const databaseId = String(entry.dashboardId);
  return {
    id: `dash-${context.tenant}-${databaseId}`,
    databaseId,
    title: (entry.name ?? entry.dashboardName)?.trim() || `Dashboard ${databaseId}`,
    category: context.tenant === "kemenkeu" ? "E-commerce" : "Fashion",
    badge: "Tersimpan",
    badgeTone: "teal",
    subtitle: `${context.table} · Oracle`,
    metricText: `${widgets.length} Widget`,
    widgets,
    roleAccess: entry.roleAccess ?? (context.isAdmin ? "admin" : undefined),
    description: entry.description ?? null,
  };
}

function starterPromptsFor(context: TenantContext | null) {
  return context?.tenant === "kemenkeu"
    ? KEMENKEU_STARTER_PROMPTS
    : FASHION_STARTER_PROMPTS;
}

function normalizeWidgetName(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizeWidgetSubtitle(widget: WidgetItem): WidgetItem {
  const subtitle = String(widget.subtitle || widget.sub || "").trim();
  if (!/^(?:tolong|mohon|buatkan|buat|bikin|tampilan|tampilkan|tunjukkan|coba|please|show|create|apa|apakah|bagaimana|berapa|mengapa|siapa|di\s+mana)\b/i.test(subtitle)) {
    return widget;
  }
  if (widget.type !== "chart") {
    return { ...widget, subtitle: `Ringkasan ${widget.title.toLocaleLowerCase()}` };
  }

  const title = widget.title
    .replace(/\s*-\s*(?:pie|donut|doughnut|bar|line|area|scatter)\s+chart$/i, "")
    .replace(/\s*-\s*table$/i, "");
  const [titleDimension = "kategori", ...titleMetricParts] = title.split(/\s*-\s*/);
  const dimension = String(widget.centerLabel || titleDimension).replace(/_/g, " ").toLocaleLowerCase();
  const metric = String(widget.metricLabel || titleMetricParts.join(" ") || "nilai").replace(/_/g, " ").toLocaleLowerCase();
  const chartType = String(widget.chartType || "").toLocaleLowerCase();
  const subtitleText = chartType.startsWith("pie") || chartType.startsWith("donut")
    ? `Proporsi ${metric} menurut ${dimension}`
    : chartType.startsWith("line") || chartType.startsWith("area")
      ? `Tren ${metric} menurut ${dimension}`
      : chartType.startsWith("scatter")
        ? `Sebaran ${metric} menurut ${dimension}`
        : chartType === "table"
          ? `Rincian ${metric} menurut ${dimension}`
          : `Perbandingan ${metric} menurut ${dimension}`;
  return { ...widget, subtitle: subtitleText };
}

function resolveWidgetDeleteRequest(text: string, widgets: WidgetItem[]): { widget?: WidgetItem; reply?: string } | null {
  if (!/\b(hapus|menghapus|hapuskan|delete|remove|buang|hilangkan)\b/i.test(text)) return null;
  const normalized = normalizeWidgetName(text);
  const wantsCard = /\b(card|kartu)\b/i.test(text);
  const wantsChart = /\b(chart|grafik|diagram)\b/i.test(text);
  const target = normalized
    .replace(/\b(hapus|menghapus|hapuskan|delete|remove|buang|hilangkan|widget|card|kartu|chart|grafik|diagram|dashboard|yang|bernama|dengan|ini|itu|saya|aku|tolong|mohon|ai|semua|seluruh)\b/g, " ")
    .replace(/\s+/g, " ").trim();
  const listedWidgets = widgets.map((widget) => widget.title).filter(Boolean);
  if (!target) {
    return { reply: listedWidgets.length ? `Sebutkan nama widget yang ingin dihapus. Widget di dashboard aktif: ${listedWidgets.join(", ")}.` : "Dashboard aktif belum memiliki widget untuk dihapus." };
  }

  const aliases: Record<string, string[]> = {
    "jumlah pesanan": ["jumlah transaksi", "total pesanan", "total transaksi"],
    "jumlah transaksi": ["jumlah pesanan", "total pesanan", "total transaksi"],
    "total pesanan": ["jumlah pesanan", "jumlah transaksi", "total transaksi"],
  };
  const targetNames = [target, ...(aliases[target] || [])];
  const matches = widgets.filter((widget) => {
    if (wantsCard && widget.type !== "card") return false;
    if (wantsChart && widget.type !== "chart") return false;
    const title = normalizeWidgetName(widget.title);
    const id = normalizeWidgetName(widget.id);
    return targetNames.some((name) => title === name || title.includes(name) || name.includes(title) || id.includes(name));
  });
  if (matches.length === 1) return { widget: matches[0] };
  if (matches.length > 1) return { reply: `Saya menemukan beberapa widget yang cocok: ${matches.map((widget) => widget.title).join(", ")}. Sebutkan judul yang ingin dihapus.` };
  return { reply: `Widget "${target}" tidak ditemukan di dashboard aktif.${listedWidgets.length ? ` Widget yang tersedia: ${listedWidgets.join(", ")}.` : ""}` };
}

type AiHealthStatus = "checking" | "connected" | "database-disconnected" | "model-disconnected" | "disconnected";

export default function CustomDashboardPage() {
  const [tenantContext, setTenantContext] = useState<TenantContext | null>(null);
  const [dashboards, setDashboards] = useState<DashboardItem[]>([]);
  const [selectedDashboardId, setSelectedDashboardId] = useState<string>("");
  const [widgetsLoaded, setWidgetsLoaded] = useState(false);
  const [initialWidgetRefreshDone, setInitialWidgetRefreshDone] = useState(false);

  const [activeDashboardFilterId, setActiveDashboardFilterId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [sidebarView, setSidebarView] = useState<"dashboards" | "chatbot">("dashboards");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [detailDashboard, setDetailDashboard] = useState<DashboardItem | null>(null);
  const [detailStep, setDetailStep] = useState<1 | 2>(1);
  // Step 2 member management (admin only).
  const [memberList, setMemberList] = useState<DashboardMember[]>([]);
  const [candidateUsers, setCandidateUsers] = useState<CandidateUser[]>([]);
  const [memberUsername, setMemberUsername] = useState<string>("");
  const [memberRole, setMemberRole] = useState<string>("viewer");
  const [memberUnit, setMemberUnit] = useState<string>("");
  const [memberBusy, setMemberBusy] = useState<boolean>(false);
  // Inline edit of an existing member's access role.
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);
  const [editingMemberRole, setEditingMemberRole] = useState<string>("viewer");
  // Edit of dashboard name + description in Step 1 (pengelola/admin only).
  const [detailEditName, setDetailEditName] = useState<string>("");
  const [detailEditDesc, setDetailEditDesc] = useState<string>("");
  const [detailInfoBusy, setDetailInfoBusy] = useState<boolean>(false);
  const [newDashboardTitle, setNewDashboardTitle] = useState<string>("");
  const [editingDashboardId, setEditingDashboardId] = useState<string | null>(null);
  const [editingDashboardTitle, setEditingDashboardTitle] = useState("");

  // Chatbot State
  const [chatDraft, setChatDraft] = useState<string>("");
  const [chatSending, setChatSending] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [highlightedWidgetIds, setHighlightedWidgetIds] = useState<string[]>([]);
  // Widget focused by clicking it: shown as a context chip above the chatbot.
  const [focusedWidgetId, setFocusedWidgetId] = useState<string | null>(null);
  // Entrance animation: replays every time a dashboard is opened/clicked and on
  // every (re)load. A key that changes forces widgets to remount & re-animate.
  const [animateWidgets, setAnimateWidgets] = useState<boolean>(false);
  const [animationNonce, setAnimationNonce] = useState<number>(0);
  const [aiHealthStatus, setAiHealthStatus] = useState<AiHealthStatus>("checking");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      content: "Halo! Saya AiGovtech, asisten analitik data. Saya dapat menganalisis data dari database perusahaan yang sedang Anda akses dan membantu membuat kartu atau grafik.",
    },
  ]);
  const chatMessagesAreaRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const activeDashboardRef = useRef<{ databaseId?: string; title: string; widgetCount: number } | null>(null);
  const nextChatId = useRef<number>(2);
  const pendingWidgetScrollIdsRef = useRef<string[]>([]);

  const starterPrompts = starterPromptsFor(tenantContext);
  const hasDashboards = dashboards.length > 0;
  // RBAC: only admins may open the dashboard Detail / Member configuration.
  const isAdmin = tenantContext?.isAdmin === true;

  // Role of the signed-in user on the currently selected dashboard.
  // Admin always has full rights. When RBAC is off (IFP/legacy) tenantContext
  // has no isAdmin flag and roleAccess is undefined -> treat as full rights so
  // existing behaviour is preserved.
  const rbacActive = tenantContext?.isAdmin !== undefined;
  const activeRole = isAdmin
    ? "admin"
    : (dashboards.find((d) => d.id === selectedDashboardId)?.roleAccess || null);
  const roleRank: Record<string, number> = { viewer: 1, editor: 2, pengelola: 3, admin: 4 };
  const rank = activeRole ? (roleRank[activeRole] || 0) : 0;
  // Capability flags. Without RBAC (legacy) everything is allowed.
  const canEditWidgets = !rbacActive || isAdmin || rank >= roleRank.editor;
  const canAddDashboard = !rbacActive || isAdmin || rank >= roleRank.pengelola;
  // Viewers can only look; the chatbot (which creates/changes widgets) is for
  // editor and above. Same threshold as editing widgets.
  const canUseChatbot = canEditWidgets;

  // Seed the editable name/description fields when the Detail overlay opens.
  useEffect(() => {
    if (!detailDashboard) return;
    const live = dashboards.find((d) => d.id === detailDashboard.id) || detailDashboard;
    setDetailEditName(live.title);
    setDetailEditDesc(live.description ?? "");
    // Only when the opened dashboard changes (not on every keystroke).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailDashboard?.id]);

  // Load members + candidate users when the Member step opens for a dashboard.
  useEffect(() => {
    if (!detailDashboard || detailStep !== 2 || !isAdmin) return;
    const dashboardId = detailDashboard.databaseId || detailDashboard.id;
    let active = true;
    (async () => {
      try {
        const appId = new URLSearchParams(window.location.search).get("appId");
        const url = new URL("/api/dashboard-members", window.location.origin);
        url.searchParams.set("dashboardId", String(dashboardId));
        if (appId) url.searchParams.set("appId", appId);
        const res = await fetch(url, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!active) return;
        if (res.ok) {
          setMemberList(Array.isArray(data.members) ? data.members : []);
          setCandidateUsers(Array.isArray(data.candidates) ? data.candidates : []);
        } else {
          setToastMessage(data.message || "Gagal memuat member.");
        }
      } catch {
        if (active) setToastMessage("Gagal memuat member.");
      }
    })();
    return () => { active = false; };
  }, [detailDashboard, detailStep, isAdmin]);

  async function handleAddMember() {
    if (!detailDashboard || !memberUsername) return;
    const dashboardId = detailDashboard.databaseId || detailDashboard.id;
    setMemberBusy(true);
    try {
      const appId = new URLSearchParams(window.location.search).get("appId");
      const url = new URL("/api/dashboard-members", window.location.origin);
      if (appId) url.searchParams.set("appId", appId);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dashboardId: String(dashboardId),
          username: memberUsername,
          roleAccess: memberRole,
          unit: memberUnit || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMemberList(Array.isArray(data.members) ? data.members : []);
        setMemberUsername("");
        setMemberUnit("");
        setMemberRole("viewer");
        setToastMessage("Member ditambahkan.");
      } else {
        setToastMessage(data.message || "Gagal menambah member.");
      }
    } catch {
      setToastMessage("Gagal menambah member.");
    } finally {
      setMemberBusy(false);
    }
  }

  function handleStartEditMember(member: DashboardMember) {
    setEditingMemberId(member.id);
    setEditingMemberRole(member.roleAccess);
  }

  // Save dashboard name + description (Step 1). Updates local state, then
  // persists the whole list including the edited description via PUT /dashboards.
  async function handleSaveDashboardInfo() {
    if (!detailDashboard) return;
    const name = detailEditName.trim();
    if (!name) {
      setToastMessage("Nama dashboard tidak boleh kosong.");
      return;
    }
    const targetId = detailDashboard.id;
    const description = detailEditDesc.trim();
    setDetailInfoBusy(true);

    // Update local state so UI reflects the change immediately.
    const nextDashboards = dashboards.map((d) =>
      d.id === targetId ? { ...d, title: name, description } : d,
    );
    setDashboards(nextDashboards);

    try {
      const appId = new URLSearchParams(window.location.search).get("appId");
      const endpoint = new URL("/api/gateway/aigovtech/dashboards", window.location.origin);
      if (appId) endpoint.searchParams.set("appId", appId);
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        // Send the full list; include description for every dashboard so the
        // edited one is saved and others keep theirs.
        body: JSON.stringify({
          dashboards: nextDashboards.map((d) => ({
            dashboardId: d.databaseId,
            name: d.title,
            description: d.description ?? "",
          })),
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || `Gagal menyimpan (HTTP ${response.status}).`);
      }
      setToastMessage("Informasi dashboard tersimpan.");
    } catch (error) {
      console.error("Failed to save dashboard info", error);
      setToastMessage(error instanceof Error ? error.message : "Gagal menyimpan informasi dashboard.");
    } finally {
      setDetailInfoBusy(false);
    }
  }

  async function handleSaveMemberRole(member: DashboardMember) {
    if (!detailDashboard) return;
    const dashboardId = detailDashboard.databaseId || detailDashboard.id;
    setMemberBusy(true);
    try {
      const appId = new URLSearchParams(window.location.search).get("appId");
      const url = new URL("/api/dashboard-members", window.location.origin);
      if (appId) url.searchParams.set("appId", appId);
      // POST MERGE-updates the existing member (same unique key) with the new role.
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dashboardId: String(dashboardId),
          username: member.username,
          roleAccess: editingMemberRole,
          unit: member.unit,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMemberList(Array.isArray(data.members) ? data.members : []);
        setEditingMemberId(null);
        setToastMessage("Hak akses member diperbarui.");
      } else {
        setToastMessage(data.message || "Gagal memperbarui hak akses.");
      }
    } catch {
      setToastMessage("Gagal memperbarui hak akses.");
    } finally {
      setMemberBusy(false);
    }
  }

  async function handleRemoveMember(id: number) {
    setMemberBusy(true);
    try {
      const appId = new URLSearchParams(window.location.search).get("appId");
      const url = new URL("/api/dashboard-members", window.location.origin);
      url.searchParams.set("id", String(id));
      if (appId) url.searchParams.set("appId", appId);
      const res = await fetch(url, { method: "DELETE" });
      if (res.ok) {
        setMemberList((list) => list.filter((m) => m.id !== id));
      } else {
        const data = await res.json().catch(() => ({}));
        setToastMessage(data.message || "Gagal menghapus member.");
      }
    } catch {
      setToastMessage("Gagal menghapus member.");
    } finally {
      setMemberBusy(false);
    }
  }

  // Members available to add = candidate users not already members.
  const availableCandidates = candidateUsers.filter(
    (c) => !memberList.some((m) => m.username === c.username),
  );

  // The widget currently focused (clicked) across all dashboards.
  const focusedWidget = focusedWidgetId
    ? dashboards.flatMap((d) => d.widgets).find((w) => w.id === focusedWidgetId) || null
    : null;

  // The Detail overlay must reflect the LIVE dashboard (widgets sync from the
  // DB after it opens), not the snapshot captured when the button was clicked.
  // Fall back to the snapshot if the dashboard is no longer in the list.
  const detailDashboardLive = detailDashboard
    ? dashboards.find((d) => d.id === detailDashboard.id) || detailDashboard
    : null;

  // Click a widget -> focus it and open the chatbot so the selected widget
  // becomes the conversation context (see the composer chip). The focus ring is
  // driven solely by focusedWidgetId, so clearing the chip clears the ring.
  function handleFocusWidget(widgetId: string) {
    // Viewers cannot use the chatbot, so focusing a widget there is pointless.
    if (!canUseChatbot) return;
    setFocusedWidgetId(widgetId);
    setSidebarView("chatbot");
  }

  useEffect(() => {
    let active = true;
    let refreshInterval: number | undefined;
    // After the saved widgets are on screen, ask the API to recalculate the ones
    // whose source data changed since they were saved, then merge the new
    // numbers in. Runs on every (re)load; nothing happens when data is unchanged.
    async function syncWidgetsWithSource(appId: string | null, initial = false) {
      const targetDashboard = activeDashboardRef.current;
      if (!targetDashboard?.databaseId || !/^\d+$/.test(targetDashboard.databaseId)) {
        if (initial) setInitialWidgetRefreshDone(true);
        return;
      }
      try {
        const refreshUrl = new URL("/api/gateway/aigovtech/widgets/refresh", window.location.origin);
        if (appId) refreshUrl.searchParams.set("appId", appId);
        const refreshResponse = await fetch(refreshUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ force: initial, dashboardIds: [targetDashboard.databaseId] }),
          cache: "no-store",
        });
        const refreshResult = await refreshResponse.json().catch(() => ({}));
        if (!active) return;
        if (!refreshResponse.ok) {
          console.error("Widget refresh endpoint failed", refreshResult);
        }

        const widgetsUrl = new URL("/api/gateway/aigovtech/widgets", window.location.origin);
        if (appId) widgetsUrl.searchParams.set("appId", appId);
        const widgetsResponse = await fetch(widgetsUrl, { cache: "no-store" });
        const widgetsPayload = await widgetsResponse.json().catch(() => ({}));
        if (!active) return;
        if (!widgetsResponse.ok || !Array.isArray(widgetsPayload.dashboards)) {
          throw new Error("Widget terbaru tidak dapat dimuat dari database.");
        }

        const saved = (widgetsPayload.dashboards as { dashboardId: string | number; widgets: WidgetItem[] }[]).find(
          (entry) => String(entry.dashboardId) === targetDashboard.databaseId,
        );
        const savedWidgets = saved?.widgets || [];

        setDashboards((current) =>
          current.map((dashboard) => {
            if (dashboard.databaseId !== targetDashboard.databaseId || !saved) return dashboard;
            return {
              ...dashboard,
              widgets: dashboard.widgets.map((widget) => {
                const rawFresh = saved.widgets.find((item) => item.id === widget.id);
                const fresh = rawFresh ? normalizeWidgetSubtitle(rawFresh) : undefined;
                if (!fresh) return widget;
                const next: Record<string, unknown> = { ...widget };
                for (const key of REFRESHED_WIDGET_FIELDS) {
                  if (fresh[key] !== undefined) next[key] = fresh[key];
                }
                return next as unknown as WidgetItem;
              }),
            };
          }),
        );
        const refreshedForDashboard = (Array.isArray(refreshResult.refreshed) ? refreshResult.refreshed : []).filter(
          (widget: { dashboardId?: string | number }) => String(widget.dashboardId) === targetDashboard.databaseId,
        ).length;
        if (
          activeDashboardRef.current?.databaseId === targetDashboard.databaseId &&
          (initial || refreshedForDashboard > 0)
        ) {
          const syncedWidgetCount = saved ? savedWidgets.length : targetDashboard.widgetCount;
          showToast(refreshedForDashboard > 0
            ? `${syncedWidgetCount} widget dashboard "${targetDashboard.title}" dimuat dari database; ${refreshedForDashboard} dihitung ulang.`
            : `Dashboard "${targetDashboard.title}" disinkronkan dari database (${syncedWidgetCount} widget).`);
        }
      } catch (error) {
        console.error("Failed to refresh widgets from source data", error);
        if (initial && activeDashboardRef.current?.databaseId === targetDashboard.databaseId) {
          showToast(`Data widget dashboard "${targetDashboard.title}" belum dapat dimuat dari database.`);
        }
      } finally {
        if (active && initial) setInitialWidgetRefreshDone(true);
      }
    }

    async function loadTenantContext() {
      const appId = new URLSearchParams(window.location.search).get("appId");
      const contextUrl = new URL("/api/ai/context", window.location.origin);
      if (appId) contextUrl.searchParams.set("appId", appId);
      try {
        const response = await fetch(contextUrl, { cache: "no-store" });
        const context = await response.json();
        if (!response.ok || !context?.tenant || !context?.table) {
          throw new Error(context?.message || "Konteks perusahaan tidak tersedia.");
        }
        if (!active) return;

        const nextContext = context as TenantContext;

        // The dashboard list, its order, and the UI preferences all live in the
        // database now (no localStorage). The list of dashboards comes from
        // /dashboards; the widgets of each come from /widgets.
        let nextDashboards: DashboardItem[] = [];
        let nextSelectedId = "";
        let nextSidebarView: "dashboards" | "chatbot" = "dashboards";
        let nextIsSidebarOpen = true;
        try {
          const dashboardsUrl = new URL("/api/gateway/aigovtech/dashboards", window.location.origin);
          const widgetsUrl = new URL("/api/gateway/aigovtech/widgets", window.location.origin);
          if (appId) {
            dashboardsUrl.searchParams.set("appId", appId);
            widgetsUrl.searchParams.set("appId", appId);
          }
          const [dashboardsResponse, widgetsResponse] = await Promise.all([
            fetch(dashboardsUrl, { cache: "no-store" }),
            fetch(widgetsUrl, { cache: "no-store" }),
          ]);
          const dashboardsPayload = await dashboardsResponse.json().catch(() => ({}));
          const widgetsPayload = await widgetsResponse.json().catch(() => ({}));
          if (!dashboardsResponse.ok || !Array.isArray(dashboardsPayload.dashboards)) {
            throw new Error(dashboardsPayload.message || "Daftar dashboard tidak dapat dimuat dari database.");
          }
          if (!active) return;

          const widgetsByDashboard = new Map<string, WidgetItem[]>();
          if (widgetsResponse.ok && Array.isArray(widgetsPayload.dashboards)) {
            for (const entry of widgetsPayload.dashboards as { dashboardId: string | number; widgets?: WidgetItem[] }[]) {
              widgetsByDashboard.set(String(entry.dashboardId), Array.isArray(entry.widgets) ? entry.widgets : []);
            }
          }

          nextDashboards = (dashboardsPayload.dashboards as { dashboardId: string | number; name?: string; roleAccess?: string | null; description?: string | null }[]).map((entry) =>
            dashboardFromPersisted(nextContext, { ...entry, widgets: widgetsByDashboard.get(String(entry.dashboardId)) || [] }),
          );

          // A dashboard that has widgets but no row in DASHBOARDS yet (data from
          // before this feature) is adopted so nothing is lost; it will get a
          // DASHBOARDS row on the next save.
          const knownIds = new Set(nextDashboards.map((dashboard) => dashboard.databaseId));
          for (const [databaseId, widgets] of widgetsByDashboard) {
            if (!knownIds.has(databaseId) && widgets.length > 0) {
              nextDashboards.push(dashboardFromPersisted(nextContext, { dashboardId: databaseId, widgets }));
            }
          }

          const preferences = dashboardsPayload.preferences || {};
          if (preferences.selectedDashboardId) {
            const match = nextDashboards.find((dashboard) => dashboard.databaseId === String(preferences.selectedDashboardId));
            if (match) nextSelectedId = match.id;
          }
          if (!nextSelectedId) nextSelectedId = nextDashboards[0]?.id ?? "";
          if (preferences.sidebarView === "chatbot" && nextDashboards.length > 0) {
            nextSidebarView = "chatbot";
          } else if (preferences.sidebarView === "dashboards") {
            nextSidebarView = preferences.sidebarView;
          }
          if (typeof preferences.sidebarOpen === "boolean") nextIsSidebarOpen = preferences.sidebarOpen;
        } catch (error) {
          console.error("Failed to load dashboards from tenant Oracle database", error);
          if (active) setToastMessage("Daftar dashboard belum dapat dimuat dari database. Coba muat ulang.");
        }

        setTenantContext(nextContext);
        setDashboards(nextDashboards);
        setSelectedDashboardId(nextSelectedId);
        const nextActiveDashboard = nextDashboards.find((dashboard) => dashboard.id === nextSelectedId) || nextDashboards[0];
        activeDashboardRef.current = nextActiveDashboard
          ? { databaseId: nextActiveDashboard.databaseId, title: nextActiveDashboard.title, widgetCount: nextActiveDashboard.widgets.length }
          : null;
        setSidebarView(nextSidebarView);
        setIsSidebarOpen(nextIsSidebarOpen);
        setInitialWidgetRefreshDone(false);
        setWidgetsLoaded(true);
        setChatMessages([{
          id: 1,
          role: "assistant",
          content: `Halo! Saya AiGovtech, asisten analitik ${nextContext.databaseLabel}. Saya dapat menganalisis data dari ${nextContext.table} dan membantu membuat kartu atau grafik.`,
        }]);
        void syncWidgetsWithSource(appId, true);
        // Recheck the Oracle source while the dashboard remains open so edits
        // made by other users are reflected without a manual reload.
        refreshInterval = window.setInterval(() => {
          if (document.visibilityState === "visible") void syncWidgetsWithSource(appId);
        }, 30_000);
      } catch (err) {
        console.error("Failed to load AI tenant context", err);
        if (active) setChatError("Konteks database perusahaan tidak dapat dimuat. Silakan muat ulang dashboard.");
      }
    }
    void loadTenantContext();
    return () => {
      active = false;
      if (refreshInterval !== undefined) window.clearInterval(refreshInterval);
    };
  }, []);

  useEffect(() => {
    const selected = dashboards.find((dashboard) => dashboard.id === selectedDashboardId) || dashboards[0];
    activeDashboardRef.current = selected
      ? { databaseId: selected.databaseId, title: selected.title, widgetCount: selected.widgets.length }
      : null;
  }, [dashboards, selectedDashboardId]);

  useEffect(() => {
    let active = true;
    const checkAiHealth = async () => {
      try {
        const appId = new URLSearchParams(window.location.search).get("appId");
        const healthUrl = new URL("/api/gateway/aigovtech/health", window.location.origin);
        if (appId) healthUrl.searchParams.set("appId", appId);
        const response = await fetch(healthUrl, { cache: "no-store" });
        const health = await response.json().catch(() => ({}));
        if (!active) return;
        if (!response.ok || (!health.modelConnected && !health.databaseConnected)) {
          setAiHealthStatus("disconnected");
        } else if (!health.modelConnected) {
          setAiHealthStatus("model-disconnected");
        } else if (!health.databaseConnected) {
          setAiHealthStatus("database-disconnected");
        } else {
          setAiHealthStatus("connected");
        }
      } catch {
        if (active) setAiHealthStatus("disconnected");
      }
    };
    void checkAiHealth();
    const intervalId = window.setInterval(() => void checkAiHealth(), 15000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  // Drag & Drop and Resizing State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggedDashboardId, setDraggedDashboardId] = useState<string | null>(null);
  const [dragOverDashboardId, setDragOverDashboardId] = useState<string | null>(null);

  function handleDashboardDragStart(e: React.DragEvent<HTMLDivElement>, dashboardId: string) {
    if ((e.target as HTMLElement).closest("button, input")) {
      e.preventDefault();
      return;
    }
    setDraggedDashboardId(dashboardId);
    try {
      e.dataTransfer.setData("text/plain", dashboardId);
      e.dataTransfer.effectAllowed = "move";
    } catch {}
  }

  function handleDashboardDragOver(e: React.DragEvent<HTMLDivElement>, dashboardId: string) {
    e.preventDefault();
    try {
      e.dataTransfer.dropEffect = "move";
    } catch {}
    if (draggedDashboardId && draggedDashboardId !== dashboardId) {
      setDragOverDashboardId(dashboardId);
    }
  }

  function handleDashboardDrop(e: React.DragEvent<HTMLDivElement>, targetId: string) {
    e.preventDefault();
    e.stopPropagation();
    let sourceId = draggedDashboardId;
    try {
      sourceId = e.dataTransfer.getData("text/plain") || sourceId;
    } catch {}

    if (sourceId && sourceId !== targetId) {
      const targetBounds = e.currentTarget.getBoundingClientRect();
      const pointerAfterTarget = e.clientY > targetBounds.top + targetBounds.height / 2;
      setDashboards((prev) => {
        const sourceIndex = prev.findIndex((item) => item.id === sourceId);
        const targetIndex = prev.findIndex((item) => item.id === targetId);
        if (sourceIndex < 0 || targetIndex < 0) return prev;
        const reordered = [...prev];
        const [moved] = reordered.splice(sourceIndex, 1);
        let insertionIndex = targetIndex + (pointerAfterTarget ? 1 : 0);
        if (sourceIndex < insertionIndex) insertionIndex -= 1;
        reordered.splice(insertionIndex, 0, moved);
        return reordered;
      });
      showToast("Urutan dashboard berhasil diperbarui.");
    }
    setDraggedDashboardId(null);
    setDragOverDashboardId(null);
  }

  function handleDashboardDragEnd() {
    setDraggedDashboardId(null);
    setDragOverDashboardId(null);
  }

  function handleDragStart(e: React.DragEvent<HTMLDivElement>, index: number) {
    setDraggedIndex(index);
    try {
      e.dataTransfer.setData("text/plain", String(index));
      e.dataTransfer.effectAllowed = "move";
    } catch (_) {}
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>, index: number) {
    e.preventDefault();
    try {
      e.dataTransfer.dropEffect = "move";
    } catch (_) {}
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>, targetIndex: number) {
    e.preventDefault();
    e.stopPropagation();

    let sourceIndex = draggedIndex;
    try {
      const dataStr = e.dataTransfer.getData("text/plain");
      if (dataStr) {
        const parsed = parseInt(dataStr, 10);
        if (!isNaN(parsed)) sourceIndex = parsed;
      }
    } catch (_) {}

    if (sourceIndex === null || sourceIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    setDashboards((prev) =>
      prev.map((d) => {
        if (d.id !== selectedDashboardId) return d;
        const newWidgets = [...d.widgets];
        const [movedItem] = newWidgets.splice(sourceIndex, 1);
        newWidgets.splice(targetIndex, 0, movedItem);
        return {
          ...d,
          widgets: newWidgets,
        };
      })
    );

    setDraggedIndex(null);
    setDragOverIndex(null);
    showToast("âœ¨ Posisi widget berhasil dipindahkan!");
  }

  function handleDragEnd() {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }

  function handleWidgetResize(widgetId: string, width: string, height: number) {
    setDashboards((prev) =>
      prev.map((d) => {
        if (d.id !== selectedDashboardId) return d;
        return {
          ...d,
          widgets: d.widgets.map((w) =>
            w.id === widgetId ? { ...w, width, height } : w
          ),
        };
      })
    );
  }

  function handleWidgetPositionChange(widgetId: string, x: number, y: number) {
    setDashboards((prev) =>
      prev.map((d) => {
        if (d.id !== selectedDashboardId) return d;
        return {
          ...d,
          widgets: d.widgets.map((w) =>
            w.id === widgetId ? { ...w, x, y } : w
          ),
        };
      })
    );
  }

  function handleResetGridLayout() {
    const canvas = canvasRef.current;
    const canvasRect = canvas?.getBoundingClientRect();
    const viewportWidth = typeof window !== "undefined"
      ? window.innerWidth - (canvasRect?.left || 0) - 16
      : 0;
    // Some embedded dashboard shells report a narrower canvas than the visible
    // workspace. Use the actual remaining viewport width so card rows divide
    // and fill the full space users see.
    const canvasWidth = viewportWidth || canvasRect?.width || 1000;
    // Sizes come from what is actually rendered, so widgets the user resized
    // are laid out with their real size and rows never overlap.
    const measure = (id: string) => {
      const rect = canvas
        ?.querySelector<HTMLElement>(`[data-widget-id="${id.replace(/"/g, '\\"')}"]`)
        ?.getBoundingClientRect();
      return rect ? { width: rect.width, height: rect.height } : undefined;
    };

    setDashboards((prev) =>
      prev.map((d) => {
        if (d.id !== selectedDashboardId) return d;
        const placements = computeGridLayout(d.widgets, canvasWidth, measure);
        const resetWidgets = d.widgets.map((w) => {
          const place = placements.get(w.id);
          if (!place) return w;
          return {
            ...w,
            x: place.x,
            y: place.y,
            width: place.width,
            height: place.height,
          };
        });

        return { ...d, widgets: resetWidgets };
      })
    );
    showToast("âœ¨ Posisi semua widget dirapikan ke susunan grid awal!");
  }

  // Entrance animation trigger: plays EVERY time the selected dashboard changes
  // (clicking a dashboard in the list) and on every (re)load. The nonce bump
  // changes each widget's React key so they remount and re-run the animation.
  useEffect(() => {
    if (!widgetsLoaded || !selectedDashboardId) return;
    setAnimationNonce((n) => n + 1);
    setAnimateWidgets(true);
    const timer = window.setTimeout(() => setAnimateWidgets(false), 1800);
    return () => window.clearTimeout(timer);
  }, [selectedDashboardId, widgetsLoaded]);

  // Auto-scroll chat to bottom INSIDE the messages area ONLY (never scrolling the page/header)
  useEffect(() => {
    if (sidebarView === "chatbot" && chatMessagesAreaRef.current) {
      chatMessagesAreaRef.current.scrollTo({
        top: chatMessagesAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [chatMessages, chatSending, sidebarView]);

  // RBAC: viewers may not use the chatbot. If a viewer ends up in chatbot view
  // (e.g. restored preference), force them back to the dashboard list.
  useEffect(() => {
    if (!canUseChatbot && sidebarView === "chatbot") {
      setSidebarView("dashboards");
    }
  }, [canUseChatbot, sidebarView]);

  // Listen to shell trigger events for chatbot
  useEffect(() => {
    if (widgetsLoaded && !hasDashboards && sidebarView === "chatbot") {
      setSidebarView("dashboards");
    }
  }, [widgetsLoaded, hasDashboards, sidebarView]);

  useEffect(() => {
    function handleOpenChatbot() {
      if (!hasDashboards) return;
      setIsSidebarOpen(true);
      setSidebarView("chatbot");
    }
    function handleToggleChatbot() {
      if (!hasDashboards) return;
      setIsSidebarOpen((isOpen) => {
        if (!isOpen) {
          setSidebarView("chatbot");
          return true;
        }
        setSidebarView((v) => (v === "chatbot" ? "dashboards" : "chatbot"));
        return true;
      });
    }

    window.addEventListener("custom-dashboard:open-chatbot", handleOpenChatbot);
    window.addEventListener("custom-dashboard:toggle-chatbot", handleToggleChatbot);

    return () => {
      window.removeEventListener("custom-dashboard:open-chatbot", handleOpenChatbot);
      window.removeEventListener("custom-dashboard:toggle-chatbot", handleToggleChatbot);
    };
  }, [hasDashboards]);

  // Save the dashboard list (names + order) to the database whenever it
  // changes. The whole list is sent, so renames, reordering, additions and
  // removals (including an empty list) are all persisted. No localStorage.
  useEffect(() => {
    if (!tenantContext || !widgetsLoaded) return;
    // RBAC: only those who may manage the dashboard list (pengelola/admin)
    // persist it. Viewers/editors never trigger this auto-save, so they don't
    // get a "forbidden" error just by opening a dashboard.
    if (!canAddDashboard) return;
    const timeoutId = window.setTimeout(async () => {
      const appId = new URLSearchParams(window.location.search).get("appId");
      const endpoint = new URL("/api/gateway/aigovtech/dashboards", window.location.origin);
      if (appId) endpoint.searchParams.set("appId", appId);
      try {
        const response = await fetch(endpoint, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dashboards: dashboards.map((dashboard) => ({ dashboardId: dashboard.databaseId, name: dashboard.title })) }),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.message || `Gagal menyimpan daftar dashboard (HTTP ${response.status}).`);
        }
      } catch (error) {
        console.error("Failed to persist dashboard list", error);
        setToastMessage("Daftar dashboard belum tersimpan ke database. Coba lagi setelah koneksi pulih.");
      }
    }, 500);
    return () => window.clearTimeout(timeoutId);
  }, [dashboards, tenantContext, widgetsLoaded, canAddDashboard]);

  // Save UI preferences (selected dashboard, sidebar) to the database.
  useEffect(() => {
    if (!tenantContext || !widgetsLoaded) return;
    const timeoutId = window.setTimeout(async () => {
      const appId = new URLSearchParams(window.location.search).get("appId");
      const endpoint = new URL("/api/gateway/aigovtech/dashboards/preferences", window.location.origin);
      if (appId) endpoint.searchParams.set("appId", appId);
      const selectedDatabaseId = dashboards.find((dashboard) => dashboard.id === selectedDashboardId)?.databaseId ?? null;
      try {
        await fetch(endpoint, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selectedDashboardId: selectedDatabaseId, sidebarView, sidebarOpen: isSidebarOpen }),
        });
      } catch (error) {
        console.error("Failed to persist dashboard preferences", error);
      }
    }, 500);
    return () => window.clearTimeout(timeoutId);
  }, [selectedDashboardId, sidebarView, isSidebarOpen, dashboards, tenantContext, widgetsLoaded]);

  useEffect(() => {
    if (!tenantContext || !widgetsLoaded || !initialWidgetRefreshDone || dashboards.length === 0) return;
    const timeoutId = window.setTimeout(async () => {
      const appId = new URLSearchParams(window.location.search).get("appId");
      const endpoint = new URL("/api/gateway/aigovtech/widgets", window.location.origin);
      if (appId) endpoint.searchParams.set("appId", appId);
      // Each dashboard is saved on its own: one failing dashboard must not stop
      // the dashboards after it from being saved (they would be lost on refresh).
      // RBAC: only persist widgets for dashboards the user may edit (editor+).
      // Admin (and legacy/no-RBAC) can edit all.
      const mayEdit = (roleAccess?: string) => {
        if (!rbacActive || isAdmin) return true;
        const r = roleAccess ? (roleRank[roleAccess] || 0) : 0;
        return r >= roleRank.editor;
      };
      let failed = 0;
      for (const dashboard of dashboards) {
        if (!mayEdit(dashboard.roleAccess)) continue;
        try {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dashboardId: dashboard.databaseId, dashboardName: dashboard.title, widgets: dashboard.widgets }),
          });
          if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(payload.message || `Gagal menyimpan widget (HTTP ${response.status}).`);
          }
        } catch (error) {
          failed += 1;
          console.error(`Failed to persist widgets of dashboard "${dashboard.title}"`, error);
        }
      }
      if (failed > 0) {
        setToastMessage("Perubahan card/chart belum tersimpan ke database. Coba lagi setelah koneksi pulih.");
      }
    }, 500);
    return () => window.clearTimeout(timeoutId);
  }, [dashboards, tenantContext, widgetsLoaded, initialWidgetRefreshDone]);

  const activeDashboard =
    dashboards.find((d) => d.id === selectedDashboardId) || dashboards[0] || {
      id: "blank",
      title: "Dashboard Baru",
      category: tenantContext?.tenant === "kemenkeu" ? "E-commerce" : "Fashion",
      badge: "Baru",
      subtitle: "Dashboard Kosong",
      metricText: "0 Widget",
      widgets: [],
    };

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  }

  function appendWidgetsBelowExisting(existing: WidgetItem[], incoming: WidgetItem[]) {
    const canvas = canvasRef.current;
    const canvasTop = canvas?.getBoundingClientRect().top ?? 0;
    const merged = [...existing];
    const addedIds: string[] = [];
    const addedWidgets: WidgetItem[] = [];
    const defaultWidgetHeight = (widget: WidgetItem) => widget.height && widget.height > 0
      ? widget.height
      : widget.type === "card" ? 180 : 380;
    for (const rawWidget of incoming) {
      const widget = normalizeWidgetSubtitle(rawWidget);
      const isOrderCountCard = (item: WidgetItem) => {
        if (item.type !== "card") return false;
        const identity = normalizeWidgetName(`${item.id} ${item.title} ${item.cardType || ""}`);
        return /jumlah pesanan|jumlah transaksi|total pesanan|total transaksi|card total transaksi/.test(identity);
      };
      const equivalentIndexes = widget.type === "card" && isOrderCountCard(widget)
        ? merged.flatMap((item, index) => isOrderCountCard(item) ? [index] : [])
        : [];
      const index = merged.findIndex((item) => item.id === widget.id);
      const replaceIndex = index >= 0 ? index : equivalentIndexes[0] ?? -1;
      if (index >= 0) {
        const updated = {
          ...widget,
          width: widget.width ?? merged[index].width,
          height: defaultWidgetHeight(widget),
          x: merged[index].x,
          y: merged[index].y,
        };
        for (const duplicateIndex of equivalentIndexes.filter((itemIndex) => itemIndex !== index).sort((a, b) => b - a)) {
          merged.splice(duplicateIndex, 1);
        }
        const currentIndex = merged.findIndex((item) => item.id === widget.id);
        if (widget.type === "card") {
          merged.splice(currentIndex, 1);
          addedWidgets.push(updated);
          if (!addedIds.includes(widget.id)) addedIds.push(widget.id);
        } else {
          merged[currentIndex] = updated;
        }
      } else if (replaceIndex >= 0) {
        // A card created from a free-form query may have a generated ID/title.
        // Replace it with the canonical metric and remove semantic duplicates;
        // the refreshed card is then placed in the top row below.
        const previous = merged[replaceIndex];
        const updated = {
          ...widget,
          width: widget.width ?? previous.width,
          height: defaultWidgetHeight(widget),
          x: previous.x,
          y: previous.y,
        };
        for (const duplicateIndex of equivalentIndexes.filter((itemIndex) => itemIndex !== replaceIndex).sort((a, b) => b - a)) {
          merged.splice(duplicateIndex, 1);
        }
        merged.splice(replaceIndex, 1);
        addedWidgets.push(updated);
        if (!addedIds.includes(widget.id)) addedIds.push(widget.id);
      } else {
        addedWidgets.push({
          ...widget,
          width: widget.width ?? (widget.type === "card" ? `${Math.min(440, canvas?.getBoundingClientRect().width || 440)}px` : "100%"),
          height: defaultWidgetHeight(widget),
        });
        addedIds.push(widget.id);
      }
    }

    if (addedWidgets.length) {
      const addedCards = addedWidgets.filter((widget) => widget.type === "card");
      const addedCharts = addedWidgets.filter((widget) => widget.type !== "card");
      // Pack cards from left to right in the top card grid. This fills the
      // remaining slots in a row before opening the next row.
      if (addedCards.length) {
        merged.push(...addedCards);
        const canvasWidth = canvas?.getBoundingClientRect().width || window.innerWidth || 1000;
        const cardWidgets = merged.filter((widget) => widget.type === "card");
        const placements = computeGridLayout(cardWidgets, canvasWidth, () => undefined);
        let cardsBottom = 0;
        for (let index = 0; index < merged.length; index += 1) {
          const widget = merged[index];
          if (widget.type === "card") {
            const place = placements.get(widget.id);
            if (!place) continue;
            merged[index] = { ...widget, ...place };
            cardsBottom = Math.max(cardsBottom, place.y + place.height);
          }
        }
        // Keep existing charts below the packed cards if the new card rows
        // would otherwise overlap them; preserve their horizontal positions.
        const chartsTop = cardsBottom + 16;
        for (let index = 0; index < merged.length; index += 1) {
          const widget = merged[index];
          if (widget.type === "card") continue;
          const element = canvas?.querySelector<HTMLElement>(`[data-widget-id="${widget.id.replace(/"/g, '\\"')}"]`);
          const renderedY = element ? element.getBoundingClientRect().top - canvasTop : undefined;
          const currentY = widget.y ?? renderedY ?? 220;
          if (currentY < chartsTop) merged[index] = { ...widget, y: chartsTop };
        }
      }
      let nextY = 0;
      if (addedCharts.length) {
        const bottom = merged.reduce((maxBottom, widget) => {
          if (addedCards.length) {
            return Math.max(maxBottom, (widget.y ?? 0) + defaultWidgetHeight(widget));
          }
          const element = canvas?.querySelector<HTMLElement>(`[data-widget-id="${widget.id.replace(/"/g, '\\"')}"]`);
          const rect = element?.getBoundingClientRect();
          return Math.max(maxBottom, rect
            ? rect.bottom - canvasTop
            : (widget.y ?? 0) + defaultWidgetHeight(widget));
        }, 0);
        nextY = bottom ? bottom + 16 : 0;
        for (const widget of addedCharts) {
          const placed = { ...widget, x: 0, y: nextY };
          merged.push(placed);
          nextY += defaultWidgetHeight(placed) + 16;
        }
      }
    }
    if (addedIds.length) pendingWidgetScrollIdsRef.current = addedIds;
    return merged;
  }

  useEffect(() => {
    const pendingWidgetScrollIds = pendingWidgetScrollIdsRef.current;
    if (!pendingWidgetScrollIds.length) return;
    const frame = window.requestAnimationFrame(() => {
      const elements = pendingWidgetScrollIds
        .map((id) => canvasRef.current?.querySelector<HTMLElement>(`[data-widget-id="${id.replace(/"/g, '\\"')}"]`))
        .filter((element): element is HTMLElement => Boolean(element));
      if (!elements.length) return;
      elements[0].scrollIntoView({ behavior: "smooth", block: "start" });
      setHighlightedWidgetIds(pendingWidgetScrollIds);
      pendingWidgetScrollIdsRef.current = [];
      window.setTimeout(() => setHighlightedWidgetIds([]), 2400);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [dashboards]);

  // LISTEN TO AIGOVTECH EVENTS FROM SIDEBAR CHATBOT
  useEffect(() => {
    function handleAddWidgetEvent(event: Event) {
      const customEvent = event as CustomEvent;
      const widget = customEvent.detail as WidgetItem;
      if (!widget || !widget.id) return;
      // RBAC: viewers may not add widgets to the dashboard.
      if (!canEditWidgets) {
        showToast("Peran Anda hanya dapat melihat dashboard ini.");
        return;
      }

      setDashboards((prev) =>
        prev.map((d) => {
          if (d.id !== selectedDashboardId) return d;
          const updatedWidgets = appendWidgetsBelowExisting(d.widgets, [widget]);
          return {
            ...d,
            widgets: updatedWidgets,
            metricText: `${updatedWidgets.length} Widget`,
          };
        }),
      );
      showToast(`âœ¨ Widget "${widget.title}" berhasil ditambahkan oleh AiGovtech!`);
    }

    function handleAddMultipleWidgetsEvent(event: Event) {
      const customEvent = event as CustomEvent;
      const widgets = customEvent.detail as WidgetItem[];
      if (!Array.isArray(widgets) || widgets.length === 0) return;
      // RBAC: viewers may not add widgets to the dashboard.
      if (!canEditWidgets) {
        showToast("Peran Anda hanya dapat melihat dashboard ini.");
        return;
      }

      setDashboards((prev) =>
        prev.map((d) => {
          if (d.id !== selectedDashboardId) return d;
          const merged = appendWidgetsBelowExisting(d.widgets, widgets);
          return {
            ...d,
            widgets: merged,
            metricText: `${merged.length} Widget`,
          };
        }),
      );
      showToast(`âœ¨ ${widgets.length} Widget berhasil diterapkan oleh AiGovtech!`);
    }

    window.addEventListener("aigovtech:add-widget", handleAddWidgetEvent);
    window.addEventListener("aigovtech:add-widgets", handleAddMultipleWidgetsEvent);

    return () => {
      window.removeEventListener("aigovtech:add-widget", handleAddWidgetEvent);
      window.removeEventListener("aigovtech:add-widgets", handleAddMultipleWidgetsEvent);
    };
  }, [selectedDashboardId, canEditWidgets]);

  // Handle sending message in Chatbot
  // Handle sending message in Chatbot
  async function handleSendChatMessage(promptText?: string) {
    const textToSend = (promptText || chatDraft).trim();
    if (!textToSend || chatSending) return;

    const userMsg: ChatMessage = {
      id: nextChatId.current++,
      role: "user",
      content: textToSend,
    };

    const newConvo = [...chatMessages, userMsg];
    setChatMessages(newConvo);
    if (!promptText) setChatDraft("");
    setChatError(null);
    setChatSending(true);

    try {
      const deleteRequest = resolveWidgetDeleteRequest(textToSend, activeDashboard.widgets);
      if (deleteRequest) {
        let reply = deleteRequest.reply || "";
        if (deleteRequest.widget) {
          const removedWidget = deleteRequest.widget;
          setDashboards((current) => current.map((dashboard) => {
            if (dashboard.id !== selectedDashboardId) return dashboard;
            const widgets = dashboard.widgets.filter((widget) => widget.id !== removedWidget.id);
            return { ...dashboard, widgets, metricText: `${widgets.length} Widget` };
          }));
          reply = `Widget "${removedWidget.title}" berhasil dihapus dari dashboard aktif.`;
          showToast(reply);
        }
        setChatMessages((current) => [...current, {
          id: nextChatId.current++,
          role: "assistant",
          content: reply,
        }]);
        return;
      }

      let resData: any = null;

      const appId = new URLSearchParams(window.location.search).get("appId");
      const chatUrl = new URL("/api/gateway/aigovtech/chat", window.location.origin);
      if (appId) chatUrl.searchParams.set("appId", appId);
      // When a widget is focused, give the AI its context (title + type) so the
      // reply is about that widget. This only affects what is sent, not the
      // visible chat bubble.
      const outgoingMessages = newConvo.map(({ role, content }) => ({ role, content }));
      if (focusedWidget) {
        const last = outgoingMessages[outgoingMessages.length - 1];
        if (last && last.role === "user") {
          last.content =
            `[Konteks widget terpilih: "${focusedWidget.title}" (${focusedWidget.type === "card" ? "kartu metrik" : "grafik"})] ` +
            last.content;
        }
      }
      const res = await fetch(chatUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: outgoingMessages,
        }),
      });
      resData = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(resData?.message || `Layanan AiGovtech gagal (HTTP ${res.status}).`);
      }

      // If live backend responded with reply & widgets
      if (resData && (resData.reply || resData.data?.reply || resData.choices?.[0]?.message?.content)) {
        const reply =
          resData.data?.reply ??
          resData.reply ??
          resData.data?.answer ??
          resData.answer ??
          resData.data?.choices?.[0]?.message?.content ??
          resData.choices?.[0]?.message?.content;
        if (typeof reply !== "string" || !reply.trim()) {
          throw new Error("Layanan AiGovtech tidak mengirimkan jawaban.");
        }

        const widget = resData.widgetConfig || resData.data?.widgetConfig;
        const widgets = resData.widgetConfigs || resData.data?.widgetConfigs;

        const widgetsToApply: WidgetItem[] = Array.isArray(widgets) && widgets.length > 0
          ? widgets
          : widget?.id ? [widget] : [];
        if (widgetsToApply.length > 0) {
          setDashboards((prev) => prev.map((d) => {
            if (d.id !== selectedDashboardId) return d;
            const merged = appendWidgetsBelowExisting(d.widgets, widgetsToApply);
            return { ...d, widgets: merged, metricText: `${merged.length} Widget` };
          }));
          showToast(`${widgetsToApply.length} widget diterapkan ke dashboard.`);
        }
        setChatMessages((prev) => [
          ...prev,
          {
            id: nextChatId.current++,
            role: "assistant",
            content: reply,
            widget,
            widgets,
          },
        ]);
        return;
      }

      throw new Error(resData?.message || "Layanan AiGovtech memberi respons tanpa jawaban. Periksa log API dan gateway untuk melihat penyebabnya.");
    } catch (err: any) {
      console.error("Chat error", err);
      setChatError(err?.message || "Terjadi kendala saat menghubungi AiGovtech.");
    } finally {
      setChatSending(false);
    }
  }

  function handleClearChat() {
    if (chatSending) return;
    setChatMessages([{
      id: 1,
      role: "assistant",
      content: `Halo! Saya AiGovtech, asisten analitik ${tenantContext?.databaseLabel || "data"}. Saya dapat menganalisis data dari ${tenantContext?.table || "database perusahaan"} dan membantu membuat kartu atau grafik.`,
    }]);
    nextChatId.current = 2;
    setChatDraft("");
    setChatError(null);
  }

  function handleStartRenameDashboard(event: React.MouseEvent, dashboard: DashboardItem) {
    event.stopPropagation();
    setEditingDashboardId(dashboard.id);
    setEditingDashboardTitle(dashboard.title);
  }

  function handleSaveDashboardName(id: string) {
    const title = editingDashboardTitle.trim();
    if (!title) {
      showToast("Nama dashboard tidak boleh kosong.");
      return;
    }
    setDashboards((previous) => previous.map((dashboard) =>
      dashboard.id === id ? { ...dashboard, title } : dashboard,
    ));
    setEditingDashboardId(null);
    setEditingDashboardTitle("");
    showToast(`Nama dashboard diubah menjadi "${title}".`);
  }

  // Handle adding a new dashboard -> initially empty ("masih kosongan")
  function handleCreateDashboard() {
    const title = newDashboardTitle.trim() || `Dashboard Baru #${dashboards.length + 1}`;
    const newId = `dash-${Date.now()}`;
    const nextDatabaseId = String(Math.max(0, ...dashboards.map((dashboard) => Number(dashboard.databaseId) || 0)) + 1);
    const newItem: DashboardItem = {
      id: newId,
      databaseId: nextDatabaseId,
      title,
      category: tenantContext?.tenant === "kemenkeu" ? "E-commerce" : "Fashion",
      badge: "Baru",
      badgeTone: "teal",
      subtitle: tenantContext ? `${tenantContext.table} · Oracle` : "Database Oracle",
      metricText: "0 Widget",
      widgets: [], // Empty state ("masih kosongan")
    };

    setDashboards((prev) => [newItem, ...prev]);
    setSelectedDashboardId(newId);
    setActiveDashboardFilterId("all");
    setNewDashboardTitle("");
    setShowAddModal(false);
    showToast(`Dashboard "${title}" berhasil ditambahkan (masih kosong).`);
  }

  // Handle deleting a dashboard. The list may become empty â€” that is allowed;
  // the empty state is shown and a new dashboard can be added with "+ Tambah".
  function handleDeleteDashboard(id: string, title: string) {
    const updated = dashboards.filter((d) => d.id !== id);
    setDashboards(updated);
    const deletedDashboard = dashboards.find((dashboard) => dashboard.id === id);
    const databaseId = deletedDashboard?.databaseId;
    // Remove the dashboard and its widgets from the database. The list PUT that
    // follows would also drop it, but this makes the delete immediate.
    if (databaseId && /^[1-9][0-9]{0,11}$/.test(databaseId)) {
      const appId = new URLSearchParams(window.location.search).get("appId");
      const deleteUrl = new URL("/api/gateway/aigovtech/dashboards", window.location.origin);
      deleteUrl.searchParams.set("dashboardId", databaseId);
      if (appId) deleteUrl.searchParams.set("appId", appId);
      void fetch(deleteUrl, { method: "DELETE" }).then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
      }).catch((error) => {
        console.error("Failed to remove persisted dashboard", error);
        setToastMessage("Dashboard dihapus di tampilan, tetapi belum terhapus di database.");
      });
    }
    if (activeDashboardFilterId === id) setActiveDashboardFilterId("all");
    if (selectedDashboardId === id) {
      // Select the next remaining dashboard, or clear the selection when the
      // last one was just removed.
      setSelectedDashboardId(updated[0]?.id ?? "");
    }
    showToast(`Dashboard "${title}" berhasil dihapus.`);
  }

  function handleDeleteActiveDashboard() {
    handleDeleteDashboard(activeDashboard.id, activeDashboard.title);
  }

  // Remove a single widget from current dashboard
  function handleRemoveWidget(widgetId: string, widgetName?: string) {
    // RBAC: viewers may not remove widgets.
    if (!canEditWidgets) {
      showToast("Peran Anda hanya dapat melihat dashboard ini.");
      return;
    }
    setDashboards((prev) =>
      prev.map((d) => {
        if (d.id !== selectedDashboardId) return d;
        const filtered = d.widgets.filter((w) => w.id !== widgetId);
        return {
          ...d,
          widgets: filtered,
          metricText: `${filtered.length} Widget`,
        };
      }),
    );
    showToast(`Widget "${widgetName || widgetId}" dihapus dari dashboard.`);
  }

  // Filtered dashboards list for sidebar
  const filteredDashboards = dashboards.filter((d) => {
    const matchDashboard = activeDashboardFilterId === "all" || d.id === activeDashboardFilterId;
    const matchSearch =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchDashboard && matchSearch;
  });

  const isDashboardEmpty = activeDashboard.widgets.length === 0;

  // Auto-calculate coordinates for widgets on the free canvas
  const positionedWidgets = useMemo(() => {
    let currentCardX = 0;
    let currentCardY = 0;
    let nextChartY = 220;

    return activeDashboard.widgets.map((w) => {
      let finalX = w.x;
      let finalY = w.y;
      let finalW = w.width;
      let finalH = w.height;

      if (typeof finalX !== "number" || typeof finalY !== "number") {
        if (w.type === "card") {
          finalX = currentCardX;
          finalY = currentCardY;
          finalW = finalW || "440px";
          currentCardX += 460;
          if (currentCardX > 900) {
            currentCardX = 0;
            currentCardY += 210;
            if (currentCardY + 210 > nextChartY) nextChartY = currentCardY + 210;
          }
        } else {
          // Chart
          finalX = 0;
          finalY = Math.max(nextChartY, currentCardY > 0 ? currentCardY + 210 : 220);
          finalW = finalW || "100%";
          finalH = finalH || 380;
          nextChartY = finalY + 410;
        }
      }

      return {
        ...w,
        x: finalX,
        y: finalY,
        width: finalW,
        height: finalH,
      };
    });
  }, [activeDashboard.widgets]);

  // Dynamic Canvas Height based on the furthest bottom widget
  const canvasMinHeight = useMemo(() => {
    let maxY = 0;
    positionedWidgets.forEach((w) => {
      const y = w.y ?? 0;
      const h = w.height && w.height > 0 ? w.height : (w.type === "card" ? 160 : 380);
      if (y + h + 16 > maxY) {
        maxY = y + h + 16;
      }
    });
    return maxY;
  }, [positionedWidgets]);

  return (
    <div className={styles.appContainer}>
      <div className={styles.mainLayoutBody}>
        {/* SIDEBAR: DAFTAR DASHBOARD / FULL CHATBOT (DENGAN TOMBOL BUKA / TUTUP & HAPUS) */}
        {isSidebarOpen && (
          sidebarView === "chatbot" ? (
            <aside
              className={styles.dashboardListSidebarChatbotMode}
              aria-label="Chatbot AiGovtech"
            >
              {/* Header Navigation: Kembali ke Daftar Dashboard + Tutup Sidebar */}
              <div className={styles.chatbotHeaderNav}>
                <button
                  type="button"
                  className={styles.btnBackToDashboards}
                  onClick={() => setSidebarView("dashboards")}
                  title="Kembali ke Daftar Dashboard"
                >
                  <ArrowLeft size={14} />
                  <span>Daftar Dashboard</span>
                </button>
                <div className={styles.chatbotHeaderActions}>
                  <button
                    type="button"
                    className={styles.btnClearChat}
                    onClick={handleClearChat}
                    disabled={chatSending}
                    title="Bersihkan chat"
                    aria-label="Bersihkan chat"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    type="button"
                    className={styles.sidebarToggleCloseBtn}
                    onClick={() => setIsSidebarOpen(false)}
                    title="Tutup Sidebar"
                    aria-label="Tutup Sidebar"
                  >
                    <PanelLeftClose size={15} />
                  </button>
                </div>
              </div>

              {/* Branding Subheader: Identitas + Status Database */}
              <div className={styles.chatbotIdentityBar}>
                <div className={styles.chatbotAvatarBox}>
                  <Bot size={18} />
                </div>
                <div className={styles.chatbotIdentityInfo}>
                  <h3 className={styles.chatbotNameText}>
                    <span>AiGovtech</span>
                    <Sparkles size={13} color="#007d79" />
                  </h3>
                  <span className={styles.chatbotStatusRow} data-status={aiHealthStatus} role="status">
                    <span className={styles.chatbotStatusDot} />
                    <span>{aiHealthStatus === "connected"
                      ? `Model dan database ${tenantContext?.databaseLabel || "Oracle"} terhubung`
                      : aiHealthStatus === "database-disconnected"
                        ? `Database ${tenantContext?.databaseLabel || "Oracle"} tidak terhubung`
                        : aiHealthStatus === "model-disconnected"
                          ? "Layanan AI tidak terhubung"
                          : aiHealthStatus === "disconnected"
                            ? "AI dan Oracle tidak terhubung"
                            : "Memeriksa koneksi AI dan Oracle"}</span>
                  </span>
                </div>
              </div>

              {/* Pesan Percakapan Scrollable */}
              <div ref={chatMessagesAreaRef} className={styles.chatbotMessagesArea}>
                <div className={styles.chatbotDateBanner}>
                  PERCAKAPAN DENGAN AIGOVTECH
                </div>

                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`${styles.chatbotMsgRow} ${
                      msg.role === "user"
                        ? styles.chatbotMsgRowUser
                        : styles.chatbotMsgRowAssistant
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className={styles.chatbotAvatarMini}>AI</div>
                    )}

                    <div className={styles.chatbotBubbleBody}>
                      <div
                        className={`${styles.chatbotBubble} ${
                          msg.role === "user"
                            ? styles.chatbotBubbleUser
                            : styles.chatbotBubbleAssistant
                        }`}
                      >
                        {msg.content}
                      </div>

                      {/* Notifikasi Widget Ditambahkan */}
                      {msg.widget && (
                        <div className={styles.chatbotWidgetNotice}>
                          <div className={styles.chatbotWidgetNoticeHeader}>
                            <span className={styles.chatbotCheckCircle}>âœ“</span>
                            <span>
                              Widget <strong>{msg.widget.title}</strong> ditambahkan ke dashboard aktif
                            </span>
                          </div>
                          <button
                            type="button"
                            className={styles.btnReapplyWidgetInChat}
                            onClick={() => {
                              window.dispatchEvent(
                                new CustomEvent("aigovtech:add-widget", {
                                  detail: msg.widget,
                                }),
                              );
                            }}
                          >
                            + Tampilkan Lagi di Dashboard
                          </button>
                        </div>
                      )}

                      {Array.isArray(msg.widgets) && msg.widgets.length > 1 && (
                        <div className={styles.chatbotWidgetNotice}>
                          <div className={styles.chatbotWidgetNoticeHeader}>
                            <span className={styles.chatbotCheckCircle}>âœ“</span>
                            <span>
                              <strong>{msg.widgets.length} Widget</strong> diterapkan ke dashboard aktif
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Starter Prompts ketika percakapan baru dimulai */}
                {chatMessages.length === 1 && !chatSending && (
                  <div className={styles.chatbotStarterList}>
                    {starterPrompts.slice(0, 3).map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        className={styles.chatbotStarterChip}
                        onClick={() => handleSendChatMessage(prompt)}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                )}

                {/* Typing Indicator */}
                {chatSending && (
                  <div className={styles.chatbotTyping}>
                    <span className={styles.chatbotTypingDot} />
                    <span className={styles.chatbotTypingDot} />
                    <span className={styles.chatbotTypingDot} />
                  </div>
                )}
              </div>

              {/* Error Alert bila ada kendala */}
              {chatError && (
                <div className={styles.chatbotErrorBox}>
                  <span>âš ï¸ {chatError}</span>
                </div>
              )}

              {/* Bottom Composer */}
              <form
                className={styles.chatbotComposer}
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChatMessage();
                }}
              >
                {focusedWidget && (
                  <div className={styles.chatbotContextChip}>
                    <span className={styles.chatbotContextIcon}>
                      {focusedWidget.type === "card" ? <Layers size={13} /> : <LayoutGrid size={13} />}
                    </span>
                    <span className={styles.chatbotContextText}>
                      <strong>{focusedWidget.title}</strong>
                      <small>{focusedWidget.type === "card" ? "Kartu metrik" : "Grafik"} · widget terpilih</small>
                    </span>
                    <button
                      type="button"
                      className={styles.chatbotContextClose}
                      onClick={() => {
                        setFocusedWidgetId(null);
                        setHighlightedWidgetIds([]);
                      }}
                      aria-label="Lepas widget terpilih"
                      title="Lepas widget terpilih"
                    >
                      <X size={13} />
                    </button>
                  </div>
                )}
                <div className={styles.chatbotComposerBox}>
                  <textarea
                    className={styles.chatbotTextarea}
                    placeholder={focusedWidget ? `Tanya tentang "${focusedWidget.title}"...` : "Minta analisis data atau grafik..."}
                    rows={2}
                    value={chatDraft}
                    onChange={(e) => setChatDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendChatMessage();
                      }
                    }}
                  />
                  <button
                    type="submit"
                    className={styles.chatbotSendBtn}
                    disabled={!chatDraft.trim() || chatSending}
                    title="Kirim Pesan"
                    aria-label="Kirim Pesan"
                  >
                    <Send size={14} />
                  </button>
                </div>
                <p className={styles.chatbotHintText}>
                  Enter untuk kirim · Database {tenantContext?.databaseLabel || "Oracle"}
                </p>
              </form>
            </aside>
          ) : (
            <aside className={styles.dashboardListSidebar} aria-label="Daftar Dashboard">
              {/* Header: Title + Counter + Refresh + TOMBOL TUTUP SIDEBAR */}
              <div className={styles.sidebarHeaderRow}>
                <div className={styles.sidebarTitleGroup}>
                  <h2 className={styles.sidebarTitle}>Daftar Dashboard</h2>
                  <span className={styles.sidebarCounter}>{dashboards.length}</span>
                </div>
                <div className={styles.sidebarHeaderBtns}>
                  <button
                    type="button"
                    className={styles.sidebarIconBtn}
                    onClick={() => showToast("Daftar dashboard disinkronkan.")}
                    title="Refresh Daftar"
                    aria-label="Refresh Daftar"
                  >
                    <RefreshCw size={13} color="#667085" />
                  </button>
                  <button
                    type="button"
                    className={styles.sidebarToggleCloseBtn}
                    onClick={() => setIsSidebarOpen(false)}
                    title="Tutup Daftar Dashboard (Collapse)"
                    aria-label="Tutup Daftar Dashboard"
                  >
                    <PanelLeftClose size={16} />
                  </button>
                </div>
              </div>

              {/* Action Buttons: + Tambah Dashboard & âœ¨ Chatbot AiGovtech */}
              <div className={styles.sidebarActionButtons}>
                {canAddDashboard && (
                <button
                  type="button"
                  className={styles.btnTambahDashboard}
                  onClick={() => setShowAddModal(true)}
                  title="Tambah Dashboard Kustom Baru"
                >
                  <Plus size={16} />
                  <span>Tambah Dashboard</span>
                </button>
                )}
                {canUseChatbot && (
                <button
                  type="button"
                  className={styles.btnOpenAiChatbot}
                  onClick={() => hasDashboards && setSidebarView("chatbot")}
                  disabled={!hasDashboards}
                  title={hasDashboards ? "Buka Chatbot Analitik AiGovtech" : "Buat dashboard terlebih dahulu untuk menggunakan chatbot"}
                >
                  <Sparkles size={15} />
                  <span>Chatbot AiGovtech</span>
                  <span className={styles.aiBadgePill}>AI</span>
                </button>
                )}
              </div>

            {/* Kotak Pencarian */}
            <div className={styles.searchWrapper}>
              <Search size={14} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Cari dashboard..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            {/* Filter Chips Bar */}
            <div className={styles.filterChipScroll}>
              {[{ id: "all", title: "Semua" }, ...dashboards.map(({ id, title }) => ({ id, title }))].map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  className={`${styles.filterChip} ${
                    activeDashboardFilterId === filter.id ? styles.filterChipActive : ""
                  }`}
                  onClick={() => setActiveDashboardFilterId(filter.id)}
                >
                  {filter.title}
                </button>
              ))}
            </div>

            {/* Daftar Kartu Dashboard dengan Tombol Hapus */}
            <div className={styles.dashboardCardsList}>
              {filteredDashboards.map((item) => {
                const isSelected = item.id === selectedDashboardId;
                return (
                  <div
                    key={item.id}
                    className={`${styles.dashboardCardItem} ${
                      isSelected ? styles.dashboardCardItemActive : ""
                    } ${draggedDashboardId === item.id ? styles.dashboardCardDragging : ""} ${
                      dragOverDashboardId === item.id ? styles.dashboardCardDragOver : ""
                    }`}
                    draggable
                    onDragStart={(e) => handleDashboardDragStart(e, item.id)}
                    onDragOver={(e) => handleDashboardDragOver(e, item.id)}
                    onDrop={(e) => handleDashboardDrop(e, item.id)}
                    onDragEnd={handleDashboardDragEnd}
                    onClick={() => {
                      setSelectedDashboardId(item.id);
                      setDetailDashboard(null);
                      // Replay the entrance animation on every click (even if
                      // the same dashboard is clicked again).
                      setAnimationNonce((n) => n + 1);
                      setAnimateWidgets(true);
                    }}
                  >
                    <div className={styles.itemTopBadges}>
                      <div className={styles.itemBadgeGroup}>
                        <GripVertical size={13} className={styles.dashboardDragHandle} aria-label="Seret untuk mengurutkan dashboard" />
                        <span
                          className={`${styles.categoryPill} ${
                            styles[`categoryPill_${item.badgeTone || "teal"}`]
                          }`}
                        >
                          {item.category}
                        </span>
                        <span className={styles.datePill}>{item.badge}</span>
                      </div>

                      <div className={styles.itemActions}>
                        {isAdmin && (
                        <button
                          type="button"
                          className={styles.itemActionBtn}
                          onClick={(event) => {
                            event.stopPropagation();
                            setDetailDashboard(item);
                            setDetailStep(1);
                          }}
                          title={`Lihat detail "${item.title}"`}
                          aria-label={`Lihat detail ${item.title}`}
                        >
                          <Eye size={14} />
                        </button>
                        )}
                        <button
                          type="button"
                          className={styles.itemActionBtn}
                          onClick={(event) => handleStartRenameDashboard(event, item)}
                          title={`Ubah nama "${item.title}"`}
                          aria-label={`Ubah nama ${item.title}`}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          className={styles.itemDeleteBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDashboard(item.id, item.title);
                          }}
                          title={`Hapus "${item.title}"`}
                          aria-label={`Hapus ${item.title}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {editingDashboardId === item.id ? (
                      <div className={styles.renameDashboardRow} onClick={(event) => event.stopPropagation()}>
                        <input
                          autoFocus
                          type="text"
                          value={editingDashboardTitle}
                          aria-label={`Nama baru untuk ${item.title}`}
                          className={styles.renameDashboardInput}
                          onChange={(event) => setEditingDashboardTitle(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              handleSaveDashboardName(item.id);
                            } else if (event.key === "Escape") {
                              setEditingDashboardId(null);
                              setEditingDashboardTitle("");
                            }
                          }}
                        />
                        <button
                          type="button"
                          className={styles.itemActionBtn}
                          onClick={() => handleSaveDashboardName(item.id)}
                          title="Simpan nama"
                          aria-label="Simpan nama dashboard"
                        >
                          <Check size={14} />
                        </button>
                      </div>
                    ) : (
                      <h4 className={styles.itemCardTitle}>{item.title}</h4>
                    )}
                    <div className={styles.itemBottomRow}>
                      <span className={styles.itemSubtitle}>{item.subtitle}</span>
                      <span className={styles.itemMetricVal}>{item.metricText}</span>
                    </div>
                    <div className={styles.dashboardDetailFooter}>
                      <span>{item.databaseId ? `ID ${item.databaseId}` : "Dashboard"}</span>
                      {isAdmin && (
                      <button
                        type="button"
                        className={styles.dashboardDetailButton}
                        onClick={(event) => {
                          event.stopPropagation();
                          setDetailDashboard(item);
                          setDetailStep(1);
                        }}
                        aria-label={`Detail ${item.title}`}
                      >
                        <Info size={13} />
                        <span>Detail</span>
                      </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredDashboards.length === 0 && (
                dashboards.length === 0 ? (
                  /* No dashboards at all yet */
                  <div className={styles.listEmptyState}>
                    <div className={styles.listEmptyIcon}>
                      <LayoutDashboard size={26} color="#005e54" strokeWidth={1.7} />
                    </div>
                    <h3 className={styles.listEmptyTitle}>Belum ada dashboard</h3>
                    <p className={styles.listEmptyDesc}>
                      {canAddDashboard
                        ? "Buat dashboard pertama Anda, lalu isi dengan kartu metrik dan grafik melalui chatbot AiGovtech."
                        : "Belum ada dashboard yang diberikan untuk akun Anda. Hubungi admin untuk mendapatkan akses."}
                    </p>
                    {canAddDashboard && (
                    <button
                      type="button"
                      className={styles.listEmptyPrimaryBtn}
                      onClick={() => setShowAddModal(true)}
                    >
                      <Plus size={15} />
                      <span>Buat Dashboard Pertama</span>
                    </button>
                    )}
                    <button
                      type="button"
                      className={styles.listEmptyGhostBtn}
                      onClick={() => hasDashboards && setSidebarView("chatbot")}
                      disabled={!hasDashboards || !canUseChatbot}
                      hidden={!canUseChatbot}
                      title="Buat dashboard terlebih dahulu untuk menggunakan chatbot"
                    >
                      <Sparkles size={13} />
                      <span>Tanya AiGovtech dulu</span>
                    </button>
                  </div>
                ) : (
                  /* Dashboards exist, but none match the search/filter */
                  <div className={styles.listEmptyState}>
                    <div className={styles.listEmptyIcon}>
                      <Search size={24} color="#667085" strokeWidth={1.7} />
                    </div>
                    <h3 className={styles.listEmptyTitle}>Tidak ada hasil</h3>
                    <p className={styles.listEmptyDesc}>
                      Tidak ada dashboard yang cocok dengan pencarian atau filter Anda.
                    </p>
                    <button
                      type="button"
                      className={styles.listEmptyGhostBtn}
                      onClick={() => {
                        setSearchQuery("");
                        setActiveDashboardFilterId("all");
                      }}
                    >
                      <span>Hapus pencarian &amp; filter</span>
                    </button>
                  </div>
                )
              )}
            </div>
          </aside>
          )
        )}

        {/* WORKSPACE AREA */}
        <main className={styles.dashboardWorkspace}>
          {/* WORKSPACE TOOLBAR HEADER */}
          <div className={styles.workspaceToolbar}>
            <div className={styles.toolbarLeft}>
              {/* TOMBOL BUKA SIDEBAR KETIKA SIDEBAR DITUTUP */}
              {!isSidebarOpen && (
                <button
                  type="button"
                  className={styles.btnOpenSidebar}
                  onClick={() => setIsSidebarOpen(true)}
                  title="Buka Daftar Dashboard"
                  aria-label="Buka Daftar Dashboard"
                >
                  <PanelLeftOpen size={18} />
                  <span className={styles.sidebarBadgeMini}>{dashboards.length}</span>
                </button>
              )}

              {/* DASHBOARD AVATAR ICON */}
              <div className={styles.dashboardAvatarIcon}>
                <LayoutDashboard size={20} color="#005e54" />
              </div>

              {/* DASHBOARD META HEADER */}
              <div className={styles.activeDashboardMeta}>
                <div className={styles.activeTitleRow}>
                  <h1 className={styles.activeDashboardTitle}>{detailDashboard?.title || activeDashboard.title}</h1>
                  <span className={styles.activeCategoryPill}>
                    {detailDashboard?.category || activeDashboard.category}
                  </span>
                  <span className={styles.activeStatusPill}>
                    {detailDashboard?.badge || activeDashboard.badge}
                  </span>
                  {detailDashboard && (
                    <span className={styles.dashboardConfigModePill}>Mode Konfigurasi</span>
                  )}
                  <span className={styles.liveDbPill}>
                    <span className={styles.liveDbDot} />
                    <span>Oracle Live</span>
                  </span>
                </div>
                <div className={styles.headerMetaRow}>
                  <span className={styles.headerMetaItem}>
                    <Database size={12} className={styles.headerMetaIcon} />
                    <span>{tenantContext?.table || detailDashboard?.subtitle || activeDashboard.subtitle}</span>
                  </span>
                  <span className={styles.metaDivider}>•</span>
                  <span className={styles.headerMetaItem}>
                    <Layers size={12} className={styles.headerMetaIcon} />
                    <span>{(detailDashboard?.widgets || activeDashboard.widgets).length} Widget Aktif</span>
                  </span>
                  <span className={styles.metaDivider}>•</span>
                  <span className={styles.headerMetaItem}>
                    <span className={styles.freeModeBadge}>Kanvas Bebas 2D</span>
                  </span>
                </div>
              </div>
            </div>

            {/* TOOLBAR RIGHT: Aksi dashboard */}
            <div className={styles.toolbarRight}>
              {detailDashboard ? (
                <button
                  type="button"
                  className={styles.dashboardDetailClose}
                  onClick={() => setDetailDashboard(null)}
                  aria-label="Kembali ke dashboard"
                ><X size={17} /></button>
              ) : <button
                type="button"
                className={styles.btnResetGrid}
                onClick={handleResetGridLayout}
                title="Rapikan posisi semua card dan chart ke susunan grid"
              >
                <LayoutGrid size={14} />
                <span>Rapikan Grid</span>
              </button>}

              {canUseChatbot && (
              <button
                type="button"
                className={styles.btnHeaderAiChat}
                onClick={() => {
                  setIsSidebarOpen(true);
                  setSidebarView("chatbot");
                }}
                disabled={!hasDashboards}
                title={hasDashboards ? "Buka Chatbot Asisten AiGovtech" : "Buat dashboard terlebih dahulu untuk menggunakan chatbot"}
              >
                <Sparkles size={14} color="#007d79" />
                <span>AiGovtech</span>
                <span className={styles.headerAiDot} />
              </button>
              )}
            </div>
          </div>

          {/* DASHBOARD CONTENT BODY */}
          {isDashboardEmpty ? (
            /* EMPTY DASHBOARD STATE ("Masih Kosongan") */
            <section className={styles.emptyDashboardContainer}>
              <div className={styles.emptyCardBox}>
                <div className={styles.emptyIconBadge}>
                  <LayoutGrid size={32} color="#005e54" strokeWidth={1.8} />
                </div>
                <h2 className={styles.emptyTitle}>Dashboard Ini Masih Kosong</h2>
                <p className={styles.emptyDesc}>
                  Belum ada card metrik atau chart grafik yang ditambahkan ke{" "}
                  <strong>{activeDashboard.title}</strong>. Silakan gunakan asisten chatbot{" "}
                  <strong>AiGovtech</strong> pada sidebar navigasi sebelah kiri untuk membuat
                  dan menampilkan card metrik serta chart grafik berdasarkan data transaksi
                  transaksi {tenantContext?.databaseLabel || "perusahaan"} dari database {tenantContext?.table || "Oracle"}.
                </p>

                {canUseChatbot && (
                  <>
                    <button
                      type="button"
                      className={styles.btnOpenAiChat}
                      onClick={() => hasDashboards && setSidebarView("chatbot")}
                      disabled={!hasDashboards}
                      title={hasDashboards ? "Buka Chatbot AiGovtech di Sidebar" : "Buat dashboard terlebih dahulu untuk menggunakan chatbot"}
                      style={{ marginBottom: "18px" }}
                    >
                      <Sparkles size={15} />
                      <span>Buka Chatbot AiGovtech di Sidebar</span>
                    </button>

                    <div className={styles.emptyDivider} />

                    <span className={styles.emptySuggestionsLabel}>
                      CONTOH PERTANYAAN KE AIGOVTECH DI SIDEBAR:
                    </span>
                    <div className={styles.emptyPromptList}>
                      {starterPrompts.slice(0, 3).map((prompt) => (
                        <div
                          key={prompt}
                          className={styles.emptyPromptChip}
                          onClick={() => {
                            if (!hasDashboards) return;
                            setSidebarView("chatbot");
                            handleSendChatMessage(prompt);
                          }}
                          style={{ cursor: hasDashboards ? "pointer" : "not-allowed", opacity: hasDashboards ? 1 : 0.55 }}
                          title={hasDashboards ? "Klik untuk meminta AI menganalisis & membuat widget ini" : "Buat dashboard terlebih dahulu untuk menggunakan chatbot"}
                        >
                          <span>"{prompt}"</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </section>
          ) : (
            /* ACTIVE DASHBOARD FREE DRAGGABLE CANVAS WORKSPACE */
            <div
              ref={canvasRef}
              className={styles.canvasWorkspace}
              style={{ minHeight: `${canvasMinHeight}px` }}
            >
              {positionedWidgets.map((w, index) => {
                const displayWidget = normalizeWidgetSubtitle(w);
                let widgetContent: React.ReactNode = null;

                if (w.type === "card") {
                  // Every card uses the same shared component. Nothing here
                  // depends on the widget id or cardType: title, value, icon
                  // and subtitle all come from the widget data itself.
                  widgetContent = (
                    <SharedMetricCard
                      key={w.id}
                      title={w.title}
                      subtitle={displayWidget.subtitle || displayWidget.sub}
                      value={w.value}
                      formattedValue={w.formattedValue}
                      icon={w.icon}
                      badge={w.badge}
                      delta={w.delta}
                      animateOnce={animateWidgets}
                    />
                  );
                } else if (w.chartType === "donut-product" || w.id === "chart-top-produk") {
                  widgetContent = (
                    <SharedDonutProductChart
                      key={w.id}
                      title={w.title}
                      subtitle={displayWidget.subtitle}
                      data={w.data}
                      metricLabel={w.metricLabel}
                      centerLabel={w.centerLabel}
                      animateOnce={animateWidgets}
                    />
                  );
                } else if (w.chartType === "bar-category" || w.chartType === "bar") {
                  widgetContent = (
                    <SharedCategoryBarChart
                      key={w.id}
                      title={w.title}
                      subtitle={displayWidget.subtitle}
                      metricLabel={w.metricLabel}
                      data={w.data}
                      animateOnce={animateWidgets}
                    />
                  );
                } else if (w.chartType === "line-category" || w.chartType === "line") {
                  widgetContent = (
                    <SharedLineChartMonthlySales
                      key={w.id}
                      chartMode="category"
                      title={w.title}
                      subtitle={displayWidget.subtitle}
                      metricLabel={w.metricLabel}
                      data={w.data}
                      animateOnce={animateWidgets}
                    />
                  );
                } else if (w.chartType === "pie-category" || w.chartType === "pie") {
                  widgetContent = (
                    <SharedAnalyticsPieChart
                      title={w.title}
                      subtitle={displayWidget.subtitle}
                      metricLabel={w.metricLabel}
                      centerLabel={w.centerLabel}
                      data={w.data}
                      animateOnce={animateWidgets}
                    />
                  );
                } else if (w.chartType === "area-category" || w.chartType === "area") {
                  widgetContent = (
                    <SharedAnalyticsAreaChart
                      title={w.title}
                      subtitle={displayWidget.subtitle}
                      metricLabel={w.metricLabel}
                      data={w.data}
                      animateOnce={animateWidgets}
                    />
                  );
                } else if (w.chartType === "scatter") {
                  widgetContent = (
                    <SharedAnalyticsScatterChart
                      title={w.title}
                      subtitle={displayWidget.subtitle}
                      metricLabel={w.metricLabel}
                      centerLabel={w.centerLabel}
                      data={w.data}
                      animateOnce={animateWidgets}
                    />
                  );
                } else if (w.chartType === "table") {
                  widgetContent = (
                    <SharedAnalyticsDataTable
                      title={w.title}
                      subtitle={displayWidget.subtitle}
                      metricLabel={w.metricLabel}
                      data={w.data}
                    />
                  );
                } else if (w.chartType === "line-monthly") {
                  widgetContent = (
                    <SharedLineChartMonthlySales
                      key={w.id}
                      title={w.title}
                      subtitle={displayWidget.subtitle}
                      data={w.data}
                      summary={w.summary}
                      animateOnce={animateWidgets}
                    />
                  );
                } else if (w.chartType === "proporsi-program" || w.id === "chart-proporsi-program") {
                  widgetContent = (
                    <DonutSubprogramChart
                      key={w.id}
                      title={w.title}
                      subtitle={displayWidget.subtitle}
                      badge={w.badge}
                      {...(w.data || {})}
                    />
                  );
                } else if (w.chartType === "tren-sp2d" || w.id === "chart-tren-sp2d") {
                  widgetContent = (
                    <TrendAlokasiChart
                      key={w.id}
                      title={w.title}
                      subtitle={displayWidget.subtitle}
                      {...(w.data || {})}
                    />
                  );
                } else {
                  widgetContent = (
                    <SharedBarChartMonthlySales
                      key={w.id}
                      title={w.title}
                      subtitle={displayWidget.subtitle}
                      data={w.data}
                      summary={w.summary}
                      animateOnce={animateWidgets}
                    />
                  );
                }

                return (
                  <DraggableResizableWidget
                    key={`${w.id}-${animationNonce}`}
                    id={w.id}
                    index={index}
                    title={w.title}
                    type={w.type}
                    width={w.width}
                    height={w.height}
                    x={w.x}
                    y={w.y}
                    onResize={handleWidgetResize}
                    onPositionChange={handleWidgetPositionChange}
                    onRemove={canEditWidgets ? () => handleRemoveWidget(w.id, w.title) : undefined}
                    readOnly={!canEditWidgets}
                    highlighted={highlightedWidgetIds.includes(w.id)}
                    focused={focusedWidgetId === w.id}
                    onFocusWidget={() => handleFocusWidget(w.id)}
                  >
                    <React.Suspense fallback={<div style={{ padding: 16, color: "#667085" }}>Memuat visualisasi...</div>}>
                      {widgetContent}
                    </React.Suspense>
                  </DraggableResizableWidget>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* MODAL: TAMBAH DASHBOARD */}
      {detailDashboard && isAdmin && (
        <div className={`${styles.dashboardConfigOverlay} ${!isSidebarOpen ? styles.dashboardConfigOverlayExpanded : sidebarView === "chatbot" ? styles.dashboardConfigOverlayChatbot : ""}`}>
          <div className={styles.dashboardConfigPage}>
            <header className={styles.dashboardConfigHeader}>
              <div className={styles.dashboardConfigHeaderIcon}><LayoutGrid size={22} /></div>
              <div>
                <div className={styles.dashboardConfigTitleRow}>
                  <h1>Detail Dashboard</h1>
                  <span>MODE KONFIGURASI</span>
                </div>
                <p>Informasi, widget, dan hak akses untuk dashboard {detailDashboard.title}.</p>
              </div>
              <button
                type="button"
                className={styles.dashboardDetailClose}
                onClick={() => setIsSidebarOpen((open) => !open)}
                aria-label={isSidebarOpen ? "Tutup sidebar" : "Buka sidebar"}
                title={isSidebarOpen ? "Tutup sidebar" : "Buka sidebar"}
              >{isSidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}</button>
              <button
                type="button"
                className={styles.dashboardDetailClose}
                onClick={() => setDetailDashboard(null)}
                aria-label="Tutup detail dashboard"
              ><X size={17} /></button>
            </header>
            <nav className={styles.dashboardConfigSteps} aria-label="Tahapan konfigurasi dashboard">
              <button
                type="button"
                className={`${styles.dashboardConfigStep} ${detailStep === 1 ? styles.dashboardConfigStepActive : ""}`}
                onClick={() => setDetailStep(1)}
              >
                <span className={styles.dashboardConfigStepNumber}>1</span>
                <span><strong>Detail Informasi Dashboard</strong><small>Kode, nama, deskripsi, kategori &amp; tag</small></span>
                <b>{detailStep === 1 ? "Aktif" : ""}</b>
              </button>
              <button
                type="button"
                className={`${styles.dashboardConfigStep} ${detailStep === 2 ? styles.dashboardConfigStepActive : ""}`}
                onClick={() => setDetailStep(2)}
              >
                <span className={styles.dashboardConfigStepNumber}>2</span>
                <span><strong>Informasi Member</strong><small>Tambah member &amp; hak akses tim</small></span>
                <b>{detailStep === 2 ? "Aktif" : "Lanjutan"}</b>
              </button>
            </nav>

            {detailStep === 1 ? (
              <section id="dashboard-detail-info" className={styles.dashboardConfigPanel}>
                <div className={styles.dashboardConfigPanelHeader}>
                  <div className={styles.dashboardConfigHeaderIcon}><Info size={21} /></div>
                  <div><h2>1. Detail Informasi Dashboard</h2><p>Kode, nama, deskripsi, kategori, serta tag dashboard.</p></div>
                  <span>Langkah 1 dari 2</span>
                </div>
                <div className={styles.dashboardConfigFields}>
                  <label>Kode Dashboard <small>(ID tersimpan)</small>
                    <input readOnly value={`DB-${tenantContext?.tenant === "kemenkeu" ? "KEU" : "FASHION"}-${(detailDashboardLive || detailDashboard).databaseId || (detailDashboardLive || detailDashboard).id}`} />
                    <em>Kode unik dashboard yang tersimpan di database.</em>
                  </label>
                  <label>Nama Dashboard
                    <input
                      value={detailEditName}
                      onChange={(e) => setDetailEditName(e.target.value)}
                      readOnly={!canAddDashboard}
                      maxLength={255}
                      placeholder="Nama dashboard"
                    />
                    <em>{canAddDashboard ? "Ubah nama dashboard, lalu simpan." : "Nama dashboard yang sedang dipilih pada daftar."}</em>
                  </label>
                  <label>Kategori Dashboard
                    <input readOnly value={(detailDashboardLive || detailDashboard).category} />
                    <em>Kategori sumber data dashboard.</em>
                  </label>
                  <div className={styles.dashboardConfigTagField}>
                    <strong>Tag Dashboard</strong>
                    <div><span>{(detailDashboardLive || detailDashboard).category}</span><span>{(detailDashboardLive || detailDashboard).badge}</span><span>{tenantContext?.databaseLabel || "Oracle"}</span></div>
                    <em>Label berdasarkan kategori, status, dan sumber data yang tersedia.</em>
                  </div>
                  <label className={styles.dashboardConfigDescription}>Deskripsi Dashboard
                    <textarea
                      value={detailEditDesc}
                      onChange={(e) => setDetailEditDesc(e.target.value)}
                      readOnly={!canAddDashboard}
                      maxLength={2000}
                      placeholder={`Dashboard ${detailEditName || (detailDashboardLive || detailDashboard).title} menggunakan sumber data ${tenantContext?.table || (detailDashboardLive || detailDashboard).subtitle}.`}
                    />
                    <em>{canAddDashboard ? "Deskripsi tersimpan di database (DASHBOARDS.DESCRIPTION)." : "Deskripsi dashboard."}</em>
                  </label>
                  {canAddDashboard && (
                    <div className={styles.dashboardConfigInfoActions}>
                      <button
                        type="button"
                        className={styles.dashboardConfigContinue}
                        onClick={handleSaveDashboardInfo}
                        disabled={detailInfoBusy || !detailEditName.trim()}
                      >
                        <Check size={15} /> Simpan Informasi
                      </button>
                    </div>
                  )}
                  <div className={styles.dashboardDetailWidgetSection}>
                    <h3>Widget pada dashboard ({(detailDashboardLive || detailDashboard).widgets.length})</h3>
                    {(detailDashboardLive || detailDashboard).widgets.length ? <ul>{(detailDashboardLive || detailDashboard).widgets.map((widget) => (
                      <li key={widget.id}>
                        <span className={styles.dashboardDetailWidgetIcon}>{widget.type === "card" ? <Layers size={14} /> : <LayoutGrid size={14} />}</span>
                        <span className={styles.dashboardDetailWidgetText}><strong>{widget.title}</strong><small>{widget.subtitle || (widget.type === "card" ? "Kartu metrik" : "Grafik")}</small></span>
                      </li>
                    ))}</ul> : <p className={styles.dashboardDetailEmpty}>Belum ada widget di dashboard ini.</p>}
                  </div>
                </div>
              </section>
            ) : (
              <section id="dashboard-member-access" className={styles.dashboardConfigPanel}>
                <div className={styles.dashboardConfigPanelHeader}>
                  <div className={styles.dashboardConfigHeaderIcon}><UsersRound size={21} /></div>
                  <div><h2>2. Informasi Member &amp; Hak Akses Tim</h2><p>Kelola kolaborator, peran, dan visibilitas anggota tim.</p></div>
                  <span>Langkah 2 dari 2</span>
                </div>
                <div className={styles.dashboardConfigMemberPanel}>
                  <div className={styles.dashboardConfigMemberForm}>
                    <strong><UserPlus size={15} /> Tambah Member dari Daftar Pengguna</strong>
                    <div>
                      <label>
                        <span>Pilih Pengguna <b>*</b></span>
                        <select
                          value={memberUsername}
                          onChange={(e) => setMemberUsername(e.target.value)}
                        >
                          <option value="">— Pilih pengguna —</option>
                          {availableCandidates.map((c) => (
                            <option key={c.username} value={c.username}>
                              {c.name} ({c.username}){c.isAdmin ? " · Admin" : ""}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span>Peran Akses <b>*</b></span>
                        <select value={memberRole} onChange={(e) => setMemberRole(e.target.value)}>
                          <option value="viewer">Viewer</option>
                          <option value="editor">Editor</option>
                          <option value="pengelola">Pengelola</option>
                        </select>
                      </label>
                      <label>
                        <span>Unit Satker / Instansi</span>
                        <input
                          value={memberUnit}
                          onChange={(e) => setMemberUnit(e.target.value)}
                          placeholder="Opsional (mis. Direktorat Anggaran)"
                        />
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddMember}
                      disabled={!memberUsername || memberBusy}
                    >
                      <Plus size={14} /> Tambahkan Member
                    </button>
                    {availableCandidates.length === 0 && (
                      <p className={styles.dashboardDetailEmpty}>
                        Semua pengguna pada tenant ini sudah menjadi member.
                      </p>
                    )}
                  </div>
                  <div className={styles.dashboardConfigMemberList}>
                    <div>
                      <strong><UsersRound size={15} /> Daftar Hak Akses Member</strong>
                      <span>{memberList.length} Member Terdaftar</span>
                      <small>Tersimpan di database AUTH_SYSTEM per dashboard.</small>
                    </div>
                    {memberList.length === 0 ? (
                      <div className={styles.dashboardConfigNoMembers}>
                        Belum ada member untuk dashboard ini.
                      </div>
                    ) : (
                      <ul className={styles.dashboardMemberItems}>
                        {memberList.map((m) => (
                          <li key={m.id} className={styles.dashboardMemberRow}>
                            <span className={styles.dashboardMemberAvatar}>
                              {m.name.slice(0, 1).toUpperCase()}
                            </span>
                            <span className={styles.dashboardMemberInfo}>
                              <strong>{m.name}</strong>
                              <small>{m.email || m.username}{m.unit ? ` · ${m.unit}` : ""}</small>
                            </span>
                            {editingMemberId === m.id ? (
                              <>
                                <select
                                  className={styles.dashboardMemberRoleSelect}
                                  value={editingMemberRole}
                                  onChange={(e) => setEditingMemberRole(e.target.value)}
                                  disabled={memberBusy}
                                  aria-label={`Peran akses ${m.name}`}
                                >
                                  <option value="viewer">Viewer</option>
                                  <option value="editor">Editor</option>
                                  <option value="pengelola">Pengelola</option>
                                </select>
                                <button
                                  type="button"
                                  className={styles.itemActionBtn}
                                  onClick={() => handleSaveMemberRole(m)}
                                  disabled={memberBusy}
                                  aria-label={`Simpan hak akses ${m.name}`}
                                  title="Simpan"
                                >
                                  <Check size={13} />
                                </button>
                                <button
                                  type="button"
                                  className={styles.itemActionBtn}
                                  onClick={() => setEditingMemberId(null)}
                                  disabled={memberBusy}
                                  aria-label={`Batal edit ${m.name}`}
                                  title="Batal"
                                >
                                  <X size={13} />
                                </button>
                              </>
                            ) : (
                              <>
                                <span className={styles.dashboardMemberRole}>{m.roleAccess}</span>
                                <button
                                  type="button"
                                  className={styles.itemActionBtn}
                                  onClick={() => handleStartEditMember(m)}
                                  disabled={memberBusy}
                                  aria-label={`Ubah hak akses ${m.name}`}
                                  title={`Ubah hak akses ${m.name}`}
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  type="button"
                                  className={styles.itemDeleteBtn}
                                  onClick={() => handleRemoveMember(m.id)}
                                  disabled={memberBusy}
                                  aria-label={`Hapus member ${m.name}`}
                                  title={`Hapus ${m.name}`}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <p className={styles.dashboardConfigAccessNote}>
                    Upload member massal (Excel/CSV) akan tersedia pada pembaruan berikutnya.
                  </p>
                </div>
              </section>
            )}

            <footer className={styles.dashboardConfigFooter}>
              {detailStep === 1 ? (
                <>
                  <button type="button" className={styles.dashboardConfigBack} onClick={() => setDetailDashboard(null)}><ArrowLeft size={15} /> Kembali ke Dashboard</button>
                  <span>Detail ini menampilkan data yang tersimpan pada dashboard.</span>
                  <button type="button" className={styles.dashboardConfigContinue} onClick={() => setDetailStep(2)}>
                    Lanjut ke Informasi Member <ArrowLeft size={15} className={styles.dashboardConfigForwardIcon} />
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className={styles.dashboardConfigBack} onClick={() => setDetailStep(1)}><ArrowLeft size={15} /> Kembali</button>
                  <span>Perubahan member tersimpan otomatis di database.</span>
                  <div className={styles.dashboardConfigFooterActions}>
                    <button
                      type="button"
                      className={styles.dashboardConfigDraft}
                      onClick={() => setToastMessage("Perubahan member sudah tersimpan sebagai draf.")}
                    >
                      Simpan sebagai Draf
                    </button>
                    <button
                      type="button"
                      className={styles.dashboardConfigContinue}
                      onClick={() => {
                        setSelectedDashboardId(detailDashboard.id);
                        setDetailDashboard(null);
                        setToastMessage("Perubahan tersimpan. Kembali ke dashboard.");
                      }}
                    >
                      Simpan &amp; Lanjutkan Dashboard <ArrowLeft size={15} className={styles.dashboardConfigForwardIcon} />
                    </button>
                  </div>
                </>
              )}
            </footer>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleIcon}>
                <FolderPlus size={18} color="#005e54" />
              </div>
              <div>
                <h3 className={styles.modalTitle}>Tambah Dashboard Baru</h3>
                <p className={styles.modalSub}>
                  Dashboard baru akan dibuat dalam keadaan kosong. Anda dapat menambahkan
                  card metrik dan chart grafik menggunakan chatbot AiGovtech di sidebar.
                </p>
              </div>
            </div>

            <div className={styles.modalBody}>
              <label className={styles.inputLabel}>
                Nama Dashboard
                <input
                  type="text"
                  placeholder="Contoh: Analisis Penjualan Q3"
                  value={newDashboardTitle}
                  onChange={(e) => setNewDashboardTitle(e.target.value)}
                  className={styles.modalInput}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateDashboard();
                  }}
                />
              </label>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.btnModalCancel}
                onClick={() => setShowAddModal(false)}
              >
                Batal
              </button>
              <button
                type="button"
                className={styles.btnModalSubmit}
                onClick={handleCreateDashboard}
              >
                <Plus size={15} />
                <span>Buat Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className={styles.toastNotification} role="status">
          <Check size={16} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
