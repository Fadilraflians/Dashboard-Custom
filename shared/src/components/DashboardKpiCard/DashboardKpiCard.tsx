import React from "react";
import { Info } from "lucide-react";
import styles from "./DashboardKpiCard.module.css";

export type KpiTone = "muted" | "up" | "down";
export interface DashboardKpiData { id: string; label: string; value: string; highlight?: boolean; performance?: boolean; sub: { label?: string; text: string; tone: KpiTone }[]; }

export default function DashboardKpiCard({ card }: { card: DashboardKpiData }) {
  const id = card.id.toUpperCase();
  const performance = card.performance ?? card.id === "f";
  const rows = performance && card.sub.length === 0
    ? [{ text: "-", tone: "muted" as const }, { text: "-", tone: "muted" as const }]
    : card.sub;
  return <article className={`${styles.kpi} ${card.highlight ? styles.highlight : ""}`}>
    <div className={styles.top}><span className={`${styles.code} ${styles[`code${id}`] || ""}`}>{id}</span><Info size={14} className={styles.info} /></div>
    <div className={styles.label}>{card.label}</div>
    {performance ? <div className={styles.performance}><div className={styles.performanceLine}><span>{card.value}</span><strong>Kinerja Baik</strong></div><div className={styles.progress}><span /></div></div> : <div className={`${styles.value} ${styles[`value${id}`] || ""}`}>{card.value}</div>}
    <div className={styles.subs}>{rows.map((row, index) => <div key={`${row.label ?? row.text}-${index}`} className={`${styles.sub} ${styles[row.tone]}`}><span className={styles.bank}><i />{row.label ?? (index === 0 ? "BNI" : "BSI")}</span><span>{row.text}</span></div>)}</div>
  </article>;
}
