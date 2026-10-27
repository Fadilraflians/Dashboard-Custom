const fs = require("node:fs");
const path = require("node:path");
const oracledb = require("oracledb");

const envPath = path.resolve(__dirname, "../.env");
for (const line of fs.readFileSync(envPath, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
  if (match) process.env[match[1]] = match[2].replace(/^("|')(.*)\1$/, "$2");
}

const targets = [
  { key: "FASHION", schema: "FASHION_APP", table: "FASHION_SALES" },
  { key: "KEMENKEU", schema: "KEMENKEUDB", table: "DATA_ECOMMERS" },
];

async function main() {
  for (const target of targets) {
    let connection;
    try {
      const prefix = `DB_${target.key}`;
      connection = await oracledb.getConnection({
        user: process.env[`${prefix}_USER`],
        password: process.env[`${prefix}_PASS`],
        connectString: `${process.env[`${prefix}_HOST`]}:${process.env[`${prefix}_PORT`]}/${process.env[`${prefix}_SERVICE`]}`,
      });
      const context = await connection.execute(
        "SELECT USER AS CONNECTED_USER, SYS_CONTEXT('USERENV','SERVICE_NAME') AS SERVICE_NAME FROM DUAL",
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT },
      );
      const columns = await connection.execute(
        "SELECT COLUMN_NAME, DATA_TYPE FROM ALL_TAB_COLUMNS WHERE OWNER = :owner AND TABLE_NAME = :tableName ORDER BY COLUMN_ID",
        { owner: target.schema, tableName: target.table },
        { outFormat: oracledb.OUT_FORMAT_OBJECT },
      );
      if (!columns.rows.length) {
        console.log(`${target.key}: connected as ${context.rows[0].CONNECTED_USER} to ${context.rows[0].SERVICE_NAME}; table ${target.schema}.${target.table} not found or not visible.`);
      } else {
        await connection.execute(`SELECT COUNT(*) AS ROW_COUNT FROM ${target.schema}.${target.table}`);
        const dateColumn = columns.rows.find((row) => row.COLUMN_NAME === (target.key === "KEMENKEU" ? "TANGGAL_TRANSAKSI" : "ORDER_DATE"));
        console.log(`${target.key}: connected as ${context.rows[0].CONNECTED_USER} to ${context.rows[0].SERVICE_NAME}; table ${target.schema}.${target.table} visible (${columns.rows.length} columns); transaction date type ${dateColumn?.DATA_TYPE || "unknown"}.`);
      }
    } catch (error) {
      console.log(`${target.key}: connection or metadata check failed (${error.code || "error"}).`);
    } finally {
      if (connection) await connection.close();
    }
  }
}

main().catch((error) => {
  console.error(`Tenant database check failed (${error.code || "error"}).`);
  process.exitCode = 1;
});
