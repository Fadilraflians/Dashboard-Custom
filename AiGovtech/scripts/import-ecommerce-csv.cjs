const fs = require("node:fs");
const path = require("node:path");
const oracledb = require("oracledb");

const CSV_PATH = process.argv[2] || "C:\\Users\\Fadil Rafliansyah\\Downloads\\Data_ecommers.csv";
const TARGET_SCHEMA = (process.env.ORACLE_TARGET_SCHEMA || "kemenkeudb").toUpperCase();
const TABLE_NAME = "ECOMMERCE_TRANSACTIONS";
const QUALIFIED_TABLE = `${TARGET_SCHEMA}.${TABLE_NAME}`;

function loadLocalEnv() {
  const envPath = path.resolve(__dirname, "../.env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (match && !(match[1] in process.env)) {
      process.env[match[1]] = match[2].replace(/^("|')(.*)\1$/, "$2");
    }
  }
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else field += char;
  }
  if (field.length || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows;
}

function parseDate(value, rowNumber) {
  if (!value) return null;
  let date;
  if (/^\d+(?:\.\d+)?$/.test(value)) {
    // Excel's 1900 date system uses 1899-12-30 as its serial-date epoch.
    date = new Date(Date.UTC(1899, 11, 30) + Number(value) * 86400000);
  } else {
    const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!match) throw new Error(`Format tanggal tidak dikenal pada baris ${rowNumber}: ${value}`);
    date = new Date(Date.UTC(Number(match[3]), Number(match[1]) - 1, Number(match[2])));
  }
  if (Number.isNaN(date.getTime())) throw new Error(`Tanggal tidak valid pada baris ${rowNumber}: ${value}`);
  return date;
}

function parseNumber(value, rowNumber, column) {
  if (value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`Angka tidak valid pada baris ${rowNumber}, kolom ${column}`);
  return number;
}

function readRows() {
  if (!fs.existsSync(CSV_PATH)) throw new Error(`File CSV tidak ditemukan: ${CSV_PATH}`);
  const parsed = parseCsv(fs.readFileSync(CSV_PATH, "utf8").replace(/^\uFEFF/, ""));
  const headers = parsed.shift();
  const expected = [
    "Order_ID", "Customer_ID", "Tanggal_Transaksi", "Usia_Pelanggan", "Gender", "Kategori",
    "Produk", "Jumlah", "Harga_Satuan", "Subtotal", "Diskon_Persen", "Nilai_Diskon",
    "Ongkos_Kirim", "Total_Pembayaran", "Profit", "Wilayah", "Jenis_Ecommerce",
    "Metode_Pembayaran", "Status_Pengiriman", "Jenis_Pengiriman", "Rating_Pelanggan",
    "Status_Member", "Voucher",
  ];
  if (JSON.stringify(headers) !== JSON.stringify(expected)) {
    throw new Error("Header CSV tidak sesuai skema yang didukung; belum ada data yang dimasukkan.");
  }

  const numericIndexes = new Map([
    [3, "Usia_Pelanggan"], [7, "Jumlah"], [8, "Harga_Satuan"], [9, "Subtotal"],
    [10, "Diskon_Persen"], [11, "Nilai_Diskon"], [12, "Ongkos_Kirim"],
    [13, "Total_Pembayaran"], [14, "Profit"], [20, "Rating_Pelanggan"],
  ]);
  const records = parsed.filter((fields) => fields.some((value) => value !== "")).map((fields, index) => {
    const rowNumber = index + 2;
    if (fields.length !== expected.length) throw new Error(`Jumlah kolom tidak sesuai pada baris ${rowNumber}`);
    const values = fields.map((value) => value.trim());
    values[2] = parseDate(values[2], rowNumber);
    for (const [columnIndex, columnName] of numericIndexes) {
      values[columnIndex] = parseNumber(values[columnIndex], rowNumber, columnName);
    }
    return values;
  });
  if (records.length === 0) throw new Error("CSV tidak memiliki baris data.");
  return records;
}

const createTableSql = `CREATE TABLE ${TABLE_NAME} (
  ORDER_ID VARCHAR2(20 CHAR) NOT NULL PRIMARY KEY,
  CUSTOMER_ID VARCHAR2(20 CHAR),
  TANGGAL_TRANSAKSI DATE,
  USIA_PELANGGAN NUMBER(3),
  GENDER VARCHAR2(20 CHAR),
  KATEGORI VARCHAR2(100 CHAR),
  PRODUK VARCHAR2(150 CHAR),
  JUMLAH NUMBER(10),
  HARGA_SATUAN NUMBER(16,2),
  SUBTOTAL NUMBER(16,2),
  DISKON_PERSEN NUMBER(5,2),
  NILAI_DISKON NUMBER(16,2),
  ONGKOS_KIRIM NUMBER(16,2),
  TOTAL_PEMBAYARAN NUMBER(16,2),
  PROFIT NUMBER(16,2),
  WILAYAH VARCHAR2(100 CHAR),
  JENIS_ECOMMERCE VARCHAR2(80 CHAR),
  METODE_PEMBAYARAN VARCHAR2(50 CHAR),
  STATUS_PENGIRIMAN VARCHAR2(50 CHAR),
  JENIS_PENGIRIMAN VARCHAR2(50 CHAR),
  RATING_PELANGGAN NUMBER(3),
  STATUS_MEMBER VARCHAR2(40 CHAR),
  VOUCHER VARCHAR2(100 CHAR)
)`;

