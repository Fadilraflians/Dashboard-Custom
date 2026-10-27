import type { CSSProperties, ReactNode } from "react";

export interface SummaryVaKpiCardData {
  title: string;
  value: string;
  icon: string;
  tone: string;
  pills: string[];
  noteLeft: string;
  noteRight: string;
}

export interface SummaryVaChannelData {
  title: string;
  desc: string;
  value: string;
  amount: string;
  width: number;
  icon: string;
}

export interface SummaryVaClasses {
  kpiCard: string;
  kpiTop: string;
  iconBox: string;
  pillRow: string;
  kpiFoot: string;
  channelCard: string;
  channelIcon: string;
  progressTrack: string;
}

export function SummaryVaKpiCard({
  card,
  classes,
  toneClassName,
  iconToneClassName,
  icon,
}: {
  card: SummaryVaKpiCardData;
  classes: SummaryVaClasses;
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

export function SummaryVaChannelCard({
  channel,
  classes,
  icon,
}: {
  channel: SummaryVaChannelData;
  classes: SummaryVaClasses;
  icon: ReactNode;
}) {
  const progressStyle = { "--w": `${channel.width}%` } as CSSProperties;

  return (
    <article className={classes.channelCard}>
      <span className={classes.channelIcon}>{icon}</span>
      <div>
        <strong>{channel.title}</strong>
        <p>{channel.desc}</p>
        <div className={classes.progressTrack}><span style={progressStyle} /></div>
      </div>
      <b>{channel.value}<small>{channel.amount}</small></b>
    </article>
  );
}
