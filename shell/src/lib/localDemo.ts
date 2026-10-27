import type { SessionRecord } from "./session";

export const LOCAL_DEMO_USER_ID = "local-demo-user";
export const LOCAL_DEMO_TOKEN = "local-demo-token";

export interface LocalDemoAccount {
  username: string;
  password: string;
  otp: string;
  sub: string;
  name: string;
  role: string;
  email: string;
  localDemoRole: "admin" | "company";
  organizationId?: number;
}

function localDemoAccounts(): LocalDemoAccount[] {
  return [
    {
      username: process.env.LOCAL_DEMO_ADMIN_USERNAME || "admin",
      password: process.env.LOCAL_DEMO_ADMIN_PASSWORD || "Admin123!",
      otp: process.env.LOCAL_DEMO_ADMIN_OTP || "194263",
      sub: "local-demo-admin",
      name: process.env.LOCAL_DEMO_ADMIN_NAME || "Administrator Demo",
      role: "Administrator Demo",
      email: "admin@localhost",
      localDemoRole: "admin",
    },
    {
      username: process.env.LOCAL_DEMO_KEMENKES_USERNAME || "kemenkes",
      password: process.env.LOCAL_DEMO_KEMENKES_PASSWORD || "Kemenkes123!",
      otp: process.env.LOCAL_DEMO_KEMENKES_OTP || "583917",
      sub: "local-demo-company-kemenkes",
      name: process.env.LOCAL_DEMO_KEMENKES_NAME || "Pengguna Kementerian Kesehatan",
      role: "User · Kementerian Kesehatan",
      email: "user.kemenkes@localhost",
      localDemoRole: "company",
      organizationId: 1,
    },
    {
      username: process.env.LOCAL_DEMO_KEMENKEU_USERNAME || "kemenkeu",
      password: process.env.LOCAL_DEMO_KEMENKEU_PASSWORD || "Kemenkeu123!",
      otp: process.env.LOCAL_DEMO_KEMENKEU_OTP || "762415",
      sub: "local-demo-company-kemenkeu",
      name: process.env.LOCAL_DEMO_KEMENKEU_NAME || "Pengguna Kementerian Keuangan",
      role: "User · Kementerian Keuangan",
      email: "user.kemenkeu@localhost",
      localDemoRole: "company",
      organizationId: 2,
    },
  ];
}

export function isLocalDemoEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.LOCAL_DEMO_AUTH === "true"
  );
}

export function findLocalDemoCredentials(username: string, password: string) {
  if (!isLocalDemoEnabled()) return null;
  return localDemoAccounts().find((account) =>
    account.username === username && account.password === password,
  ) ?? null;
}

export function findLocalDemoOtpAccount(username: string, otp: string) {
  if (!isLocalDemoEnabled()) return null;
  return localDemoAccounts().find((account) =>
    account.username === username && account.otp === otp,
  ) ?? null;
}

export function isLocalDemoSession(
  session: Pick<SessionRecord, "sub" | "jwt" | "localDemoRole"> | null | undefined,
): boolean {
  return (
    isLocalDemoEnabled() &&
    (session?.sub === LOCAL_DEMO_USER_ID || session?.sub?.startsWith("local-demo-") === true) &&
    session.jwt === LOCAL_DEMO_TOKEN
  );
}

/**
 * Whether catalog endpoints should serve the local (demo) organization &
 * application directory instead of calling the IFP backend. True for demo
 * sessions AND for database-auth sessions (AUTH_SOURCE=db), since those do not
 * go through IFP and the IFP catalog is unreachable locally. A DB-auth session
 * is identified by its `sub` prefix "authdb-".
 */
export function shouldUseLocalCatalog(
  session: Pick<SessionRecord, "sub" | "jwt" | "localDemoRole"> | null | undefined,
): boolean {
  if (isLocalDemoSession(session)) return true;
  return session?.sub?.startsWith("authdb-") === true;
}

export function isLocalDemoAdmin(session: Pick<SessionRecord, "localDemoRole" | "sub" | "jwt"> | null | undefined) {
  return isLocalDemoSession(session) &&
    (session?.localDemoRole === "admin" || session?.sub === LOCAL_DEMO_USER_ID);
}

