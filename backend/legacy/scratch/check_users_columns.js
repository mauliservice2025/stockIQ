const pg = require('../database/pg');

async function main() {
  try {
    const res = await pg.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'");
    console.log('Columns in users table:', res.rows.map(r => r.column_name));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pg.pool.end();
  }
}

main();
