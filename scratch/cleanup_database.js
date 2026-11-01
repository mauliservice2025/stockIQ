const pg = require('../database/pg');

(async () => {
  try {
    const conn = await pg.testConnection();
    if (!conn.connected) {
      console.error('Database connection failed');
      process.exit(1);
    }

    console.log('--- Cleaning up database permissions and role permissions ---');

    // 1. Update PERM-INVENTORY name
    const res1 = await pg.query("UPDATE permissions SET name = 'Stock Balances' WHERE id = 'PERM-INVENTORY'");
    console.log(`Updated permissions (PERM-INVENTORY): ${res1.rowCount} row(s)`);

    // 2. Delete role_permissions with TRACEABILITY
    const res2 = await pg.query("DELETE FROM role_permissions WHERE perm_code = 'TRACEABILITY' OR perm_code ILIKE '%trace%'");
    console.log(`Deleted role_permissions (TRACEABILITY): ${res2.rowCount} row(s)`);

    // 3. Delete permissions with TRACEABILITY
    const res3 = await pg.query("DELETE FROM permissions WHERE perm_code = 'TRACEABILITY' OR id LIKE '%TRACE%'");
    console.log(`Deleted permissions (TRACEABILITY): ${res3.rowCount} row(s)`);

    // 4. Update roles description if mentioning genealogy
    const res4 = await pg.query("UPDATE roles SET description = REPLACE(description, 'genealogy traces, ', '') WHERE description LIKE '%genealogy%'");
    console.log(`Updated roles description: ${res4.rowCount} row(s)`);

    // Verify
    const verifyPerms = await pg.query("SELECT id, name, perm_code FROM permissions WHERE id LIKE '%INVENTORY%' OR id LIKE '%TRACE%' OR perm_code ILIKE '%trace%'");
    console.log('Remaining related permissions:', verifyPerms.rows);

    const verifyRolePerms = await pg.query("SELECT * FROM role_permissions WHERE perm_code ILIKE '%trace%'");
    console.log('Remaining role_permissions:', verifyRolePerms.rows);

    console.log('Database cleanup completed successfully.');
  } catch (err) {
    console.error('Error during DB cleanup:', err);
  }
  process.exit(0);
})();
