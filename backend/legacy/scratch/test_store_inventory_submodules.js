const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('VERIFYING STORE & INVENTORY MASTER SUB-MODULES:');
console.log('1. Store Setup  2. Item Setup');
console.log('================================================================');

// 1. Read index.html
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

// Match Store & Inventory Master group
const storeGroupMatch = indexHtml.match(/id="group-store-inventory"[\s\S]*?class="sidebar-logout-footer"/);
assert(storeGroupMatch, 'group-store-inventory must exist in index.html');
const storeHtml = storeGroupMatch[0];

// Verify Sub-Module 1: Store Setup
assert(storeHtml.includes('id="subgroup-store-setup"'), 'subgroup-store-setup must exist');
const storeSetupMatch = storeHtml.match(/id="subgroup-store-setup"[\s\S]*?<\/div>\s*<\/div>/);
assert(storeSetupMatch, 'subgroup-store-setup block must be well-formed');
const storeSetupHtml = storeSetupMatch[0];

assert(storeHtml.includes('Store Master Setup'), 'Module title must be "Store Master Setup"');

const expectedStoreSetupRoutes = [
  { route: '#/store-master', title: 'Store Master' },
  { route: '#/store-mapping', title: 'Category & Item Mapping' },
  { route: '#/storage-locations', title: 'Storage Location Master' },
  { route: '#/racks', title: 'Rack Master' },
  { route: '#/shelves', title: 'Shelf Master' },
  { route: '#/bins', title: 'Bin Master' }
];

expectedStoreSetupRoutes.forEach(item => {
  assert(storeHtml.includes(`href="${item.route}"`), `Store Setup must contain route ${item.route}`);
  assert(storeHtml.includes(item.title), `Store Setup must contain title "${item.title}"`);
});
console.log('✓ PASS: Store Master Setup module contains Store Master, Category & Item Mapping, and all physical storage hierarchy masters.');
// Verify Sub-Module 2: Item Setup (now relocated to group-item-master-setup)
const itemSetupMatch = indexHtml.match(/id="group-item-master-setup"[\s\S]*?id="group-store-inventory"/);
assert(itemSetupMatch, 'group-item-master-setup block must be well-formed');
const itemSetupHtml = itemSetupMatch[0];

assert(itemSetupHtml.includes('<span class="module-header-title">Item Master Setup</span>'), 'Module title must be "Item Master Setup"');

const expectedItemSetupRoutes = [
  { route: '#/item-master', title: 'Item Master' },
  { route: '#/vehicle-compatibility', title: 'Vehicle Compatibility' },
  { route: '#/stock-transfers', title: 'Stock Transfers' },
  { route: '#/stock-counts', title: 'Physical Count & Adjust' },
  { route: '#/warranty-scrap', title: 'Warranty & Scrap Stores' },
  { route: '#/inventory-rules', title: 'Inventory Rules & Access' },
  { route: '#/stock-ledger', title: 'Stock Ledger & Valuation' }
];

expectedItemSetupRoutes.forEach(item => {
  assert(itemSetupHtml.includes(`href="${item.route}"`), `Item Setup must contain route ${item.route}`);
  assert(itemSetupHtml.includes(item.title), `Item Setup must contain title "${item.title}"`);
});
console.log('✓ PASS: Item Master Setup module contains Item Master and all remaining inventory workflows.');

// Check for zero emojis in titles
const emojiPattern = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
[...storeSetupHtml.matchAll(/<span class="sub-nav-title">([\s\S]*?)<\/span>/g)].forEach(m => {
  assert(!emojiPattern.test(m[1]), `Emoji found in Store Setup sub-nav: ${m[1]}`);
});
[...itemSetupHtml.matchAll(/<span class="sub-nav-title">([\s\S]*?)<\/span>/g)].forEach(m => {
  assert(!emojiPattern.test(m[1]), `Emoji found in Item Setup sub-nav: ${m[1]}`);
});
console.log('✓ PASS: Zero emojis in Store Setup & Item Setup navigation.');

// 2. Read js/app.js routes
const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');

expectedStoreSetupRoutes.forEach(item => {
  const routeRegex = new RegExp(`'${item.route}'\\s*:\\s*\\{[\\s\\S]*?section:\\s*'Store Master Setup'`);
  assert(routeRegex.test(appJs), `app.js route ${item.route} must have section: 'Store Master Setup'`);
});
console.log('✓ PASS: app.js Store Setup routes mapped to section: "Store Master Setup".');

