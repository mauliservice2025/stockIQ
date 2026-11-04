const { Client } = require('pg');
const client = new Client('postgresql://postgres:postgres@localhost:5432/stockiq');

async function main() {
  await client.connect();
  console.log('Connected to PostgreSQL stockiq database.');

  // 1. Get all foreign keys pointing to plants
  const fkQuery = `
    SELECT
      tc.table_name,
      tc.constraint_name,
      kcu.column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'plants';
  `;
  const fks = await client.query(fkQuery);
  console.log(`Found ${fks.rows.length} foreign key constraints to drop.`);

  for (const fk of fks.rows) {
    try {
      await client.query(`ALTER TABLE "${fk.table_name}" DROP CONSTRAINT IF EXISTS "${fk.constraint_name}";`);
      console.log(`  Dropped FK ${fk.constraint_name} on ${fk.table_name}`);
    } catch (e) {
      console.warn(`  Could not drop ${fk.constraint_name}:`, e.message);
    }
  }

  // 2. Make plant_id columns nullable in those tables so records can exist without a mandatory branch
  const tablesWithPlantId = [
    'departments', 'warehouses', 'purchase_requisitions', 'purchase_orders',
    'goods_receipt_notes', 'quality_inspections', 'inventory_balances',
    'inventory_transactions', 'production_orders', 'stock_transfers',
    'sales_orders', 'stock_count_plans', 'stock_adjustments', 'users',
    'user_plants', 'user_store_access'
  ];

  for (const tbl of tablesWithPlantId) {
    try {
      await client.query(`ALTER TABLE "${tbl}" ALTER COLUMN plant_id DROP NOT NULL;`);
      console.log(`  Set plant_id nullable on ${tbl}`);
    } catch (e) {
      // Column might be source_plant_id or dest_plant_id on stock_transfers
      if (tbl === 'stock_transfers') {
        try {
          await client.query(`ALTER TABLE stock_transfers ALTER COLUMN source_plant_id DROP NOT NULL;`);
          await client.query(`ALTER TABLE stock_transfers ALTER COLUMN dest_plant_id DROP NOT NULL;`);
          console.log(`  Set source/dest plant_id nullable on stock_transfers`);
        } catch (_) {}
      }
    }
  }

  // 3. Clear all records from plants table
  const delRes = await client.query('DELETE FROM plants;');
  console.log(`\nDeleted ${delRes.rowCount} branch master records from PostgreSQL plants table.`);

  // 4. Verify count
  const cntRes = await client.query('SELECT COUNT(*) FROM plants;');
  console.log(`Remaining records in PostgreSQL plants table: ${cntRes.rows[0].count}`);

  await client.end();
}

main().catch(console.error);
