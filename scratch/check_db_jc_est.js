const { Pool } = require('pg');
require('dotenv').config();

async function main() {
  const pool = new Pool();
  try {
    const res = await pool.query("SELECT collection_name, jsonb_array_length(data) as count FROM iscm_data");
    console.log('Collections in iscm_data:', res.rows);

    const jcRes = await pool.query("SELECT data FROM iscm_data WHERE collection_name = 'jobCards'");
    if (jcRes.rows.length > 0) {
      const jcs = jcRes.rows[0].data;
      const target = jcs.filter(j => (j.job_card_no && j.job_card_no.includes('0032')) || (j.customer_name && j.customer_name.includes('Satish')));
      console.log('Found target JC (Satish / 0032):', JSON.stringify(target, null, 2));
    }

    const estRes = await pool.query("SELECT collection_name, data FROM iscm_data WHERE collection_name IN ('estimates', 'billingEstimates')");
    for (const row of estRes.rows) {
      const ests = row.data || [];
      const targetEst = ests.filter(e => (e.job_card_no && e.job_card_no.includes('0032')) || (e.customer_name && e.customer_name.includes('Satish')));
      console.log(`Found target Estimate in ${row.collection_name}:`, JSON.stringify(targetEst, null, 2));
    }

    const srvRes = await pool.query("SELECT collection_name, data FROM iscm_data WHERE collection_name = 'services'");
    if (srvRes.rows.length > 0) {
      console.log('Services in iscm_data:', JSON.stringify(srvRes.rows[0].data, null, 2));
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

main();
