const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/stockiq' });

(async () => {
  try {
    console.log('--- 1. Seeding ROLE-002 and ROLE-003 into PostgreSQL ---');

    await pool.query(`
      INSERT INTO roles (id, code, name, description, role_type, is_system, status, user_count)
      VALUES 
        ('ROLE-002', 'STORE_OPS_EXEC', 'Store Operations Executive', 'Store operations executive, parts inward, job card issue/return, transfer, cycle count and stock ledger.', 'OPERATIONAL', TRUE, 'ACTIVE', 1),
        ('ROLE-003', 'STORE_MGR_OPS', 'Senior Store & Sourcing Manager', 'Senior store and inventory management, material receipts and requisition approvals.', 'OPERATIONAL', TRUE, 'ACTIVE', 2)
      ON CONFLICT (id) DO UPDATE SET
        code = EXCLUDED.code,
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        role_type = EXCLUDED.role_type,
        is_system = EXCLUDED.is_system,
        status = EXCLUDED.status,
        user_count = EXCLUDED.user_count;
    `);
    console.log('Roles inserted/updated.');

    console.log('--- 2. Seeding role_permissions for ROLE-002 and ROLE-003 from ROLE-STORE-MGR ---');
    
    // Copy permissions from ROLE-STORE-MGR for ROLE-002 and ROLE-003
    for (const targetRole of ['ROLE-002', 'ROLE-003']) {
      await pool.query(`
        INSERT INTO role_permissions (
          id, role_id, perm_code, "view", "add", "edit", "delete", "submit", "approve", "reject", "cancel", "print", "export", "import", "post", "reverse", "close", "reopen"
        )
        SELECT 
          target_role || '_' || perm_code,
          target_role,
          perm_code,
          "view",
          "add",
          "edit",
          "delete",
          "submit",
          "approve",
          "reject",
          "cancel",
          "print",
          "export",
          "import",
          "post",
          "reverse",
          "close",
          "reopen"
        FROM role_permissions
        CROSS JOIN (SELECT $1::text as target_role) tr
        WHERE role_id = 'ROLE-STORE-MGR'
        ON CONFLICT (role_id, perm_code) DO UPDATE SET
          "view" = EXCLUDED."view",
          "add" = EXCLUDED."add",
          "edit" = EXCLUDED."edit",
          "delete" = EXCLUDED."delete",
          "submit" = EXCLUDED."submit",
          "approve" = EXCLUDED."approve",
          "reject" = EXCLUDED."reject",
          "cancel" = EXCLUDED."cancel",
          "print" = EXCLUDED."print",
          "export" = EXCLUDED."export",
          "import" = EXCLUDED."import",
          "post" = EXCLUDED."post",
          "reverse" = EXCLUDED."reverse",
          "close" = EXCLUDED."close",
          "reopen" = EXCLUDED."reopen";
      `, [targetRole]);
    }

    const count002 = await pool.query("SELECT COUNT(*) FROM role_permissions WHERE role_id = 'ROLE-002'");
    const count003 = await pool.query("SELECT COUNT(*) FROM role_permissions WHERE role_id = 'ROLE-003'");
    console.log(`ROLE-002 permissions in PG: ${count002.rows[0].count}`);
    console.log(`ROLE-003 permissions in PG: ${count003.rows[0].count}`);

    const rolesList = await pool.query("SELECT id, code, name, user_count, status FROM roles ORDER BY id");
    console.log('All PG roles:');
    console.table(rolesList.rows);

  } catch (err) {
    console.error('Error seeding PG roles:', err);
  } finally {
    await pool.end();
  }
})();
