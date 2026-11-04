const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool();

async function run() {
  try {
    const colRes = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='audit_logs'");
    console.log('audit_logs columns:', colRes.rows.map(r => r.column_name));
    const countRes = await pool.query("SELECT count(*) FROM audit_logs");
    console.log('audit_logs count:', countRes.rows[0].count);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
