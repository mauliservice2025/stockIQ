const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/stockiq' });

(async () => {
  console.log('--- Removing ROLE-STORE-EXEC from PostgreSQL ---');

  // 1. Reassign users having ROLE-STORE-EXEC to ROLE-STORE-MGR
  const userUpdate = await pool.query(`
    UPDATE users 
    SET primary_role_id = 'ROLE-STORE-MGR' 
    WHERE primary_role_id = 'ROLE-STORE-EXEC'
    RETURNING id, username, full_name, primary_role_id
  `);
  console.log('Reassigned users:', userUpdate.rows);

  // 2. Remove approval authorities for ROLE-STORE-EXEC
  const appAuth = await pool.query("DELETE FROM approval_authorities WHERE role_id = 'ROLE-STORE-EXEC'");
  console.log('Deleted approval authorities');

  // 3. Remove SoD rules involving ROLE-STORE-EXEC
  const sodDel = await pool.query("DELETE FROM sod_rules WHERE conflicting_role_1 = 'ROLE-STORE-EXEC' OR conflicting_role_2 = 'ROLE-STORE-EXEC'");
  console.log('Deleted SoD rules');

  // 4. Remove role_permissions for ROLE-STORE-EXEC
  const rpDel = await pool.query("DELETE FROM role_permissions WHERE role_id = 'ROLE-STORE-EXEC'");
  console.log('Deleted role permissions');

  // 5. Remove any user_roles mapping
  const urDel = await pool.query("DELETE FROM user_roles WHERE role_id = 'ROLE-STORE-EXEC'");
  console.log('Deleted user_roles');

  // 6. Delete ROLE-STORE-EXEC from roles
  const roleDel = await pool.query("DELETE FROM roles WHERE id = 'ROLE-STORE-EXEC' RETURNING id, name");
  console.log('Deleted role from roles:', roleDel.rows);

  // 7. Verify remaining roles
  const remaining = await pool.query("SELECT id, code, name FROM roles ORDER BY id");
  console.log('Remaining roles in PG:', remaining.rows);

  await pool.end();
})().catch(console.error);
