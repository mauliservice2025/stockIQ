const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/stockiq' });

(async () => {
  const users = await pool.query("SELECT id, username, full_name, designation, department, primary_role_id FROM users WHERE id IN ('USR-001', 'USR-002', 'USR-106')");
  console.log('Users info:', users.rows);

  const allRoles = await pool.query("SELECT id, code, name FROM roles");
  console.log('All roles:', allRoles.rows);

  await pool.end();
})().catch(console.error);
