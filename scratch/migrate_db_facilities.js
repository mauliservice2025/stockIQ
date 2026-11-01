const pg = require('../database/pg');

async function migrateDatabase() {
  console.log('--- Starting Database Migration: Plants/Branches -> Facilities ---');

  // 1. Rename table plants -> facilities (if exists)
  const checkPlants = await pg.query("SELECT to_regclass('public.plants') as plants_table, to_regclass('public.facilities') as facilities_table;");
  console.log('Table status:', checkPlants.rows[0]);

  if (checkPlants.rows[0].plants_table && !checkPlants.rows[0].facilities_table) {
    console.log('Renaming table plants to facilities...');
    await pg.query('ALTER TABLE plants RENAME TO facilities;');
  } else if (!checkPlants.rows[0].facilities_table) {
    console.log('Creating facilities table...');
    await pg.query(`
      CREATE TABLE IF NOT EXISTS facilities (
        id VARCHAR(36) PRIMARY KEY,
        company_id VARCHAR(36) REFERENCES companies(id),
        organization_id VARCHAR(36),
        code VARCHAR(30) UNIQUE NOT NULL,
        facility_code VARCHAR(30),
        branch_code VARCHAR(30),
        name VARCHAR(150) NOT NULL,
        facility_type VARCHAR(50) DEFAULT 'TWO_WHEELER_WORKSHOP',
        plant_type VARCHAR(50) DEFAULT 'TWO_WHEELER_WORKSHOP',
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        country VARCHAR(100),
        pincode VARCHAR(20),
        gstin VARCHAR(50),
        contact_person VARCHAR(100),
        mobile_number VARCHAR(30),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  // Ensure columns facility_code and facility_type exist in facilities
  await pg.query(`
    ALTER TABLE facilities ADD COLUMN IF NOT EXISTS facility_code VARCHAR(30);
    ALTER TABLE facilities ADD COLUMN IF NOT EXISTS branch_code VARCHAR(30);
    ALTER TABLE facilities ADD COLUMN IF NOT EXISTS facility_type VARCHAR(50) DEFAULT 'TWO_WHEELER_WORKSHOP';
    ALTER TABLE facilities ADD COLUMN IF NOT EXISTS plant_type VARCHAR(50) DEFAULT 'TWO_WHEELER_WORKSHOP';
  `);

  // Synchronize facility_code <-> branch_code, facility_type <-> plant_type
  await pg.query(`
    UPDATE facilities SET facility_code = branch_code WHERE facility_code IS NULL AND branch_code IS NOT NULL;
    UPDATE facilities SET branch_code = facility_code WHERE branch_code IS NULL AND facility_code IS NOT NULL;
    UPDATE facilities SET facility_type = plant_type WHERE facility_type IS NULL AND plant_type IS NOT NULL;
    UPDATE facilities SET plant_type = facility_type WHERE plant_type IS NULL AND facility_type IS NOT NULL;
  `);

  // Create backward compatibility VIEW for plants
  await pg.query('DROP VIEW IF EXISTS plants CASCADE;');
  await pg.query(`
    CREATE OR REPLACE VIEW plants AS 
    SELECT 
      id, company_id, organization_id, code,
      COALESCE(facility_code, branch_code) as branch_code,
      facility_code,
      name,
      COALESCE(facility_type, plant_type) as plant_type,
      facility_type,
      address, city, state, country, pincode, gstin,
      contact_person, mobile_number, is_active, created_at, updated_at
    FROM facilities;
  `);

  // Create INSTEAD OF triggers/rules for plants view
  await pg.query(`
    CREATE OR REPLACE RULE plants_insert AS ON INSERT TO plants DO INSTEAD
      INSERT INTO facilities (
        id, company_id, organization_id, code, facility_code, branch_code, name,
        facility_type, plant_type, address, city, state, country, pincode, gstin,
        contact_person, mobile_number, is_active, created_at, updated_at
      ) VALUES (
        NEW.id, NEW.company_id, NEW.organization_id, NEW.code,
        COALESCE(NEW.facility_code, NEW.branch_code),
        COALESCE(NEW.branch_code, NEW.facility_code),
        NEW.name,
        COALESCE(NEW.facility_type, NEW.plant_type),
        COALESCE(NEW.plant_type, NEW.facility_type),
        NEW.address, NEW.city, NEW.state, NEW.country, NEW.pincode, NEW.gstin,
        NEW.contact_person, NEW.mobile_number, NEW.is_active,
        COALESCE(NEW.created_at, CURRENT_TIMESTAMP),
        COALESCE(NEW.updated_at, CURRENT_TIMESTAMP)
      );

    CREATE OR REPLACE RULE plants_update AS ON UPDATE TO plants DO INSTEAD
      UPDATE facilities SET
        company_id = NEW.company_id,
        organization_id = NEW.organization_id,
        code = NEW.code,
        facility_code = COALESCE(NEW.facility_code, NEW.branch_code),
        branch_code = COALESCE(NEW.branch_code, NEW.facility_code),
        name = NEW.name,
        facility_type = COALESCE(NEW.facility_type, NEW.plant_type),
        plant_type = COALESCE(NEW.plant_type, NEW.facility_type),
        address = NEW.address,
        city = NEW.city,
        state = NEW.state,
        country = NEW.country,
        pincode = NEW.pincode,
        gstin = NEW.gstin,
        contact_person = NEW.contact_person,
        mobile_number = NEW.mobile_number,
        is_active = NEW.is_active,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = OLD.id;

    CREATE OR REPLACE RULE plants_delete AS ON DELETE TO plants DO INSTEAD
      DELETE FROM facilities WHERE id = OLD.id;
  `);

  // Handle user_plants -> user_facilities
  const checkUserPlants = await pg.query("SELECT to_regclass('public.user_plants') as up_table, to_regclass('public.user_facilities') as uf_table;");
  if (checkUserPlants.rows[0].up_table && !checkUserPlants.rows[0].uf_table) {
    console.log('Renaming user_plants to user_facilities...');
    await pg.query('ALTER TABLE user_plants RENAME TO user_facilities;');
    await pg.query('ALTER TABLE user_facilities RENAME COLUMN plant_id TO facility_id;');
  } else if (!checkUserPlants.rows[0].uf_table) {
    console.log('Creating user_facilities table...');
    await pg.query(`
      CREATE TABLE IF NOT EXISTS user_facilities (
        user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        facility_id VARCHAR(36) NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
        is_default BOOLEAN DEFAULT FALSE,
        PRIMARY KEY(user_id, facility_id)
      );
    `);
  }

  // Create backward compatibility view for user_plants
  await pg.query('DROP VIEW IF EXISTS user_plants CASCADE;');
  await pg.query(`
    CREATE OR REPLACE VIEW user_plants AS
    SELECT user_id, facility_id as plant_id, is_default FROM user_facilities;
  `);

  // Add facility_id and assigned_facilities to users
  await pg.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS facility_id VARCHAR(36);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS assigned_facilities JSONB;
    UPDATE users SET facility_id = plant_id WHERE facility_id IS NULL AND plant_id IS NOT NULL;
    UPDATE users SET assigned_facilities = assigned_plants WHERE assigned_facilities IS NULL AND assigned_plants IS NOT NULL;
  `);

  // Add facility_id to departments, warehouses, etc.
  const tablesWithPlantId = [
    'departments', 'warehouses', 'inventory_balances', 'inventory_transactions',
    'goods_receipt_notes', 'purchase_orders', 'purchase_requisitions',
    'production_orders', 'quality_inspections', 'sales_orders',
    'stock_adjustments', 'stock_count_plans', 'user_store_access'
  ];

  for (const t of tablesWithPlantId) {
    const hasTable = await pg.query("SELECT to_regclass($1) as tbl", ['public.' + t]);
    if (hasTable.rows[0].tbl) {
      console.log(`Adding facility_id to ${t}...`);
      await pg.query(`ALTER TABLE ${t} ADD COLUMN IF NOT EXISTS facility_id VARCHAR(36);`);
      await pg.query(`UPDATE ${t} SET facility_id = plant_id WHERE facility_id IS NULL AND plant_id IS NOT NULL;`);
    }
  }

  // Handle stock_transfers
  const hasTransfers = await pg.query("SELECT to_regclass('public.stock_transfers') as tbl;");
  if (hasTransfers.rows[0].tbl) {
    await pg.query(`
      ALTER TABLE stock_transfers ADD COLUMN IF NOT EXISTS source_facility_id VARCHAR(36);
      ALTER TABLE stock_transfers ADD COLUMN IF NOT EXISTS dest_facility_id VARCHAR(36);
      UPDATE stock_transfers SET source_facility_id = source_plant_id WHERE source_facility_id IS NULL;
      UPDATE stock_transfers SET dest_facility_id = dest_plant_id WHERE dest_facility_id IS NULL;
    `);
  }

  console.log('--- Database Migration Finished Successfully ---');
  process.exit(0);
}

migrateDatabase().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
