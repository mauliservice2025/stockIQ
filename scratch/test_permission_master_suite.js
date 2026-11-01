/**
 * Verification Test Suite for Permission Master & Store Transaction Migration
 */

const fs = require('fs');
const assert = require('assert');

console.log('================================================================');
console.log('VERIFYING PERMISSION MASTER & STORE TRANSACTION INTEGRATION');
console.log('================================================================');

// 1. Setup mock browser environment
const localStorageStore = {};
global.localStorage = {
  getItem: (key) => localStorageStore[key] || null,
  setItem: (key, val) => { localStorageStore[key] = String(val); },
  removeItem: (key) => { delete localStorageStore[key]; },
  clear: () => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); }
};

global.window = global;
global.document = {
  getElementById: (id) => ({
    id,
    style: {},
    classList: { toggle: () => {}, add: () => {}, remove: () => {}, contains: () => false },
    addEventListener: () => {},
    querySelectorAll: () => []
  }),
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {}
};

// 2. Load Core Data & DB
const { INITIAL_DATA } = require('../js/data/mock-data.js');
global.INITIAL_DATA = INITIAL_DATA;

eval(fs.readFileSync('js/data/db.js', 'utf8'));
const db = window.DB;

eval(fs.readFileSync('js/modules/store-inventory.js', 'utf8'));
const storeMod = window.StoreInventoryModule;

eval(fs.readFileSync('js/modules/user-management.js', 'utf8'));
const userMod = window.UserManagementModule;

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
    failed++;
  }
}

// -------------------------------------------------------------
// TEST 1: STORE & INVENTORY MODULE DOES NOT CONTAIN TRANSACTION MATRIX
// -------------------------------------------------------------
test('Store & Inventory module has no TRANSACTION_MATRIX tab or sidebar link', () => {
  const indexHtml = fs.readFileSync('index.html', 'utf8');
  assert(!indexHtml.includes('⚙️ Transaction Matrix'), 'index.html must not contain Transaction Matrix');
  assert(!indexHtml.includes('#/store-transactions'), 'index.html must not link to #/store-transactions in sidebar');

  const dummyDiv = { innerHTML: '' };
  storeMod.activeTab = 'STORE_MASTER';
  storeMod.render(dummyDiv);

  assert(!dummyDiv.innerHTML.includes('⚙️ Transaction Matrix'), 'Store tabs ribbon must not contain Transaction Matrix');
  assert(!dummyDiv.innerHTML.includes('Configure 22-Transactions'), 'Store Master table must not contain Configure 22-Transactions button');
});

