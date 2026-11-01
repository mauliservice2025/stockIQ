/**
 * Test Suite for Opening Balance Management Module
 * Validates BRD v1.0 specifications and integration points.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ✗ [FAIL] ${message}`);
    failed++;
  }
}

console.log('========================================================');
console.log('RUNNING OPENING BALANCE MANAGEMENT MODULE VERIFICATION');
console.log('========================================================\n');

// 1. Static HTML & UI checks
console.log('1. Checking Navigation & HTML Integration:');
const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');

assert(
  indexHtml.includes('id="nav-item-opening-balance"'),
  'index.html contains #nav-item-opening-balance element'
);
assert(
  indexHtml.includes('href="#/opening-balance"'),
  'index.html links to #/opening-balance'
);
assert(
  indexHtml.includes('js/modules/opening-balance.js'),
  'index.html includes script tag for js/modules/opening-balance.js'
);

// Verify placement beside Stock Balances in group-inventory
const groupInvStart = indexHtml.indexOf('id="group-inventory"');
const groupInvEnd = indexHtml.indexOf('id="group-production"');
assert(groupInvStart !== -1 && groupInvEnd !== -1, 'group-inventory module group exists in sidebar');
if (groupInvStart !== -1 && groupInvEnd !== -1) {
  const groupContent = indexHtml.slice(groupInvStart, groupInvEnd);
  const stockBalIdx = groupContent.indexOf('href="#/inventory"');
  const obIdx = groupContent.indexOf('href="#/opening-balance"');
  assert(stockBalIdx !== -1 && obIdx !== -1, 'Both Stock Balances and Opening Balance exist in group-inventory');
  assert(obIdx > stockBalIdx, 'Opening Balance is positioned directly following Stock Balances');
}

// 2. Inventory.js Quick Access Button
console.log('\n2. Checking Inventory Screen Quick Access Button:');
const invJs = fs.readFileSync(path.join(rootDir, 'js/modules/inventory.js'), 'utf-8');
assert(
  invJs.includes('location.hash=\'#/opening-balance\'') || invJs.includes('location.hash="#/opening-balance"'),
  'inventory.js includes button navigating to #/opening-balance'
);
assert(
  invJs.includes('Opening Balance'),
  'inventory.js button is labeled "Opening Balance"'
);

// 3. App Controller Routes & Permissions
console.log('\n3. Checking App Controller Router & Permissions:');
const appJs = fs.readFileSync(path.join(rootDir, 'js/app.js'), 'utf-8');
assert(
  appJs.includes("'#/opening-balance': { module: window.OpeningBalanceModule"),
  'app.js registers #/opening-balance route'
);
assert(
  appJs.includes('isOpeningBalanceChild'),
  'app.js includes isOpeningBalanceChild for active nav highlighting'
);
assert(
  appJs.includes("'#/opening-balance': 'INVENTORY'"),
  'app.js maps #/opening-balance to INVENTORY permission code'
);
assert(
  !appJs.includes('#/customer-opening') && !appJs.includes('#/supplier-opening') && !appJs.includes('#/ledger-opening'),
  'app.js does not contain routes for removed customer, supplier, or ledger screens'
);

// 4. Opening Balance Module Runtime Simulation
console.log('\n4. Simulating Opening Balance Module in Mock Environment:');

// Create mock browser DOM environment
global.window = global;
global.window.location = { hash: '#/opening-balance' };
global.document = {
  getElementById: (id) => ({
    value: '',
    checked: false,
    innerHTML: '',
    appendChild: () => {}
  }),
  querySelectorAll: () => [],
  addEventListener: () => {}
};

// Mock Storage
const storage = {};
global.window.DB = {
  getAll: (table) => storage[table] || [],
  get: (table, id) => (storage[table] || []).find(r => r.id === id),
  insert: (table, row) => {
    if (!storage[table]) storage[table] = [];
    storage[table].push(row);
    return row;
  },
  upsert: (table, row) => {
    if (!storage[table]) storage[table] = [];
    const idx = storage[table].findIndex(r => r.id === row.id);
    if (idx >= 0) storage[table][idx] = { ...storage[table][idx], ...row };
    else storage[table].push(row);
    return row;
  },
  delete: (table, id) => {
    if (!storage[table]) return;
    storage[table] = storage[table].filter(r => r.id !== id);
  },
  logAudit: (action, entity, id, details) => {
    if (!storage.auditLog) storage.auditLog = [];
    storage.auditLog.push({ action, entity, id, details, timestamp: new Date().toISOString() });
  }
};

global.window.State = {
  currentUser: { name: 'Pravin Patil', role: 'System Administrator' },
  showToast: (msg, type) => { /* mock */ },
  closeModal: () => { /* mock */ },
  openModal: (cfg) => { /* mock */ }
};

