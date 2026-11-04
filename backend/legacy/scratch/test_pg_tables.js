const pg = require('../database/pg');

async function main() {
  try {
    const conn = await pg.testConnection();
    console.log('Conn:', conn);
    const tables = await pg.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('Tables:', tables.rows.map(r => r.table_name));
    for (const t of tables.rows) {
      if (t.table_name.includes('estimate') || t.table_name.includes('job') || t.table_name.includes('bill')) {
        console.log('Matched table:', t.table_name);
        const count = await pg.query(`SELECT count(*) FROM "${t.table_name}"`);
        console.log(`Count in ${t.table_name}:`, count.rows[0].count);
      }
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pg.pool.end();
  }
}

main();
