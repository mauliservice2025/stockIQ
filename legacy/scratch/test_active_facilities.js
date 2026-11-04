const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('Testing Active Facilities Filtering across the system...');

const localStorageMock = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; }
};

global.localStorage = localStorageMock;
global.window = { localStorage: localStorageMock };

const dbJs = fs.readFileSync(path.join(__dirname, '../js/data/db.js'), 'utf8');
eval(dbJs);

const dbInstance = window.DB;
window.State = { currentPlantId: 'PLANT-01' };

// 1. Test isPlantActive logic
dbInstance.data.organizations = [
  { id: 'ORG-01', code: 'MAULI-CORP', name: 'Mauli Corp', status: 'Active', is_active: true },
  { id: 'ORG-02', code: 'INACTIVE-CORP', name: 'Inactive Corp', status: 'Inactive', is_active: false }
];

dbInstance.data.plants = [
  { id: 'PLANT-01', code: 'MSC1', name: 'Mauli Service Center 1', organization_id: 'ORG-01', status: 'Active', is_active: true },
  { id: 'PLANT-02', code: 'MSC2', name: 'Mauli Service Center 2', organization_id: 'ORG-01', status: 'Inactive', is_active: false },
  { id: 'PLANT-03', code: 'MSC3', name: 'Mauli Service Center 3', organization_id: 'ORG-02', status: 'Active', is_active: true }
];

assert.strictEqual(dbInstance.isPlantActive('PLANT-01'), true, 'PLANT-01 should be active');
assert.strictEqual(dbInstance.isPlantActive('PLANT-02'), false, 'PLANT-02 should be inactive due to is_active: false');
assert.strictEqual(dbInstance.isPlantActive('PLANT-03'), false, 'PLANT-03 should be inactive due to inactive parent org ORG-02');

const activePlants = dbInstance.getActivePlants();
assert.strictEqual(activePlants.length, 1, 'Only 1 plant should be active');
assert.strictEqual(activePlants[0].id, 'PLANT-01', 'Active plant must be PLANT-01');
console.log('  -> PASS: DB isPlantActive and getActivePlants strictly filter inactive plants and inactive orgs');

// 2. Test RegistrationConfigModule.getFacilities
const regConfigJs = fs.readFileSync(path.join(__dirname, '../js/modules/registration-config.js'), 'utf8');
eval(regConfigJs);

const regActive = window.RegistrationConfigModule.getFacilities(true);
assert.strictEqual(regActive.length, 1, 'getFacilities(true) must return only active facilities');
assert.strictEqual(regActive[0].id, 'PLANT-01', 'getFacilities(true) must return PLANT-01');
console.log('  -> PASS: RegistrationConfigModule.getFacilities(true) returns only active facilities');

// Test fallback when plants is empty
dbInstance.data.plants = [];
const fallbackActive = window.RegistrationConfigModule.getFacilities(true);
assert.strictEqual(fallbackActive.length, 1, 'Fallback getFacilities(true) must return only active default facilities');
assert.strictEqual(fallbackActive[0].id, 'PLANT-01', 'Fallback active facility must be PLANT-01');
console.log('  -> PASS: RegistrationConfigModule.getFacilities(true) fallback returns only active facility (PLANT-01)');

console.log('\n🎉 ALL ACTIVE FACILITIES FILTERING TESTS PASSED (3/3)!');
