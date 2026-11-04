const { pool } = require('../database/pg');

async function testDelete() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const res = await client.query('DELETE FROM plants');
    console.log('Successfully deleted plants count:', res.rowCount);
    await client.query('ROLLBACK');
    console.log('Rollback successful. No FK constraint tripped.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('FK constraint error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}
testDelete();
