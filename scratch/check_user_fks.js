const pg = require('../database/pg');

async function main() {
  try {
    const res = await pg.query("SELECT table_name, column_name FROM information_schema.columns WHERE column_name LIKE '%user_id%' ORDER BY table_name;");
    console.log('Tables with user_id columns:', res.rows);
  } catch (e) {
    console.error(e);
  } finally {
    await pg.pool.end();
  }
}

main();
