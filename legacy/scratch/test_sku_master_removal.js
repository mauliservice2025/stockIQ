// scratch/test_sku_master_removal.js
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
    hasPermission: () => true,
    showModal: () => {},
    closeModal: () => {},
    showToast: () => {}
  }
};
global.document = {
  getElementById: (id) => ({ innerHTML: '', appendChild: () => {} })
};

// Seed some old items in localStorage to test migration
localStorageMap.set('APEX_ISCM_DATABASE_V2', JSON.stringify({
  _item_master_and_vehicle_compat_purged_v1: true,
  items: [{ id: 'OLD-SKU-01', code: 'SKU-001', name: 'Old SKU Item' }],
  suppliers: [{ id: 'SUP-01', code: 'BHARAT', name: 'Bharat Forge', category: 'Forgings', contact: 'Mr. P', email: 'p@b.com', city: 'Pune', payment_terms: 30, rating: 4.8 }],
  customers: [],
  warehouses: [],
  plants: []
}));

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

console.log('--- TESTING MATERIAL & PRODUCT MASTER (SKU CATALOG) REMOVAL ---');

// 1. Database check
const items = window.DB.getAll('items');
assert(Array.isArray(items) && items.length === 0, 'Database items collection is empty');

// Check parsed localStorage saved state
const savedState = JSON.parse(localStorage.getItem('APEX_ISCM_DATABASE_V2'));
assert(savedState._sku_catalog_purged_v1 === true, 'Migration flag _sku_catalog_purged_v1 set in database');
assert(savedState.items.length === 0, 'Items purged from localStorage');

// 2. MastersModule checks
const mod = window.MastersModule;
assert(mod.activeMaster === 'SUPPLIERS', 'Default activeMaster is SUPPLIERS');
assert(typeof mod.renderItemsMaster === 'undefined', 'renderItemsMaster removed');
assert(typeof mod.showAddItemModal === 'undefined', 'showAddItemModal removed');
assert(typeof mod.submitNewItem === 'undefined', 'submitNewItem removed');

// 3. Render HTML check
const fakeContainer = { innerHTML: '' };
mod.render(fakeContainer);
const html = fakeContainer.innerHTML;

assert(!html.includes('Item & SKU Master'), 'Item & SKU Master tab button removed from navigation header');
assert(!html.includes('Material & Product Master (SKU Catalog)'), 'Material & Product Master (SKU Catalog) card removed from UI');
assert(!html.includes('Register New SKU'), 'Register New SKU button removed');
assert(!html.includes('switchMaster(\'ITEMS\')'), 'switchMaster(\'ITEMS\') removed');

assert(html.includes('Supplier Master'), 'Supplier Master tab is present');
assert(html.includes('Customer Master'), 'Customer Master tab is present');
assert(!html.includes('Warehouses & Bins'), 'Warehouses & Bins tab is removed');
assert(!html.includes('Facilities & Departments'), 'Facilities & Departments tab is removed');
assert(html.includes('Approved Supplier & Vendor Master (SRM)'), 'Approved Supplier & Vendor Master (SRM) renders as default active view');

console.log(`\nSummary: ${pass} passed, ${fail} failed.`);
if (fail > 0) process.exit(1);
