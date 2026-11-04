const { pool } = require('../database/pg');

async function purgeDatabase() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Decouple holidays from deleted facilities
    const holRes = await client.query('UPDATE holidays SET facility_id = NULL;');
    console.log(`Updated ${holRes.rowCount} holiday records.`);

    // 2. Decouple departments from deleted plants
    const deptRes = await client.query('UPDATE departments SET plant_id = NULL;');
    console.log(`Updated ${deptRes.rowCount} department records.`);

    // 3. Clear plants table
    const plantRes = await client.query('DELETE FROM plants;');
    console.log(`Deleted ${plantRes.rowCount} plants from PostgreSQL.`);

    // 4. Clear companies table
    const compRes = await client.query('DELETE FROM companies;');
    console.log(`Deleted ${compRes.rowCount} companies from PostgreSQL.`);

    await client.query('COMMIT');
    console.log('✅ PostgreSQL database purge successfully committed!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error purging database:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

purgeDatabase();
