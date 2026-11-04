const db = require('../database/pg');

async function run() {
  try {
    const res = await db.query('SELECT perm_code, "view", "add", "edit" FROM role_permissions WHERE role_id = $1 ORDER BY perm_code', ['ROLE-STORE-EXEC']);
    console.log('Postgres Count:', res.rows.length);
    console.log(res.rows.map(x => `${x.perm_code}: view=${x.view}`).join('\n'));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
