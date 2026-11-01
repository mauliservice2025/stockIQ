const pg = require('../database/pg');
async function q() {
  try {
    const users = await pg.query('SELECT id, username, full_name, user_type, primary_role_id, status FROM users');
    console.log('PG Users count:', users.rows.length);
    const pravin = users.rows.filter(u => (u.username && u.username.toLowerCase().includes('pravin')) || (u.full_name && u.full_name.toLowerCase().includes('pravin')));
    console.log('Pravin in PG:', pravin);
    const perms = await pg.query("SELECT * FROM role_permissions WHERE perm_code = 'STORE_TX_JOB_CARD_ISSUE'");
    console.log('Perms for STORE_TX_JOB_CARD_ISSUE:', perms.rows);
    const allPermsAdmin = await pg.query("SELECT perm_code FROM role_permissions WHERE role_id = 'ROLE-ADMIN'");
    console.log('ROLE-ADMIN perm_codes in PG:', allPermsAdmin.rows.map(r => r.perm_code));
  } catch (err) {
    console.error(err);
  } finally {
    await pg.pool.end();
  }
}
q();
