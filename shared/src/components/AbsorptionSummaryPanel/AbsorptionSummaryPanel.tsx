import React from "react";
import styles from "./AbsorptionSummaryPanel.module.css";

export interface BankProgressRowData { label: string; value: string; ignored: string; percent: number; tone: "teal" | "orange"; }
export interface AbsorptionSummaryPanelProps { code?: string; title?: string; badge?: string; description?: string; totalPercent: string; totalPenyerapan: string; totalTidakDihitung: string; rows: BankProgressRowData[]; }

export default function AbsorptionSummaryPanel({ code = "F", title = "Total % Penyerapan (E / C)", badge = "Kinerja Baik", description = "Rasio efektivitas serapan anggaran terhadap total dana teralokasi per bank penyalur", totalPercent, totalPenyerapan, totalTidakDihitung, rows }: AbsorptionSummaryPanelProps) {
  return <section className={styles.panel}>
    <div className={styles.top}>
      <div className={styles.title}><span className={styles.code}>{code}</span><div><strong>{title}</strong><p>{description}</p></div><span className={styles.badge}>{badge}</span></div>
      <div className={styles.numbers}><span>Total Penyerapan: <b>{totalPenyerapan}</b></span><span>Total Tdk Dihitung: <b>{totalTidakDihitung}</b></span></div>
      <div className={styles.percent}><small>TOTAL KUMULATIF</small><strong>{totalPercent}</strong></div>
    </div>
    <div className={styles.rows}>{rows.map((row) => <div key={row.label} className={styles.row}><div className={styles.meta}><span><i />{row.label}</span><b className={styles[row.tone]}>{row.value}</b><em>{row.ignored}</em></div><div className={`${styles.track} ${styles[`${row.tone}Track`]}`}><span style={{ width: `${row.percent}%` }} /></div></div>)}</div>
  </section>;
}
