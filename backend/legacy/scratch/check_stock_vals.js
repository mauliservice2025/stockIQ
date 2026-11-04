const pg = require('../database/pg.js');

async function main() {
  const r = await pg.query("SELECT * FROM items WHERE code LIKE '%ENGINE-VALVE-SET-007%' LIMIT 1");
  console.log('Sample item:', r.rows[0]);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
