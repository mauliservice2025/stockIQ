const pg = require('../database/pg');

async function initHolidayTables() {
  console.log('Connecting to PostgreSQL...');
  try {
    // 1. Create holiday_types table
    await pg.query(`
      CREATE TABLE IF NOT EXISTS holiday_types (
        id VARCHAR(30) PRIMARY KEY,
        code VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        color VARCHAR(20) DEFAULT '#3b82f6',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Created/verified table: holiday_types');

    // 2. Create holidays table
    await pg.query(`
      CREATE TABLE IF NOT EXISTS holidays (
        id VARCHAR(36) PRIMARY KEY,
        organization_id VARCHAR(36) NOT NULL,
        facility_id VARCHAR(36),
        applicable_level VARCHAR(20) NOT NULL DEFAULT 'ORGANIZATION',
        financial_year_id VARCHAR(36) NOT NULL,
        holiday_code VARCHAR(50) NOT NULL,
        holiday_name VARCHAR(150) NOT NULL,
        holiday_date DATE NOT NULL,
        day_name VARCHAR(20),
        holiday_type_id VARCHAR(30) NOT NULL,
        holiday_category VARCHAR(20) NOT NULL DEFAULT 'FULL_DAY',
        half_day_type VARCHAR(20),
        from_time VARCHAR(10),
        to_time VARCHAR(10),
        recurring_yn BOOLEAN DEFAULT FALSE,
        description TEXT,
        active_yn BOOLEAN DEFAULT TRUE,
        created_by VARCHAR(100) DEFAULT 'System Administrator',
        created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        modified_by VARCHAR(100),
        modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_holidays_scope ON holidays (organization_id, COALESCE(facility_id, 'ALL'), financial_year_id, holiday_date);
    `);
    console.log('✓ Created/verified table: holidays');

    // 3. Create holiday_audit table
    await pg.query(`
      CREATE TABLE IF NOT EXISTS holiday_audit (
        id VARCHAR(36) PRIMARY KEY,
        holiday_id VARCHAR(36) NOT NULL,
        action VARCHAR(50) NOT NULL,
        old_value JSONB,
        new_value JSONB,
        user_name VARCHAR(100) DEFAULT 'System Administrator',
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Created/verified table: holiday_audit');

    // Insert Default Holiday Types if not exists
    const types = [
      { id: 'NAT', code: 'NAT', name: 'National Holiday', color: '#3b82f6', description: 'Nationwide gazetted statutory holiday' },
      { id: 'ST', code: 'ST', name: 'State Holiday', color: '#10b981', description: 'State government declared holiday (Maharashtra)' },
      { id: 'FEST', code: 'FEST', name: 'Festival Holiday', color: '#f59e0b', description: 'Religious and cultural festival celebration' },
      { id: 'LOC', code: 'LOC', name: 'Local Holiday', color: '#8b5cf6', description: 'City/district or regional specific holiday' },
      { id: 'COMP', code: 'COMP', name: 'Company Holiday', color: '#06b6d4', description: 'Corporate, foundation, or annual company holiday' },
      { id: 'SPEC', code: 'SPEC', name: 'Special Holiday', color: '#ec4899', description: 'Emergency or special one-time declared holiday' },
      { id: 'OTH', code: 'OTH', name: 'Other', color: '#64748b', description: 'Other unclassified non-working day' }
    ];

    for (const t of types) {
      await pg.query(`
        INSERT INTO holiday_types (id, code, name, description, color, is_active)
        VALUES ($1, $2, $3, $4, $5, TRUE)
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, color = EXCLUDED.color;
      `, [t.id, t.code, t.name, t.description, t.color]);
    }
    console.log('✓ Seeded default holiday types (NAT, ST, FEST, LOC, COMP, SPEC, OTH)');

    console.log('🎉 PostgreSQL Holiday Master tables successfully initialized!');
    process.exit(0);
  } catch (err) {
    console.error('Initialization error:', err);
    process.exit(1);
  }
}

initHolidayTables();
