const { Client } = require('pg');
const client = new Client('postgresql://postgres:postgres@localhost:5432/stockiq');

async function main() {
  await client.connect();
  const res = await client.query(`
    SELECT
      rc.delete_rule,
      tc.table_name,
      kcu.column_name
    FROM information_schema.referential_constraints rc
    JOIN information_schema.table_constraints tc
      ON rc.constraint_name = tc.constraint_name
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE rc.unique_constraint_name IN (
      SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'plants'
    );
  `);
  console.log('Delete rules for plants:');
  console.table(res.rows);
  await client.end();
}

main().catch(console.error);