export function canLocalDemoAccessOrganization(
  session: Pick<SessionRecord, "localDemoRole" | "organizationId" | "sub" | "jwt"> | null | undefined,
  organizationId: number,
) {
  return isLocalDemoAdmin(session) || (
    isLocalDemoSession(session) && session?.organizationId === organizationId
  );
}

export function canLocalDemoAccessApplication(
  session: Pick<SessionRecord, "localDemoRole" | "organizationId" | "sub" | "jwt"> | null | undefined,
  appId: number,
) {
  const organizationByApplication: Record<number, number> = { 4: 1, 5: 2 };
  const organizationId = organizationByApplication[appId];
  return Boolean(organizationId && canLocalDemoAccessOrganization(session, organizationId));
}

export function localDemoOrganizations(search = "", allowedOrganizationId?: number) {
  const organizations = [
    {
      organizationId: 1,
      organizationCode: "KEMENKES",
      organizationName: "Kementerian Kesehatan",
      organizationType: "KEMENTRIAN",
      organizationDescription: "Data demo lokal untuk pengembangan portal.",
      status: "TERVERIFIKASI",
    },
    {
      organizationId: 2,
      organizationCode: "KEMENKEU",
      organizationName: "Kementerian Keuangan",
      organizationType: "KEMENTRIAN",
      organizationDescription: "Data demo lokal untuk pengembangan portal keuangan.",
      status: "TERVERIFIKASI",
    },
  ];
  const query = search.trim().toLowerCase();
  return organizations.filter((item) =>
    (allowedOrganizationId === undefined || item.organizationId === allowedOrganizationId) &&
    `${item.organizationName} ${item.organizationCode}`.toLowerCase().includes(query),
  );
}

export function localDemoApplications(organizationId: number, search = "") {
  const applicationsByOrganization: Record<number, Array<{
    appId: number;
    appCode: string;
    appName: string;
    appDescription: string;
    appStatus: string;
    appIcon: string;
    appHighlightInfo: string;
    displayOrder: number;
  }>> = {
    1: [
    {
      appId: 4,
      appCode: "BOK_DASHBOARD",
      appName: "Dashboard BOK",
      appDescription: "Portal demo lokal untuk navigasi menu BOK.",
      appStatus: "ACTIVE",
      appIcon: "",
      appHighlightInfo: "DEMO LOKAL",
      displayOrder: 1,
    },
    ],
    2: [
      {
        appId: 5,
        appCode: "MFE_DASHBOARD",
        appName: "Dashboard MFE",
        appDescription: "Portal demo lokal untuk navigasi dashboard keuangan.",
        appStatus: "ACTIVE",
        appIcon: "",
        appHighlightInfo: "DEMO LOKAL",
        displayOrder: 1,
      },
    ],
  };
  const applications = applicationsByOrganization[organizationId] ?? [];
  const query = search.trim().toLowerCase();
  return applications.filter((item) =>
    `${item.appName} ${item.appCode}`.toLowerCase().includes(query),
  );
}

const MENU_LABELS: Record<string, string> = {
  BOK_DASHBOARD: "Dashboard BOK",
  BOK_PUSAT_INFORMASI: "Pusat Informasi",
  BOK_SUMMARY_GIRO: "Ringkasan Giro",
  BOK_SUMMARY_VA: "Ringkasan Virtual Account",
  BOK_POSISI_SALDO_GIRO: "Posisi Saldo Giro",
  BOK_POSISI_SALDO_VA: "Posisi Saldo Virtual Account",
  BOK_MUTASI_GIRO: "Mutasi Giro",
  BOK_MUTASI_VA: "Mutasi Virtual Account",
  BOK_REKAP_PROVINSI: "Rekap Provinsi",
  BOK_REKAP_KABUPATEN_KOTA: "Rekap Kabupaten/Kota",
  BOK_REKAP_PUSKESMAS: "Rekap Puskesmas",
  BOK_UPLOAD_PAGU: "Upload Pagu",
  BOK_KOREKSI_GIRO: "Koreksi Giro",
  BOK_KOREKSI_VA: "Koreksi Virtual Account",
  BOK_MUTASI_BUNGA: "Mutasi Bunga",
  BOK_MUTASI_RKUD: "Mutasi RKUD",
  BOK_REKAP_BUNGA: "Rekap Bunga",
  BOK_PEMBAYARAN_BUNGA: "Pembayaran Bunga",
  BOK_BUKTI_KIRIM_JASA_GIRO: "Bukti Kirim Jasa Giro",
  BOK_PRINT_DGO: "Cetak DGO",
  BOK_CHECK_DUPLIKASI_RPD: "Cek Duplikasi RPD",
  BOK_DOWNLOAD_FILE: "Download File",
  BOK_USER_MANUAL: "User Manual",
  BOK_CUSTOM_DASHBOARD: "Custom Dashboard",
};

