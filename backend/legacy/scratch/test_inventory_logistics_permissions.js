const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TEST: INVENTORY & LOGISTICS SUB-MODULES & PERMISSIONS MATRIX ===\n');

// Mock browser environment
global.window = global;
global.window.addEventListener = () => {};
global.window.dispatchEvent = () => {};
global.CustomEvent = class CustomEvent {};
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};
const makeElem = () => ({
  innerHTML: '',
  value: '',
  textContent: '',
  focus: () => {},
  classList: { add: () => {}, remove: () => {}, contains: () => false, toggle: () => {} },
  style: {},
  addEventListener: () => {},
  querySelectorAll: () => [],
  querySelector: () => null,
  setAttribute: () => {},
  getAttribute: () => null,
  remove: () => {},
  appendChild: () => {}
});

global.document = {
  documentElement: makeElem(),
  body: makeElem(),
  getElementById: (id) => makeElem(),
  querySelector: () => makeElem(),
  querySelectorAll: () => [],
  addEventListener: () => {},
  createElement: () => makeElem()
};

// 1. Load State & DB
eval(fs.readFileSync(path.join(__dirname, '../js/state.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, '../js/data/db.js'), 'utf8'));

// Mock roles & current user
window.DB.data = {
  roles: [
    { id: 'ROLE-ADMIN', code: 'SYSTEM_ADMIN', name: 'System Administrator' },
    { id: 'ROLE-003', code: 'MECHANIC', name: 'Mechanic' }
  ],
  role_permissions: [
    { role_id: 'ROLE-003', perm_code: 'INVENTORY', view: true, add: false, edit: false, delete: false },
    { role_id: 'ROLE-003', perm_code: 'TRANSFERS', view: true, add: false, edit: false, delete: false }
  ]
};

window.State.getCurrentUser = () => ({
  id: 'USR-MEC',
  username: 'mechanic',
  status: 'ACTIVE',
  primary_role_id: 'ROLE-003',
  primary_role: 'ROLE-003'
});

// 2. Load User Management Module
eval(fs.readFileSync(path.join(__dirname, '../js/modules/user-management.js'), 'utf8'));

// 3. Load App
eval(fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8'));

const userMod = window.UserManagementModule;

// TEST 1: Catalog Check
console.log('--- TEST 1: subModulesCatalog Inventory & Logistics items ---');
const invLogItems = userMod.subModulesCatalog.filter(sm => sm.category === 'Inventory & Logistics');
console.log(`Found ${invLogItems.length} sub-modules under 'Inventory & Logistics':`);
invLogItems.forEach(sm => console.log(`  - [${sm.code}] ${sm.name} (${sm.route})`));

assert.strictEqual(invLogItems.length, 4, 'Must have exactly 4 sub-modules under Inventory & Logistics');

const codes = invLogItems.map(sm => sm.code);
assert(codes.includes('INVENTORY'), 'Must contain INVENTORY');
assert(codes.includes('OPENING_BALANCE'), 'Must contain OPENING_BALANCE');
assert(codes.includes('TRANSFERS'), 'Must contain TRANSFERS');
assert(codes.includes('RECEIVE_TRANSFERS'), 'Must contain RECEIVE_TRANSFERS');

const stockBal = invLogItems.find(sm => sm.code === 'INVENTORY');
assert.strictEqual(stockBal.name, 'Stock Balances', 'INVENTORY must be named Stock Balances');
assert.strictEqual(stockBal.route, '#/inventory', 'Stock Balances route must be #/inventory');

const openBal = invLogItems.find(sm => sm.code === 'OPENING_BALANCE');
assert.strictEqual(openBal.name, 'Opening Balance', 'OPENING_BALANCE must be named Opening Balance');
assert.strictEqual(openBal.route, '#/opening-balance', 'Opening Balance route must be #/opening-balance');

const stockTrf = invLogItems.find(sm => sm.code === 'TRANSFERS');
assert.strictEqual(stockTrf.name, 'Stock Transfer', 'TRANSFERS must be named Stock Transfer');
assert.strictEqual(stockTrf.route, '#/transfers', 'Stock Transfer route must be #/transfers');

const rcvTrf = invLogItems.find(sm => sm.code === 'RECEIVE_TRANSFERS');
assert.strictEqual(rcvTrf.name, 'Receive Stock Transfer', 'RECEIVE_TRANSFERS must be named Receive Stock Transfer');
assert.strictEqual(rcvTrf.route, '#/receive-transfers', 'Receive Stock Transfer route must be #/receive-transfers');
console.log('✓ PASS: All 4 sub-modules match sidebar names, codes and routes!');

// TEST 2: Role Permission Controller Permissions Matrix HTML Render
console.log('\n--- TEST 2: Permissions Matrix HTML Render ---');
userMod.selectedRoleId = 'ROLE-003';
userMod.permCategoryFilter = 'Inventory & Logistics';
userMod.permSearchTerm = '';
const matrixHtml = userMod.renderSubModulePermissionMatrix('ROLE-PERM-MAP');

assert(matrixHtml.includes('Stock Balances'), 'Matrix must render Stock Balances');
assert(matrixHtml.includes('Opening Balance'), 'Matrix must render Opening Balance');
assert(matrixHtml.includes('Stock Transfer'), 'Matrix must render Stock Transfer');
assert(matrixHtml.includes('Receive Stock Transfer'), 'Matrix must render Receive Stock Transfer');
assert(matrixHtml.includes('chk_INVENTORY_view'), 'Matrix must render checkbox for INVENTORY view');
assert(matrixHtml.includes('chk_OPENING_BALANCE_view'), 'Matrix must render checkbox for OPENING_BALANCE view');
assert(matrixHtml.includes('chk_TRANSFERS_view'), 'Matrix must render checkbox for TRANSFERS view');
assert(matrixHtml.includes('chk_RECEIVE_TRANSFERS_view'), 'Matrix must render checkbox for RECEIVE_TRANSFERS view');
console.log('✓ PASS: Permissions Matrix HTML renders all 4 Inventory & Logistics sub-modules with checkboxes!');

// TEST 3: Category Grant and Clear Actions
console.log('\n--- TEST 3: Grant & Clear Inventory & Logistics Rights ---');
userMod.toggleCategoryRights('ROLE-003', 'Inventory & Logistics', true);
invLogItems.forEach(sm => {
  const entry = userMod.getSubModulePermEntry('ROLE-003', sm.code);
  assert.strictEqual(entry.view, true, `${sm.code} view right must be true after grant`);
  assert.strictEqual(entry.add, true, `${sm.code} add right must be true after grant`);
  assert.strictEqual(entry.edit, true, `${sm.code} edit right must be true after grant`);
});
console.log('✓ PASS: Grant Inventory & Logistics grants rights to all 4 sub-modules.');

userMod.toggleCategoryRights('ROLE-003', 'Inventory & Logistics', false);
invLogItems.forEach(sm => {
  const entry = userMod.getSubModulePermEntry('ROLE-003', sm.code);
  assert.strictEqual(entry.view, false, `${sm.code} view right must be false after clear`);
  assert.strictEqual(entry.add, false, `${sm.code} add right must be false after clear`);
});
console.log('✓ PASS: Clear Inventory & Logistics clears rights across all 4 sub-modules.');

// TEST 4: App Route Perm Codes and Tab Integration
console.log('\n--- TEST 4: App Route Perm Codes & Tab Integration ---');
assert.strictEqual(window.App.getRequiredPermCode('#/inventory'), 'INVENTORY');
assert.strictEqual(window.App.getRequiredPermCode('#/opening-balance'), 'OPENING_BALANCE');
assert.strictEqual(window.App.getRequiredPermCode('#/transfers'), 'TRANSFERS');
assert.strictEqual(window.App.getRequiredPermCode('#/receive-transfers'), 'RECEIVE_TRANSFERS');

// Grant rights back to test tabs rendering
userMod.toggleCategoryRights('ROLE-003', 'Inventory & Logistics', true);
const tabsHtml = window.renderInventoryLogisticsTabs('#/inventory');
assert(tabsHtml.includes('Stock Balances'), 'Tabs must render Stock Balances');
assert(tabsHtml.includes('Opening Balance'), 'Tabs must render Opening Balance');
assert(tabsHtml.includes('Stock Transfer'), 'Tabs must render Stock Transfer');
assert(tabsHtml.includes('Receive Stock Transfer'), 'Tabs must render Receive Stock Transfer');
console.log('✓ PASS: App route perm codes and navigation tabs verified.');

console.log('\n🎉 ALL INVENTORY & LOGISTICS PERMISSIONS MATRIX TESTS PASSED (100%)!');
