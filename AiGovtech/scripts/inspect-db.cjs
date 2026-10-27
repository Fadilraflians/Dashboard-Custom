const fs = require('fs');
const path = require('path');
const oracledb = require('oracledb');

const localEnvPath = path.resolve(__dirname, '../.env');
const config = {};
if (fs.existsSync(localEnvPath)) {
  for (const line of fs.readFileSync(localEnvPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (match) config[match[1]] = match[2];
  }
}

async function run() {
  const conn = await oracledb.getConnection({
    user: config.ORACLE_USER,
    password: config.ORACLE_PASSWORD,
    connectString: config.ORACLE_CONNECT_STRING,
  });

  const res = await conn.execute(
    "SELECT owner, table_name FROM all_tables WHERE owner NOT IN ('SYS', 'SYSTEM', 'AUDSYS', 'XDB', 'OUTLN', 'WMSYS', 'CTXSYS', 'MDSYS', 'OJVMSYS', 'LBACSYS', 'DVSYS', 'GSMADMIN_INTERNAL', 'APPQOSSYS', 'DBSNMP')",
    [],
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );
  console.log('All non-system tables:', JSON.stringify(res.rows, null, 2));

  await conn.close();
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
