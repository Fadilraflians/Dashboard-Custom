import Icon from "@/components/PusatInformasi/Icon";
import styles from "./page.module.css";
import type { ReactNode } from "react";

export function SharedCardBoundary({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

const guideCards = [
  ["Dashboard BOK", "Memantau ringkasan alokasi, penyaluran, penyerapan, dan kondisi dana BOK.", "3 Panduan Lengkap", "Umum"],
  ["Posisi Saldo", "Melihat posisi saldo rekening giro dan Virtual Account.", "4 Rekening VA", "Keuangan"],
  ["Mutasi Rekening", "Melihat riwayat transaksi debit dan kredit rekening.", "Arus Kas Manual", "Transaksi"],
  ["Rekap Penyaluran", "Melihat detail penyaluran dana BOK berdasarkan wilayah dan rekening.", "Peta & Tabel Salur", "Distribusi"],
  ["Upload Pagu", "Panduan mengunggah dan memproses data pagu.", "Format Excel & Validasi", "Perencanaan"],
  ["Laporan & Download", "Panduan unduh, pengecekan, dan penggunaan laporan.", "Report PDF & Excel", "Output & Audit"],
];

const popularGuides = [
  "Cara melihat Dashboard BOK",
  "Cara melihat Posisi Saldo Giro",
  "Cara melihat Saldo Virtual Account",
  "Cara melakukan Upload Pagu",
  "Cara melihat Rekap Penyaluran",
  "Cara mengunduh laporan",
];

const videos = [
  ["Tutorial Penggunaan Dashboard", "Panduan cara memahami informasi utama pada Dashboard BOK.", "Dasbor"],
  ["Tutorial Posisi Saldo", "Panduan cara melihat saldo rekening Giro dan VA.", "Keuangan"],
  ["Tutorial Rekap Penyaluran", "Panduan cara membaca dan mengunduh data penyaluran.", "Laporan"],
];

export default function UserManualPage() {
  return (
    <div className={styles.page}>
      <div className={styles.breadcrumb}>
        <Icon name="home" size={13} />
        <span>Home</span>
        <span>/</span>
        <strong>User Manual</strong>
      </div>

      <header className={styles.pageHead}>
        <div>
          <h1>
            User Manual <span>Panduan BOK v2.6</span>
          </h1>
          <p>Panduan penggunaan aplikasi BOK untuk membantu Anda memahami setiap fitur dan proses.</p>
        </div>
        <div className={styles.headActions}>
          <button type="button" className={styles.secondaryBtn}>
            <Icon name="search" size={15} /> Pencarian Panduan
          </button>
          <button type="button" className={styles.primaryBtn}>
            <Icon name="download" size={15} /> Unduh Buku Panduan
          </button>
        </div>
      </header>

      <section className={styles.hero}>
        <div>
          <span>Buku Manual BOK Puskesmas & Bendahara</span>
          <h2>Selamat Datang di User Manual BOK</h2>
          <p>Temukan panduan penggunaan fitur BOK secara bertahap, mulai dari melihat dashboard, memantau saldo, mengelola pagu, hingga melihat laporan.</p>
          <div className={styles.heroActions}>
            <button type="button">Mulai Eksplorasi <Icon name="chevronRight" size={14} /></button>
            <button type="button">Temukan Video Singkat</button>
          </div>
        </div>
        <div className={styles.heroStats}>
          <article><strong>18+</strong><span>Modul Panduan</span></article>
          <article><strong>100%</strong><span>Berbasis Sistem</span></article>
        </div>
      </section>

      <section className={styles.searchPanel}>
        <h2>Ada yang bisa kami bantu jelaskan hari ini?</h2>
        <div className={styles.searchBox}>
          <Icon name="search" size={16} />
          <input placeholder="Cari panduan, fitur, atau kata kunci... (contoh: cara melihat saldo, upload pagu, cetak bukti)" />
          <button type="button">Cari</button>
        </div>
        <div className={styles.quickTags}>
          <span>Pencarian populer:</span>
          <button type="button">cara melihat saldo</button>
          <button type="button">cara upload pagu</button>
          <button type="button">cara melihat laporan</button>
          <button type="button">validasi pagu</button>
        </div>
      </section>

      <section className={styles.guideSection}>
        <div className={styles.sectionHead}>
          <div>
            <h2>Panduan Berdasarkan Menu</h2>
            <p>Pilih menu aplikasi yang ingin Anda pelajari alur dan cara penggunaannya.</p>
          </div>
          <button type="button">Kategori Utama</button>
        </div>
        <div className={styles.guideGrid}>
          {guideCards.map(([title, description, footer, tag], index) => (
            <article key={title} className={styles.guideCard}>
              <div className={styles.guideIcon}>
                <Icon name={index % 2 === 0 ? "dashboard" : "book"} size={18} />
              </div>
              <span>{tag}</span>
              <h3>{index + 1}. {title}</h3>
              <p>{description}</p>
              <div>
                <small>{footer}</small>
                <button type="button">Lihat Panduan <Icon name="chevronRight" size={13} /></button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.popularSection}>
        <div className={styles.sectionHead}>
          <div>
            <h2>Panduan Populer</h2>
            <p>Daftar alur kerja yang paling sering dicari oleh bendahara dan operator Puskesmas.</p>
          </div>
          <button type="button">Sering Digunakan</button>
        </div>
        <div className={styles.popularGrid}>
          {popularGuides.map((guide, index) => (
            <button type="button" key={guide} className={styles.popularCard}>
              <Icon name={index % 3 === 0 ? "dashboard" : index % 3 === 1 ? "wallet" : "file"} size={17} />
              <span>{guide}</span>
              <Icon name="chevronRight" size={14} />
            </button>
          ))}
        </div>
      </section>

      <section className={styles.videoSection}>
        <div className={styles.sectionHead}>
          <div>
            <h2>Materi Pembelajaran</h2>
            <p>Pilih format materi yang paling nyaman untuk Anda pelajari.</p>
          </div>
          <div className={styles.videoTabs}>
            <button type="button" className={styles.tabActive}><Icon name="file" size={14} /> Video Tutorial</button>
            <button type="button"><Icon name="book" size={14} /> Dokumen PDF</button>
          </div>
        </div>
        <div className={styles.videoGrid}>
          {videos.map(([title, description, label]) => (
            <article key={title} className={styles.videoCard}>
              <div className={styles.videoThumb}>
                <span>{label}</span>
                <button type="button" aria-label={`Putar ${title}`}>
                  <Icon name="chevronRight" size={20} />
                </button>
                <em>04:20</em>
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
              <button type="button"><Icon name="info" size={14} /> Mulai Tutorial</button>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.helpBox}>
        <div>
          <Icon name="help" size={18} />
          <div>
            <h2>Masih membutuhkan bantuan?</h2>
            <p>Hubungi tim bantuan jika panduan ini belum menjawab kebutuhan Anda.</p>
          </div>
        </div>
        <div>
          <button type="button" className={styles.secondaryBtn}>Hubungi Call Center BNI</button>
          <button type="button" className={styles.primaryBtn}>Hubungi Bantuan</button>
        </div>
      </section>
    </div>
  );
}
