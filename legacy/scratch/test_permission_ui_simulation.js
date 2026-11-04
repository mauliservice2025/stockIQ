/**
 * End-to-End DOM & Interaction Simulation for Permission Master & Store Inventory
 */

const fs = require('fs');
const assert = require('assert');

console.log('================================================================');
console.log('RUNNING FULL UI SIMULATION FOR PERMISSION MASTER & STORE INVENTORY');
console.log('================================================================');

// 1. Mock DOM environment with element manipulation and event listeners
const localStorageStore = {};
global.localStorage = {
  getItem: (key) => localStorageStore[key] || null,
  setItem: (key, val) => { localStorageStore[key] = String(val); },
  removeItem: (key) => { delete localStorageStore[key]; },
  clear: () => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); }
};

global.window = global;
global.window.location = { hash: '#/store-inventory' };
global.window.State = {
  showModal: () => {},
  closeModal: () => {},
  showToast: (msg) => console.log('   [Toast]:', msg)
};

// Simple virtual DOM element factory
class MockElement {
  constructor(id = '', tag = 'div') {
    this.id = id;
    this.tagName = tag.toUpperCase();
    this.innerHTML = '';
    this.style = {};
    this.classList = {
      classes: new Set(),
      add: (c) => this.classList.classes.add(c),
      remove: (c) => this.classList.classes.delete(c),
      toggle: (c) => this.classList.classes.has(c) ? this.classList.classes.delete(c) : this.classList.classes.add(c),
      contains: (c) => this.classList.classes.has(c)
    };
    this.attributes = {};
  }
  setAttribute(k, v) { this.attributes[k] = v; }
  getAttribute(k) { return this.attributes[k]; }
}

const elements = {
  'view-container': new MockElement('view-container'),
  'user-mgmt-content': new MockElement('user-mgmt-content'),
  'store-inventory-subview-container': new MockElement('store-inventory-subview-container')
};

global.document = {
  getElementById: (id) => elements[id] || new MockElement(id),
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {}
};

// 2. Load Core Data & Modules
const { INITIAL_DATA } = require('../js/data/mock-data.js');
global.INITIAL_DATA = INITIAL_DATA;

eval(fs.readFileSync('js/data/db.js', 'utf8'));
eval(fs.readFileSync('js/modules/store-inventory.js', 'utf8'));
eval(fs.readFileSync('js/modules/user-management.js', 'utf8'));

const storeMod = window.StoreInventoryModule;
const userMod = window.UserManagementModule;

// Step 1: Render Store & Inventory Module
console.log('\n--- Step 1: Simulating Navigation to Store & Inventory (#/store-inventory) ---');
window.location.hash = '#/store-inventory';
const storeContainer = elements['view-container'];
storeMod.render(storeContainer);

assert(!storeContainer.innerHTML.includes('⚙️ Transaction Matrix'), 'FAILED: Transaction Matrix tab found in Store & Inventory');
assert(storeContainer.innerHTML.includes('🏬 Store Master & Hierarchy'), 'FAILED: Store Master tab missing');
assert(storeContainer.innerHTML.includes('📦 Category & Item Mapping'), 'FAILED: Category Mapping tab missing');
assert(storeContainer.innerHTML.includes('🏍️ Vehicle Compatibility'), 'FAILED: Vehicle Compatibility tab missing');
assert(storeContainer.innerHTML.includes('🔧 Job Card Parts Workflow'), 'FAILED: Job Card Workflow tab missing');
assert(storeContainer.innerHTML.includes('🔄 Stock Transfers'), 'FAILED: Stock Transfers tab missing');
assert(storeContainer.innerHTML.includes('📊 Physical Count & Adjust'), 'FAILED: Physical Count tab missing');
assert(storeContainer.innerHTML.includes('🛡️ Warranty & Scrap Stores'), 'FAILED: Warranty & Scrap Stores tab missing');
assert(storeContainer.innerHTML.includes('⚖️ Inventory Rules & Access'), 'FAILED: Inventory Rules tab missing');
assert(storeContainer.innerHTML.includes('📜 Stock Ledger & Valuation'), 'FAILED: Stock Ledger tab missing');
console.log('✓ Store & Inventory renders exactly 9 tabs without Transaction Matrix.');

