const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/stockiq' });

(async () => {
  try {
    const cols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='users';");
    console.log('Columns in users table:', cols.rows.map(c => c.column_name));

    const u = await pool.query("SELECT id, username, full_name, primary_role_id FROM users WHERE username ILIKE '%sagar%' OR id='USR-106';");
    console.log('PG Users for sagar:');
    console.table(u.rows);

    const r = await pool.query("SELECT id, code, name FROM roles;");
    console.log('PG Roles:');
    console.table(r.rows);

    const rp = await pool.query("SELECT COUNT(*) FROM role_permissions WHERE role_id='ROLE-002';");
    console.log('Permissions for ROLE-002 in PG:', rp.rows[0].count);

    const rpStore = await pool.query("SELECT COUNT(*) FROM role_permissions WHERE role_id='ROLE-STORE-MGR';");
    console.log('Permissions for ROLE-STORE-MGR in PG:', rpStore.rows[0].count);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
})();
