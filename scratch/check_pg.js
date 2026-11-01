const { query } = require('../database/pg');

async function test() {
  const p = await query("SELECT * FROM permissions WHERE perm_code = 'STORE_TX_STOCK_TRANSFER' OR perm_code = 'TRANSFERS' OR id LIKE '%TRANSFER%' OR id LIKE '%XFER%'");
  console.log('Permissions in PG:', p.rows);

  const rp = await query("SELECT * FROM role_permissions WHERE perm_code = 'STORE_TX_STOCK_TRANSFER'");
  console.log('Role Permissions in PG:', rp.rows);
}

test().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
