const pg = require('../database/pg');

async function seedRole001() {
  try {
    console.log('1. Inserting ROLE-001 into PostgreSQL roles table...');
    const roleRes = await pg.query(`
      INSERT INTO roles (id, code, name, description, role_type, is_system, status, user_count)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        code = EXCLUDED.code,
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        status = EXCLUDED.status
      RETURNING *;
    `, [
      'ROLE-001',
      '001',
      'Superadmin',
      'Super Admin role with configurable module rights and operational permissions.',
      'SYSTEM',
      false,
      'ACTIVE',
      1
    ]);
    console.log('✓ Roles row:', roleRes.rows[0]);

    console.log('2. Inserting Billing & Security permissions for ROLE-001...');
    const permsToGrant = [
      'SEC_DASHBOARD',
      'USER_MASTER',
      'BILLING_DASHBOARD',
      'STORE_TX_JOB_CARD_ISSUE',
      'BILLING_ESTIMATES',
      'DRAFT_BILLS',
      'FINAL_BILLS',
      'CUSTOMER_BILLING',
      'VEHICLE_DELIVERY',
      'CHANGE_NEXT_SERVICE_DATE'
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
      `, ['ROLE-001', code]);
    }

    const verify = await pg.query(`SELECT role_id, perm_code, view FROM role_permissions WHERE role_id = 'ROLE-001'`);
    console.log(`✓ Successfully seeded ${verify.rows.length} permissions in PostgreSQL:`, verify.rows.map(r => r.perm_code));

    // Also verify or insert user USR-111 in PostgreSQL
    const userRes = await pg.query(`
      INSERT INTO users (
        id, username, full_name, email, status, primary_role_id, plant_id, warehouse_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        full_name = EXCLUDED.full_name,
        primary_role_id = EXCLUDED.primary_role_id,
        status = EXCLUDED.status
      RETURNING id, username, primary_role_id;
    `, [
      'USR-111',
      'SANKETB',
      'Sanket Borole',
      'sanket@gmail.com',
      'ACTIVE',
      'ROLE-001',
      'PLANT-01',
      'WH-MSC-001'
    ]);
    console.log('✓ Users row:', userRes.rows[0]);

  } catch (e) {
    console.error('Error during seed:', e.message);
  } finally {
    await pg.pool.end();
  }
}

seedRole001();
