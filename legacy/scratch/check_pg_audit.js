const pg = require('../database/pg');

async function main() {
  try {
    const res = await pg.query("SELECT * FROM audit_logs WHERE action ILIKE '%ESTIMATE%' OR details ILIKE '%estimate%'");
    console.log('PG audit logs with estimate:', res.rows);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pg.pool.end();
  }
}

main();
 l̥