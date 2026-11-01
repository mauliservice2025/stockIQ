const pg = require('../database/pg');

async function main() {
  try {
    const res = await pg.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('Tables in PG:', res.rows.map(r => r.table_name));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pg.pool.end();
  }
}

main();
