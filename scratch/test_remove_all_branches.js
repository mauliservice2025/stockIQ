const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('=== TEST SUITE: REMOVE ALL BRANCH MASTER DATA ONLY ===\n');

// 1. Check INITIAL_DATA
const { INITIAL_DATA } = require('../js/data/mock-data.js');
console.log('1. Checking mock-data.js INITIAL_DATA:');
console.log('   INITIAL_DATA.plants length:', INITIAL_DATA.plants.length);
if (INITIAL_DATA.plants.length !== 0) {
  throw new Error('FAILED: INITIAL_DATA.plants must be empty!');
}
console.log('   [PASS] INITIAL_DATA.plants is an empty array.\n');

// 2. Set up Sandbox DOM Environment
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
  location: { hash: '#/branches' },
  confirm: () => true,
  alert: () => {},
  Chart: function() { return { destroy: () => {}, update: () => {} }; },
  INDIAN_LOCATION_MASTER: { Maharashtra: { Pune: ['Pune', 'Chakan', 'Wakad'] } },
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
};
sandbox.window = sandbox;
vm.createContext(sandbox);

sandbox.INITIAL_DATA = INITIAL_DATA;
sandbox.window.INITIAL_DATA = INITIAL_DATA;

// 2. Load db.js
const dbCode = fs.readFileSync(path.join(__dirname, '../js/data/db.js'), 'utf8');
vm.runInContext(dbCode, sandbox);

console.log('2. Checking DatabaseLayer fresh initialization:');
const plants = sandbox.window.DB.getAll('plants');
console.log('   DB.getAll("plants") count:', plants.length);
if (plants.length !== 0) {
  throw new Error('FAILED: DB.getAll("plants") should be empty on initial load!');
}
console.log('   [PASS] DB initialized with 0 branches/plants.\n');

// 3. Test migration when localStorage contains old seed branches
console.log('3. Testing migration/purge of legacy localStorage seed branches:');
const legacyDbData = {
  plants: [
    { id: 'PLANT-01', code: 'BRANCH-PUN-01', name: 'Pune Workshop' },
    { id: 'PLANT-02', code: 'BRANCH-CHE-02', name: 'Chennai Commercial' },
    { id: 'PLANT-03', code: 'BRANCH-WAKAD-01', name: 'Wakad Quick-Service' },
    { id: 'PLANT-04', code: 'BRANCH-MUM-01', name: 'Mumbai Central' },
    { id: 'PLANT-05', code: 'BRANCH-NAG-01', name: 'Nagpur MIDC' }
  ],
  warehouses: [
    { id: 'WH-01', plant_id: 'PLANT-01', code: 'WH-01', name: 'Main Store' }
  ]
};
mockLocalStorage.setItem('stockiq_db_v1.0', JSON.stringify(legacyDbData));

// Create fresh DB layer instance to trigger loadData with legacy localStorage
sandbox.window.DB = new sandbox.window.DB.constructor();
console.log('   Migrated DB plants count:', sandbox.window.DB.getAll('plants').length);
if (sandbox.window.DB.getAll('plants').length !== 0) {
  throw new Error('FAILED: Legacy seed branches were not purged from localStorage!');
}
console.log('   [PASS] Legacy seed branches successfully purged from localStorage.\n');

// 4. Load State & OrgLocationModule
const stateCode = fs.readFileSync(path.join(__dirname, '../js/state.js'), 'utf8');
vm.runInContext(stateCode, sandbox);

const orgLocCode = fs.readFileSync(path.join(__dirname, '../js/modules/org-location.js'), 'utf8');
vm.runInContext(orgLocCode, sandbox);

const mastersCode = fs.readFileSync(path.join(__dirname, '../js/modules/masters.js'), 'utf8');
vm.runInContext(mastersCode, sandbox);

console.log('4. Testing OrgLocationModule.renderBranchesTab() with 0 branches:');
sandbox.window.OrgLocationModule.activeTab = 'BRANCHES';
const branchesHtml = sandbox.window.OrgLocationModule.renderBranchesTab();
if (!branchesHtml.includes('No Branches Found')) {
  throw new Error('FAILED: renderBranchesTab did not display "No Branches Found" empty state!');
}
if (branchesHtml.includes('Remove All')) {
  throw new Error('FAILED: "Remove All" button should NOT be visible when branch count is 0!');
}
console.log('   [PASS] OrgLocationModule renders "No Branches Found" correctly.\n');

