const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/stockiq' });

async function check() {
  const allowed = ['USR-001', 'USR-002', 'USR-003', 'USR-106'];
  
  // 1. Check users table
  const uRes = await pool.query('SELECT id, username, full_name FROM users');
  console.log('Postgres users:', uRes.rows);

  // 2. Check all tables with user_id or similar columns for non-allowed users
  const colRes = await pool.query(`
    SELECT table_name, column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND (column_name LIKE '%user_id%' OR column_name = 'user_id' OR column_name = 'delegator_user_id' OR column_name = 'delegatee_user_id')
  `);

  for (const row of colRes.rows) {
    try {
      const q = await pool.query(`SELECT DISTINCT "${row.column_name}" FROM "${row.table_name}" WHERE "${row.column_name}" IS NOT NULL`);
      const invalid = q.rows.map(r => r[row.column_name]).filter(id => !allowed.includes(id));
      if (invalid.length > 0) {
        console.log(`FOUND NON-ALLOWED USERS in ${row.table_name}.${row.column_name}:`, invalid);
      }
    } catch (e) {
      console.warn(`Error on ${row.table_name}: ${e.message}`);
    }
  }

  // 3. Check created_by, approved_by, received_by, requested_by, inspector_name
  const nameCols = [
    { table: 'goods_receipt_notes', col: 'received_by' },
    { table: 'purchase_orders', col: 'approved_by' },
    { table: 'purchase_requisitions', col: 'requested_by' },
    { table: 'purchase_requisitions', col: 'approved_by' },
    { table: 'quality_inspections', col: 'inspector_name' },
    { table: 'departments', col: 'manager_name' },
    { table: 'warehouses', col: 'manager_name' },
    { table: 'login_history', col: 'user_name' }
  ];

  for (const nc of nameCols) {
    try {
      const q = await pool.query(`SELECT DISTINCT "${nc.col}" FROM "${nc.table}" WHERE "${nc.col}" IS NOT NULL`);
      console.log(`${nc.table}.${nc.col}:`, q.rows.map(r => r[nc.col]));
    } catch (e) {}
  }

  await pool.end();
}

check();
