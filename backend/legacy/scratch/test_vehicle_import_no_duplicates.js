const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

console.log('=== TEST: Vehicle Import No Duplicates & Auto-Heal ===\n');

const dbCode = fs.readFileSync('js/data/db.js', 'utf8');
const mockDataCode = fs.readFileSync('js/data/mock-data.js', 'utf8');
const itemSetupCode = fs.readFileSync('js/modules/item-setup-master.js', 'utf8');

const localStorageMock = {
  _storage: {},
  getItem(k) { return this._storage[k] || null; },
  setItem(k, v) { this._storage[k] = String(v); },
  removeItem(k) { delete this._storage[k]; }
};

const context = {
  console,
  setTimeout: fn => fn(),
  localStorage: localStorageMock,
  window: {},
  document: {
    getElementById: id => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => ({ style: {}, setAttribute() {}, appendChild() {} })
  }
};
context.window = context;
context.window.State = {
  showModal: () => {},
  closeModal: () => {},
  showToast: (msg, type) => console.log(`[Toast ${type || 'info'}]: ${msg}`)
};

vm.createContext(context);
vm.runInContext(mockDataCode, context);
vm.runInContext(dbCode, context);
vm.runInContext(itemSetupCode, context);

const DB = context.window.DB;
const ISM = context.window.ItemSetupModule;

async function runTests() {
  // TEST 1: Simulate the exact CSV from the user screenshot
  console.log('--- TEST 1: CSV Parsing & Batch Deduplication ---');
  const sampleCsv = `Model Code,Model Name,Variant,Engine CC,Fuel Type,Year From,Year To,Status
APR-RS457-457,Aprilia RS 457,Standard,457,Petrol,2024,2026,Active
APR-SR125-124,Aprilia SR 125,Standard,125,Petrol,2018,2026,Active
BAJ-CT100-99,Bajaj CT 100,Standard,993,Petrol,2004,2020,Active
BAJ-CT100-99,Bajaj CT 100,Standard,993,Petrol,2004,2020,Active
HERO-SPL-100,Hero Splendor Plus,Self Start,97,Petrol,2005,2026,Active`;

  ISM.processVehicleCsvText(sampleCsv);
  const parsed = ISM._parsedVehicleImportData;
  assert(parsed && parsed.length === 4, `Batch must deduplicate repeat rows. Expected 4, got ${parsed.length}`);
  const ct100InParsed = parsed.filter(p => p.code === 'BAJ-CT100-99');
  assert(ct100InParsed.length === 1, `BAJ-CT100-99 must appear exactly once in parsed records, got: ${ct100InParsed.length}`);
  console.log('✓ TEST 1 PASSED: CSV batch deduplicated repeated rows.');

  // TEST 2: Execute Import - ensure records added exactly ONCE
  console.log('\n--- TEST 2: Execute Import (No Double Insertion) ---');
  DB.data.vehicleModels = []; // start clean
  ISM.executeVehicleImport();

  const vehiclesAfterImport = DB.getAll('vehicleModels');
  assert(vehiclesAfterImport.length === 4, `Expected exactly 4 vehicle models in DB, got: ${vehiclesAfterImport.length}`);
  
  const ct100Matches = vehiclesAfterImport.filter(v => v.code === 'BAJ-CT100-99');
  assert(ct100Matches.length === 1, `Bajaj CT 100 must appear EXACTLY ONCE after import. Found: ${ct100Matches.length}`);
  console.log(`✓ TEST 2 PASSED: Imported 4 models. Bajaj CT 100 count: ${ct100Matches.length} (exactly 1, not duplicate!).`);

  // TEST 3: Re-importing the same CSV with upsert should NOT duplicate records
  console.log('\n--- TEST 3: Re-import with Upsert (Idempotency) ---');
  ISM.processVehicleCsvText(sampleCsv);
  ISM.executeVehicleImport();

  const vehiclesAfterReimport = DB.getAll('vehicleModels');
  assert(vehiclesAfterReimport.length === 4, `Re-importing must not increase record count. Expected 4, got: ${vehiclesAfterReimport.length}`);
  const ct100Reimport = vehiclesAfterReimport.filter(v => v.code === 'BAJ-CT100-99');
  assert(ct100Reimport.length === 1, `Bajaj CT 100 count after re-import: ${ct100Reimport.length}`);
  console.log(`✓ TEST 3 PASSED: Idempotent re-import verified. Total models: ${vehiclesAfterReimport.length}.`);

  // TEST 4: Auto-heal existing duplicate records in localStorage
  console.log('\n--- TEST 4: Auto-Heal Existing Duplicate Records ---');
  // Inject the exact duplicate scenario seen in user screenshot: 2 of Bajaj CT 100
  DB.data.vehicleModels.push({
    id: 'MOD-DUP-999',
    code: 'BAJ-CT100-99',
    name: 'Bajaj CT 100',
    variant: 'Standard',
    displacement_cc: 993,
    fuel_type: 'Petrol',
    year_from: 2004,
    year_to: 2020,
    status: 'Active'
  });
  assert(DB.data.vehicleModels.filter(v => v.code === 'BAJ-CT100-99').length === 2, 'Injected duplicate for testing');

  // Trigger renderVehicleCompatibilityTab which runs auto-heal
  ISM.renderVehicleCompatibilityTab();

  const vehiclesAfterAutoHeal = DB.getAll('vehicleModels');
  const ct100AfterAutoHeal = vehiclesAfterAutoHeal.filter(v => v.code === 'BAJ-CT100-99');
  assert(ct100AfterAutoHeal.length === 1, `Auto-heal must remove duplicate! Found: ${ct100AfterAutoHeal.length}`);
  console.log(`✓ TEST 4 PASSED: Auto-heal on tab render eliminated duplicate. Bajaj CT 100 is now single entry.`);

  // TEST 5: DatabaseLayer loadData auto-heal on application startup
  console.log('\n--- TEST 5: DatabaseLayer.loadData Auto-Heal on Startup ---');
  // Store data with duplicates in localStorage
  const dirtyData = {
    _item_master_and_vehicle_compat_purged_v1: true,
    vehicleModels: [
      { id: 'BAJ-CT100-99', code: 'BAJ-CT100-99', name: 'Bajaj CT 100' },
      { id: 'BAJ-CT100-99-DUP', code: 'BAJ-CT100-99', name: 'Bajaj CT 100' },
      { id: 'APR-RS457-457', code: 'APR-RS457-457', name: 'Aprilia RS 457' }
    ]
  };
  localStorageMock.setItem(DB.storageKey, JSON.stringify(dirtyData));

  // Re-run loadData
  const loaded = DB.loadData();
  const ct100InLoaded = loaded.vehicleModels.filter(v => v.code === 'BAJ-CT100-99');
  assert(ct100InLoaded.length === 1, `loadData must auto-heal duplicates on startup. Found: ${ct100InLoaded.length}`);
  assert(loaded.vehicleModels.length === 2, `Total models must be 2, got: ${loaded.vehicleModels.length}`);
  console.log(`✓ TEST 5 PASSED: DatabaseLayer.loadData automatically deduplicated storage on startup.`);

  console.log('\n🎉 ALL VEHICLE IMPORT DEDUPLICATION TESTS PASSED SUCCESSFULLY! 🎉');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
