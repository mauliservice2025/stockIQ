const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/stockiq' });

(async () => {
  const res = await pool.query("SELECT perm_code, \"view\", \"add\", \"edit\", \"delete\", \"submit\", \"approve\", \"export\", \"print\" FROM role_permissions WHERE role_id='ROLE-STORE-MGR' ORDER BY perm_code");
  console.table(res.rows);
  await pool.end();
})();
