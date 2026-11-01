const pg = require('../database/pg.js');

async function main() {
  const b1 = await pg.query("SELECT * FROM item_batches LIMIT 10");
  console.log('item_batches in DB:', b1.rows);
  const grn = await pg.query("SELECT * FROM grn_items LIMIT 10");
  console.log('grn_items in DB:', grn.rows);
  const bal = await pg.query("SELECT * FROM inventory_balances LIMIT 10");
  console.log('inventory_balances in DB:', bal.rows);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
