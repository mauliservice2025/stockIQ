const { Pool } = require('pg');
require('dotenv').config();

async function check() {
  const pool = new Pool();
  try {
    const res = await pool.query("SELECT collection_name, jsonb_array_length(data) as count FROM iscm_data WHERE collection_name = 'billingEstimates'");
    if (res.rows.length > 0) {
      console.log('PG billingEstimates count:', res.rows[0].count);
      const dataRes = await pool.query("SELECT data FROM iscm_data WHERE collection_name = 'billingEstimates'");
      const list = dataRes.rows[0].data || [];
      const jcConverted = list.filter(e => e.converted_to_type === 'JOB_CARD' || (e.converted_to_no && e.converted_to_no.startsWith('JC')));
      console.log('Estimates converted to JOB_CARD in PG:', jcConverted.map(e => ({
        id: e.id,
        estimate_no: e.estimate_no,
        status: e.status,
        converted_to_type: e.converted_to_type,
        converted_to_no: e.converted_to_no
      })));
    } else {
      console.log('No billingEstimates collection in iscm_data');
    }
  } catch (err) {
    console.error('PG Error:', err.message);
  } finally {
    await pool.end();
  }
}

check();