// Seed sample inventoryBalances and items
storage.items = [
  { id: 'ITEM-01', code: '2W-ENG-OIL-10W30', name: 'Engine Oil 10W-30 (Synthetic)', category: 'LUBRICANTS', uom: 'LTR' },
  { id: 'ITEM-02', code: '2W-FLT-OIL-001', name: 'Oil Filter Cartridge (Pulsar/Avenger)', category: 'FILTERS', uom: 'NOS' }
];
storage.inventoryBalances = [
  { id: 'BAL-001', item_id: 'ITEM-01', plant_id: 'PLANT-01', warehouse_id: 'WH-PUN-MAIN', on_hand: 50, available: 50, valuation_rate: 260 }
];

// Load opening-balance.js
const moduleCode = fs.readFileSync(path.join(rootDir, 'js/modules/opening-balance.js'), 'utf-8');
eval(moduleCode);

assert(
  typeof window.OpeningBalanceModule === 'object',
  'OpeningBalanceModule is defined on window'
);

// Test initDefaults and Database Table Purge
window.OpeningBalanceModule.initDefaults();

const batches = window.DB.getAll('openingInventoryBatches');
const custBalances = window.DB.getAll('openingCustomerBalances');
const supBalances = window.DB.getAll('openingSupplierBalances');
const glBalances = window.DB.getAll('openingLedgerBalances');
const config = window.DB.getAll('openingBalanceConfig');

assert(batches.length > 0, `Default inventory batches seeded (count: ${batches.length})`);
assert(config.length > 0, 'Opening balance configuration seeded');
assert(!custBalances || custBalances.length === 0, 'Customer opening balances purged from database');
assert(!supBalances || supBalances.length === 0, 'Supplier opening balances purged from database');
assert(!glBalances || glBalances.length === 0, 'General ledger balances purged from database');

// Assert removed screens/methods do NOT exist in code
assert(typeof window.OpeningBalanceModule.renderDashboard === 'undefined', 'Overview Dashboard renderDashboard() removed from code');
assert(typeof window.OpeningBalanceModule.renderCustomerTab === 'undefined', 'Customer Opening Receivables renderCustomerTab() removed from code');
assert(typeof window.OpeningBalanceModule.renderSupplierTab === 'undefined', 'Supplier Opening Payables renderSupplierTab() removed from code');
assert(typeof window.OpeningBalanceModule.renderLedgerTab === 'undefined', 'General Ledger renderLedgerTab() removed from code');
assert(typeof window.OpeningBalanceModule.showCustomerBalanceModal === 'undefined', 'Customer modal removed from code');
assert(typeof window.OpeningBalanceModule.showSupplierBalanceModal === 'undefined', 'Supplier modal removed from code');
assert(typeof window.OpeningBalanceModule.showLedgerBalanceModal === 'undefined', 'Ledger modal removed from code');

// Test Header Layout & Upper Filters (BRD Clean Header without duplicate banner)
console.log('\n5. Testing Header Layout, Breadcrumbs Removal & Upper Filters:');
const filtersHtml = window.OpeningBalanceModule.getFiltersHtml();
assert(filtersHtml.includes('id="ob-company-sel"'), 'getFiltersHtml includes Company select');
assert(filtersHtml.includes('id="ob-plant-sel"'), 'getFiltersHtml includes Facility / Branch select');
assert(filtersHtml.includes('id="ob-year-sel"'), 'getFiltersHtml includes Financial Year select');

const mockContainer = { innerHTML: '' };
const mockPageActions = { innerHTML: '' };
const mockBreadcrumbs = { innerHTML: 'Old Breadcrumbs', style: { display: '' } };

global.document.getElementById = (id) => {
  if (id === 'page-actions-container') return mockPageActions;
  if (id === 'view-container') return mockContainer;
  return { value: '', checked: false, innerHTML: '', appendChild: () => {} };
};
global.document.querySelector = (sel) => {
  if (sel === '.breadcrumbs') return mockBreadcrumbs;
  return null;
};

window.OpeningBalanceModule.render(mockContainer);

