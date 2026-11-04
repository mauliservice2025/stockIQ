const pg = require('../database/pg');

async function seedRoleAdmin() {
  try {
    console.log('Inserting Billing & Workshop permissions for ROLE-ADMIN in PostgreSQL...');
    const permsToGrant = [
      'SEC_DASHBOARD',
      'USER_MASTER',
      'BILLING_DASHBOARD',
      'JOB_CARDS',
      'STORE_TX_JOB_CARD_ISSUE',
      'BILLING_ESTIMATES',
      'DRAFT_BILLS',
      'FINAL_BILLS',
      'CUSTOMER_BILLING',
      'VEHICLE_DELIVERY',
      'CHANGE_NEXT_SERVICE_DATE',
      'CUSTOMER_REMINDERS',
      'REMINDER_DASHBOARD',
      'REMINDER_CONFIG',
      'REMINDER_PROCESS',
      'REMINDER_HISTORY',
      'REMINDER_REPORTS',
      'REMINDER_TEMPLATES'
    ];

    for (const code of permsToGrant) {
      await pg.query(`
        INSERT INTO role_permissions (
          role_id, perm_code, view, add, edit, delete, submit, approve,
          reject, cancel, print, export, import, post, reverse, close, reopen
        ) VALUES ($1, $2, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true)
        ON CONFLICT (role_id, perm_code) DO UPDATE SET
          view = true, add = true, edit = true, delete = true, submit = true,
          approve = true, reject = true, cancel = true, print = true, export = true,
          import = true, post = true, reverse = true, close = true, reopen = true;
      `, ['ROLE-ADMIN', code]);
    }

    const verify = await pg.query(`SELECT role_id, perm_code, view FROM role_permissions WHERE role_id = 'ROLE-ADMIN'`);
    console.log(`✓ Successfully seeded permissions for ROLE-ADMIN in PostgreSQL (${verify.rows.length} total):`, verify.rows.map(r => r.perm_code));
  } catch (e) {
    console.error('Error during seed:', e.message);
  } finally {
    await pg.pool.end();
  }
}

seedRoleAdmin();