console.log('5. Testing MastersModule.renderPlantsMaster() with 0 branches:');
const plantsHtml = sandbox.window.MastersModule.renderPlantsMaster();
if (!plantsHtml.includes('No Plants / Branches Registered')) {
  throw new Error('FAILED: renderPlantsMaster did not display empty state!');
}
console.log('   [PASS] MastersModule renders empty state for plants correctly.\n');

console.log('6. Testing Add, Delete and Clear All flow:');
// Insert a new branch
const newBranch = {
  id: 'PLANT-NEW-01',
  code: 'BRANCH-BLR-01',
  branch_code: 'BLR',
  name: 'Bengaluru Electronic City Hub',
  plant_type: 'TWO_WHEELER_WORKSHOP',
  city: 'Bengaluru',
  state: 'Karnataka',
  country: 'India',
  is_active: true
};
sandbox.window.DB.insert('plants', newBranch);
console.log('   Inserted 1 branch. DB count:', sandbox.window.DB.getAll('plants').length);

const renderedWithBranch = sandbox.window.OrgLocationModule.renderBranchesTab();
if (!renderedWithBranch.includes('Remove All')) {
  throw new Error('FAILED: "Remove All" button missing when branches exist!');
}
if (!renderedWithBranch.includes('BRANCH-BLR-01')) {
  throw new Error('FAILED: Inserted branch code not found in rendered table!');
}
console.log('   [PASS] New branch rendered with "Remove All" and action buttons.');

// Test deleteBranch
sandbox.window.OrgLocationModule.deleteBranch('PLANT-NEW-01');
console.log('   Deleted PLANT-NEW-01. DB count:', sandbox.window.DB.getAll('plants').length);
if (sandbox.window.DB.getAll('plants').length !== 0) {
  throw new Error('FAILED: deleteBranch failed to delete the branch!');
}
console.log('   [PASS] deleteBranch successfully removed the branch.');

// Insert 2 branches and test clearAllBranches()
sandbox.window.DB.insert('plants', { id: 'PLANT-A', code: 'BR-A', name: 'Branch A', is_active: true });
sandbox.window.DB.insert('plants', { id: 'PLANT-B', code: 'BR-B', name: 'Branch B', is_active: true });
console.log('   Inserted 2 branches. DB count:', sandbox.window.DB.getAll('plants').length);

sandbox.window.OrgLocationModule.clearAllBranches();
console.log('   Called clearAllBranches(). DB count:', sandbox.window.DB.getAll('plants').length);
if (sandbox.window.DB.getAll('plants').length !== 0) {
  throw new Error('FAILED: clearAllBranches failed to empty the master!');
}
console.log('   [PASS] clearAllBranches successfully emptied the master.\n');

// 7. Test all 18 modules rendering with 0 branches
console.log('7. Testing all module screens rendering with 0 branches:');
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
});

const dummy = createMockElement('div');
sandbox.window.DashboardModule.render(dummy);
sandbox.window.PurchaseOrdersModule.render(dummy);
sandbox.window.RequisitionsModule.render(dummy);
sandbox.window.GoodsReceiptModule.render(dummy);
sandbox.window.QualityInspectionModule.render(dummy);
sandbox.window.PutawayModule.render(dummy);
sandbox.window.TransfersModule.render(dummy);
sandbox.window.ProductionModule.render(dummy);
sandbox.window.DispatchModule.render(dummy);
sandbox.window.ReturnsModule.render(dummy);
sandbox.window.AdjustmentsModule.render(dummy);
sandbox.window.InventoryModule.render(dummy);
sandbox.window.StoreInventoryModule.render(dummy);
sandbox.window.MastersModule.render(dummy);
sandbox.window.OrganizationModule.render(dummy);
sandbox.window.OrgLocationModule.activeTab = 'BRANCHES';
sandbox.window.OrgLocationModule.render(dummy);
sandbox.window.UserManagementModule.render(dummy);
sandbox.window.CommonMasterModule.render(dummy);
sandbox.window.AuthModule.getLoginPageHtml();
console.log('   [PASS] All 18 screens render without error when 0 branches exist.\n');

console.log('>>> ALL 7 BRANCH MASTER TEST SUITES PASSED SUCCESSFULLY! <<<');