assert(mockBreadcrumbs.style.display === 'none', 'Breadcrumbs are removed/hidden (style.display = none)');
assert(mockPageActions.innerHTML.includes('id="ob-company-sel"'), 'Filters are moved upperside into #page-actions-container');
assert(!mockContainer.innerHTML.includes('Initial Stock Valuation, Customer Receivables, Supplier Payables'), 'Redundant duplicate inner banner card is completely removed');
assert(mockContainer.innerHTML.includes('Inventory Opening Balance'), 'Inventory Opening Balance tab is present');
assert(mockContainer.innerHTML.includes('Policy & Configuration'), 'Policy & Configuration tab is present');
assert(!mockContainer.innerHTML.includes('Overview Dashboard'), 'Overview Dashboard tab is completely removed from UI');
assert(!mockContainer.innerHTML.includes('Customer Opening Receivables'), 'Customer Opening Receivables tab is completely removed from UI');
assert(!mockContainer.innerHTML.includes('Supplier Opening Payables'), 'Supplier Opening Payables tab is completely removed from UI');
assert(!mockContainer.innerHTML.includes('General Ledger & Cash/Bank'), 'General Ledger tab is completely removed from UI');
assert(!mockContainer.innerHTML.includes('Trial Balance Difference'), 'Dashboard KPI cards are completely removed from UI');
assert(!mockContainer.innerHTML.includes('Opening Balance Migration Quick Actions'), 'Dashboard quick action banner is completely removed from UI');

// Test Compact Modal UI & Renamed Button
console.log('\n6. Testing Modal Compact UI & Button Label:');
let capturedModalConfig = null;
global.window.State.showModal = (cfg) => {
  capturedModalConfig = cfg;
};
window.OpeningBalanceModule.showNewInventoryBatchModal();

assert(capturedModalConfig !== null, 'showNewInventoryBatchModal invoked window.State.showModal');
assert(capturedModalConfig.contentHtml.includes('Save Opening Balance'), 'Button renamed to "Save Opening Balance"');
assert(!capturedModalConfig.contentHtml.includes('Submit for Approval'), 'Old label "Submit for Approval" removed from modal');
assert(capturedModalConfig.contentHtml.includes('ob-compact-form'), 'Modal form uses .ob-compact-form class');
assert(capturedModalConfig.contentHtml.includes('repeat(5, minmax(0, 1fr))'), 'Header grid uses 5-column compact layout');

// Test Stock Ledger Posting Integration
console.log('\n7. Testing Inventory Batch Posting & Stock Ledger Update:');
// Create a new unposted batch
const testBatch = {
  id: 'OB-TEST-999',
  batch_no: 'OB/INV/2026/TEST',
  company_id: 'COMP-01',
  plant_id: 'PLANT-01',
  warehouse_id: 'WH-PUN-MAIN',
  store_name: 'Ravet Main Store',
  financial_year: '2026-2027',
  opening_date: '2026-04-01',
  status: 'APPROVED',
  items: [
    {
      item_code: '2W-ENG-OIL-10W30',
      item_name: 'Engine Oil 10W-30 (Synthetic)',
      category: 'LUBRICANTS',
      uom: 'LTR',
      store_id: 'WH-PUN-MAIN',
      bin_id: 'BIN-PUN-L01',
      batch_no: 'LOT-TEST-01',
      opening_qty: 30,
      unit_cost: 300,
      gross_value: 9000,
      net_value: 9000
    }
  ]
};
window.DB.insert('openingInventoryBatches', testBatch);

// Check initial on_hand for ITEM-01
const initialBal = storage.inventoryBalances.find(b => b.item_id === 'ITEM-01');
const initialQty = initialBal ? initialBal.on_hand : 0;

// Post the batch
window.OpeningBalanceModule.postInventoryBatch('OB-TEST-999');

// Verify batch status changed to POSTED
const updatedBatch = window.DB.get('openingInventoryBatches', 'OB-TEST-999');
assert(updatedBatch.status === 'POSTED', 'Batch status updated to POSTED');
assert(updatedBatch.posted_by === 'Pravin Patil', 'Batch posted_by recorded accurately');

// Verify inventory balance was incremented
const afterBal = storage.inventoryBalances.find(b => b.item_id === 'ITEM-01');
assert(afterBal.on_hand === initialQty + 30, `Inventory on_hand increased by 30 (from ${initialQty} to ${afterBal.on_hand})`);
assert(afterBal.available === initialQty + 30, `Inventory available increased by 30 to ${afterBal.available}`);
assert(afterBal.valuation_rate === 300, `Inventory valuation rate updated to unit cost ₹300`);

// Verify immutable audit log written
const auditEntries = (storage.auditLog || []).filter(a => a.id === 'OB-TEST-999');
assert(auditEntries.length > 0, 'Audit trail entry logged for batch posting');

console.log('\n========================================================');
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('========================================================');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
