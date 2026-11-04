const pg = require('../database/pg');

async function check() {
  try {
    const fkRes = await pg.query(`
      SELECT tc.constraint_name, tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name 
      JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name 
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'role_permissions'
    `);
    console.log('FK on role_permissions:', fkRes.rows);

    // Try inserting a dummy role_permission for ROLE-001
    const testInsert = await pg.query(`
      INSERT INTO role_permissions (role_id, perm_code, view)
      VALUES ('ROLE-001', 'BILLING_DASHBOARD', true)
      ON CONFLICT (role_id, perm_code) DO NOTHING
      RETURNING *;
    `);
    console.log('Test insert result:', testInsert.rows);
  } catch (e) {
    console.error('Error during check:', e.message);
  } finally {
    await pg.pool.end();
  }
}

check();
