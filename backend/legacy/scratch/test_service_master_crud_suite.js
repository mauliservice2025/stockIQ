const assert = require('assert');
const fs = require('fs');

console.log('=== SERVICE MASTER VALIDATION & INTEGRATION TEST SUITE ===\n');

// Mock browser environment
global.window = {
  State: {
    currentUser: { name: 'Pravin Patil' },
    showToast: (msg, type) => console.log(`  [Toast ${type}]: ${msg}`),
    showModal: (opts) => { global.lastModal = opts; },
    closeModal: () => { global.lastModal = null; }
  },
  location: { hash: '#/service-master' },
  confirm: () => true,
  PaginationHelper: {
    paginate: (items) => ({ items, totalRecords: items.length, totalPages: 1, currentPage: 1, pageSize: 10 }),
    render: () => '<div class="pagination">Pagination</div>',
    reset: () => {},
    setPage: () => {},
    setPageSize: () => {}
  }
};
global.document = {
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => []
};

const DB = {
  data: {
    services: [],
    items: [],
    inventoryBalances: []
  },
  getAll(col) { return this.data[col] || []; },
  getById(col, id) { return (this.data[col] || []).find(x => x.id === id || x.code === id); },
  upsert(col, item) {
    if (!this.data[col]) this.data[col] = [];
    const idx = this.data[col].findIndex(x => x.id === item.id || x.code === item.code);
    if (idx >= 0) this.data[col][idx] = item;
    else this.data[col].push(item);
  },
  delete(col, id) {
    if (!this.data[col]) return false;
    this.data[col] = this.data[col].filter(x => x.id !== id && x.code !== id);
    return true;
  },
  saveData() {},
  emitChange() {}
};
global.window.DB = DB;

// Load ServiceMasterModule
const serviceMasterCode = fs.readFileSync('d:/Projects/ISCM/js/modules/service-master.js', 'utf8');
eval(serviceMasterCode);
const ServiceMaster = global.window.ServiceMasterModule;

// Load BillingModule
const billingCode = fs.readFileSync('d:/Projects/ISCM/js/modules/billing.js', 'utf8');
eval(billingCode);
const Billing = global.window.BillingModule;

// Load StoreInventoryModule
const storeCode = fs.readFileSync('d:/Projects/ISCM/js/modules/store-inventory.js', 'utf8');
eval(storeCode);
const StoreInventory = global.window.StoreInventoryModule;

// -------------------------------------------------------------
// TEST 1: Initial Seed Verification (7 services from user image)
// -------------------------------------------------------------
console.log('--- TEST 1: Service Master Initial Seed from Image ---');
ServiceMaster.ensureSeedData();
const seeded = ServiceMaster.getAllServices();
console.log(`Found ${seeded.length} seeded services.`);
assert.strictEqual(seeded.length, 7, 'Must seed exactly 7 initial standard services from screenshot');

const expectedServices = [
  { code: 'LBR-001', name: 'General Service Labour', rate: 399 },
  { code: 'LBR-002', name: 'Engine Oil & Filter Replacement Labour', rate: 100 },
  { code: 'LBR-003', name: 'Brake Overhaul & Cleaning Labour', rate: 250 },
  { code: 'LBR-004', name: 'Carburetor / Throttle Body Clean', rate: 350 },
  { code: 'LBR-005', name: 'Electrical & Wiring Check', rate: 200 },
  { code: 'LBR-006', name: 'Clutch & CVT Overhaul Labour', rate: 450 },
  { code: 'LBR-007', name: 'Water Wash & Polishing', rate: 200 }
];

expectedServices.forEach(exp => {
  const match = seeded.find(s => s.code === exp.code);
  assert(match, `Service ${exp.code} must be present`);
  assert.strictEqual(match.name, exp.name, `Service ${exp.code} name must match`);
  assert.strictEqual(match.rate, exp.rate, `Service ${exp.code} rate must match ₹${exp.rate}`);
  assert.strictEqual(match.sac_code, '998729', `Service ${exp.code} must have SAC 998729`);
  assert.strictEqual(match.status, 'Active', `Service ${exp.code} must be Active`);
});
console.log('✓ All 7 screenshot services verified with code, name, rates and SAC 998729.\n');

// -------------------------------------------------------------
// TEST 2: Add New Service (CRUD - Create)
// -------------------------------------------------------------
console.log('--- TEST 2: Add New Service (CRUD - Create) ---');
ServiceMaster.openAddModal();
assert(global.lastModal, 'Add Modal must open');
assert(global.lastModal.title.includes('Add New Workshop Service'), 'Add modal title verified');

// Simulate submitting form for new service
const newServiceRecord = {
  id: 'LBR-008',
  code: 'LBR-008',
  name: 'Chain & Sprocket Replacement Labour',
  sac_code: '998729',
  category: 'Transmission Service',
  rate: 300,
  workshop_sale_price: 300,
  estimated_hours: 1.0,
  status: 'Active',
  description: 'Full rear wheel removal and drive chain sprocket kit replacement.'
};
DB.upsert('services', newServiceRecord);
assert.strictEqual(ServiceMaster.getAllServices().length, 8, 'Services count must be 8 after add');
const addedSrv = DB.getById('services', 'LBR-008');
assert(addedSrv, 'LBR-008 must exist');
assert.strictEqual(addedSrv.rate, 300);
console.log('✓ Successfully added new service LBR-008 (₹300).\n');

