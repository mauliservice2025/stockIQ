const { pool } = require('../database/pg');

async function check() {
  try {
    const cols = await pool.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND column_name IN ('plant_id', 'facility_id', 'organization_id');
    `);
    for (const r of cols.rows) {
      const res = await pool.query(`SELECT COUNT(*) FROM "${r.table_name}" WHERE "${r.column_name}" IS NOT NULL`);
      if (parseInt(res.rows[0].count) > 0) {
        console.log(`Table ${r.table_name}.${r.column_name} has count:`, res.rows[0].count);
      }
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}
check();
