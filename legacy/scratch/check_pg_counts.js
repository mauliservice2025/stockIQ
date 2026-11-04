const { Client } = require('pg');
const client = new Client('postgresql://postgres:postgres@localhost:5432/stockiq');

async function main() {
  await client.connect();
  const tables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);
  console.log('Tables and row counts:');
  for (const row of tables.rows) {
    try {
      const cnt = await client.query(`SELECT COUNT(*) FROM "${row.table_name}";`);
      if (parseInt(cnt.rows[0].count, 10) > 0) {
        console.log(`  ${row.table_name}: ${cnt.rows[0].count}`);
      }
    } catch (e) {
      console.log(`  ${row.table_name}: error`, e.message);
    }
  }
  await client.end();
}

main().catch(console.error);
