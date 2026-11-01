const pg = require('../database/pg');

(async () => {
  try {
    const conn = await pg.testConnection();
    if (!conn.connected) {
      console.error('Cannot connect to PostgreSQL');
      process.exit(1);
    }
    console.log('Connected to PostgreSQL.');

    // 1. Create organizations table if not exists
    await pg.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id VARCHAR(36) PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        org_type VARCHAR(50) DEFAULT 'HEADQUARTERS',
        tax_id VARCHAR(50),
        gstin VARCHAR(50),
        pan VARCHAR(50),
        email VARCHAR(100),
        phone VARCHAR(50),
        website VARCHAR(100),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        country VARCHAR(100) DEFAULT 'India',
        pincode VARCHAR(20),
        status VARCHAR(20) DEFAULT 'Active',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Table organizations verified/created.');

    // Seed ORG-001
    await pg.query(`
      INSERT INTO organizations (id, code, name, city, state, country, pincode, status, is_active, updated_at)
      VALUES ('ORG-001', 'MSC', 'Mauli Service Center Pvt. Ltd.', 'Pune', 'Maharashtra', 'India', '412101', 'Active', TRUE, NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        code = EXCLUDED.code,
        status = EXCLUDED.status,
        is_active = EXCLUDED.is_active,
        updated_at = NOW();
    `);
    console.log('Seeded ORG-001 into organizations.');

    // 2. Add any missing columns to warehouses table
    const columnsToAdd = [
      'ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS address TEXT;',
      'ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS gstin VARCHAR(50);',
      'ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS manager VARCHAR(100);',
      'ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS contact_number VARCHAR(50);',
      'ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS email VARCHAR(100);',
      'ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS store_type VARCHAR(50);',
      'ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS parent_store_id VARCHAR(50);',
      'ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS facility_ids TEXT;',
      'ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT \'Active\';',
      'ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS effective_from VARCHAR(50);',
      'ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS effective_to VARCHAR(50);',
      'ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();'
    ];

    for (const sql of columnsToAdd) {
      await pg.query(sql);
    }
    console.log('Warehouses columns verified/added.');

    // 3. Ensure facilities table has both PLANT-01 and PLANT-02
    const facRes = await pg.query("SELECT id, name, code FROM facilities WHERE id IN ('PLANT-01', 'PLANT-02') ORDER BY id;");
    console.log('Current facilities in PG:', facRes.rows);

    // 4. Seed warehouses for PLANT-01 and PLANT-02
    await pg.query(`
      INSERT INTO warehouses (id, plant_id, code, name, warehouse_type, store_type, facility_ids, manager, contact_number, status, is_active, created_at, updated_at)
      VALUES 
        ('WH-PUN-MAIN', 'PLANT-01', 'STR-MSC1-MAIN', 'Main Store - MSC 1', 'MAIN_STORE', 'Main Store', '["PLANT-01"]', 'Sanket', '7888010210', 'Active', TRUE, NOW(), NOW()),
        ('WH-MSC2-MAIN', 'PLANT-02', 'STR-MSC2-MAIN', 'Main Store - MSC 2', 'MAIN_STORE', 'Main Store', '["PLANT-02"]', 'Chetan', '8765456789', 'Active', TRUE, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        plant_id = EXCLUDED.plant_id,
        code = EXCLUDED.code,
        name = EXCLUDED.name,
        warehouse_type = EXCLUDED.warehouse_type,
        store_type = EXCLUDED.store_type,
        facility_ids = EXCLUDED.facility_ids,
        manager = EXCLUDED.manager,
        contact_number = EXCLUDED.contact_number,
        status = EXCLUDED.status,
        is_active = EXCLUDED.is_active,
        updated_at = NOW();
    `);
    console.log('Seeded warehouses for PLANT-01 and PLANT-02 into PostgreSQL.');

    const whRes = await pg.query("SELECT id, plant_id, code, name, status FROM warehouses;");
    console.log('Warehouses in PG:', whRes.rows);

  } catch (err) {
    console.error('Error during setup:', err);
  }
  process.exit(0);
})();
