const fs = require('fs');

async function main() {
  // 1. Check PostgreSQL
  try {
    const pg = require('../database/pg.js');
    const plantsRes = await pg.query("SELECT id, code, name, branch_code, city, is_active FROM plants ORDER BY id;");
    console.log('--- PLANTS IN POSTGRESQL ---');
    console.log(plantsRes.rows);
  } catch (err) {
    console.log('Postgres error / not configured:', err.message);
  }

  // 2. Check mock-data.js
  const mockContent = fs.readFileSync('js/data/mock-data.js', 'utf8');
  const sandbox = {};
  const fn = new Function('sandbox', mockContent + '; sandbox.INITIAL_DATA = INITIAL_DATA;');
  fn(sandbox);

  console.log('--- PLANTS IN MOCK-DATA ---');
  if (sandbox.INITIAL_DATA.plants) {
    console.log(sandbox.INITIAL_DATA.plants.map(p => ({
      id: p.id,
      code: p.code,
      name: p.name,
      branch_code: p.branch_code,
      city: p.city,
      status: p.status
    })));
  }

  console.log('--- DOCUMENT_NUMBER_SERIES IN MOCK-DATA ---');
  if (sandbox.INITIAL_DATA.document_number_series) {
    console.log(sandbox.INITIAL_DATA.document_number_series.map(s => ({
      id: s.id,
      series_id: s.series_id,
      doc_type: s.doc_type,
      doc_type_code: s.doc_type_code,
      branch_id: s.branch_id,
      branch_name: s.branch_name,
      pattern: s.pattern,
      next_number: s.next_number,
      current_seq: s.current_seq
    })));
  }

  // 3. Check db.js initial table definitions
  const dbJs = fs.readFileSync('js/data/db.js', 'utf8');
  console.log('db.js loaded (size:', dbJs.length, ')');
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
