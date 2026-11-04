const { query } = require('../database/pg');

async function removeStockTransferFromDb() {
  console.log('--- Removing STORE_TX_STOCK_TRANSFER & PERM-STORE-XFER from PostgreSQL ---');
  
  const delRolePerm = await query("DELETE FROM role_permissions WHERE perm_code = 'STORE_TX_STOCK_TRANSFER'");
  console.log('Deleted from role_permissions:', delRolePerm.rowCount);

  const delPerm = await query("DELETE FROM permissions WHERE id = 'PERM-STORE-XFER' OR perm_code = 'STORE_TX_STOCK_TRANSFER'");
  console.log('Deleted from permissions:', delPerm.rowCount);

  const checkPerm = await query("SELECT * FROM permissions WHERE id = 'PERM-STORE-XFER' OR perm_code = 'STORE_TX_STOCK_TRANSFER'");
  console.log('Remaining permissions matching:', checkPerm.rows.length);

  const checkRolePerm = await query("SELECT * FROM role_permissions WHERE perm_code = 'STORE_TX_STOCK_TRANSFER'");
  console.log('Remaining role_permissions matching:', checkRolePerm.rows.length);

  console.log('✅ PostgreSQL cleanup completed successfully!');
}

removeStockTransferFromDb().then(() => process.exit(0)).catch(err => {
  console.error('Error during DB cleanup:', err);
  process.exit(1);
});