expectedItemSetupRoutes.forEach(item => {
  const routeRegex = new RegExp(`'${item.route}'\\s*:\\s*\\{[\\s\\S]*?section:\\s*'Item Master Setup'`);
  assert(routeRegex.test(appJs), `app.js route ${item.route} must have section: 'Item Master Setup'`);
});
console.log('✓ PASS: app.js Item Setup routes mapped to section: "Item Master Setup".');

// 3. Check js/modules/store-inventory.js tabConfig and methods
const storeJs = fs.readFileSync(path.join(__dirname, '../js/modules/store-inventory.js'), 'utf8');
assert(storeJs.includes("subModule: 'STORE_SETUP'"), 'tabConfig must have subModule: STORE_SETUP');
assert(storeJs.includes("subModule: 'ITEM_SETUP'"), 'tabConfig must have subModule: ITEM_SETUP');
assert(storeJs.includes("switchSubModule(subModuleKey)"), 'StoreInventoryModule must have switchSubModule method');

// 4. Test DOM simulation
const vm = require('vm');
const sandbox = {
  window: {},
  document: {
    getElementById: (id) => {
      if (id === 'view-container') return { innerHTML: '' };
      return null;
    },
    querySelector: () => null,
    querySelectorAll: () => []
  },
  console: console
};
sandbox.window = sandbox;
sandbox.window.DB = {
  getAll: (table) => {
    if (table === 'warehouses') return [{ id: 'WH-01', code: 'MAIN-01', name: 'Pune Central Warehouse', plant_id: 'P-01', status: 'Active' }];
    if (table === 'plants') return [{ id: 'P-01', name: 'Mauli Service Center 1', status: 'Active' }];
    if (table === 'zones') return [{ id: 'Z-01', warehouse_id: 'WH-01', code: 'ZONE-A', name: 'Fast Moving', location_type: 'ZONE', status: 'Active' }];
    if (table === 'racks') return [{ id: 'R-01', warehouse_id: 'WH-01', storage_location_id: 'Z-01', code: 'RACK-01', name: 'Rack 1', rack_type: 'Selective', status: 'Active' }];
    if (table === 'shelves') return [{ id: 'SH-01', rack_id: 'R-01', code: 'SHELF-01', level_number: 1, status: 'Active' }];
    if (table === 'bins') return [{ id: 'BIN-01', shelf_id: 'SH-01', code: 'BIN-A1', status: 'Active' }];
    if (table === 'itemCategories') return [];
    if (table === 'items') return [];
    if (table === 'inventoryBalances') return [];
    if (table === 'jobCards') return [];
    return [];
  }
};
sandbox.window.State = {
  hasPermission: () => true,
  showToast: () => {}
};

vm.createContext(sandbox);
vm.runInContext(storeJs, sandbox);

const storeMod = sandbox.window.StoreInventoryModule;
assert(storeMod, 'StoreInventoryModule must be initialized');

// Test switching to Store Setup
storeMod.activeTab = 'STORE_MASTER';
const container1 = { innerHTML: '' };
storeMod.render(container1);
assert(container1.innerHTML.includes('Store Setup'), 'Render must include Store Setup pill');
assert(container1.innerHTML.includes('Item Setup'), 'Render must include Item Setup pill');
assert(container1.innerHTML.includes('Storage Location Master'), 'Store Setup must show Storage Location Master tab');
assert(container1.innerHTML.includes('Category & Item Mapping'), 'Store Setup must show Category & Item Mapping tab');
console.log('✓ PASS: Store Setup view correctly displays Store Setup tabs including Category & Item Mapping.');

// Test switching to Item Setup
storeMod.activeTab = 'ITEM_MASTER';
const container2 = { innerHTML: '' };
storeMod.render(container2);
assert(!container2.innerHTML.includes('Storage Location Master'), 'Item Setup must NOT show Storage Location Master tab in active tab list');
assert(!container2.innerHTML.includes('Category & Item Mapping'), 'Item Setup must NOT show Category & Item Mapping tab in active tab list');
console.log('✓ PASS: Item Setup view correctly displays only Item Setup tabs.');

console.log('\n================================================================');
console.log('🎉 ALL STORE & ITEM SETUP SUB-MODULE CHECKS PASSED (100%)!');
console.log('================================================================');
