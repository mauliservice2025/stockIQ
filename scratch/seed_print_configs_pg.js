const { pool } = require('../database/pg');
const { INITIAL_DATA } = require('../js/data/mock-data.js');

async function run() {
  const configs = INITIAL_DATA.document_print_configurations || [];
  for (const c of configs) {
    await pool.query(`
      INSERT INTO document_print_configurations (
        id, code, name, facility_id, document_type, version, status,
        effective_from, remarks, page_settings, header_config,
        body_config, columns_config, footer_config, conditional_rules, created_by, created_at,
        updated_by, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
      ON CONFLICT (id) DO NOTHING;
    `, [
      c.id, c.code, c.name, c.facility_id, c.document_type, c.version, c.status,
      c.effective_from, c.remarks, JSON.stringify(c.page_settings),
      JSON.stringify(c.header_config), JSON.stringify(c.body_config), JSON.stringify(c.columns_config),
      JSON.stringify(c.footer_config), JSON.stringify(c.conditional_rules || []), c.created_by, c.created_at, c.updated_by, c.updated_at
    ]);
  }
  console.log('Seeded', configs.length, 'print configs to PostgreSQL!');

  const auditLogs = INITIAL_DATA.document_print_audit_logs || [];
  for (const a of auditLogs) {
    await pool.query(`
      INSERT INTO document_print_audit_logs (
        id, configuration_id, action, facility_id, document_type, version_number,
        user_id, user_name, remarks, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (id) DO NOTHING;
    `, [
      a.id, a.configuration_id, a.action, a.facility_id, a.document_type, a.version_number,
      a.user_id, a.user_name, a.remarks, a.created_at
    ]);
  }
  console.log('Seeded', auditLogs.length, 'print audit logs to PostgreSQL!');
  await pool.end();
}
run().catch(console.error);
