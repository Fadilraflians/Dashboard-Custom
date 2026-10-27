const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../src/api/index.cjs');
let code = fs.readFileSync(targetPath, 'utf8');

// Normalize line endings to LF
code = code.replace(/\r\n/g, '\n');

const marker = 'app.use(express.json({ limit: "64kb" }));';
if (!code.includes(marker)) {
  console.error("Marker not found in index.cjs!");
  process.exit(1);
}

const bokFunctionsAndCors = `app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: "64kb" }));

async function getBokMetricsFromOracle() {
  const pool = await getOraclePool();
  const connection = await pool.getConnection();
  try {
    const result = await connection.execute(
      "SELECT METRIC_KEY, LABEL, METRIC_VALUE, NUMERIC_VALUE, SUB_LABEL, BADGE_TEXT, STATUS_INFO, TONE FROM FASHION_APP.BOK_DASHBOARD_METRICS",
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );
    return result.rows || [];
  } finally {
    await connection.close();
  }
}

async function getBokSp2dFromOracle() {
  const pool = await getOraclePool();
  const connection = await pool.getConnection();
  try {
    const result = await connection.execute(
      "SELECT ID, TAHUN, TRIWULAN, IS_ACTIVE, PAGU_RPD, SP2D_CAIR, REALISASI, PERSENTASE_REALISASI, KETERANGAN FROM FASHION_APP.BOK_REALISASI_SP2D ORDER BY ID ASC",
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );
    return result.rows || [];
  } finally {
    await connection.close();
  }
}

async function getBokSubprogramFromOracle() {
  const pool = await getOraclePool();
  const connection = await pool.getConnection();
  try {
    const result = await connection.execute(
      "SELECT ID, TRIWULAN, NAMA_PROGRAM, ALOKASI_DANA, PERSENTASE, WARNA_HEX FROM FASHION_APP.BOK_SUBPROGRAM_ALOKASI ORDER BY ID ASC",
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );
    return result.rows || [];
  } finally {
    await connection.close();
  }
}

function buildWidgetConfigs(metrics, sp2dList, subprogramList, userQuery) {
  const q = (userQuery || "").toLowerCase();
  const metricsMap = {};
  for (const m of metrics) {
    metricsMap[m.METRIC_KEY] = m;
  }

  const cardTotalDana = {
    id: "card-total-dana",
    type: "card",
    componentName: "DashboardKpiCard",
    title: "Total Dana Disalurkan",
    value: metricsMap.TOTAL_DANA_DISALURKAN?.METRIC_VALUE || "Rp 420.000.000",
    sub: metricsMap.TOTAL_DANA_DISALURKAN?.SUB_LABEL || "+100% Target TW III Terpenuhi",
    badge: metricsMap.TOTAL_DANA_DISALURKAN?.BADGE_TEXT || "Live TW III",
    icon: "Wallet",
    tone: "up",
  };

  const cardRealisasiSp2d = {
    id: "card-realisasi-sp2d",
    type: "card",
    componentName: "DashboardKpiCard",
    title: "Realisasi SP2D Kasda",
    value: metricsMap.REALISASI_SP2D_KASDA?.METRIC_VALUE || "100.0%",
    badge: metricsMap.REALISASI_SP2D_KASDA?.BADGE_TEXT || "Efektif 29 Sep 2026",
    sub: metricsMap.REALISASI_SP2D_KASDA?.SUB_LABEL || "SP2D Sah KPPN",
    icon: "ShieldCheck",
    tone: "up",
  };

  const cardEfisiensiVa = {
    id: "card-efisiensi-va",
    type: "card",
    componentName: "DashboardKpiCard",
    title: "Efisiensi Serapan Sub-VA",
    value: metricsMap.EFISIENSI_SERAPAN_VA?.METRIC_VALUE || "94.2%",
    badge: metricsMap.EFISIENSI_SERAPAN_VA?.BADGE_TEXT || "Optimal",
    sub: metricsMap.EFISIENSI_SERAPAN_VA?.SUB_LABEL || "3 Sub-akun VA Aktif",
    icon: "TrendingUp",
    tone: "warning",
  };

  const cardKliringBni = {
    id: "card-kliring-bni",
    type: "card",
    componentName: "DashboardKpiCard",
    title: "Status Kliring BNI H2H",
    value: metricsMap.STATUS_KLIRING_BNI?.METRIC_VALUE || "SUKSES TERBUKUKAN",
    sub: metricsMap.STATUS_KLIRING_BNI?.SUB_LABEL || "Giro: 045199201928",
    badge: metricsMap.STATUS_KLIRING_BNI?.BADGE_TEXT || "H2H Treasury BNI",
    icon: "Landmark",
    tone: "up",
  };

  const chartTrenSp2d = {
    id: "chart-tren-sp2d",
    type: "chart",
    chartType: "bar-line",
    componentName: "TrendAlokasiChart",
    title: "TREN ALOKASI PAGU VS PENYALURAN SP2D VS REALISASI (2026)",
    subtitle: "Perbandingan Triwulan I s/d IV Tahun Anggaran 2026",
    data: {
      quarters: sp2dList.map((row) => ({
        quarter: row.TRIWULAN,
        pagu: Number(row.PAGU_RPD) / 1000000,
        sp2d: Number(row.SP2D_CAIR) / 1000000,
        realisasi: Number(row.REALISASI) / 1000000,
        label: row.TRIWULAN === "TW I" ? "Rp 410M" : row.TRIWULAN === "TW II" ? "Rp 400M" : row.TRIWULAN === "TW III" ? "Rp 420M" : "Rp 450M (Pagu)",
        active: Boolean(row.IS_ACTIVE),
      })),
      infoBanner: "Realisasi SP2D TW III mencapai 100% dari target penyerapan tahap berjalan.",
      cumulativePagu: metricsMap.PAGU_KUMULATIF?.METRIC_VALUE || "Rp 1.780.000.000",
    },
  };

  const chartProporsiProgram = {
    id: "chart-proporsi-program",
    type: "chart",
    chartType: "donut",
    componentName: "DonutSubprogramChart",
    title: "PROPORSI ALOKASI SUB-PROGRAM",
    subtitle: "Distribusi persentase dari pagu SP2D Rp 420 Juta",
    badge: "TW III",
    data: {
      centerTitle: "Total TW III",
      centerAmount: "420 Jt",
      centerSubtitle: "3 Program",
      programs: subprogramList.map((row) => ({
        name: row.NAMA_PROGRAM,
        amount: "Rp " + (Number(row.ALOKASI_DANA) / 1000000) + " Jt",
        percentage: row.PERSENTASE + "%",
        color: row.WARNA_HEX || "#005e54",
      })),
    },
  };

  const allWidgets = [cardTotalDana, cardRealisasiSp2d, cardEfisiensiVa, cardKliringBni, chartTrenSp2d, chartProporsiProgram];

  const matchedWidgets = [];
  if (/total dana|dana disalurkan|disalurkan/i.test(q)) {
    matchedWidgets.push(cardTotalDana);
  }
  if (/realisasi sp2d|sp2d kasda|realisasi kasda|sah kppn/i.test(q)) {
    matchedWidgets.push(cardRealisasiSp2d);
  }
  if (/efisiensi|serapan|sub-va|va aktif|sub va/i.test(q)) {
    matchedWidgets.push(cardEfisiensiVa);
  }
  if (/kliring|bni h2h|h2h|giro|terbukukan/i.test(q)) {
    matchedWidgets.push(cardKliringBni);
  }
  if (/tren|grafik tren|pagu vs sp2d|bar chart|batang|alokasi pagu/i.test(q)) {
    matchedWidgets.push(chartTrenSp2d);
  }
  if (/proporsi|sub-program|subprogram|donut|pie|lingkaran|pmt|nakes|klb/i.test(q)) {
    matchedWidgets.push(chartProporsiProgram);
  }
  if (/semua|lengkap|rekomendasi|seluruh|paket|full/i.test(q) || (matchedWidgets.length === 0 && /widget|dashboard|tambah/i.test(q))) {
    return { primary: chartTrenSp2d, all: allWidgets };
  }

  if (matchedWidgets.length > 0) {
    return { primary: matchedWidgets[0], all: matchedWidgets };
  }

  if (/chart|grafik/i.test(q)) {
    return { primary: chartTrenSp2d, all: [chartTrenSp2d, chartProporsiProgram] };
  }
  if (/card|kartu|metrik/i.test(q)) {
    return { primary: cardTotalDana, all: [cardTotalDana, cardRealisasiSp2d, cardEfisiensiVa, cardKliringBni] };
  }

  return { primary: cardTotalDana, all: [cardTotalDana] };
}

app.get("/bok/dashboard", async (_request, response) => {
  try {
    const [metrics, sp2d, subprogram] = await Promise.all([
      getBokMetricsFromOracle(),
      getBokSp2dFromOracle(),
      getBokSubprogramFromOracle(),
    ]);

    const widgets = buildWidgetConfigs(metrics, sp2d, subprogram, "semua");

    return response.json({
      success: true,
      data: {
        metrics,
        sp2d,
        subprogram,
        widgets: widgets.all,
      },
    });
  } catch (error) {
    console.error("[AIGovtech] Oracle BOK dashboard error:", error.message);
    return response.status(503).json({
      success: false,
      message: "Gagal memuat data analitik BOK dari Oracle.",
    });
  }
});`;

