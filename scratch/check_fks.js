const { pool } = require('../database/pg');

async function check() {
  try {
    const fks = await pool.query(`
      SELECT
        tc.table_name, kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE ccu.table_name = 'plants';
    `);
    console.log('FKs referencing plants:', fks.rows);

    // Also check row counts in tables referencing plants
    for (const r of fks.rows) {
      const cnt = await pool.query(`SELECT COUNT(*) FROM "${r.table_name}"`);
      console.log(`Table ${r.table_name} count:`, cnt.rows[0].count);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}
check();
