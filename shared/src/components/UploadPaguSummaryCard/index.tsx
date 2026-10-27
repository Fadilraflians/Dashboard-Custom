import type { ReactNode } from "react";
import styles from "./styles.module.css";

export type UploadPaguSummaryCardProps = {
  label: string;
  value: string;
  unit: string;
  helper: string;
  icon: ReactNode;
  tone?: "default" | "success" | "warning";
};

export default function UploadPaguSummaryCard({
  label,
  value,
  unit,
  helper,
  icon,
  tone = "default",
}: UploadPaguSummaryCardProps) {
  return (
    <article className={styles.card}>
      <div>
        <span>{label}</span>
        <strong>{value} <small>{unit}</small></strong>
        <p>{helper}</p>
      </div>
      <em className={styles[tone]}>{icon}</em>
    </article>
  );
}
