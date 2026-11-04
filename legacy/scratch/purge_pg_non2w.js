const { pool } = require('../database/pg');
const { runSeeder, generateSeedSqlFile } = require('../database/seed');

async function purgeAndReseed() {
  try {
    console.log('--- Cleaning tables with CASCADE in PostgreSQL ---');
    await pool.query(`
      TRUNCATE TABLE
        shipments,
        sales_orders,
        production_orders,
        putaway_tasks,
        quality_inspections,
        goods_receipt_notes,
        purchase_orders,
        purchase_requisitions,
        inventory_balances,
        bom_items,
        bom_headers,
        warehouse_bins,
        warehouse_zones,
        warehouses,
        items,
        item_categories,
        suppliers,
        customers
      CASCADE;
    `);
    console.log('✓ Successfully truncated all master and transactional tables with CASCADE');

    console.log('\n--- Re-seeding clean Two-Wheeler data ---');
    generateSeedSqlFile();
    await runSeeder();
    console.log('✓ Re-seeding complete!');

    // Verification
    const itemRes = await pool.query('SELECT code, name, category_id FROM items ORDER BY code;');
    console.log(`\nVerified PostgreSQL items count: ${itemRes.rowCount}`);
    itemRes.rows.forEach(r => console.log(`  - [${r.code}] ${r.name} (${r.category_id})`));

    const catRes = await pool.query('SELECT code, name FROM item_categories ORDER BY code;');
    console.log(`\nVerified PostgreSQL item_categories count: ${catRes.rowCount}`);
    catRes.rows.forEach(r => console.log(`  - [${r.code}] ${r.name}`));

    const whRes = await pool.query('SELECT code, name, warehouse_type FROM warehouses ORDER BY code;');
    console.log(`\nVerified PostgreSQL warehouses count: ${whRes.rowCount}`);
    whRes.rows.forEach(r => console.log(`  - [${r.code}] ${r.name} (${r.warehouse_type})`));

  } catch (err) {
    console.error('Error during purge and re-seed:', err);
  } finally {
    await pool.end();
  }
}

purgeAndReseed();
