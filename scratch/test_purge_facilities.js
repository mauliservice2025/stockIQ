const fs = require('fs');
const path = require('path');
const vm = require('vm');

async function runTests() {
  console.log('=== TEST SUITE: PURGE CHENNAI & WAKAD FACILITIES ===\n');

  // Test 1: PostgreSQL check
  const { query } = require('../database/pg');
  const pgPlants = await query('SELECT id, code, name FROM plants;');
  console.log('1. Checking PostgreSQL plants table:');
  console.log('   Plants count in PG:', pgPlants.rows.length);
  console.log('   Plants:', pgPlants.rows);
  const foundInPg = pgPlants.rows.filter(p => 
    p.id === 'PLANT-02' || p.id === 'PLANT-03' || 
    p.code === 'BRANCH-CHE-02' || p.code === 'BRANCH-WAKAD-01' ||
    (p.name && (p.name.includes('Chennai Sriperumbudur') || p.name.includes('Apex Two-Wheeler Wakad')))
  );
  if (foundInPg.length > 0) {
    throw new Error(`FAIL: Target facilities still exist in PG: ${JSON.stringify(foundInPg)}`);
  }
  console.log('   [PASS] Target facilities completely absent from PostgreSQL.\n');

  // Test 2: database/seed.sql check
  const seedSql = fs.readFileSync(path.join(__dirname, '../database/seed.sql'), 'utf8');
  console.log('2. Checking database/seed.sql:');
  const seedMatches = [
    'PLANT-02', 'PLANT-03', 'BRANCH-CHE-02', 'BRANCH-WAKAD-01',
    'Chennai Sriperumbudur', 'Apex Two-Wheeler Wakad'
  ].filter(t => seedSql.includes(t));
  if (seedMatches.length > 0) {
    throw new Error(`FAIL: Target strings found in seed.sql: ${seedMatches.join(', ')}`);
  }
  console.log('   [PASS] Target facilities completely absent from seed.sql.\n');

  // Test 3: js/data/mock-data.js check
  const { INITIAL_DATA } = require('../js/data/mock-data');
  console.log('3. Checking js/data/mock-data.js:');
  const plantMatches = (INITIAL_DATA.plants || []).filter(p =>
    p.id === 'PLANT-02' || p.id === 'PLANT-03' ||
    p.code === 'BRANCH-CHE-02' || p.code === 'BRANCH-WAKAD-01' ||
    (p.name && (p.name.includes('Chennai Sriperumbudur') || p.name.includes('Apex Two-Wheeler Wakad')))
  );
  if (plantMatches.length > 0) {
    throw new Error(`FAIL: Target facilities found in INITIAL_DATA.plants: ${JSON.stringify(plantMatches)}`);
  }
  console.log('   Remaining plants in INITIAL_DATA.plants:', INITIAL_DATA.plants.map(p => ({ id: p.id, name: p.name })));
  console.log('   [PASS] Target facilities completely absent from mock-data.js.\n');

  // Test 4: Verify localStorage purge in DatabaseLayer
  console.log('4. Checking DatabaseLayer automatic purge of cached data:');
  const mockLocalStorage = {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; }
  };
  // Simulate cached dirty data containing PLANT-02 and PLANT-03
  mockLocalStorage.setItem('APEX_ISCM_DATABASE_V2', JSON.stringify({
    plants: [
      { id: 'PLANT-01', name: 'Mauli Service Center 1' },
      { id: 'PLANT-02', code: 'BRANCH-CHE-02', name: 'Chennai Sriperumbudur Commercial Branch' },
      { id: 'PLANT-03', code: 'BRANCH-WAKAD-01', name: 'Apex Two-Wheeler Wakad Quick-Service Branch' }
    ],
    users: [
      { id: 'USR-107', assigned_plants: ['ALL', 'PLANT-01', 'PLANT-02'], plant_id: 'PLANT-02' }
    ],
    document_number_series: [
      { id: 'DNS-1', branch_id: 'PLANT-01' },
      { id: 'DNS-2', branch_id: 'PLANT-02' }
    ],
    holidays: [
      { id: 'HOL-1', facility_id: 'PLANT-01' },
      { id: 'HOL-2', facility_id: 'PLANT-02' }
    ]
  }));

  const dbCode = fs.readFileSync(path.join(__dirname, '../js/data/db.js'), 'utf8');
  const sandbox = {
    console,
    localStorage: mockLocalStorage,
    INITIAL_DATA,
    setTimeout: () => {},
    window: {}
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(dbCode + '\nthis.dbInstance = new DatabaseLayer();', sandbox);

  const cleanedData = sandbox.dbInstance.data;
  const remainingCachedPlants = cleanedData.plants.map(p => p.id);
  console.log('   Plants in DB after loadData purge:', remainingCachedPlants);
  if (remainingCachedPlants.includes('PLANT-02') || remainingCachedPlants.includes('PLANT-03')) {
    throw new Error('FAIL: DatabaseLayer did not purge PLANT-02 / PLANT-03 from plants');
  }
  const user107 = cleanedData.users.find(u => u.id === 'USR-107');
  if (user107.assigned_plants.includes('PLANT-02')) {
    throw new Error('FAIL: USR-107 still has PLANT-02 in assigned_plants');
  }
  if (user107.plant_id === 'PLANT-02') {
    throw new Error('FAIL: USR-107 still has PLANT-02 as plant_id');
  }
  if (cleanedData.document_number_series.some(s => s.branch_id === 'PLANT-02')) {
    throw new Error('FAIL: document_number_series still has PLANT-02');
  }
  if (cleanedData.holidays.some(h => h.facility_id === 'PLANT-02')) {
    throw new Error('FAIL: holidays still has PLANT-02');
  }
  console.log('   [PASS] DatabaseLayer successfully purged target facilities from all collections.\n');

  console.log('================================================================');
  console.log('🎉 ALL TESTS PASSED: CHENNAI & WAKAD FACILITIES SUCCESSFULLY PURGED!');
  console.log('================================================================');
  process.exit(0);
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
