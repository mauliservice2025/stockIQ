// scratch/test_warehouses_facilities_masters_removal.js
const fs = require('fs');

// Mock localStorage and browser environment
const localStorageMap = new Map();
global.localStorage = {
  getItem: (k) => localStorageMap.get(k) || null,
  setItem: (k, v) => localStorageMap.set(k, v),
  removeItem: (k) => localStorageMap.delete(k),
  clear: () => localStorageMap.clear()
};

global.window = {
  location: { hash: '#/masters' },
  State: {
    currentPlantId: 'PLANT-01',
    hasPermission: () => true,
    showModal: () => {},
    closeModal: () => {},
    showToast: () => {}
  }
};
global.document = {
  getElementById: (id) => ({ innerHTML: '', appendChild: () => {}, querySelectorAll: () => [], style: {} }),
  querySelector: () => null,
  querySelectorAll: () => []
};

// Load mock-data.js
const mockDataCode = fs.readFileSync('d:/Projects/ISCM/js/data/mock-data.js', 'utf8');
eval(mockDataCode);

// Load db.js
const dbCode = fs.readFileSync('d:/Projects/ISCM/js/data/db.js', 'utf8');
eval(dbCode);

// Load masters.js
const mastersCode = fs.readFileSync('d:/Projects/ISCM/js/modules/masters.js', 'utf8');
eval(mastersCode);

let pass = 0;
let fail = 0;
function assert(cond, name) {
  if (cond) {
    console.log(`✅ PASS: ${name}`);
    pass++;
  } else {
    console.error(`❌ FAIL: ${name}`);
    fail++;
  }
}

console.log('--- TESTING WAREHOUSE & FACILITY MASTERS REMOVAL FROM MASTERS MODULE ---');

const mod = window.MastersModule;

// 1. Method removals
assert(typeof mod.renderWarehousesMaster === 'undefined', 'renderWarehousesMaster is removed from MastersModule');
assert(typeof mod.renderPlantsMaster === 'undefined', 'renderPlantsMaster is removed from MastersModule');

// 2. Rendered content check
const fakeContainer = { innerHTML: '' };
mod.render(fakeContainer);
const html = fakeContainer.innerHTML;

assert(!html.includes('Warehouses & Bins'), 'Warehouses & Bins tab button removed from navigation');
assert(!html.includes('Facilities & Departments'), 'Facilities & Departments tab button removed from navigation');
assert(!html.includes('Warehouse Stores & Storage Bins'), 'Warehouse Stores & Storage Bins card removed from UI');
assert(!html.includes('Manufacturing Facilities & Operational Cost Centers'), 'Manufacturing Facilities & Operational Cost Centers card removed from UI');
assert(!html.includes('switchMaster(\'WAREHOUSES\')'), 'switchMaster(\'WAREHOUSES\') removed');
assert(!html.includes('switchMaster(\'PLANTS\')'), 'switchMaster(\'PLANTS\') removed');

assert(html.includes('Supplier Master'), 'Supplier Master tab is present');
assert(html.includes('Customer Master'), 'Customer Master tab is present');

// 3. Fallback test
mod.switchMaster('WAREHOUSES');
assert(mod.renderActiveMasterContent().includes('Approved Supplier & Vendor Master (SRM)'), 'switchMaster(WAREHOUSES) safely renders default active view');

mod.switchMaster('PLANTS');
assert(mod.renderActiveMasterContent().includes('Approved Supplier & Vendor Master (SRM)'), 'switchMaster(PLANTS) safely renders default active view');

// 4. Verification that DB records are preserved for dedicated Facility and Store modules
const plants = window.DB.getAll('plants');
assert(Array.isArray(plants) && plants.length > 0, 'Plants / Facilities data preserved in DB for Facility Setup');

const stores = window.DB.getAll('warehouses');
assert(Array.isArray(stores), 'Warehouses / Stores collection accessible in DB for Store Master');

console.log(`\nSummary: ${pass} passed, ${fail} failed.`);
if (fail > 0) process.exit(1);