function labelForMenu(code: string): string {
  return (
    MENU_LABELS[code] ||
    code
      .replace(/^BOK_/, "")
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
}

export function localDemoMenus(appId: number) {
  if (appId !== 4 && appId !== 5) return [];

  const configuredCodes = Object.keys(process.env)
    .filter((key) => /^MFE_BOK_[A-Z0-9_]+_URL$/.test(key))
    .map((key) => key.slice(4, -4))
    .filter((code) => Boolean(process.env[`MFE_${code}_SCOPE`]));

  const codes = [
    "BOK_DASHBOARD",
    ...configuredCodes,
  ];

  const leaf = (code: string, menuId: number) => ({
    menuId,
    menuCode: code,
    menuName: labelForMenu(code),
    menuType: "MENU" as const,
    routePath: `/app/${code.toLowerCase()}`,
    icon: code === "BOK_DASHBOARD" ? "LayoutDashboard" : code === "BOK_CUSTOM_DASHBOARD" ? "LayoutGrid" : undefined,
  });

  let nextId = 1;
  const section = (name: string, sectionCodes: string[]) => ({
    menuId: nextId++,
    menuCode: `BOK_${name.replace(/[^A-Z0-9]+/gi, "_").toUpperCase()}`,
    menuName: name,
    menuType: "SECTION" as const,
    child: sectionCodes.filter((code) => codes.includes(code)).map((code) => leaf(code, nextId++)),
  });

  const assignedCodes = new Set([
    "BOK_DASHBOARD", "BOK_SUMMARY_GIRO", "BOK_SUMMARY_VA",
    "BOK_POSISI_SALDO_GIRO", "BOK_POSISI_SALDO_VA", "BOK_MUTASI_GIRO", "BOK_MUTASI_VA",
    "BOK_REKAP_PROVINSI", "BOK_REKAP_KABUPATEN_KOTA", "BOK_REKAP_PUSKESMAS",
    "BOK_UPLOAD_PAGU", "BOK_KOREKSI_GIRO", "BOK_KOREKSI_VA", "BOK_CHECK_DUPLIKASI_RPD",
    "BOK_DOWNLOAD_FILE", "BOK_USER_MANUAL", "BOK_CUSTOM_DASHBOARD",
  ]);
  const administrationCodes = [
    "BOK_DOWNLOAD_FILE", "BOK_USER_MANUAL", "BOK_CUSTOM_DASHBOARD",
    ...codes.filter((code) => !assignedCodes.has(code)),
  ];

  return [
    section("Utama", ["BOK_DASHBOARD", "BOK_SUMMARY_GIRO", "BOK_SUMMARY_VA"]),
    section("Data & Transaksi", ["BOK_POSISI_SALDO_GIRO", "BOK_POSISI_SALDO_VA", "BOK_MUTASI_GIRO", "BOK_MUTASI_VA", "BOK_REKAP_PROVINSI", "BOK_REKAP_KABUPATEN_KOTA", "BOK_REKAP_PUSKESMAS"]),
    section("Perencanaan & Kontrol", ["BOK_UPLOAD_PAGU", "BOK_KOREKSI_GIRO", "BOK_KOREKSI_VA", "BOK_CHECK_DUPLIKASI_RPD"]),
    section("Administrasi", administrationCodes),
  ].filter((item) => item.child.length > 0);
}