async function main() {
  loadLocalEnv();
  const records = readRows();
  const { ORACLE_USER, ORACLE_PASSWORD, ORACLE_CONNECT_STRING } = process.env;
  if (!ORACLE_USER || !ORACLE_PASSWORD || !ORACLE_CONNECT_STRING) {
    throw new Error("Konfigurasi koneksi Oracle belum lengkap di AiGovtech/.env.");
  }

  const connection = await oracledb.getConnection({ user: ORACLE_USER, password: ORACLE_PASSWORD, connectString: ORACLE_CONNECT_STRING });
  try {
    const context = await connection.execute(
      "SELECT USER AS CONNECTED_USER, SYS_CONTEXT('USERENV','CURRENT_SCHEMA') AS CURRENT_SCHEMA, SYS_CONTEXT('USERENV','DB_NAME') AS DB_NAME, SYS_CONTEXT('USERENV','SERVICE_NAME') AS SERVICE_NAME FROM DUAL",
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );
    const connectionInfo = context.rows[0];
    const ownerResult = await connection.execute(
      "SELECT COUNT(*) AS OWNER_COUNT FROM ALL_USERS WHERE USERNAME = :schemaName",
      { schemaName: TARGET_SCHEMA },
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );
    if (ownerResult.rows[0].OWNER_COUNT === 0) {
      throw new Error(`Schema ${TARGET_SCHEMA} tidak ditemukan atau tidak terlihat oleh akun Oracle. Tidak ada perubahan database.`);
    }

    const existing = await connection.execute(
      `SELECT COUNT(*) AS TABLE_COUNT FROM ALL_TABLES WHERE OWNER = :owner AND TABLE_NAME = :tableName`,
      { owner: TARGET_SCHEMA, tableName: TABLE_NAME },
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );
    if (existing.rows[0].TABLE_COUNT > 0) {
      throw new Error(`Tabel ${QUALIFIED_TABLE} sudah ada. Import dihentikan tanpa mengubah tabel.`);
    }

    const requiredPrivileges = connectionInfo.CONNECTED_USER === TARGET_SCHEMA
      ? ["CREATE TABLE"]
      : ["CREATE ANY TABLE", "INSERT ANY TABLE"];
    const privilege = await connection.execute(
      `SELECT COUNT(DISTINCT PRIVILEGE) AS PRIVILEGE_COUNT FROM SESSION_PRIVS WHERE PRIVILEGE IN (${requiredPrivileges.map((_, index) => `:${index + 1}`).join(", ")})`,
      requiredPrivileges,
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );
    if (privilege.rows[0].PRIVILEGE_COUNT !== requiredPrivileges.length) {
      throw new Error(`Akun Oracle ${connectionInfo.CONNECTED_USER} belum memiliki izin yang diperlukan untuk membuat tabel dan memasukkan data ke schema ${TARGET_SCHEMA}. Tidak ada perubahan database.`);
    }

    await connection.execute(createTableSql.replace(`CREATE TABLE ${TABLE_NAME}`, `CREATE TABLE ${QUALIFIED_TABLE}`));
    const insertSql = `INSERT INTO ${QUALIFIED_TABLE} VALUES (
      :1, :2, :3, :4, :5, :6, :7, :8, :9, :10, :11, :12,
      :13, :14, :15, :16, :17, :18, :19, :20, :21, :22, :23
    )`;
    await connection.executeMany(insertSql, records, { batchErrors: false, autoCommit: false });
    await connection.commit();
    const count = await connection.execute(`SELECT COUNT(*) AS ROW_COUNT FROM ${QUALIFIED_TABLE}`, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    console.log(`Import berhasil: ${count.rows[0].ROW_COUNT} baris ke ${QUALIFIED_TABLE} pada ${connectionInfo.DB_NAME}/${connectionInfo.SERVICE_NAME}.`);
  } catch (error) {
    await connection.rollback().catch(() => {});
    throw error;
  } finally {
    await connection.close();
  }
}

main().catch((error) => {
  console.error(`Import dihentikan: ${error.message}`);
  process.exitCode = 1;
});
