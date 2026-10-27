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

async function testPriv() {
  const conn = await oracledb.getConnection({
    user: config.ORACLE_USER,
    password: config.ORACLE_PASSWORD,
    connectString: config.ORACLE_CONNECT_STRING,
  });

  try {
    await conn.execute("CREATE TABLE test_tab (id NUMBER, name VARCHAR2(50))");
    console.log("CREATE TABLE SUCCESS!");
    await conn.execute("DROP TABLE test_tab");
    console.log("DROP TABLE SUCCESS!");
  } catch (e) {
    console.log("Privilege test result:", e.message);
  }

  await conn.close();
}

testPriv().catch(console.error);
