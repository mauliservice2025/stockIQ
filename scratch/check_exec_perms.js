const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/stockiq' });

(async () => {
  const r = await pool.query("SELECT * FROM roles WHERE id = 'ROLE-STORE-EXEC'");
  console.log('Role:', r.rows);
  const perms = await pool.query("SELECT * FROM role_permissions WHERE role_id = 'ROLE-STORE-EXEC'");
  console.log('Permissions count:', perms.rows.length);
  console.log('Permissions:', perms.rows.map(p => ({ perm_code: p.perm_code, view: p.can_view, create: p.can_create, edit: p.can_edit })));
  await pool.end();
})().catch(console.error);
