const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('VERIFYING RELOCATION OF STORAGE MASTERS TO STORE & INVENTORY');
console.log('================================================================');

// 1. Check index.html navigation structure
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

// Check Organization & Facility Setup (#subgroup-org-location)
const orgSubgroupMatch = indexHtml.match(/id="subgroup-org-location"[\s\S]*?<\/div>\s*<\/div>/);
assert(orgSubgroupMatch, 'subgroup-org-location must exist in index.html');
const orgHtml = orgSubgroupMatch[0];

const movedRoutes = ['#/stores', '#/storage-locations', '#/racks', '#/shelves', '#/bins'];
movedRoutes.forEach(r => {
  assert(!orgHtml.includes(`href="${r}"`), `Subgroup Org & Facility Setup must NOT contain ${r}`);
});
console.log('✓ PASS: Organization & Facility Setup no longer contains Store, Storage Location, Rack, Shelf, Bin.');

// Check remaining masters in Organization & Facility Setup
const remainingInOrg = ['#/organizations', '#/branches', '#/financial-calendar', '#/doc-series', '#/holiday-master'];
remainingInOrg.forEach(r => {
  assert(orgHtml.includes(`href="${r}"`), `Subgroup Org & Facility Setup must contain ${r}`);
});
console.log('✓ PASS: Organization & Facility Setup contains Organisation, Facility, Financial Calendar, Doc Series, Holiday Master.');

// Check Store & Inventory Master (#group-store-inventory)
const storeGroupMatch = indexHtml.match(/id="group-store-inventory"[\s\S]*?class="sidebar-logout-footer"/);
assert(storeGroupMatch, 'group-store-inventory must exist in index.html');
const storeHtml = storeGroupMatch[0];

const storageMastersInStore = [
  { route: '#/store-master', title: 'Store Master' },
  { route: '#/storage-locations', title: 'Storage Location Master' },
  { route: '#/racks', title: 'Rack Master' },
  { route: '#/shelves', title: 'Shelf Master' },
  { route: '#/bins', title: 'Bin Master' }
];

storageMastersInStore.forEach(m => {
  assert(storeHtml.includes(`href="${m.route}"`), `group-store-inventory must contain link to ${m.route}`);
  assert(storeHtml.includes(m.title), `group-store-inventory must contain title "${m.title}"`);
});
console.log('✓ PASS: Store & Inventory Master contains Store, Storage Location, Rack, Shelf, Bin masters in navigation.');

// 2. Check app.js route mappings
const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');

// Check route configs point to window.StoreInventoryModule and 'Store Master Setup'
const testRoutes = ['#/stores', '#/storage-locations', '#/racks', '#/shelves', '#/bins'];
testRoutes.forEach(route => {
  const routeRegex = new RegExp(`'${route}'\\s*:\\s*\\{\\s*module:\\s*window\\.StoreInventoryModule[\\s\\S]*?section:\\s*'Store Master Setup'`);
  assert(routeRegex.test(appJs), `app.js route ${route} must map to window.StoreInventoryModule under 'Store Master Setup'`);
});
console.log('✓ PASS: All 5 storage routes map to window.StoreInventoryModule under "Store Master Setup" in app.js.');

// Check RBAC permission route mappings
assert(appJs.includes("'#/storage-locations': 'LOC_MASTER'"), 'app.js maps #/storage-locations to LOC_MASTER');
assert(appJs.includes("'#/racks': 'RACK_MASTER'"), 'app.js maps #/racks to RACK_MASTER');
assert(appJs.includes("'#/shelves': 'SHELF_MASTER'"), 'app.js maps #/shelves to SHELF_MASTER');
assert(appJs.includes("'#/bins': 'BIN_MASTER'"), 'app.js maps #/bins to BIN_MASTER');
console.log('✓ PASS: app.js contains correct RBAC permission mapping for all storage routes.');

// 3. Check org-location.js
const orgJs = fs.readFileSync(path.join(__dirname, '../js/modules/org-location.js'), 'utf8');

// Ensure tabConfig only has 4 entries
assert(orgJs.includes("key: 'ORGANIZATIONS'"), 'org-location has ORGANIZATIONS');
assert(orgJs.includes("key: 'BRANCHES'"), 'org-location has BRANCHES');
assert(orgJs.includes("key: 'FINANCIAL_CALENDAR'"), 'org-location has FINANCIAL_CALENDAR');
assert(orgJs.includes("key: 'DOC_SERIES'"), 'org-location has DOC_SERIES');
assert(!orgJs.includes("key: 'STORES'"), 'org-location does NOT have STORES tabConfig');
assert(!orgJs.includes("key: 'LOCATIONS'"), 'org-location does NOT have LOCATIONS tabConfig');
assert(!orgJs.includes("key: 'RACKS'"), 'org-location does NOT have RACKS tabConfig');
assert(!orgJs.includes("key: 'SHELVES'"), 'org-location does NOT have SHELVES tabConfig');
assert(!orgJs.includes("key: 'BINS'"), 'org-location does NOT have BINS tabConfig');
console.log('✓ PASS: org-location.js tabConfig contains only 4 Organization & Facility Setup masters.');