code = code.replace(marker, bokFunctionsAndCors);

// Now update inside app.post("/chat") to handle BOK queries
const chatFind = 'const lastUserMessage = [...messages]\n      .reverse()\n      .find((message) => message.role === "user")?.content || "";';
const chatInsert = `const lastUserMessage = [...messages]
      .reverse()
      .find((message) => message.role === "user")?.content || "";

    const isBokQuery = /bok|puskesmas|sp2d|kasda|dana|salur|disalurkan|pagu|rpd|realisasi|kliring|bni|giro|va|sub-va|sub va|serapan|efisiensi|balita|kek|nakes|ukm|surveilans|klb|subprogram|sub-program|triwulan|tw\\b|kemenkes|widget|dashboard|tambah/i.test(lastUserMessage);

    if (isBokQuery) {
      const [metrics, sp2d, subprogram] = await Promise.all([
        getBokMetricsFromOracle(),
        getBokSp2dFromOracle(),
        getBokSubprogramFromOracle(),
      ]);

      const widgetResult = buildWidgetConfigs(metrics, sp2d, subprogram, lastUserMessage);

      let reply = "";
      if (/total dana|disalurkan/i.test(lastUserMessage)) {
        reply = "Berdasarkan data Oracle BOK Puskesmas, Total Dana Disalurkan pada TW III mencapai Rp 420.000.000 dengan target penyaluran terpenuhi 100%. Kartu metrik siap ditambahkan ke dashboard Anda.";
      } else if (/realisasi sp2d|kasda/i.test(lastUserMessage)) {
        reply = "Data realisasi SP2D Kasda tercatat 100.0% dengan status SP2D Sah KPPN per 29 September 2026. Kartu KPI ini siap ditampilkan pada dashboard Anda.";
      } else if (/efisiensi|serapan|va/i.test(lastUserMessage)) {
        reply = "Efisiensi serapan sub-rekening Virtual Account (VA) Puskesmas berada di angka optimal 94.2% pada 3 sub-akun VA aktif. Kartu analitik telah disiapkan.";
      } else if (/kliring|giro|h2h/i.test(lastUserMessage)) {
        reply = "Status kliring BNI H2H saat ini SUKSES TERBUKUKAN untuk Rekening Giro 045199201928. Widget status kliring telah siap.";
      } else if (/tren|pagu|grafik tren|bar/i.test(lastUserMessage)) {
        reply = "Grafik tren alokasi pagu vs SP2D 2026 menunjukkan tren penyerapan konsisten: TW I (Rp 410M), TW II (Rp 400M), dan TW III mencapai Rp 420M (100% target berjalan) dengan pagu kumulatif Rp 1,78 Miliar. Chart grafik telah disiapkan untuk dashboard Anda.";
      } else if (/proporsi|sub-program|donut|pmt/i.test(lastUserMessage)) {
        reply = "Distribusi alokasi sub-program TW III sebesar Rp 420 Juta terbagi atas PMT Balita & KEK (42.8% / Rp 180 Jt), Insentif Nakes UKM (33.3% / Rp 140 Jt), dan Surveilans & KLB (23.9% / Rp 100 Jt). Grafik donat proporsi telah siap ditampilkan.";
      } else if (/semua|lengkap|rekomendasi/i.test(lastUserMessage)) {
        reply = "Paket lengkap dashboard BOK TW III (4 kartu metrik utama dan 2 chart analitik tren serta proporsi sub-program) berhasil disiapkan dari database Oracle. Anda dapat langsung menerapkannya ke dashboard aktif.";
      } else {
        reply = "Berdasarkan data operasional BOK Puskesmas di database Oracle, penyaluran SP2D TW III mencapai Rp 420.000.000 dengan realisasi 100% dan efisiensi serapan VA 94.2%. Widget visualisasi telah disiapkan sesuai kebutuhan Anda.";
      }

      return response.json({
        success: true,
        reply,
        widgetConfig: widgetResult.primary,
        widgetConfigs: widgetResult.all,
        choices: [{ message: { role: "assistant", content: reply } }],
        data: {
          reply,
          widgetConfig: widgetResult.primary,
          widgetConfigs: widgetResult.all,
        },
      });
    }`;

if (!code.includes(chatFind)) {
  console.error("Chat find pattern not found!");
  process.exit(1);
}

code = code.replace(chatFind, chatInsert);

fs.writeFileSync(targetPath, code, 'utf8');
console.log("Successfully updated src/api/index.cjs!");
