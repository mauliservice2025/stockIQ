const pg = require('../database/pg.js');

async function run() {
  await pg.query("UPDATE plants SET branch_code = 'MSC1' WHERE id = 'PLANT-01';");
  await pg.query("UPDATE plants SET branch_code = 'MSC2' WHERE id = 'PLANT-02';");
  const res = await pg.query("SELECT id, code, name, branch_code FROM plants;");
  console.log('Updated plants in PostgreSQL:', res.rows);
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
