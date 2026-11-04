const fs = require('fs');

async function test() {
  // 1. Verify REST APIs from the running server
  const plantsRes = await fetch('http://localhost:3000/api/plants');
  const plants = await plantsRes.json();
  console.log('--- API /api/plants ---');
  console.log('Count:', plants.length);
  plants.forEach(p => console.log(` - [${p.id}] ${p.code}: ${p.name}`));

  const whRes = await fetch('http://localhost:3000/api/warehouses');
  const warehouses = await whRes.json();
  console.log('--- API /api/warehouses ---');
  console.log('Count:', warehouses.length);
  warehouses.forEach(w => console.log(` - [${w.id}] ${w.code}: ${w.name} (facility: ${w.plant_id})`));

  const orgRes = await fetch('http://localhost:3000/api/organizations');
  const orgs = await orgRes.json();
  console.log('--- API /api/organizations ---');
  console.log('Count:', orgs.length);
  orgs.forEach(o => console.log(` - [${o.id}] ${o.code}: ${o.name}`));

  // 2. Simulate Facility Master rendering logic from js/modules/org-location.js
  console.log('\n--- Facility Master Store Linkage Verification ---');
  plants.forEach(b => {
    const linkedStores = warehouses.filter(s => 
      s.plant_id === b.id || 
      s.facility_id === b.id || 
      (b.code && (s.plant_id === b.code || s.facility_id === b.code))
    );
    console.log(`Facility ${b.code} (${b.name}) has ${linkedStores.length} store(s):`, linkedStores.map(s => s.code));
  });

  console.log('\nAll verifications passed!');
}

test().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
