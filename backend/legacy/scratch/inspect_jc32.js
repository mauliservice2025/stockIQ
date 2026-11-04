const pg = require('../database/pg');

async function main() {
  try {
    const tables = await pg.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
    console.log('=== TABLES ===');
    console.log(tables.rows.map(r => r.table_name).join(', '));

    const jc = await pg.query("SELECT * FROM job_cards WHERE job_card_no LIKE '%0032%'");
    console.log('=== JOB CARD 0032 ===');
    console.log(JSON.stringify(jc.rows, null, 2));

    const est = await pg.query("SELECT * FROM estimates WHERE job_card_no LIKE '%0032%'");
    console.log('=== ESTIMATE 0032 ===');
    console.log(JSON.stringify(est.rows, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

main();
