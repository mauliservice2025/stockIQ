const pg = require('../database/pg');

async function main() {
  try {
    const cons = await pg.query("SELECT constraint_name, constraint_type FROM information_schema.table_constraints WHERE table_name='role_permissions'");
    console.log('Constraints on role_permissions:', cons.rows);

    const crmPerms = [
      { id: 'PERM-CRM', module: 'Customer Relationship (CRM)', module_code: 'CRM', perm_code: 'CUSTOMER_REMINDERS', name: 'Customer Relationship Management (CRM)', description: 'Automated two-wheeler service reminders, CRM notifications and customer engagement' },
      { id: 'PERM-REMINDER-DASHBOARD', module: 'Customer Relationship (CRM)', module_code: 'CRM', perm_code: 'REMINDER_DASHBOARD', name: 'Service Reminder Dashboard', description: 'Due, overdue & upcoming service reminder analytics, conversion metrics and follow-up KPIs' },
      { id: 'PERM-REMINDER-CONFIG', module: 'Customer Relationship (CRM)', module_code: 'CRM', perm_code: 'REMINDER_CONFIG', name: 'Reminder Configuration', description: 'Automated service intervals (Free & Paid Service), advance reminder days and trigger rules' },
      { id: 'PERM-REMINDER-PROCESS', module: 'Customer Relationship (CRM)', module_code: 'CRM', perm_code: 'REMINDER_PROCESS', name: 'Reminder Processing', description: 'Real-time vehicle reminder generation, customer dispatch queue and SMS/WhatsApp delivery' },
      { id: 'PERM-REMINDER-HISTORY', module: 'Customer Relationship (CRM)', module_code: 'CRM', perm_code: 'REMINDER_HISTORY', name: 'Reminder History', description: 'Comprehensive audit log of sent customer reminders, delivery statuses and contact history' },
      { id: 'PERM-REMINDER-REPORTS', module: 'Customer Relationship (CRM)', module_code: 'CRM', perm_code: 'REMINDER_REPORTS', name: 'Reminder Reports', description: 'Service conversion reports, customer retention analytics and delivery performance' },
      { id: 'PERM-REMINDER-TEMPLATES', module: 'Customer Relationship (CRM)', module_code: 'CRM', perm_code: 'REMINDER_TEMPLATES', name: 'Message Template Master', description: 'SMS, WhatsApp and email message templates with dynamic customer/vehicle placeholders' }
    ];

    const targetRoles = ['ROLE-001', 'ROLE-ADMIN'];
    for (const rId of targetRoles) {
      for (const p of crmPerms) {
        const existing = await pg.query('SELECT 1 FROM role_permissions WHERE role_id = $1 AND perm_code = $2', [rId, p.perm_code]);
        if (existing.rows.length === 0) {
          const rpId = `${rId}_${p.perm_code}`;
          await pg.query(`
            INSERT INTO role_permissions (
              id, role_id, perm_code, view, add, edit, delete, 
              submit, approve, reject, cancel, print, export, 
              import, post, reverse, close, reopen
            )
            VALUES (
              $1, $2, $3, true, true, true, true,
              true, true, true, true, true, true,
              true, true, false, true, false
            )
          `, [rpId, rId, p.perm_code]);
        }
      }
    }
    console.log('✓ Granted CRM permissions to Super Admin (ROLE-001) and Administrator (ROLE-ADMIN) in PostgreSQL.');

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pg.pool.end();
  }
}

main();
