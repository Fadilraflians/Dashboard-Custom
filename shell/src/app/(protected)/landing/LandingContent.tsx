"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Landmark,
  Layers,
  Search,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  Headphones,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
} from "lucide-react";
import type {
  CatalogApplication,
  CatalogOrganization,
  CatalogSummaryData,
} from "@/serverServices";
import CountUp from "@/components/CountUp";
import styles from "./landing.module.css";

/** Where a selected application enters (shell MFE host w/ sidebar). */
const MFE_ENTRY_HREF = "/app/dashboard";

const PAGE_SIZE = 9;

interface LandingContentProps {
  userName: string;
}

type OrgFilter = "ALL" | "KEMENTRIAN" | "LEMBAGA";

export default function LandingContent({ userName }: LandingContentProps) {
  const [summary, setSummary] = useState<CatalogSummaryData | null>(null);
  const [orgs, setOrgs] = useState<CatalogOrganization[]>([]);
  const [totalData, setTotalData] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [filter, setFilter] = useState<OrgFilter>("ALL");
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Fetch the summary counts once.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/catalog/summary", { method: "POST" });
        const data = await res.json().catch(() => ({}));
        if (active && res.ok && data?.data) setSummary(data.data);
      } catch {
        /* ignore — cards show 0 */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Fetch organizations whenever page / search change.
  const loadOrgs = useCallback(async () => {
    setLoadingOrgs(true);
    try {
      const res = await fetch("/api/catalog/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          search: appliedSearch,
          sortBy: "ORGANIZATION_NAME",
          sortDirection: "ASC",
          pagination: { page, pageSize: PAGE_SIZE },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data?.data)) {
        setOrgs(data.data as CatalogOrganization[]);
        setTotalData(data?.metadata?.totalData ?? data.data.length);
      } else {
        setOrgs([]);
        setTotalData(0);
      }
    } catch {
      setOrgs([]);
      setTotalData(0);
    } finally {
      setLoadingOrgs(false);
    }
  }, [page, appliedSearch]);

  useEffect(() => {
    loadOrgs();
  }, [loadOrgs]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setAppliedSearch(search.trim());
  }

  // Only show organizations the signed-in user can access. The catalog marks
  // restricted organizations with accessAllowed=false; older responses that
  // omit the field remain visible for compatibility.
  const accessibleOrgs = orgs.filter((org) => org.accessAllowed !== false);
  // Client-side type filter on the current page (API has no type param).
  const visibleOrgs =
    filter === "ALL"
      ? accessibleOrgs
      : accessibleOrgs.filter((o) => o.organizationType === filter);

  const totalPages = Math.max(1, Math.ceil(totalData / PAGE_SIZE));
  const rangeStart = totalData === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, totalData);

  return (
    <div className={styles.page}>
      {/* ===== Welcome banner + summary stats ===== */}
      <section className={`${styles.banner} ${styles.fadeIn}`}>
        <div className={styles.bannerInfo}>
          <div className={styles.bannerAvatar}>
            {userName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className={styles.title}>
              Halo, {userName} <span className={styles.wave}>👋</span>
            </h1>
            <p className={styles.subtitle}>Selamat datang di GovTech Access</p>
            <p className={styles.subtitleSmall}>
              Kelola dan pantau seluruh akses kementerian, lembaga, dan
              portal dalam satu sistem terintegrasi.
            </p>

            <div className={styles.statRow}>
              <div className={styles.statCard}>
                <span className={styles.statIcon}>
                  <Landmark size={20} />
                </span>
                <div>
                  <span className={styles.statLabel}>Kementerian / Lembaga</span>
                  <div className={styles.statValueRow}>
                    <CountUp
                      className={styles.statValue}
                      value={summary?.activeOrganizations ?? 0}
                    />
                    <span className={styles.statUnit}>Terdaftar</span>
                  </div>
                </div>
              </div>

              <div className={styles.statCard}>
                <span className={`${styles.statIcon} ${styles.statIconAlt}`}>
                  <Layers size={20} />
                </span>
                <div>
                  <span className={styles.statLabel}>Total Portal</span>
                  <div className={styles.statValueRow}>
                    <CountUp
                      className={styles.statValue}
                      value={summary?.externalApplications ?? 0}
                    />
                    <span className={styles.statUnit}>Aktif</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <BannerArt />
      </section>

      {/* ===== Search ===== */}
      <form className={`${styles.searchBar} ${styles.fadeIn}`} onSubmit={submitSearch}>
        <Search size={18} className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama Kementerian, Lembaga, atau nama portal (contoh: Penerimaan, BPDLH, Bedah Rumah)..."
        />
        <button type="submit" className={styles.searchBtn}>
          Cari
        </button>
      </form>

      {/* ===== Filter chips + sort/refresh ===== */}
      <div className={`${styles.toolbar} ${styles.fadeIn}`}>
        <div className={styles.chips}>
          <button
            type="button"
            className={`${styles.chip} ${filter === "ALL" ? styles.chipActive : ""}`}
            onClick={() => setFilter("ALL")}
          >
            Semua ({accessibleOrgs.length})
          </button>
          <button
            type="button"
            className={`${styles.chip} ${filter === "KEMENTRIAN" ? styles.chipActive : ""}`}
            onClick={() => setFilter("KEMENTRIAN")}
          >
            Kementerian
          </button>
          <button
            type="button"
            className={`${styles.chip} ${filter === "LEMBAGA" ? styles.chipActive : ""}`}
            onClick={() => setFilter("LEMBAGA")}
          >
            Lembaga Non-Kementerian
          </button>
        </div>
        <button
          type="button"
          className={styles.refreshBtn}
          onClick={loadOrgs}
          disabled={loadingOrgs}
        >
          {loadingOrgs ? (
            <Loader2 size={14} className={styles.spin} />
          ) : (
            <RefreshCw size={14} />
          )}
          Segarkan Status Portal
        </button>
      </div>

      <p className={styles.resultHint}>
        Menampilkan {visibleOrgs.length} Entitas Kementerian / Lembaga
      </p>

      {/* ===== Organization cards ===== */}
      {loadingOrgs ? (
        <div className={styles.loadingBlock}>
          <Loader2 size={22} className={styles.spin} /> Memuat data...
        </div>
      ) : visibleOrgs.length === 0 ? (
        <div className={styles.emptyBlock}>Tidak ada data organisasi.</div>
      ) : (
        <div className={styles.grid}>
          {visibleOrgs.map((org, idx) => (
            <OrgCard
              key={org.organizationId}
              org={org}
              index={(page - 1) * PAGE_SIZE + idx + 1}
              delay={idx * 60}
              expanded={expandedId === org.organizationId}
              onToggle={() =>
                setExpandedId((cur) =>
                  cur === org.organizationId ? null : org.organizationId,
                )
              }
            />
          ))}
        </div>
      )}

      {/* ===== Pagination ===== */}
      <div className={`${styles.pagination} ${styles.fadeIn}`}>
        <span className={styles.pageInfo}>
          Menampilkan {rangeStart}–{rangeEnd} dari {totalData} Kementerian /
          Lembaga
        </span>
        <div className={styles.pager}>
          <button
            type="button"
            className={styles.pagerBtn}
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft size={14} /> Sebelumnya
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              className={`${styles.pageNum} ${p === page ? styles.pageNumActive : ""}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            className={styles.pagerBtn}
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Selanjutnya <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* ===== Helpdesk CTA ===== */}
      <section className={`${styles.helpCta} ${styles.fadeIn}`}>
        <div className={styles.helpInfo}>
          <span className={styles.helpIcon}>
            <Headphones size={20} />
          </span>
          <div>
            <h3 className={styles.helpTitle}>
              Butuh Akses Tambahan ke Portal K/L Lainnya?
            </h3>
            <p className={styles.helpText}>
              Hubungi Helpdesk Corporate Banking BNI atau Relationship Manager
              institusi Anda untuk provisioning hak akses.
            </p>
          </div>
        </div>
        <div className={styles.helpActions}>
          <button type="button" className={styles.helpGhost}>
            Panduan Integrasi (SOP)
          </button>
          <button type="button" className={styles.helpPrimary}>
            Hubungi Helpdesk BNI
          </button>
        </div>
      </section>
    </div>
  );
}

/* ---------- Organization card (collapsible) ---------- */

function OrgCard({
  org,
  index,
  delay,
  expanded,
  onToggle,
}: {
  org: CatalogOrganization;
  index: number;
  delay: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const router = useRouter();
  const [apps, setApps] = useState<CatalogApplication[] | null>(null);
  const [loadingApps, setLoadingApps] = useState(false);
  const [appsError, setAppsError] = useState<string | null>(null);

  const typeClass =
    org.organizationType === "KEMENTRIAN"
      ? styles.accentKementerian
      : styles.accentLembaga;

  // Lazily load applications the first time the card is expanded. Guard on
  // `apps === null` only (NOT loadingApps) — including a state we flip inside
  // the effect in the deps would re-run it and cancel the in-flight request.
  useEffect(() => {
    if (!expanded || apps !== null) return;
    let active = true;
    setLoadingApps(true);
    setAppsError(null);
    (async () => {
      try {
        const res = await fetch("/api/catalog/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appType: 2,
            organizationId: org.organizationId,
            search: "",
            sortBy: "DISPLAY_ORDER",
            sortDirection: "ASC",
            pagination: { page: 1, pageSize: 10 },
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!active) return;
        if (res.ok && Array.isArray(data?.data)) {
          setApps(data.data as CatalogApplication[]);
        } else {
          setApps([]);
          setAppsError(data?.message || "Gagal memuat aplikasi");
        }
      } catch {
        if (active) {
          setApps([]);
          setAppsError("Tidak dapat terhubung ke server");
        }
      } finally {
        if (active) setLoadingApps(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [expanded, apps, org.organizationId]);

  function enterApp(app: CatalogApplication) {
    // Carry the selected application's context into the app shell so the
    // sidebar can show the real app icon/name + organization and load the
    // right menus (by appId). The MFE host route owns header + sidebar.
    const params = new URLSearchParams({
      appId: String(app.appId),
      appName: app.appName,
      orgName: org.organizationName,
      appIcon: app.appIcon ?? "",
    });
    router.push(`${MFE_ENTRY_HREF}?${params.toString()}`);
  }

  return (
    <article
      className={`${styles.orgCard} ${typeClass} ${styles.cardFade} ${
        expanded ? styles.orgCardExpanded : ""
      }`}
      style={{ animationDelay: `${delay}ms` }}
      data-org={org.organizationId}
    >
      <div className={styles.orgTop}>
        <span className={styles.orgNumber}>
          {String(index).padStart(2, "0")}
        </span>
        <span className={styles.orgPortalBadge}>
          <Layers size={12} /> {expanded && apps ? apps.length : 1} Portal
        </span>
      </div>

      <div className={styles.orgBody}>
        <span className={styles.orgIcon}>
          {org.organizationCode.slice(0, 4).toUpperCase()}
        </span>
        <h3 className={styles.orgName}>{org.organizationName}</h3>
      </div>

      <p className={styles.orgDesc}>{org.organizationDescription}</p>

      <div className={styles.orgMeta}>
        {org.status === "TERVERIFIKASI" && (
          <span className={styles.orgStatus}>
            <CheckCircle2 size={13} /> Terverifikasi
          </span>
        )}
        <span className={styles.orgType}>{org.organizationType}</span>
      </div>

      {/* Expandable applications panel — always rendered; slides open via class */}
      <div
        className={`${styles.appsPanel} ${expanded ? styles.appsPanelOpen : ""}`}
      >
          <div className={styles.appsPanelHead}>
            <span className={styles.appsPanelTitle}>
              Daftar Portal Tersedia
            </span>
            {apps && (
              <span className={styles.appsPanelCount}>
                {apps.length} Portal Terdaftar
              </span>
            )}
          </div>

          {loadingApps ? (
            <div className={styles.appsLoading}>
              <Loader2 size={16} className={styles.spin} /> Memuat portal...
            </div>
          ) : appsError ? (
            <div className={styles.appsEmpty}>{appsError}</div>
          ) : apps && apps.length > 0 ? (
            <ul className={styles.appsList}>
              {apps.map((app) => (
                <li key={app.appId} className={styles.appRow}>
                  <div className={styles.appRowMain}>
                    <span className={styles.appIcon}>
                      {app.appName.slice(0, 2).toUpperCase()}
                    </span>
                    <div className={styles.appInfo}>
                      <span className={styles.appName}>{app.appName}</span>
                      <div className={styles.appMetaRow}>
                        {app.appStatus === "ACTIVE" && (
                          <span className={styles.appStatus}>
                            <span className={styles.appStatusDot} /> Online /
                            Aktif
                          </span>
                        )}
                        {app.appHighlightInfo && (
                          <span className={styles.appBadge}>
                            {app.appHighlightInfo}
                          </span>
                        )}
                      </div>
                      {app.appDescription && (
                        <p className={styles.appDesc}>{app.appDescription}</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`${styles.appEnterBtn} ${app.accessAllowed === false ? styles.appEnterBtnDisabled : ""}`}
                    onClick={() => enterApp(app)}
                    disabled={app.accessAllowed === false}
                    title={app.accessAllowed === false ? "Akun ini tidak memiliki akses ke portal tersebut" : undefined}
                  >
                    {app.accessAllowed === false ? "Akses Terbatas" : "Masuk Portal"}
                    {app.accessAllowed === false ? <CheckCircle2 size={14} /> : <ArrowRight size={14} />}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.appsEmpty}>
              Belum ada portal untuk entitas ini.
            </div>
          )}
      </div>

      <button
        type="button"
        className={styles.orgAction}
        onClick={onToggle}
        aria-expanded={expanded}
      >
        {expanded ? "Sembunyikan Daftar Portal" : "Lihat Daftar Portal"}
        {expanded ? (
          <ChevronDown size={14} className={styles.orgActionChevUp} />
        ) : (
          <ArrowRight size={14} />
        )}
      </button>
    </article>
  );
}

/* ---------- Decorative banner illustration ---------- */

function BannerArt() {
  return (
    <div className={styles.bannerArt} aria-hidden="true">
      <svg
        className={styles.bannerArtSvg}
        viewBox="0 0 420 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="leafGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#5eead4" stopOpacity="0.35" />
          </linearGradient>
          <linearGradient id="panelGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f0f7f6" />
          </linearGradient>
        </defs>

        {/* soft leaves */}
        <path
          d="M70 150 C70 110 110 95 150 100 C140 140 105 160 70 150 Z"
          fill="url(#leafGrad)"
        />
        <path
          d="M150 170 C150 135 185 120 220 126 C210 162 182 180 150 170 Z"
          fill="url(#leafGrad)"
          opacity="0.75"
        />

        {/* dotted connection paths */}
        <path
          d="M60 120 Q140 60 230 70 Q300 78 350 60"
          stroke="#5eead4"
          strokeWidth="1.5"
          strokeDasharray="3 5"
          strokeLinecap="round"
        />
        <path
          d="M110 185 Q180 150 250 150"
          stroke="#99f6e4"
          strokeWidth="1.5"
          strokeDasharray="3 5"
          strokeLinecap="round"
        />

        {/* connection dots */}
        <circle cx="230" cy="70" r="4" fill="#008380" />
        <circle cx="300" cy="78" r="3" fill="#f15a24" />
        <circle cx="250" cy="150" r="3.5" fill="#2dd4bf" />

        {/* institution glyph cards (rounded squares with a bank icon) */}
        <InstitutionCard x={46} y={96} tint="#5eead4" />
        <InstitutionCard x={132} y={56} tint="#99f6e4" />
        <InstitutionCard x={286} y={44} tint="#f15a24" accent />
        <InstitutionCard x={150} y={176} tint="#5eead4" />

        {/* dashboard panel */}
        <g>
          <rect
            x="300"
            y="118"
            width="104"
            height="104"
            rx="12"
            fill="url(#panelGrad)"
            stroke="#d8e8e7"
          />
          <circle cx="312" cy="130" r="2" fill="#cbd5e1" />
          <circle cx="320" cy="130" r="2" fill="#cbd5e1" />
          <circle cx="328" cy="130" r="2" fill="#cbd5e1" />
          {/* list rows */}
          <circle cx="314" cy="150" r="3" fill="#2dd4bf" />
          <rect x="322" y="148" width="40" height="4" rx="2" fill="#d1d5db" />
          <circle cx="314" cy="164" r="3" fill="#2dd4bf" />
          <rect x="322" y="162" width="34" height="4" rx="2" fill="#d1d5db" />
          <circle cx="314" cy="178" r="3" fill="#2dd4bf" />
          <rect x="322" y="176" width="40" height="4" rx="2" fill="#d1d5db" />
          <circle cx="314" cy="192" r="3" fill="#2dd4bf" />
          <rect x="322" y="190" width="28" height="4" rx="2" fill="#d1d5db" />
          {/* mini chart */}
          <rect x="368" y="150" width="26" height="26" rx="6" fill="#f0f7f6" stroke="#d8e8e7" />
          <rect x="373" y="166" width="3" height="6" rx="1" fill="#008380" />
          <rect x="378" y="162" width="3" height="10" rx="1" fill="#008380" />
          <rect x="383" y="158" width="3" height="14" rx="1" fill="#008380" />
          {/* donut */}
          <rect x="368" y="182" width="26" height="26" rx="6" fill="#f0f7f6" stroke="#d8e8e7" />
          <circle
            cx="381"
            cy="195"
            r="7"
            fill="none"
            stroke="#5eead4"
            strokeWidth="3"
            strokeDasharray="33 11"
            strokeLinecap="round"
            transform="rotate(-90 381 195)"
          />
        </g>
      </svg>
    </div>
  );
}

function InstitutionCard({
  x,
  y,
  tint,
  accent,
}: {
  x: number;
  y: number;
  tint: string;
  accent?: boolean;
}) {
  const fill = accent ? "#fff1ec" : "#ecfdf5";
  const stroke = accent ? "#f6c3ad" : "#bbf0e6";
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width="34" height="34" rx="9" fill={fill} stroke={stroke} />
      {/* simple bank/building glyph */}
      <path
        d="M8 15 L17 9 L26 15"
        stroke={tint}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <rect x="10" y="15" width="2.4" height="8" rx="0.8" fill={tint} />
      <rect x="15.8" y="15" width="2.4" height="8" rx="0.8" fill={tint} />
      <rect x="21.6" y="15" width="2.4" height="8" rx="0.8" fill={tint} />
      <rect x="8" y="24" width="18" height="2.4" rx="0.8" fill={tint} />
    </g>
  );
}
