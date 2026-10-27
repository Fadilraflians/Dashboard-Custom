import React from "react";
import Icon from "./Icon";
import styles from "./PusatInformasi.module.css";

export interface HeroAnnouncement {
  id: number; badge: string; date: string; source: string;
  title: string; excerpt: string; tag: string;
}
export interface Announcement {
  id: number; type: string; date: string; time: string;
  label: string; title: string; excerpt: string;
}
export interface AnnouncementTab { key: string; label: string; count: number; }
export interface InformationEvent {
  id: number; month: string; day: string; title: string; time: string; place: string;
}
export interface ProgramFile {
  id: number; title: string; source: string; date: string; meta: string;
}

export function InformationHero({ hero, activeIndex, count, onPrevious, onNext, onSelect }: {
  hero: HeroAnnouncement; activeIndex: number; count: number;
  onPrevious: () => void; onNext: () => void; onSelect: (index: number) => void;
}) {
  return <section className={styles.hero}>
    <div className={styles.heroBody}>
      <div className={styles.heroTop}>
        <span className={styles.heroBadge}>{hero.badge}</span>
        <span className={styles.heroDate}><Icon name="calendar" size={13} /> {hero.date}</span>
        <span className={styles.heroSource}>{hero.source}</span>
      </div>
      <h2 className={styles.heroTitle}>{hero.title}</h2>
      <p className={styles.heroExcerpt}>{hero.excerpt}</p>
      <div className={styles.heroActions}>
        <button type="button" className={styles.heroCta}>Lihat Detail Pengumuman <Icon name="chevronRight" size={16} /></button>
        <div className={styles.heroNav}>
          <div className={styles.heroDots}>{Array.from({ length: count }, (_, index) => <button type="button" key={index} className={`${styles.heroDot} ${index === activeIndex ? styles.heroDotActive : ""}`} onClick={() => onSelect(index)} aria-label={`Pengumuman ${index + 1}`} />)}</div>
          <button type="button" className={styles.heroArrow} onClick={onPrevious} aria-label="Sebelumnya"><Icon name="chevronLeft" size={16} /></button>
          <button type="button" className={styles.heroArrow} onClick={onNext} aria-label="Berikutnya"><Icon name="chevronRight" size={16} /></button>
        </div>
      </div>
    </div>
    <span className={styles.heroTag}><Icon name="shield" size={13} /> {hero.tag}</span>
  </section>;
}

export function AnnouncementBrowser({ announcements, tabs, activeTab, query, onTabChange, onQueryChange }: {
  announcements: Announcement[]; tabs: AnnouncementTab[]; activeTab: string; query: string;
  onTabChange: (key: string) => void; onQueryChange: (query: string) => void;
}) {
  return <div className={styles.listCol}>
    <div className={styles.tabs}>{tabs.map((tab) => <button type="button" key={tab.key} className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ""}`} onClick={() => onTabChange(tab.key)}>{tab.label} ({tab.count})</button>)}</div>
    <div className={styles.toolbar}>
      <div className={styles.searchWrap}><Icon name="search" size={16} className={styles.searchIcon} /><input className={styles.search} placeholder="Cari judul atau kata kunci..." value={query} onChange={(event) => onQueryChange(event.target.value)} /></div>
      <select className={styles.select} defaultValue="all"><option value="all">Semua Periode</option><option value="2026">2026</option><option value="2025">2025</option></select>
      <select className={styles.select} defaultValue="terbaru"><option value="terbaru">Urutkan: Terbaru</option><option value="terlama">Urutkan: Terlama</option></select>
    </div>
    <ul className={styles.list}>
      {announcements.map((item) => <li key={item.id} className={styles.item}>
        <span className={styles.itemIcon} aria-hidden="true"><Icon name="bell" size={16} /></span>
        <div className={styles.itemBody}><div className={styles.itemMeta}><span className={styles.itemType}>{item.type}</span><span className={styles.itemDate}>{item.date} • {item.time}</span><span className={styles.itemLabel}>{item.label}</span></div><h3 className={styles.itemTitle}>{item.title}</h3><p className={styles.itemExcerpt}>{item.excerpt}</p></div>
        <Icon name="chevronRight" size={18} className={styles.itemArrow} />
      </li>)}
      {announcements.length === 0 && <li className={styles.empty}>Tidak ada pengumuman yang cocok dengan pencarian.</li>}
    </ul>
    <div className={styles.pagination}><span className={styles.pageInfo}>Menampilkan 1-5 dari 12 pengumuman</span><div className={styles.pager}><button type="button" className={styles.pageBtn} disabled>Sebelumnya</button><button type="button" className={`${styles.pageNum} ${styles.pageNumActive}`}>1</button><button type="button" className={styles.pageNum}>2</button><button type="button" className={styles.pageNum}>3</button><button type="button" className={styles.pageBtn}>Selanjutnya</button></div></div>
  </div>;
}

export function EventAgendaCard({ events }: { events: InformationEvent[] }) {
  return <div className={styles.card}><div className={styles.cardHead}><h4 className={styles.cardTitle}><Icon name="calendar" size={16} /> Event &amp; Agenda</h4><button type="button" className={styles.cardLink}>Lihat Semua</button></div><ul className={styles.eventList}>{events.map((event) => <li key={event.id} className={styles.event}><div className={styles.eventDate}><span className={styles.eventMonth}>{event.month}</span><span className={styles.eventDay}>{event.day}</span></div><div className={styles.eventBody}><h5 className={styles.eventTitle}>{event.title}</h5><p className={styles.eventMeta}><Icon name="info" size={11} /> {event.time}</p><p className={styles.eventMeta}><Icon name="info" size={11} /> {event.place}</p></div></li>)}</ul></div>;
}

export function ProgramInformationCard({ files }: { files: ProgramFile[] }) {
  return <div className={styles.card}><div className={styles.cardHead}><h4 className={styles.cardTitle}><Icon name="file" size={16} /> Informasi Program</h4><button type="button" className={styles.cardLink}>Lihat Semua</button></div><ul className={styles.fileList}>{files.map((file) => <li key={file.id} className={styles.file}><span className={styles.fileIcon} aria-hidden="true"><Icon name="file" size={16} /></span><div className={styles.fileBody}><h5 className={styles.fileTitle}>{file.title}</h5><p className={styles.fileMeta}>{file.source} • {file.date} • {file.meta}</p></div><button type="button" className={styles.fileDownload} aria-label="Unduh"><Icon name="download" size={16} /></button></li>)}</ul></div>;
}

export function BokHelpdeskCard() {
  return <div className={styles.helpdesk}><h4 className={styles.helpdeskTitle}><Icon name="help" size={16} /> BNI Helpdesk BOK</h4><p className={styles.helpdeskText}>Mengalami kendala pemindahbukuan SP2D atau validasi tanda tangan elektronik Kepala Puskesmas? Hubungi BNI Institutional Desk.</p><div className={styles.helpdeskRow}><span className={styles.helpdeskPhone}>1500046</span><button type="button" className={styles.helpdeskBtn}>Hubungi Call Center</button></div></div>;
}
