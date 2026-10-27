import styles from "./styles.module.css";

export type UploadPaguStatusPillProps = { value: string };

export default function UploadPaguStatusPill({ value }: UploadPaguStatusPillProps) {
  const tone = value === "Berhasil" ? styles.success : value === "Gagal" ? styles.danger : styles.warning;
  return <span className={`${styles.pill} ${tone}`}><i />{value}</span>;
}
