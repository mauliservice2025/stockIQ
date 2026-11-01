const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool();

async function run() {
  try {
    const tablesRes = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
    const tables = tablesRes.rows.map(r => r.table_name);
    console.log('Checking all 71 tables for any rows or customer references...');

    for (const t of tables) {
      const colRes = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema='public' AND table_name=$1
      `, [t]);

      const countRes = await pool.query(`SELECT count(*) FROM "${t}"`);
      const count = parseInt(countRes.rows[0].count, 10);
      
      const customerCols = colRes.rows.filter(c => c.column_name.toLowerCase().includes('cust'));
      if (customerCols.length > 0 || count > 0 && (t.includes('bill') || t.includes('job') || t.includes('vehicle') || t.includes('estimate') || t.includes('delivery'))) {
        console.log(`Table: ${t} (Rows: ${count}), Customer columns: ${customerCols.map(c => c.column_name).join(', ')}`);
        if (count > 0 && customerCols.length > 0) {
          const sample = await pool.query(`SELECT ${customerCols.map(c => `"${c.column_name}"`).join(', ')} FROM "${t}" LIMIT 5`);
          console.log(`  Sample data in ${t}:`, sample.rows);
        }
      }
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

run();
