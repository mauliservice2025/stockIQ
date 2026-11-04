const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/stockiq' });

(async () => {
  console.log('--- Updating user roles in PostgreSQL ---');
  
  await pool.query("UPDATE users SET primary_role_id = 'ROLE-STORE-EXEC' WHERE id = 'USR-106'");
  console.log('Updated USR-106 (Sagar Sable) -> ROLE-STORE-EXEC');

  await pool.query("UPDATE users SET primary_role_id = 'ROLE-STORE-MGR' WHERE id = 'USR-002'");
  console.log('Updated USR-002 (Rushikesh Dhiwar) -> ROLE-STORE-MGR');

  await pool.query("UPDATE users SET primary_role_id = 'ROLE-ADMIN' WHERE id = 'USR-001'");
  console.log('Updated USR-001 (Pravin Patil) -> ROLE-ADMIN');

  const verify = await pool.query(`
    SELECT u.id, u.username, u.full_name, u.primary_role_id, r.name as role_name 
    FROM users u 
    JOIN roles r ON u.primary_role_id = r.id 
    WHERE u.id IN ('USR-001', 'USR-002', 'USR-106')
  `);
  console.log('Verification result:', verify.rows);

  const invalid = await pool.query(`
    SELECT u.id, u.username, u.primary_role_id 
    FROM users u 
    LEFT JOIN roles r ON u.primary_role_id = r.id 
    WHERE r.id IS NULL
  `);
  console.log('Remaining invalid roles in users table:', invalid.rows.length);

  await pool.end();
})().catch(console.error);
