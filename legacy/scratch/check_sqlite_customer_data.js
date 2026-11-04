const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

async function checkSqlite() {
  const dbPath = path.join(__dirname, '..', 'database', 'stockiq.db');
  if (!fs.existsSync(dbPath)) {
    console.log('No stockiq.db found');
    return;
  }
  const SQL = await initSqlJs();
  const filebuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(filebuffer);

  const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  const tableNames = tables[0] ? tables[0].values.map(v => v[0]) : [];
  console.log('SQLite tables count:', tableNames.length);

  for (const t of tableNames) {
    if (t.includes('cust') || t.includes('job') || t.includes('bill') || t.includes('estimate') || t.includes('delivery') || t.includes('vehicle')) {
      const res = db.exec(`SELECT count(*) FROM "${t}"`);
      const cnt = res[0] ? res[0].values[0][0] : 0;
      console.log(`SQLite table ${t}: ${cnt} rows`);
      if (cnt > 0) {
        const rows = db.exec(`SELECT * FROM "${t}" LIMIT 5`);
        console.log(`  Sample ${t}:`, rows[0].values);
      }
    }
  }
  db.close();
}

checkSqlite().catch(console.error);
