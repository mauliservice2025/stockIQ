const { Client } = require('pg');
const client = new Client('postgresql://postgres:postgres@localhost:5432/stockiq');

const seedPlants = [
  {
    id: 'PLANT-01',
    company_id: 'COMP-01',
    organization_id: 'ORG-001',
    code: 'BRANCH-PUN-01',
    branch_code: 'PUN',
    name: 'Pune Chakan Main Workshop & High-Precision Unit',
    plant_type: 'AUTOMOBILE_WORKSHOP',
    address: 'Plot 42, Chakan Industrial Area Phase II',
    city: 'Pune',
    state: 'Maharashtra',
    country: 'India',
    contact_person: 'Pravin Patil',
    mobile_number: '9822012345',
    is_active: true
  },
  {
    id: 'PLANT-02',
    company_id: 'COMP-01',
    organization_id: 'ORG-001',
    code: 'BRANCH-CHE-02',
    branch_code: 'CHE',
    name: 'Chennai Sriperumbudur Commercial Branch',
    plant_type: 'AUTOMOBILE_WORKSHOP',
    address: 'Survey 108, Sriperumbudur Industrial Corridor',
    city: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    contact_person: 'R. Sundaram',
    mobile_number: '9840198765',
    is_active: true
  },
  {
    id: 'PLANT-03',
    company_id: 'COMP-01',
    organization_id: 'ORG-002',
    code: 'BRANCH-WAKAD-01',
    branch_code: 'PUN',
    name: 'Apex Two-Wheeler Wakad Quick-Service Branch',
    plant_type: 'TWO_WHEELER_WORKSHOP',
    address: 'Shop 12-15, Wakad Auto Market',
    city: 'Pimpri-Chinchwad',
    state: 'Maharashtra',
    country: 'India',
    contact_person: 'Sagar Sable',
    mobile_number: '9876543210',
    is_active: true
  },
  {
    id: 'PLANT-04',
    company_id: 'COMP-01',
    organization_id: 'ORG-001',
    code: 'BRANCH-MUM-01',
    branch_code: 'MUM',
    name: 'Mumbai Central Service & Two-Wheeler Hub',
    plant_type: 'TWO_WHEELER_WORKSHOP',
    address: 'Unit 4, Andheri Industrial Auto Zone',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    contact_person: 'Vikram Joshi',
    mobile_number: '9820011223',
    is_active: true
  },
  {
    id: 'PLANT-05',
    company_id: 'COMP-01',
    organization_id: 'ORG-001',
    code: 'BRANCH-NAG-01',
    branch_code: 'NAG',
    name: 'Nagpur MIDC Automotive Workshop',
    plant_type: 'TWO_WHEELER_WORKSHOP',
    address: 'Plot 18, MIDC Hingna Road',
    city: 'Nagpur',
    state: 'Maharashtra',
    country: 'India',
    contact_person: 'Amit Deshmukh',
    mobile_number: '9890123456',
    is_active: true
  }
];

async function run() {
  await client.connect();
  console.log('Connected to PostgreSQL.');

  // Add missing columns if not exist
  await client.query(`
    ALTER TABLE plants ADD COLUMN IF NOT EXISTS organization_id VARCHAR(50);
    ALTER TABLE plants ADD COLUMN IF NOT EXISTS branch_code VARCHAR(20);
    ALTER TABLE plants ADD COLUMN IF NOT EXISTS contact_person VARCHAR(100);
    ALTER TABLE plants ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(20);
  `);
  console.log('Columns ensured on plants table.');

  for (const p of seedPlants) {
    await client.query(`
      INSERT INTO plants (id, company_id, organization_id, code, branch_code, name, plant_type, address, city, state, country, contact_person, mobile_number, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        organization_id = EXCLUDED.organization_id,
        code = EXCLUDED.code,
        branch_code = EXCLUDED.branch_code,
        name = EXCLUDED.name,
        plant_type = EXCLUDED.plant_type,
        address = EXCLUDED.address,
        city = EXCLUDED.city,
        state = EXCLUDED.state,
        country = EXCLUDED.country,
        contact_person = EXCLUDED.contact_person,
        mobile_number = EXCLUDED.mobile_number,
        is_active = EXCLUDED.is_active,
        updated_at = NOW();
    `, [
      p.id, p.company_id, p.organization_id, p.code, p.branch_code, p.name,
      p.plant_type, p.address, p.city, p.state, p.country,
      p.contact_person, p.mobile_number, p.is_active
    ]);
  }

  const res = await client.query('SELECT id, code, branch_code, name, is_active FROM plants ORDER BY id;');
  console.log('Current Plants in PG:');
  console.table(res.rows);

  await client.end();
}

run().catch(console.error);
