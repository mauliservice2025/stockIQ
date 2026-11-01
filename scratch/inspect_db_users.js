const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/stockiq' });

async function run() {
  try {
    const colRes = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position");
    console.log('Postgres users columns:');
    console.table(colRes.rows);

    const rowsRes = await pool.query('SELECT * FROM users ORDER BY id');
    console.log('Postgres users rows count:', rowsRes.rows.length);
    console.log(JSON.stringify(rowsRes.rows, null, 2));

    // Also check if there are other tables like employees
    const tablesRes = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
    console.log('Tables in stockiq:');
    console.log(tablesRes.rows.map(r => r.table_name).join(', '));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

run();
