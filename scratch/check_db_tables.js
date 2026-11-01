const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool();

async function run() {
  try {
    const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
    console.log('PostgreSQL Tables count:', res.rows.length);
    console.log('Tables:', res.rows.map(r => r.table_name));

    // Also check tables related to job cards, billing, estimates, etc.
    const billingTables = res.rows.map(r => r.table_name).filter(t => 
      t.includes('job') || t.includes('bill') || t.includes('estimate') || t.includes('delivery') || t.includes('vehicle') || t.includes('customer')
    );
    console.log('Matched Tables:', billingTables);

    for (const t of billingTables) {
      const countRes = await pool.query(`SELECT count(*) FROM "${t}"`);
      console.log(`Table ${t}: ${countRes.rows[0].count} rows`);
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

run();
