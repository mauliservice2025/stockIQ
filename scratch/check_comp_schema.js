const pg = require('../database/pg');
(async () => {
  await pg.testConnection();
  const res = await pg.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'companies' ORDER BY ordinal_position;");
  console.log('companies columns:', res.rows);
  process.exit(0);
})();
