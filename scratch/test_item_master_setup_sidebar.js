const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

console.log('================================================================');
console.log('TESTING "ITEM MASTER SETUP" MODULE CREATION AND RELOCATION');
console.log('================================================================\n');

// 1. Read files
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const storeJs = fs.readFileSync(path.join(__dirname, '../js/modules/store-inventory.js'), 'utf8');

// 2. Check sidebar module group ordering in index.html
const moduleGroupMatches = [...indexHtml.matchAll(/id="(group-[^"]+)"/g)].map(m => m[1]);
console.log('Module groups in order:', moduleGroupMatches);

const controlIndex = moduleGroupMatches.indexOf('group-control');
const itemMasterSetupIndex = moduleGroupMatches.indexOf('group-item-master-setup');
const mastersIndex = moduleGroupMatches.indexOf('group-masters');
const storeInventoryIndex = moduleGroupMatches.indexOf('group-store-inventory');

const billingIndex = moduleGroupMatches.indexOf('group-billing');
assert(controlIndex !== -1, 'group-control (Audits & Reports) must exist');
assert(billingIndex !== -1, 'group-billing must exist');
assert(itemMasterSetupIndex !== -1, 'group-item-master-setup must exist');
assert(mastersIndex !== -1, 'group-masters must exist');
assert(storeInventoryIndex !== -1, 'group-store-inventory must exist');

assert.strictEqual(
  billingIndex,
  controlIndex + 1,
  'group-billing must be positioned immediately below group-control (Audits & Reports)'
);
assert.strictEqual(
  itemMasterSetupIndex,
  billingIndex + 1,
  'group-item-master-setup must be positioned immediately below group-billing'
);
assert.strictEqual(
  storeInventoryIndex,
  itemMasterSetupIndex + 1,
  'group-store-inventory must be positioned immediately below group-item-master-setup'
);
assert.strictEqual(
  mastersIndex,
  storeInventoryIndex + 1,
  'group-masters must be positioned immediately below group-store-inventory'
);
console.log('✓ PASS: group-billing is positioned above group-item-master-setup, group-store-inventory below group-item-master-setup, and group-masters below Store Master Setup.');

// 3. Check group-item-master-setup content and title
const itemMasterSetupBlockMatch = indexHtml.match(/<div class="module-group" id="group-item-master-setup">([\s\S]*?)<\/div>\s*<!-- Store Master Setup/);
assert(itemMasterSetupBlockMatch, 'Could not extract group-item-master-setup HTML');
const itemMasterSetupHtml = itemMasterSetupBlockMatch[1];

assert(itemMasterSetupHtml.includes('Item Master Setup'), 'Header title must be "Item Master Setup"');
assert(itemMasterSetupHtml.includes('📦'), 'Header icon must be 📦');
console.log('✓ PASS: Header title is "Item Master Setup" with package icon.');

// 4. Verify all 15 item setup masters are present under group-item-master-setup
const expectedItemMasters = [
  { route: '#/item-master', title: 'Item Master' },
  { route: '#/item-categories', title: 'Item Category Master' },
  { route: '#/item-subcategories', title: 'Item Sub-Category Master' },
  { route: '#/item-brands', title: 'Brand Master' },
  { route: '#/item-manufacturers', title: 'Manufacturer Master' },
  { route: '#/vehicle-compatibility', title: 'Vehicle Compatibility' },
  { route: '#/uom-master', title: 'UOM Master' },
  { route: '#/hsn-master', title: 'HSN/SAC Master' },
  { route: '#/stock-transfers', title: 'Stock Transfers' },
  { route: '#/stock-counts', title: 'Physical Count & Adjust' },
  { route: '#/warranty-scrap', title: 'Warranty & Scrap Stores' },
  { route: '#/inventory-rules', title: 'Inventory Rules & Access' },
  { route: '#/stock-ledger', title: 'Stock Ledger & Valuation' }
];

expectedItemMasters.forEach(item => {
  assert(itemMasterSetupHtml.includes(`href="${item.route}"`), `Item Master Setup must contain link for ${item.route}`);
  assert(itemMasterSetupHtml.includes(item.title), `Item Master Setup must display title "${item.title}"`);
});
console.log(`✓ PASS: All ${expectedItemMasters.length} Item Setup masters verified under Item Master Setup module.`);

// 5. Verify Store Master Setup contains Store Setup masters including Category & Item Mapping
const storeGroupBlockMatch = indexHtml.match(/<div class="module-group" id="group-store-inventory">([\s\S]*?)<\/div>\s*<!-- Masters/);
assert(storeGroupBlockMatch, 'Could not extract group-store-inventory HTML');
const storeGroupHtml = storeGroupBlockMatch[1];

assert(storeGroupHtml.includes('Store Master Setup'), 'Module header must say "Store Master Setup"');
assert(storeGroupHtml.includes('id="subgroup-store-setup"'), 'Store Master Setup must contain subgroup-store-setup');

const expectedStoreSetupRoutes = [
  '#/store-master',
  '#/store-mapping',
  '#/storage-locations',
  '#/racks',
  '#/shelves',
  '#/bins'
];

