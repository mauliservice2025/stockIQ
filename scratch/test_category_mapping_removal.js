// scratch/test_category_mapping_removal.js
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
  location: { hash: '#/store-master' },
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

// Seed some old storeItemMappings in localStorage to test migration
localStorageMap.set('APEX_ISCM_DATABASE_V2', JSON.stringify({
  _item_master_and_vehicle_compat_purged_v1: true,
  _sku_catalog_purged_v1: true,
  items: [],
  warehouses: [{ id: 'WH-01', name: 'Main Store', code: 'WH-01' }],
  plants: [{ id: 'PLANT-01', name: 'Pune Plant', code: 'PUN' }],
  storeItemMappings: [{ id: 'SIM-01', store_id: 'WH-01', item_id: 'ITM-01', min_stock: 10 }]
}));

// Load db.js
const dbCode = fs.readFileSync('d:/Projects/ISCM/js/data/db.js', 'utf8');
eval(dbCode);

// Load store-inventory.js
const storeCode = fs.readFileSync('d:/Projects/ISCM/js/modules/store-inventory.js', 'utf8');
eval(storeCode);

// Load user-management.js
const userMgmtCode = fs.readFileSync('d:/Projects/ISCM/js/modules/user-management.js', 'utf8');
eval(userMgmtCode);

// Read index.html
const indexHtml = fs.readFileSync('d:/Projects/ISCM/index.html', 'utf8');

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

console.log('--- TESTING CATEGORY & ITEM MAPPING MASTER REMOVAL ---');

// 1. Sidebar in index.html
assert(!indexHtml.includes('nav-item-store-mapping'), 'nav-item-store-mapping removed from index.html sidebar');
assert(!indexHtml.includes('#/store-mapping'), '#/store-mapping link removed from index.html sidebar');

// 2. Database purge
const mappings = window.DB.getAll('storeItemMappings');
assert(Array.isArray(mappings) && mappings.length === 0, 'Database storeItemMappings collection is empty');

const savedState = JSON.parse(localStorage.getItem('APEX_ISCM_DATABASE_V2'));
assert(savedState._store_item_mappings_purged_v1 === true, 'Migration flag _store_item_mappings_purged_v1 set in database');
assert(savedState.storeItemMappings.length === 0, 'storeItemMappings purged from localStorage');

// 3. StoreInventoryModule tabConfig & methods
const storeMod = window.StoreInventoryModule;
const storeSetupTabs = storeMod.tabConfig.filter(t => t.subModule === 'STORE_SETUP');
assert(!storeMod.tabConfig.some(t => t.key === 'CATEGORY_MAPPING'), 'CATEGORY_MAPPING removed from tabConfig');
assert(storeSetupTabs.map(t => t.key).join(',') === 'STORE_MASTER,LOCATIONS,RACKS,SHELVES,BINS', 'STORE_SETUP tabs are exactly Store Master, Locations, Racks, Shelves, Bins');

assert(typeof storeMod.renderCategoryMappingTab === 'undefined', 'renderCategoryMappingTab is removed');
assert(typeof storeMod.showAddStoreItemMappingModal === 'undefined', 'showAddStoreItemMappingModal is removed');
assert(typeof storeMod.submitStoreItemMapping === 'undefined', 'submitStoreItemMapping is removed');
assert(typeof storeMod.deleteStoreItemMapping === 'undefined', 'deleteStoreItemMapping is removed');

// 4. Hash routing fallback
window.location.hash = '#/store-mapping';
storeMod.render({ innerHTML: '' });
assert(storeMod.activeTab === 'STORE_MASTER', '#/store-mapping safely falls back to STORE_MASTER');

// 5. UserManagement permissions
const userMod = window.UserManagementModule;
const screenPerms = userMod.screenPermissionsRegistry || [];
assert(!screenPerms.some(p => p.code === 'STORE_CATEGORY_MAP'), 'STORE_CATEGORY_MAP removed from screen permissions registry');

console.log(`\nSummary: ${pass} passed, ${fail} failed.`);
if (fail > 0) process.exit(1);
