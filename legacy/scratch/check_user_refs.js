const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/stockiq' });

async function check() {
  const res = await pool.query(`
    SELECT table_name, column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND (column_name LIKE '%user%' OR column_name IN ('created_by', 'updated_by', 'approved_by', 'delegator_user_id', 'delegatee_user_id', 'manager_reviewer_id'))
    ORDER BY table_name, column_name
  `);
  console.table(res.rows);

  // Check distinct user_ids or usernames present in these tables
  for (const r of res.rows) {
    if (r.table_name === 'users') continue;
    try {
      const q = await pool.query(`SELECT DISTINCT "${r.column_name}" FROM "${r.table_name}" WHERE "${r.column_name}" IS NOT NULL LIMIT 10`);
      if (q.rows.length > 0) {
        console.log(`${r.table_name}.${r.column_name}:`, q.rows.map(x => x[r.column_name]));
      }
    } catch (e) {
      // ignore
    }
  }

  await pool.end();
}
check();