// 4. Check store-inventory.js
const storeJs = fs.readFileSync(path.join(__dirname, '../js/modules/store-inventory.js'), 'utf8');

assert(storeJs.includes("key: 'STORE_MASTER'"), 'store-inventory has STORE_MASTER');
assert(storeJs.includes("key: 'LOCATIONS'"), 'store-inventory has LOCATIONS');
assert(storeJs.includes("key: 'RACKS'"), 'store-inventory has RACKS');
assert(storeJs.includes("key: 'SHELVES'"), 'store-inventory has SHELVES');
assert(storeJs.includes("key: 'BINS'"), 'store-inventory has BINS');
console.log('✓ PASS: store-inventory.js tabConfig contains all 5 storage hierarchy masters.');

// 5. Test DOM rendering in mock environment
global.window = {
  location: { hash: '#/storage-locations' },
  DB: {
    getAll: (table) => {
      if (table === 'warehouses') return [{ id: 'WH-01', code: 'MAIN-01', name: 'Pune Central Warehouse', plant_id: 'P-01', status: 'Active' }];
      if (table === 'zones') return [{ id: 'Z-01', warehouse_id: 'WH-01', code: 'ZONE-A', name: 'High-Velocity Fast Moving Spares', location_type: 'ZONE', status: 'Active' }];
      if (table === 'racks') return [{ id: 'R-01', warehouse_id: 'WH-01', storage_location_id: 'Z-01', code: 'RACK-01', name: 'Pallet Rack 01', rack_type: 'Selective', status: 'Active' }];
      if (table === 'shelves') return [{ id: 'SH-01', rack_id: 'R-01', code: 'SHELF-01', level_number: 1, status: 'Active' }];
      if (table === 'bins') return [{ id: 'B-01', warehouse_id: 'WH-01', shelf_id: 'SH-01', code: 'BIN-01-A', rack: 'RACK-01', shelf: 'SHELF-01', bin: 'A', status: 'Active' }];
      return [];
    },
    logAudit: () => {}
  },
  State: {
    hasPermission: () => true,
    showToast: () => {},
    showModal: () => {},
    closeModal: () => {}
  }
};
global.document = {
  getElementById: () => null,
  querySelector: () => null
};

// Load org-location.js and store-inventory.js
eval(orgJs);
eval(storeJs);

assert(typeof window.StoreInventoryModule.renderStorageLocationsTab === 'function', 'renderStorageLocationsTab must be a function');
assert(typeof window.StoreInventoryModule.renderRacksTab === 'function', 'renderRacksTab must be a function');
assert(typeof window.StoreInventoryModule.renderShelvesTab === 'function', 'renderShelvesTab must be a function');
assert(typeof window.StoreInventoryModule.renderBinsTab === 'function', 'renderBinsTab must be a function');

// Test renderActiveSubView for each storage tab
window.StoreInventoryModule.activeTab = 'LOCATIONS';
const locHtml = window.StoreInventoryModule.renderActiveSubView();
assert(locHtml.includes('High-Velocity Fast Moving Spares'), 'LOCATIONS view renders zones data');
assert(locHtml.includes('Register Location'), 'LOCATIONS view has Register Location button');

window.StoreInventoryModule.activeTab = 'RACKS';
const rackHtml = window.StoreInventoryModule.renderActiveSubView();
assert(rackHtml.includes('Pallet Rack 01'), 'RACKS view renders racks data');
assert(rackHtml.includes('Register Rack'), 'RACKS view has Register Rack button');

window.StoreInventoryModule.activeTab = 'SHELVES';
const shelfHtml = window.StoreInventoryModule.renderActiveSubView();
assert(shelfHtml.includes('SHELF-01'), 'SHELVES view renders shelves data');
assert(shelfHtml.includes('Register Shelf'), 'SHELVES view has Register Shelf button');

window.StoreInventoryModule.activeTab = 'BINS';
const binHtml = window.StoreInventoryModule.renderActiveSubView();
assert(binHtml.includes('BIN-01-A'), 'BINS view renders bins data');
assert(binHtml.includes('Register Bin'), 'BINS view has Register Bin button');

window.StoreInventoryModule.activeTab = 'STORE_MASTER';
const storeMasterHtml = window.StoreInventoryModule.renderActiveSubView();
assert(storeMasterHtml.includes('Pune Central Warehouse'), 'STORE_MASTER view renders store data');

console.log('✓ PASS: All 5 sub-views render correctly with live data and modal action triggers.');

console.log('\n================================================================');
console.log('🎉 ALL STORAGE MASTER RELOCATION VERIFICATIONS PASSED (100%)!');
console.log('================================================================');