// -------------------------------------------------------------
// TEST 3: Edit Service (CRUD - Update)
// -------------------------------------------------------------
console.log('--- TEST 3: Edit Service (CRUD - Update) ---');
ServiceMaster.openEditModal('LBR-001');
assert(global.lastModal, 'Edit modal must open');
assert(global.lastModal.title.includes('LBR-001'), 'Edit modal title must include LBR-001');

// Update LBR-001 rate to ₹450
const srv1 = DB.getById('services', 'LBR-001');
srv1.rate = 450;
srv1.workshop_sale_price = 450;
srv1.name = 'General Service & Detailed Inspection';
DB.upsert('services', srv1);

const updatedSrv1 = DB.getById('services', 'LBR-001');
assert.strictEqual(updatedSrv1.rate, 450, 'Updated rate must be 450');
assert.strictEqual(updatedSrv1.name, 'General Service & Detailed Inspection', 'Updated name must persist');
console.log('✓ Successfully updated LBR-001 rate to ₹450 and name.\n');

// -------------------------------------------------------------
// TEST 4: Delete Service (CRUD - Delete)
// -------------------------------------------------------------
console.log('--- TEST 4: Delete Service (CRUD - Delete) ---');
ServiceMaster.deleteService('LBR-007');
assert(!DB.getById('services', 'LBR-007'), 'LBR-007 must be deleted from DB');
console.log('✓ Successfully deleted service LBR-007 from Master.\n');

// -------------------------------------------------------------
// TEST 5: Integration with BillingModule & Estimate Add Item Modal
// -------------------------------------------------------------
console.log('--- TEST 5: BillingModule Dropdown Integration ---');
const masterItems = Billing.fetchAllMasterItems();
const labourServices = masterItems.filter(i => i.type === 'LABOUR');
console.log(`BillingModule fetched ${labourServices.length} labour services from Service Master.`);

// Verify LBR-001 has the updated rate (450) and name
const billingSrv1 = labourServices.find(l => l.code === 'LBR-001');
assert(billingSrv1, 'LBR-001 must be in masterItems');
assert.strictEqual(billingSrv1.rate, 450, 'BillingModule must reflect updated rate ₹450');
assert.strictEqual(billingSrv1.name, 'General Service & Detailed Inspection');

// Verify LBR-008 is present
const billingSrv8 = labourServices.find(l => l.code === 'LBR-008');
assert(billingSrv8, 'Newly added LBR-008 must be in masterItems');
assert.strictEqual(billingSrv8.rate, 300);

// Verify deleted LBR-007 is NOT present
assert(!labourServices.some(l => l.code === 'LBR-007'), 'Deleted LBR-007 must NOT be in masterItems');

// Verify renderEstimatePresetOptions outputs live services
Billing._estimatePresetData = { labourItems: labourServices };
const presetHtml = Billing.renderEstimatePresetOptions('LABOUR');
assert(presetHtml.includes('LBR-001 - General Service & Detailed Inspection (₹450)'), 'Estimate preset dropdown must show updated LBR-001');
assert(presetHtml.includes('LBR-008 - Chain & Sprocket Replacement Labour (₹300)'), 'Estimate preset dropdown must show added LBR-008');
assert(!presetHtml.includes('LBR-007'), 'Estimate preset dropdown must NOT contain deleted LBR-007');
console.log('✓ Estimate "+ Add Item / Service" modal dropdown dynamically syncs with Service Master changes!\n');

// -------------------------------------------------------------
// TEST 6: StoreInventoryModule Tabs & Navigation Verification
// -------------------------------------------------------------
console.log('--- TEST 6: StoreInventoryModule Tab & Navigation Placement ---');
StoreInventory.render({ style: {}, innerHTML: '' });
const itemMasterIdx = StoreInventory.tabConfig.findIndex(t => t.key === 'ITEM_MASTER');
const serviceMasterIdx = StoreInventory.tabConfig.findIndex(t => t.key === 'SERVICE_MASTER');
assert(itemMasterIdx !== -1, 'ITEM_MASTER tab must exist');
assert(serviceMasterIdx !== -1, 'SERVICE_MASTER tab must exist');
assert.strictEqual(serviceMasterIdx, itemMasterIdx + 1, 'SERVICE_MASTER must be placed right beside ITEM_MASTER');
console.log(`✓ Verified: Service Master tab (index ${serviceMasterIdx}) sits right beside Item Master tab (index ${itemMasterIdx}).\n`);

// -------------------------------------------------------------
// TEST 7: HTML & app.js Sidebar and Route Verification
// -------------------------------------------------------------
console.log('--- TEST 7: Sidebar HTML & Route Integrity ---');
const indexHtml = fs.readFileSync('d:/Projects/ISCM/index.html', 'utf8');
assert(indexHtml.includes('id="nav-item-service-master"'), 'index.html must have #nav-item-service-master');
assert(indexHtml.includes('href="#/service-master"'), 'index.html must link to #/service-master');
assert(indexHtml.includes('js/modules/service-master.js'), 'index.html must load service-master.js');

const appJs = fs.readFileSync('d:/Projects/ISCM/js/app.js', 'utf8');
assert(appJs.includes("'#/service-master'"), 'app.js must register #/service-master route');
assert(appJs.includes("'#/service-master': 'STORE_MASTER'"), 'app.js must map STORE_MASTER permission');

const pinnedJs = fs.readFileSync('d:/Projects/ISCM/js/modules/pinned-submodules.js', 'utf8');
assert(pinnedJs.includes("id: 'service-master'"), 'pinned-submodules.js must include service-master');

console.log('✓ All navigation, routing, scripts, and permissions verified!\n');

console.log('================================================================');
console.log('🎉 ALL 7 TESTS PASSED WITH 100% SUCCESS!');
console.log('================================================================');
