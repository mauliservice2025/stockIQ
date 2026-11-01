const { query } = require('../database/pg');

async function main() {
  try {
    const res = await query(
      `DELETE FROM plants 
       WHERE id IN ('PLANT-02', 'PLANT-03') 
          OR code IN ('BRANCH-CHE-02', 'BRANCH-WAKAD-01') 
          OR name ILIKE '%Chennai Sriperumbudur%' 
          OR name ILIKE '%Apex Two-Wheeler Wakad%'`
    );
    console.log('Deleted rows from plants in PG:', res.rowCount);

    const remaining = await query('SELECT id, code, name FROM plants;');
    console.log('Remaining plants in PG:', remaining.rows);
  } catch (err) {
    console.error('Error in PG cleanup:', err);
  } finally {
    process.exit(0);
  }
}

main();
