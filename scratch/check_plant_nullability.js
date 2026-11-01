const { Client } = require('pg');
const client = new Client('postgresql://postgres:postgres@localhost:5432/stockiq');

async function main() {
  await client.connect();
  const res = await client.query(`
    SELECT table_name, column_name, is_nullable
    FROM information_schema.columns
    WHERE (column_name LIKE '%plant_id%' OR column_name = 'plant_id')
      AND table_schema = 'public';
  `);
  console.table(res.rows);
  await client.end();
}

main().catch(console.error);
