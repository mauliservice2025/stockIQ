const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/stockiq' });

async function check() {
  const tables = [
    'user_roles',
    'user_plants',
    'user_organizations',
    'user_store_access',
    'user_warehouse_access',
    'user_sessions',
    'access_requests',
    'approval_delegations',
    'login_history'
  ];

  for (const t of tables) {
    try {
      const res = await pool.query(`SELECT * FROM "${t}"`);
      console.log(`=== TABLE: ${t} (${res.rows.length} rows) ===`);
      if (res.rows.length > 0) {
        console.table(res.rows);
      }
    } catch (e) {
      console.log(`Table ${t} error: ${e.message}`);
    }
  }

  await pool.end();
}
check();
