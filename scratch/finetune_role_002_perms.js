const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/stockiq' });

(async () => {
  try {
    // 1. In PostgreSQL, remove PLANNING, REQUISITIONS, ORDERS, REPORTS from ROLE-002
    await pool.query(`
      DELETE FROM role_permissions 
      WHERE role_id = 'ROLE-002' 
      AND perm_code IN ('PLANNING', 'REQUISITIONS', 'ORDERS', 'REPORTS');
    `);
    console.log('PostgreSQL: Removed non-store permissions from ROLE-002');

    const res = await pool.query("SELECT COUNT(*) FROM role_permissions WHERE role_id = 'ROLE-002'");
    console.log('PostgreSQL: ROLE-002 permissions count:', res.rows[0].count);

    // 2. In mock-data.js, remove PLANNING, REQUISITIONS, ORDERS, REPORTS from ROLE-002
    const mockPath = path.join(__dirname, '../js/data/mock-data.js');
    let raw = fs.readFileSync(mockPath, 'utf8');
    const prefix = raw.match(/^[^{]*/)[0];
    const suffix = raw.match(/;[^;]*$/)[0];
    const jsonStr = raw.substring(prefix.length, raw.length - suffix.length);
    const data = JSON.parse(jsonStr);

    const nonStore = ['PLANNING', 'REQUISITIONS', 'ORDERS', 'REPORTS'];
    data.role_permissions = data.role_permissions.filter(rp => 
      !(rp.role_id === 'ROLE-002' && nonStore.includes(rp.perm_code))
    );

    const role002Perms = data.role_permissions.filter(rp => rp.role_id === 'ROLE-002');
    console.log('mock-data.js: ROLE-002 permissions count:', role002Perms.length);

    const newContent = prefix + JSON.stringify(data, null, 2) + suffix;
    fs.writeFileSync(mockPath, newContent, 'utf8');
    console.log('mock-data.js: updated successfully!');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
})();
