import type { ReactNode } from "react";

export interface SummaryGiroKpiCardData {
  title: string;
  value: string;
  icon: string;
  tone: string;
  pills: string[];
  noteLeft: string;
  noteRight: string;
}

export interface SummaryGiroStatCardData {
  title: string;
  value: string;
  badge: string;
  desc: string;
  foot: string;
  tone: string;
}

export interface SummaryGiroClasses {
  kpiCard: string;
  kpiTop: string;
  iconBox: string;
  pillRow: string;
  kpiFoot: string;
  sideCard: string;
}

export function SummaryGiroKpiCard({
  card,
  classes,
  toneClassName,
  iconToneClassName,
  icon,
}: {
  card: SummaryGiroKpiCardData;
  classes: SummaryGiroClasses;
  toneClassName: string;
  iconToneClassName: string;
  icon: ReactNode;
}) {
  return (
    <article className={`${classes.kpiCard} ${toneClassName}`}>
      <div className={classes.kpiTop}>
        <h3>{card.title}</h3>
        <span className={`${classes.iconBox} ${iconToneClassName}`}>{icon}</span>
      </div>
      <strong>{card.value}</strong>
      <div className={classes.pillRow}>
        <span>{card.pills[0]}</span>
        <span>{card.pills[1]}</span>
      </div>
      <div className={classes.kpiFoot}>
        <span>{card.noteLeft}</span>
        <b>{card.noteRight}</b>
      </div>
    </article>
  );
}

export function SummaryGiroStatCard({
  stat,
  classes,
  toneClassName,
}: {
  stat: SummaryGiroStatCardData;
  classes: SummaryGiroClasses;
  toneClassName: string;
}) {
  return (
    <article className={`${classes.sideCard} ${toneClassName}`}>
      <div>
        <span>{stat.title}</span>
        <strong>{stat.value}</strong>
        <p>{stat.desc}</p>
      </div>
      <b>{stat.badge}</b>
      <small>{stat.foot}</small>
    </article>
  );
}
