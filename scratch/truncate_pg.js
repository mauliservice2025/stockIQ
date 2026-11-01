const { Client } = require('pg');
const client = new Client('postgresql://postgres:postgres@localhost:5432/stockiq');

async function main() {
  await client.connect();
  
  // 1. Truncate items and related item tables in PostgreSQL
  try {
    await client.query('TRUNCATE TABLE items CASCADE;');
    console.log('✓ Truncated table items CASCADE in PostgreSQL.');
  } catch (err) {
    console.error('items truncate:', err.message);
  }

  // 2. Check for vehicle tables in PostgreSQL
  const res = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name ILIKE '%vehicle%'
  `);
  console.log('Vehicle-related tables in PostgreSQL:', res.rows.map(r => r.table_name));
  
  for (const row of res.rows) {
    try {
      await client.query(`TRUNCATE TABLE "${row.table_name}" CASCADE;`);
      console.log(`✓ Truncated ${row.table_name} in PostgreSQL.`);
    } catch (e) {
      console.error(`Error truncating ${row.table_name}:`, e.message);
    }
  }

  await client.end();
}

main().catch(console.error);
