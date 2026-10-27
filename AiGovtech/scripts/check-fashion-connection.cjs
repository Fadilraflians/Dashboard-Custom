const fs = require("node:fs");
const path = require("node:path");
const oracledb = require("oracledb");

const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (match && !(match[1] in process.env)) {
      process.env[match[1]] = match[2].replace(/^(["'])(.*)\1$/, "$2");
    }
  }
}

async function main() {
  const connection = await oracledb.getConnection({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECT_STRING,
  });
  try {
    const result = await connection.execute(
      "SELECT COUNT(*) AS ROW_COUNT, COUNT(DISTINCT ORDER_ID) AS ORDER_COUNT FROM FASHION_APP.FASHION_SALES",
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );
    const row = result.rows?.[0] || {};
    console.log(
      `Oracle connected: ${row.ROW_COUNT} rows across ${row.ORDER_COUNT} orders.`,
    );
  } finally {
    await connection.close();
  }
}

main().catch((error) => {
  console.error(`Oracle fashion connection check failed: ${error.message}`);
  process.exitCode = 1;
});