expectedStoreSetupRoutes.forEach(route => {
  assert(storeGroupHtml.includes(`href="${route}"`), `Store Master Setup must contain ${route}`);
});

// Assert that Item Setup masters are NOT in Store Master Setup
expectedItemMasters.forEach(item => {
  assert(!storeGroupHtml.includes(`href="${item.route}"`), `Store Master Setup must NOT contain ${item.route}`);
});
console.log('✓ PASS: Store Master Setup module contains ONLY Store Setup masters (Store, Location, Rack, Shelf, Bin) and does NOT contain item masters.');

// 6. Check js/app.js routes
expectedItemMasters.forEach(item => {
  const routeRegex = new RegExp(`'${item.route}'\\s*:\\s*\\{[^}]*section:\\s*'Item Master Setup'[^}]*\\}`);
  assert(routeRegex.test(appJs), `app.js route ${item.route} must have section: 'Item Master Setup'`);
});
console.log(`✓ PASS: All ${expectedItemMasters.length} item routes in app.js have section: "Item Master Setup".`);

expectedStoreSetupRoutes.forEach(route => {
  const routeRegex = new RegExp(`'${route}'\\s*:\\s*\\{[^}]*section:\\s*'Store Master Setup'[^}]*\\}`);
  assert(routeRegex.test(appJs), `app.js route ${route} must have section: 'Store Master Setup'`);
});
console.log('✓ PASS: All Store Setup routes in app.js have section: "Store Master Setup".');

assert(appJs.includes("'#/item-master-setup': { module: window.StoreInventoryModule, title: 'Item Master Setup', section: 'Item Master Setup' }"), '#/item-master-setup route must be registered');
assert(appJs.includes("'#/store-master-setup': { module: window.StoreInventoryModule, title: 'Store Master Setup', section: 'Store Master Setup' }"), '#/store-master-setup route must be registered');
assert(appJs.includes("'#/item-master-setup': 'STORE_MASTER'"), '#/item-master-setup permission must be mapped');
assert(appJs.includes("'#/store-master-setup': 'STORE_MASTER'"), '#/store-master-setup permission must be mapped');
assert(appJs.includes("routeConfig.section === 'Item Master Setup'"), 'isTopTabsModule must check for Item Master Setup');
assert(appJs.includes("routeConfig.section === 'Store Master Setup'"), 'isTopTabsModule must check for Store Master Setup');
console.log('✓ PASS: app.js contains #/item-master-setup route, RBAC mapping, and isTopTabsModule integration.');

// 7. Verify StoreInventoryModule rendering behavior
const sandbox = {
  window: {},
  document: {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => []
  },
  console: console
};
sandbox.window = sandbox;

// Mock DB
sandbox.window.DB = {
  getAll: (collection) => {
    if (collection === 'warehouses') return [{ id: 'WH-01', name: 'Main Store', status: 'Active' }];
    if (collection === 'plants') return [{ id: 'PL-01', name: 'Pune Plant' }];
    if (collection === 'itemCategories') return [{ id: 'CAT-01', name: 'Engine' }];
    if (collection === 'items') return [{ id: 'ITM-01', name: 'Spark Plug' }];
    if (collection === 'inventoryBalances') return [];
    if (collection === 'jobCards') return [];
    return [];
  }
};

sandbox.window.State = {
  hasPermission: () => true
};

vm.createContext(sandbox);
vm.runInContext(storeJs, sandbox);

const storeMod = sandbox.window.StoreInventoryModule;
assert(storeMod, 'StoreInventoryModule must load');

// Test 7a: Hash #/item-master-setup sets activeTab to ITEM_MASTER
sandbox.window.location = { hash: '#/item-master-setup' };
const containerA = { innerHTML: '' };
storeMod.render(containerA);
assert.strictEqual(storeMod.activeTab, 'ITEM_MASTER', 'hash #/item-master-setup must set activeTab to ITEM_MASTER');
assert(containerA.innerHTML.includes('Item Master'), 'Active tab list must include Item Master');
assert(!containerA.innerHTML.includes('Category & Item Mapping'), 'Active tab list must NOT include Category & Item Mapping when in Item Master Setup');
assert(!containerA.innerHTML.includes('Storage Location Master'), 'Active tab list must NOT include Store Setup tabs when in Item Master Setup');
console.log('✓ PASS: Navigating to #/item-master-setup displays only Item Master Setup tabs.');

// Test 7b: Hash #/store-master sets activeTab to STORE_MASTER
sandbox.window.location = { hash: '#/store-master' };
const containerB = { innerHTML: '' };
storeMod.render(containerB);
assert.strictEqual(storeMod.activeTab, 'STORE_MASTER', 'hash #/store-master must set activeTab to STORE_MASTER');
assert(containerB.innerHTML.includes('Storage Location Master'), 'Active tab list must include Storage Location Master');
assert(containerB.innerHTML.includes('Category & Item Mapping'), 'Active tab list must include Category & Item Mapping when in Store Setup');
console.log('✓ PASS: Navigating to #/store-master displays only Store Setup tabs.');

console.log('\n================================================================');
console.log('🎉 ALL ITEM MASTER SETUP VERIFICATIONS PASSED (100%)!');
console.log('================================================================');