// -------------------------------------------------------------
// TEST 2: STORE MODULE RENDERS 9 TABS WITH ZERO NUMBERS
// -------------------------------------------------------------
test('Store & Inventory module tabs have zero numbers', () => {
  const dummyDiv = { innerHTML: '' };
  storeMod.render(dummyDiv);

  const tabMatches = dummyDiv.innerHTML.match(/<button class="tab-btn[\s\S]*?<\/button>/g) || [];
  assert.strictEqual(tabMatches.length, 9, 'Must have exactly 9 tabs in Store & Inventory');

  tabMatches.forEach(t => {
    assert(!t.includes('tab-count'), `Tab must not contain tab-count: ${t}`);
    assert(!t.includes('badge'), `Tab must not contain badge: ${t}`);
    assert(!/\(\d+\)/.test(t), `Tab must not contain bracketed number: ${t}`);
  });
});

// -------------------------------------------------------------
// TEST 3: PERMISSION MASTER CATALOG CONTAINS 27 STORE ITEMS
// -------------------------------------------------------------
test('subModulesCatalog contains all 22 store transactions + 5 store modules', () => {
  const storeItems = userMod.subModulesCatalog.filter(s => s.category === 'Store & Inventory');
  assert.strictEqual(storeItems.length, 27, `Must have 27 Store & Inventory items in catalog, found ${storeItems.length}`);

  const requiredCodes = [
    'STORE_MASTER', 'STORE_CATEGORY_MAP', 'STORE_VEHICLE_COMPAT', 'STORE_INVENTORY_RULES', 'STORE_STOCK_LEDGER',
    'STORE_TX_PR', 'STORE_TX_PO', 'STORE_TX_GRN', 'STORE_TX_PURCHASE_RETURN', 'STORE_TX_MATERIAL_ISSUE',
    'STORE_TX_MATERIAL_RETURN', 'STORE_TX_JOB_CARD_ISSUE', 'STORE_TX_JOB_CARD_RETURN', 'STORE_TX_STOCK_TRANSFER',
    'STORE_TX_STOCK_ADJUSTMENT', 'STORE_TX_PHYSICAL_COUNT', 'STORE_TX_STOCK_RESERVATION', 'STORE_TX_WALK_IN_SALE',
    'STORE_TX_COUNTER_SALE', 'STORE_TX_SALES_RETURN', 'STORE_TX_WARRANTY_RETURN', 'STORE_TX_SCRAP_DISPOSAL',
    'STORE_TX_INTER_BRANCH', 'STORE_TX_BIN_TRANSFER', 'STORE_TX_OPENING_STOCK', 'STORE_TX_QUARANTINE',
    'STORE_TX_QUALITY_INSP'
  ];

  requiredCodes.forEach(code => {
    const item = storeItems.find(s => s.code === code);
    assert(item, `subModulesCatalog must contain code ${code}`);
    assert.strictEqual(item.category, 'Store & Inventory');
    assert.strictEqual(item.categoryIcon, '🏬');
    assert(item.description && item.description.length > 10, `${code} must have descriptive text`);
    assert(item.route && item.route.startsWith('#/'), `${code} must have navigation route`);
  });
});

// -------------------------------------------------------------
// TEST 4: PERMISSION MASTER RENDERS IN MASTER CATALOG FORMAT
// -------------------------------------------------------------
test('Permission Master renders in Master Catalog format with search and categories', () => {
  userMod.activeTab = 'PERMISSIONS';
  userMod.permViewMode = 'CATALOG';
  userMod.permCategoryFilter = 'ALL';
  userMod.permSearchTerm = '';

  const html = userMod.renderPermissionMaster();
  assert(html.includes('Permission Master'), 'Must render Permission Master title');
  assert(html.includes('Permissions Catalog'), 'Must render Permissions Catalog badge');
  assert(html.includes('📋 Permission Catalog'), 'Must have Permission Catalog view button');
  assert(html.includes('🎛️ Role-Permission Matrix'), 'Must have Role-Permission Matrix view button');
  assert(html.includes('Store & Inventory'), 'Must include Store & Inventory category pill');
  assert(html.includes('STORE_TX_JOB_CARD_ISSUE'), 'Must display Store transaction rows');
  assert(html.includes('Job Card Parts Issue'), 'Must display transaction name');
  assert(html.includes('🎛️ Configure'), 'Must have Configure action button for permissions');

  // Verify zero numbers in category pills
  const pillMatches = html.match(/class="perm-cat-pill[^"]*"[^>]*>([\s\S]*?)<\/button>/g) || [];
  pillMatches.forEach(p => {
    assert(!/\(\d+\)/.test(p), `Category pill must not contain bracketed number: ${p}`);
  });
});

// -------------------------------------------------------------
// TEST 5: FILTERING PERMISSION MASTER BY STORE & INVENTORY
// -------------------------------------------------------------
test('Filtering Permission Master by Store & Inventory shows all 27 store items', () => {
  userMod.permCategoryFilter = 'Store & Inventory';
  userMod.permViewMode = 'CATALOG';
  const html = userMod.renderPermissionMaster();

  assert(html.includes('STORE_TX_PR'), 'Must show PR');
  assert(html.includes('STORE_TX_PO'), 'Must show PO');
  assert(html.includes('STORE_TX_GRN'), 'Must show GRN');
  assert(html.includes('STORE_TX_JOB_CARD_ISSUE'), 'Must show Job Card Issue');
  assert(html.includes('STORE_TX_WARRANTY_RETURN'), 'Must show Warranty Return');
  assert(html.includes('STORE_TX_SCRAP_DISPOSAL'), 'Must show Scrap Disposal');
});

// -------------------------------------------------------------
// TEST 6: ROLE-PERMISSION MATRIX INCLUDES STORE & INVENTORY CATEGORY
// -------------------------------------------------------------
test('Role-Permission Matrix renders Store & Inventory category with action checkboxes', () => {
  userMod.activeTab = 'ROLE_PERM_MAP';
  userMod.permCategoryFilter = 'ALL';
  userMod.permSearchTerm = '';

  const html = userMod.renderRolePermissionMatrix();
  assert(html.includes('Store & Inventory'), 'Matrix must have Store & Inventory category header');
  assert(html.includes('chk_STORE_TX_JOB_CARD_ISSUE_view'), 'Must have VIEW checkbox for Job Card Issue');
  assert(html.includes('chk_STORE_TX_STOCK_TRANSFER_approve'), 'Must have APPROVE checkbox for Stock Transfer');

  // Verify zero numbers in matrix category pills and headers
  const catMatches = html.match(/class="perm-cat-pill[^"]*"[^>]*>([\s\S]*?)<\/button>/g) || [];
  catMatches.forEach(p => {
    assert(!/\(\d+\)/.test(p), `Matrix category pill must not contain bracketed numbers: ${p}`);
  });
  assert(!html.includes('Sub-Modules Permitted'), 'Status strip must not have number of permitted sub-modules');
});

// -------------------------------------------------------------
// TEST 7: DEFAULT STORE MANAGER PERMISSION RESOLUTION
// -------------------------------------------------------------
test('Role STORE_MGR inherits operational and approver rights for Store transactions', () => {
  const perm = userMod.getSubModulePermEntry('ROLE-STORE-MGR', 'STORE_TX_JOB_CARD_ISSUE');
  assert(perm, 'Permission entry must exist');
  assert.strictEqual(perm.view, true, 'Store Manager must have VIEW right for Job Card Issue');
  assert.strictEqual(perm.add, true, 'Store Manager must have ADD right for Job Card Issue');
  assert.strictEqual(perm.approve, true, 'Store Manager must have APPROVE right');
});

// -------------------------------------------------------------
// TEST 8: INITIAL_DATA.PERMISSIONS & DB SYNCHRONIZATION
// -------------------------------------------------------------
test('INITIAL_DATA.permissions and DB contains Store & Inventory transactions', () => {
  const perms = db.getAll('permissions');
  const storePerms = perms.filter(p => p.module === 'Store & Inventory');
  assert(storePerms.length >= 27, `DB permissions must contain at least 27 Store permissions, found ${storePerms.length}`);

  const prPerm = storePerms.find(p => p.code === 'STORE_TX_PR');
  assert(prPerm, 'STORE_TX_PR permission must exist in DB');
  assert.strictEqual(prPerm.name, 'Purchase Requisition (PR)');
});

console.log('================================================================');
console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('================================================================');

if (failed > 0) process.exit(1);
