const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('=== TEST ALL SCREENS WITH ZERO ORGANIZATIONS ===\n');

const storage = {};
const mockLocalStorage = {
  getItem: (key) => storage[key] || null,
  setItem: (key, val) => { storage[key] = String(val); },
  removeItem: (key) => { delete storage[key]; },
  clear: () => {}
};

function createMockElement(tag, id = '') {
  return {
    tagName: tag.toUpperCase(),
    id: id,
    classList: { contains: () => false, add: () => {}, remove: () => {} },
    value: '',
    innerHTML: '',
    style: {},
    appendChild: () => {},
    querySelectorAll: () => [],
    querySelector: () => null,
    setAttribute: () => {},
    getAttribute: () => null,
    addEventListener: () => {},
    focus: () => {}
  };
}

const domElements = {};
const mockDocument = {
  getElementById: (id) => {
    if (!domElements[id]) domElements[id] = createMockElement('div', id);
    return domElements[id];
  },
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: (tag) => createMockElement(tag),
  body: createMockElement('body', 'body'),
  addEventListener: () => {}
};

const sandbox = {
  console: console,
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  setInterval: () => {},
  clearInterval: () => {},
  localStorage: mockLocalStorage,
  document: mockDocument,
  location: { hash: '#/dashboard' },
  window: {},
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }),
  confirm: () => true,
  alert: () => {},
  Chart: function() { return { destroy: () => {}, update: () => {} }; },
  INDIAN_LOCATION_MASTER: { Maharashtra: { Pune: ['Pune', 'Chakan', 'Wakad'] } }
};
sandbox.window = sandbox;

vm.createContext(sandbox);

// 1. Data & State
const { INITIAL_DATA } = require('../js/data/mock-data.js');
sandbox.INITIAL_DATA = INITIAL_DATA;
sandbox.window.INITIAL_DATA = INITIAL_DATA;

const dbCode = fs.readFileSync(path.join(__dirname, '../js/data/db.js'), 'utf8');
vm.runInContext(dbCode, sandbox);

const stateCode = fs.readFileSync(path.join(__dirname, '../js/state.js'), 'utf8');
vm.runInContext(stateCode, sandbox);

console.log('Total Organizations:', sandbox.window.DB.getAll('organizations').length);
console.log('Total Plants:', sandbox.window.DB.getAll('plants').length);
console.log('Active Plants:', sandbox.window.DB.getActivePlants().length);

// 2. Load all modules
const modules = [
  'dashboard.js',
  'purchase-orders.js',
  'requisitions.js',
  'goods-receipt.js',
  'quality-inspection.js',
  'putaway.js',
  'transfers.js',
  'production.js',
  'dispatch.js',
  'returns.js',
  'adjustments.js',
  'inventory.js',
  'store-inventory.js',
  'masters.js',
  'organizations.js',
  'org-location.js',
  'user-management.js'
];

modules.forEach(mod => {
  const code = fs.readFileSync(path.join(__dirname, `../js/modules/${mod}`), 'utf8');
  vm.runInContext(code, sandbox);
  console.log(`Loaded module: ${mod}`);
});

// 3. Render each screen to ensure zero crashes
const dummy = createMockElement('div');

const renderTests = [
  { name: 'Dashboard', fn: () => sandbox.window.DashboardModule.render(dummy) },
  { name: 'Purchase Orders', fn: () => sandbox.window.PurchaseOrdersModule.render(dummy) },
  { name: 'Requisitions', fn: () => sandbox.window.RequisitionsModule.render(dummy) },
  { name: 'Goods Receipt', fn: () => sandbox.window.GoodsReceiptModule.render(dummy) },
  { name: 'Quality Inspection', fn: () => sandbox.window.QualityInspectionModule.render(dummy) },
  { name: 'Putaway', fn: () => sandbox.window.PutawayModule.render(dummy) },
  { name: 'Transfers', fn: () => sandbox.window.TransfersModule.render(dummy) },
  { name: 'Production', fn: () => sandbox.window.ProductionModule.render(dummy) },
  { name: 'Dispatch', fn: () => sandbox.window.DispatchModule.render(dummy) },
  { name: 'Returns', fn: () => sandbox.window.ReturnsModule.render(dummy) },
  { name: 'Adjustments', fn: () => sandbox.window.AdjustmentsModule.render(dummy) },
  { name: 'Inventory Balances', fn: () => sandbox.window.InventoryModule.render(dummy) },
  { name: 'Store Inventory', fn: () => sandbox.window.StoreInventoryModule.render(dummy) },
  { name: 'Masters (Plants/Warehouses)', fn: () => sandbox.window.MastersModule.render(dummy) },
  { name: 'Organization Master', fn: () => sandbox.window.OrganizationModule.render(dummy) },
  { name: 'Org Location (Branches Tab)', fn: () => {
    sandbox.window.OrgLocationModule.activeTab = 'BRANCHES';
    sandbox.window.OrgLocationModule.render(dummy);
  }},
  { name: 'User Management', fn: () => sandbox.window.UserManagementModule.render(dummy) }
];

renderTests.forEach(t => {
  try {
    t.fn();
    console.log(`[PASS] ${t.name} rendered cleanly.`);
  } catch (err) {
    console.error(`[FAIL] ${t.name} failed with error:`, err);
    process.exit(1);
  }
});

console.log('\n>>> ALL MODULE SCREENS RENDER CLEANLY WITHOUT ORGANIZATIONS! <<<');