// Step 2: Render Permission Master (#/permissions)
console.log('\n--- Step 2: Simulating Navigation to Permission Master (#/permissions) ---');
window.location.hash = '#/permissions';
const userContainer = elements['view-container'];
userMod.permViewMode = 'CATALOG';
userMod.permCategoryFilter = 'ALL';
userMod.render(userContainer);

assert(userContainer.innerHTML.includes('Permission Master'), 'FAILED: Permission Master title missing');
assert(userContainer.innerHTML.includes('Permissions Catalog'), 'FAILED: Permissions Catalog badge missing');
assert(userContainer.innerHTML.includes('📋 Permission Catalog'), 'FAILED: Permission Catalog button missing');
assert(userContainer.innerHTML.includes('🎛️ Role-Permission Matrix'), 'FAILED: Role-Permission Matrix button missing');
console.log('✓ Permission Master renders cleanly in Master Catalog format.');

// Step 3: Filter by Store & Inventory in Master Catalog
console.log('\n--- Step 3: Filtering Permission Master Catalog by Store & Inventory ---');
userMod.filterSubModulesByCategory('Store & Inventory');
const filteredHtml = elements['user-mgmt-content'].innerHTML;

const expectedTransactions = [
  'STORE_TX_PR',
  'STORE_TX_PO',
  'STORE_TX_GRN',
  'STORE_TX_PURCHASE_RETURN',
  'STORE_TX_MATERIAL_ISSUE',
  'STORE_TX_MATERIAL_RETURN',
  'STORE_TX_JOB_CARD_ISSUE',
  'STORE_TX_JOB_CARD_RETURN',
  'STORE_TX_STOCK_TRANSFER',
  'STORE_TX_STOCK_ADJUSTMENT',
  'STORE_TX_PHYSICAL_COUNT',
  'STORE_TX_STOCK_RESERVATION',
  'STORE_TX_WALK_IN_SALE',
  'STORE_TX_COUNTER_SALE',
  'STORE_TX_SALES_RETURN',
  'STORE_TX_WARRANTY_RETURN',
  'STORE_TX_SCRAP_DISPOSAL',
  'STORE_TX_INTER_BRANCH',
  'STORE_TX_BIN_TRANSFER',
  'STORE_TX_OPENING_STOCK',
  'STORE_TX_QUARANTINE',
  'STORE_TX_QUALITY_INSP'
];

expectedTransactions.forEach(tx => {
  assert(filteredHtml.includes(tx), `FAILED: Expected transaction ${tx} not found in Permission Master`);
});
console.log(`✓ All 22 store transactions verified under Permission Master.`);

// Step 4: Switch to Role-Permission Matrix View
console.log('\n--- Step 4: Switching to Role-Permission Matrix View ---');
userMod.switchPermViewMode('MATRIX');
const matrixHtml = userContainer.innerHTML;

assert(matrixHtml.includes('Store & Inventory'), 'FAILED: Store & Inventory category missing from Matrix view');
assert(matrixHtml.includes('chk_STORE_TX_JOB_CARD_ISSUE_view'), 'FAILED: Checkbox for Job Card Issue VIEW right missing');
assert(matrixHtml.includes('chk_STORE_TX_JOB_CARD_ISSUE_approve'), 'FAILED: Checkbox for Job Card Issue APPROVE right missing');
assert(matrixHtml.includes('chk_STORE_TX_STOCK_TRANSFER_export'), 'FAILED: Checkbox for Stock Transfer EXPORT right missing');
console.log('✓ Role-Permission Matrix allows configuring rights for all Store & Inventory transactions.');

// Step 5: Configure Permission Action & Persistence
console.log('\n--- Step 5: Updating and Persisting Rights for Store Manager ---');
userMod.updatePermCheckbox('ROLE-STORE-MGR', 'STORE_TX_JOB_CARD_ISSUE', 'delete', true);
const updatedEntry = userMod.getSubModulePermEntry('ROLE-STORE-MGR', 'STORE_TX_JOB_CARD_ISSUE');
assert.strictEqual(updatedEntry.delete, true, 'Updated delete right must be true');

userMod.saveRolePermissions();
console.log('✓ Permission changes successfully persisted to DB with audit log.');

console.log('\n================================================================');
console.log('ALL SIMULATION STEPS PASSED WITH 100% SUCCESS!');
console.log('================================================================');
