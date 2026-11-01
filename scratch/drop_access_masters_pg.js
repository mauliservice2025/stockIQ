const pg = require('../database/pg');

async function main() {
  try {
    await pg.query("DELETE FROM role_permissions WHERE perm_code IN ('WH_ACCESS', 'DEPT_ACCESS')");
    await pg.query("DELETE FROM permissions WHERE perm_code IN ('WH_ACCESS', 'DEPT_ACCESS')");
    console.log('✓ Cleaned up permissions in PostgreSQL');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pg.pool.end();
  }
}

main();
