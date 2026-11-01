const pg = require('../database/pg');

(async () => {
  const constraints = await pg.query("SELECT conname, contype, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'users'::regclass;");
  console.log('Constraints on users table:');
  constraints.rows.forEach(c => console.log(' -', c.conname, c.contype, c.pg_get_constraintdef));
  
  const roles = await pg.query("SELECT id, name FROM roles;");
  console.log('Roles in PG:', roles.rows.map(r => r.id));

  const plants = await pg.query("SELECT id, name FROM plants;");
  console.log('Plants in PG:', plants.rows.map(p => p.id));
  
  const warehouses = await pg.query("SELECT id, name FROM warehouses;");
  console.log('Warehouses in PG:', warehouses.rows.map(w => w.id));
})();
