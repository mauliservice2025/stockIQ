const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('=== TEST ALL SCREENS WITH ZERO BRANCHES / PLANTS ===\n');

const storage = {};
const mockLocalStorage = {
  getItem: (key) => storage[key] || null,
  setItem: (key, val) => { storage[key] = String(val); },
  removeItem: (key) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

const domElements = {};
function createMockElement(tag, id = '') {
  return {
    tagName: tag.toUpperCase(),
    id: id,
    classList: { contains: () => false, add: () => {}, remove: () => {} },
    value: '',
    innerHTML: '',
    style: {},
    options: [],
    appendChild: () => {},
    removeChild: () => {},
    querySelectorAll: () => [],
    querySelector: () => null,
    setAttribute: () => {},
    getAttribute: () => null,
    addEventListener: () => {},
    focus: () => {},
    click: () => {}
  };
}

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
  window: {},
  location: { hash: '#/dashboard' },
  confirm: () => true,
  alert: () => {},
  Chart: function() { return { destroy: () => {}, update: () => {} }; },
  INDIAN_LOCATION_MASTER: { Maharashtra: { Pune: ['Pune', 'Chakan', 'Wakad'] } },
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
};
sandbox.window = sandbox;
vm.createContext(sandbox);

// Load mock-data
const { INITIAL_DATA } = require('../js/data/mock-data.js');
const testData = JSON.parse(JSON.stringify(INITIAL_DATA));
testData.plants = []; // SIMULATE ZERO BRANCHES

sandbox.INITIAL_DATA = testData;
sandbox.window.INITIAL_DATA = testData;

// Load db.js
const dbCode = fs.readFileSync(path.join(__dirname, '../js/data/db.js'), 'utf8');
vm.runInContext(dbCode, sandbox);
sandbox.window.DB.data.plants = [];
sandbox.window.DB.saveData();

// Load State
const stateCode = fs.readFileSync(path.join(__dirname, '../js/state.js'), 'utf8');
vm.runInContext(stateCode, sandbox);

console.log('Total Branches/Plants in DB:', sandbox.window.DB.getAll('plants').length);

const moduleFiles = [
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
  'user-management.js',
  'common-master.js',
  'auth.js'
];

moduleFiles.forEach(mod => {
  const code = fs.readFileSync(path.join(__dirname, `../js/modules/${mod}`), 'utf8');
  vm.runInContext(code, sandbox);
  console.log(`Loaded module: ${mod}`);
});

const dummy = createMockElement('div');
domElements['main-content'] = dummy;

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
  { name: 'User Management', fn: () => sandbox.window.UserManagementModule.render(dummy) },
  { name: 'Common Master', fn: () => sandbox.window.CommonMasterModule.render(dummy) },
  { name: 'Auth Login Page HTML', fn: () => sandbox.window.AuthModule.getLoginPageHtml() }
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

console.log('\n>>> ALL MODULE SCREENS RENDER CLEANLY WITHOUT BRANCHES! <<<');
