const fs = require('fs');
const initSqlJs = require('sql.js');

async function run() {
  const SQL = await initSqlJs();
  const dbPath = 'C:/Users/PravinPatil/.gemini/antigravity-ide/conversations/3d510eae-a5ab-46c9-b70c-ccbdc5f6a33a.db';
  const fileBuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(fileBuffer);

  const res = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
  console.log('Tables in 3d510eae.db:', res[0].values);

  // Check table schemas
  for (const row of res[0].values) {
    const tbl = row[0];
    const info = db.exec(`PRAGMA table_info(${tbl})`);
    console.log(`Schema for ${tbl}:`, info[0].values.map(v => v[1]));
    const count = db.exec(`SELECT count(*) FROM ${tbl}`);
    console.log(`Count for ${tbl}:`, count[0].values[0][0]);
  }
}
run().catch(console.error);
