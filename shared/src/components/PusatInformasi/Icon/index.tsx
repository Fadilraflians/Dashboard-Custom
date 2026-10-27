import type { ReactNode } from "react";

// Kumpulan ikon SVG ringan (stroke-based) untuk sidebar & UI portal.
const PATHS: Record<string, ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  doc: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
    </>
  ),
  chart: (
    <>
      <path d="M3 3v18h18" />
      <path d="M7 15l4-4 3 3 5-6" />
    </>
  ),
  wallet: (
    <>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M16 12h2" />
      <path d="M3 10h18" />
    </>
  ),
  receipt: (
    <>
      <path d="M4 3a1 1 0 0 1 1-1c.3 0 .5.1.7.2l.9.6a1.3 1.3 0 0 0 1.4 0l.9-.6a1.3 1.3 0 0 1 1.4 0l.9.6a1.3 1.3 0 0 0 1.4 0l.9-.6a1.3 1.3 0 0 1 1.4 0l.9.6a1.3 1.3 0 0 0 1.4 0l.9-.6c.2-.1.4-.2.7-.2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1c-.3 0-.5-.1-.7-.2l-.9-.6a1.3 1.3 0 0 0-1.4 0l-.9.6a1.3 1.3 0 0 1-1.4 0l-.9-.6a1.3 1.3 0 0 0-1.4 0l-.9.6a1.3 1.3 0 0 1-1.4 0l-.9-.6a1.3 1.3 0 0 0-1.4 0l-.9.6c-.2.1-.4.2-.7.2a1 1 0 0 1-1-1z" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </>
  ),
  payments: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18M7 15h4" />
    </>
  ),
  settings: (
    <>
      <path d="M12.2 2h-.4l-1 2.7a7.8 7.8 0 0 0-1.6.7L6.5 4.2l-.3.3-2 3.4.1.4 2.2 1.7a7 7 0 0 0 0 2L4.3 13.7l-.1.4 2 3.4.3.3 2.7-1.2c.5.3 1 .5 1.6.7l1 2.7h.4l4-.1.3-.3 1-2.7c.6-.2 1.1-.4 1.6-.7l2.7 1.2.3-.3 2-3.4-.1-.4-2.2-1.7a7 7 0 0 0 0-2l2.2-1.7.1-.4-2-3.4-.3-.3-2.7 1.2c-.5-.3-1-.5-1.6-.7l-1-2.7z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  folder: (
    <>
      <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </>
  ),
  upload: (
    <>
      <path d="M12 13V3" />
      <path d="m8 7 4-4 4 4" />
      <path d="M4 14v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" />
    </>
  ),
  refresh: (
    <>
      <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" />
      <path d="M3 21v-5h5" />
      <path d="M3 12A9 9 0 0 1 18.5 5.8L21 8" />
      <path d="M21 3v5h-5" />
    </>
  ),
  percent: (
    <>
      <path d="M19 5 5 19" />
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </>
  ),
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z" />
    </>
  ),
  shuffle: (
    <>
      <path d="M16 3h5v5" />
      <path d="M4 20 21 3" />
      <path d="M21 16v5h-5" />
      <path d="M15 15 21 21" />
      <path d="M4 4l5 5" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </>
  ),
  news: (
    <>
      <path d="M4 4h13a1 1 0 0 1 1 1v14a2 2 0 0 0 2-2V7" />
      <path d="M4 4v15a2 2 0 0 0 2 2h12" />
      <path d="M8 8h6M8 12h6M8 16h4" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16v-4M12 8h.01" />
    </>
  ),
  report: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M8 13h8M8 17h8" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 2.5M12 17h.01" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </>
  ),
  home: (
    <>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11z" />
      <circle cx="12" cy="10" r="2" />
    </>
  ),
  filter: (
    <>
      <path d="M3 5h18l-7 8v5l-4 2v-7z" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  edit: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
    </>
  ),
  alert: (
    <>
      <path d="M10.3 3.8 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronLeft: <path d="m15 18-6-6 6-6" />,
  chevronRight: <path d="m9 18 6-6-6-6" />,
  check: <path d="M20 6 9 17l-5-5" />,
  shield: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  download: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5M12 15V3" />
    </>
  ),
  file: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </>
  ),
  send: (
    <>
      <path d="M22 2 11 13" />
      <path d="m22 2-7 20-4-9-9-4z" />
    </>
  ),
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </>
  ),
};

type IconProps = {
  name: string;
  size?: number;
  className?: string;
};

export default function Icon({ name, size = 18, className }: IconProps) {
  const content = PATHS[name];
  if (!content) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {content}
    </svg>
  );
}
