const pg = require('../database/pg.js');
(async () => {
  try {
    const res = await pg.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND (table_name LIKE '%genealogy%' OR table_name LIKE '%trace%');");
    console.log('Tables matching genealogy/trace:', res.rows);

    const permRes = await pg.query("SELECT * FROM permissions WHERE id LIKE '%TRACE%' OR name LIKE '%Genealogy%' OR name LIKE '%Trace%';");
    console.log('Permissions matching genealogy/trace:', permRes.rows);

    const rolePermRes = await pg.query("SELECT * FROM role_permissions WHERE permission_id LIKE '%TRACE%';");
    console.log('Role permissions matching TRACE:', rolePermRes.rows);
  } catch (err) {
    console.error('DB query error:', err.message);
  } finally {
    process.exit(0);
  }
})();
