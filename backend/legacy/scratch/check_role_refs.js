const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/stockiq' });

(async () => {
  // Check users with ROLE-STORE-EXEC
  const users = await pool.query("SELECT id, username, full_name, primary_role_id FROM users WHERE primary_role_id = 'ROLE-STORE-EXEC'");
  console.log('Users with ROLE-STORE-EXEC in pg:', users.rows);

  // Check role_permissions with ROLE-STORE-EXEC
  const rps = await pool.query("SELECT count(*) FROM role_permissions WHERE role_id = 'ROLE-STORE-EXEC'");
  console.log('Role permissions count for ROLE-STORE-EXEC:', rps.rows[0].count);

  // Check constraints referencing roles
  const constraints = await pool.query(`
    SELECT conname, conrelid::regclass, confrelid::regclass 
    FROM pg_constraint 
    WHERE confrelid = 'roles'::regclass
  `);
  console.log('Foreign keys referencing roles:', constraints.rows);

  await pool.end();
})().catch(console.error);
