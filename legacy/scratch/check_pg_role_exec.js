const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/stockiq' });

(async () => {
  const tables = ['approval_authorities', 'approval_delegations', 'sod_rules', 'access_requests', 'user_roles', 'role_permissions'];
  for (const t of tables) {
    try {
      const res = await pool.query(`SELECT count(*) FROM ${t} WHERE role_id = 'ROLE-STORE-EXEC'`);
      console.log(`${t} with role_id = ROLE-STORE-EXEC:`, res.rows[0].count);
    } catch(e) {
      console.log(`${t} query error:`, e.message);
    }
  }

  // Also check if sod_rules has conflicting_role_1 or conflicting_role_2
  try {
    const sod = await pool.query("SELECT count(*) FROM sod_rules WHERE conflicting_role_1 = 'ROLE-STORE-EXEC' OR conflicting_role_2 = 'ROLE-STORE-EXEC'");
    console.log('sod_rules conflicts count:', sod.rows[0].count);
  } catch(e) {
    console.log('sod_rules query error:', e.message);
  }

  await pool.end();
})().catch(console.error);
