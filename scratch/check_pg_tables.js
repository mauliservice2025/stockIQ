const { pool } = require('../database/pg');

async function check() {
  try {
    const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
    console.log('Tables count:', res.rows.length);
    for (const r of res.rows) {
      const countRes = await pool.query(`SELECT COUNT(*) FROM "${r.table_name}"`);
      console.log(`${r.table_name}: ${countRes.rows[0].count}`);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}
check();
