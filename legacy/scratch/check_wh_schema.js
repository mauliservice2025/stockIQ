const pg = require('../database/pg');
(async () => {
  await pg.testConnection();
  const res = await pg.query(`
    SELECT conname, contype, pg_get_constraintdef(c.oid)
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'warehouses';
  `);
  console.log('warehouses constraints:', res.rows);
  process.exit(0);
})();
