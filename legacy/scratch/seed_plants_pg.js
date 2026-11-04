const pg = require('../database/pg.js');

async function run() {
  const q = `
    INSERT INTO plants (id, company_id, organization_id, code, branch_code, name, plant_type, address, city, state, country, contact_person, mobile_number, pincode, gstin, is_active, created_at, updated_at)
    VALUES 
      ('PLANT-01', 'COMP-01', 'ORG-001', 'BRANCH-01', 'MSC1', 'Mauli Service Center 1', 'AUTOMOBILE_WORKSHOP', 'Plot No. 12, Sector 3, Pune Main Road', 'Pune', 'Maharashtra', 'India', 'Pravin Patil', '9822012345', '411001', '27AABCT2345M1Z9', true, NOW(), NOW()),
      ('PLANT-02', 'COMP-01', 'ORG-001', 'BRANCH-02', 'MSC2', 'Mauli Service Center 2', 'AUTOMOBILE_WORKSHOP', 'Survey No. 45, Wakad Bypass Highway', 'Pune', 'Maharashtra', 'India', 'Sanket Borole', '8765678765', '411057', '27AABCT2345M2Z8', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      code = EXCLUDED.code,
      branch_code = EXCLUDED.branch_code,
      name = EXCLUDED.name,
      plant_type = EXCLUDED.plant_type,
      address = EXCLUDED.address,
      city = EXCLUDED.city,
      state = EXCLUDED.state,
      pincode = EXCLUDED.pincode,
      gstin = EXCLUDED.gstin,
      contact_person = EXCLUDED.contact_person,
      mobile_number = EXCLUDED.mobile_number,
      is_active = EXCLUDED.is_active,
      updated_at = NOW();
  `;
  await pg.query(q);
  const res = await pg.query('SELECT id, code, branch_code, name, address, city, state, pincode, mobile_number, gstin FROM plants;');
  console.log('Seeded plants in PostgreSQL:', res.rows);
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
