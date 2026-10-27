import type { ReactNode } from "react";
import styles from "./styles.module.css";

export type UploadPaguTemplateCardProps = {
  title: string;
  description: string;
  format: string;
  size: string;
  icon: ReactNode;
  actionIcon: ReactNode;
};

export default function UploadPaguTemplateCard({
  title,
  description,
  format,
  size,
  icon,
  actionIcon,
}: UploadPaguTemplateCardProps) {
  return (
    <article className={styles.card}>
      <span>{icon}</span>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
        <div className={styles.meta}><small>{format}</small><small>{size}</small></div>
      </div>
      <button type="button">{actionIcon} Download Template</button>
    </article>
  );
}
