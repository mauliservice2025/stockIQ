const pg = require('../database/pg');

async function main() {
  try {
    const res = await pg.query("SELECT id, username, full_name, email, primary_role_id FROM users ORDER BY id;");
    console.log(`PostgreSQL users count: ${res.rows.length}`);
    res.rows.forEach(u => console.log(`- ${u.id}: ${u.username} (${u.full_name || 'No Name'}) [${u.primary_role_id}]`));
  } catch (e) {
    console.error(e);
  } finally {
    await pg.pool.end();
  }
}

main();
