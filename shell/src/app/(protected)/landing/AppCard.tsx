"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { PiIcon } from "@/lib/piIcon";
import styles from "./landing.module.css";

interface AppCardProps {
  /** Logical MFE app key (for aria/debug; selection happens in the host). */
  appKey: string;
  title: string;
  description: string;
  /** PrimeIcons class (e.g. "pi pi-th-large"). */
  icon: string;
  /** Shell route that hosts the MFE (e.g. /app/dashboard). */
  href: string;
}

export default function AppCard({
  appKey,
  title,
  description,
  icon,
  href,
}: AppCardProps) {
  const router = useRouter();

  function open() {
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  }

  return (
    <div
      className={styles.card}
      role="button"
      tabIndex={0}
      data-app={appKey}
      aria-label={`Buka ${title}`}
      onClick={open}
      onKeyDown={onKeyDown}
    >
      <span className={styles.cardIcon}>
        <PiIcon name={icon} size={22} />
      </span>
      <h3 className={styles.cardTitle}>{title}</h3>
      <p className={styles.cardDesc}>{description}</p>
      <span className={styles.cardAction}>
        Buka aplikasi <ArrowRight size={14} />
      </span>
    </div>
  );
}
