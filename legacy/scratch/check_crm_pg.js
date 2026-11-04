const pg = require('../database/pg');

async function main() {
  try {
    const res = await pg.query("SELECT id, perm_code, name, module, module_code FROM permissions WHERE perm_code LIKE '%REMINDER%' OR module LIKE '%CRM%' OR module LIKE '%Customer%'");
    console.log('CRM permissions in PG:', res.rows);

    const allModules = await pg.query("SELECT DISTINCT module FROM permissions");
    console.log('All modules in PG permissions:', allModules.rows.map(r => r.module));
  } catch (e) {
    console.error(e);
  } finally {
    await pg.pool.end();
  }
}

main();
