// scratch/test_jobcard_estimate_parts_sync.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('================================================================');
console.log('TEST SUITE: JOB CARD PARTS <-> ESTIMATE SYNCHRONIZATION');
console.log('================================================================\n');

const rawMock = require('../js/data/mock-data.js');
const initialData = JSON.parse(JSON.stringify(rawMock.INITIAL_DATA || rawMock));
initialData.jobCards = initialData.jobCards || [];
initialData.billingEstimates = initialData.billingEstimates || [];
initialData.draftBills = initialData.draftBills || [];
initialData.items = initialData.items || [];
initialData.inventoryBalances = initialData.inventoryBalances || [];
initialData.warehouses = initialData.warehouses || [
  { id: 'WH-PUN-SPARE', code: 'WH-PUN-SPARE', name: 'Spare Parts Store', plant_id: 'PLANT-01', status: 'Active' }
];

const mockWindow = {
  location: { hash: '#/estimates' },
  State: {
    currentPlantId: 'PLANT-01',
    showToast: (msg, type) => console.log(`  [Toast ${type || 'info'}]: ${msg}`),
    closeModal: () => {}
  }
};

const context = {
  window: mockWindow,
  global: mockWindow,
  document: {
    getElementById: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {}
  },
  localStorage: {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = v; },
    removeItem(k) { delete this._data[k]; }
  },
  console,
  INITIAL_DATA: initialData,
  setTimeout: (fn) => fn(),
  clearTimeout: () => {}
};
vm.createContext(context);

// Load DB
const dbFileContent = fs.readFileSync(path.join(__dirname, '../js/data/db.js'), 'utf8');
vm.runInContext(dbFileContent, context);
context.window.DB.data = initialData;

// Load BillingModule
const billingFileContent = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');
vm.runInContext(billingFileContent, context);

const DB = context.window.DB;
const Billing = context.window.BillingModule;

// 1. Setup Test Job Card with 2 parts and 1 labour task
const testJC = {
  id: 'JC-TEST-0029',
  job_card_no: 'JC/MSC1/2026/0029',
  customer_name: 'Suralkar',
  customer_cin: 'CIN/MSC1/2026/000021',
  customer_mobile: '8765432345',
  vehicle_reg_no: 'MH12AC4678',
  vehicle_model: 'Activa 6G',
  service_type: 'General Service',
  status: 'IN_PROGRESS',
  estimated_total: 800,
  labour_tasks: [
    { task_id: 'TSK-01', desc: 'General Service Labour', hours: 2, rate: 250, amount: 500, status: 'IN_PROGRESS' }
  ],
  parts_required: [
    {
      item_id: 'ITEM-PISTON-01',
      item_code: '2W-SPR-PISTON-RING-SET-005',
      item_name: 'Piston Ring Set',
      qty: 1,
      unit_price: 150,
      issued_qty: 1,
      returned_qty: 0,
      status: 'ISSUED'
    },
    {
      item_id: 'ITEM-BRAKE-01',
      item_code: '2W-BRK-PAD-01',
      item_name: 'Front Disc Brake Pad',
      qty: 1,
      unit_price: 150,
      issued_qty: 1,
      returned_qty: 0,
      status: 'ISSUED'
    }
  ]
};
DB.upsert('jobCards', testJC);

// 2. Generate Estimate from Job Card
Billing.actionEstimateFromJobCard(testJC.id);
let est = Billing.getActiveEstimate();
assert(est, 'Estimate must be active for Job Card');

console.log('--- Initial Estimate Created from Job Card ---');
console.log(`Estimate: ${est.estimate_no} | Status: ${est.status} | Subtotal: ₹${est.subtotal}`);
est.items.forEach((it, idx) => {
  console.log(`  ${idx + 1}. [${it.type}] ${it.code} | ${it.name} | Qty: ${it.qty} | Rate: ₹${it.rate} | Amount: ₹${it.amount}`);
});
assert.strictEqual(est.items.length, 3, 'Expected 3 items in initial estimate (2 parts, 1 labour)');
assert.strictEqual(est.subtotal, 699, 'Initial subtotal should be ₹699');
console.log('✓ Initial estimate contains both parts and labour.\n');

// 3. Test: Parts Added during Job Card
console.log('--- TEST 1: Part added during Job Card -> MUST SHOW IN ESTIMATE ---');
testJC.parts_required.push({
  item_id: 'ITEM-OIL-01',
  item_code: '2W-LUB-ENG-OIL-4T',
  item_name: 'Engine Oil 4T 1L',
  qty: 1,
  unit_price: 350,
  issued_qty: 1,
  returned_qty: 0,
  status: 'ISSUED'
});
DB.upsert('jobCards', testJC);

// Trigger synchronization
const syncResultAdd = Billing.syncEstimateWithJobCardParts(est, testJC);
console.log(`Sync result after addition: ${syncResultAdd}`);
console.log(`Estimate: ${est.estimate_no} | Subtotal: ₹${est.subtotal}`);
est.items.forEach((it, idx) => {
  console.log(`  ${idx + 1}. [${it.type}] ${it.code} | ${it.name} | Qty: ${it.qty} | Rate: ₹${it.rate} | Amount: ₹${it.amount}`);
});

assert.strictEqual(est.items.length, 4, 'Estimate must now have 4 items after adding Engine Oil');
const oilItem = est.items.find(i => i.code === '2W-LUB-ENG-OIL-4T');
assert(oilItem, 'Engine Oil must be present in estimate items');
assert.strictEqual(oilItem.qty, 1);
assert.strictEqual(oilItem.rate, 350);
assert.strictEqual(est.subtotal, 1049, 'Subtotal should now be ₹1049 (699 + 350)');
console.log('✓ Newly added part during Job Card is immediately shown in estimate!\n');

// 4. Test: Parts Returned / Removed from Job Card
console.log('--- TEST 2: Parts returned from Job Card -> MUST NOT SHOW IN ESTIMATE ---');
// Return the Piston Ring and Brake Pad (exactly as in user screenshot)
const pistonPart = testJC.parts_required.find(p => p.item_code === '2W-SPR-PISTON-RING-SET-005');
pistonPart.returned_qty = 1;
pistonPart.issued_qty = 0;
pistonPart.qty = 0;
pistonPart.status = 'RETURNED';

const brakePart = testJC.parts_required.find(p => p.item_code === '2W-BRK-PAD-01');
brakePart.returned_qty = 1;
brakePart.issued_qty = 0;
brakePart.qty = 0;
brakePart.status = 'RETURNED';

DB.upsert('jobCards', testJC);

// Trigger synchronization
const syncResultReturn = Billing.syncEstimateWithJobCardParts(est, testJC);
console.log(`Sync result after return: ${syncResultReturn}`);
console.log(`Estimate: ${est.estimate_no} | Subtotal: ₹${est.subtotal}`);
est.items.forEach((it, idx) => {
  console.log(`  ${idx + 1}. [${it.type}] ${it.code} | ${it.name} | Qty: ${it.qty} | Rate: ₹${it.rate} | Amount: ₹${it.amount}`);
});

// Assert returned parts are completely removed
assert(!est.items.some(i => i.code === '2W-SPR-PISTON-RING-SET-005'), 'Returned Piston Ring must NOT show in estimate');
assert(!est.items.some(i => i.code === '2W-BRK-PAD-01'), 'Returned Brake Pad must NOT show in estimate');

// Only Engine Oil (active part) and Labour remain
assert.strictEqual(est.items.length, 2, 'Estimate must have exactly 2 items remaining');
assert(est.items.some(i => i.type === 'LABOUR'), 'Labour task must be preserved');
assert(est.items.some(i => i.code === '2W-LUB-ENG-OIL-4T'), 'Active part Engine Oil must remain');
assert.strictEqual(est.subtotal, 749, 'Subtotal must now be ₹749 (Labour ₹399 + Oil ₹350)');
console.log('✓ Returned parts are completely removed from estimate!\n');

// 5. Test: Complete deletion of part from Job Card
console.log('--- TEST 3: Part deleted entirely from Job Card -> MUST NOT SHOW IN ESTIMATE ---');
testJC.parts_required = testJC.parts_required.filter(p => p.item_code !== '2W-LUB-ENG-OIL-4T');
DB.upsert('jobCards', testJC);

const syncResultDelete = Billing.syncEstimateWithJobCardParts(est, testJC);
console.log(`Sync result after deletion: ${syncResultDelete}`);
console.log(`Estimate: ${est.estimate_no} | Subtotal: ₹${est.subtotal}`);
est.items.forEach((it, idx) => {
  console.log(`  ${idx + 1}. [${it.type}] ${it.code} | ${it.name} | Qty: ${it.qty} | Rate: ₹${it.rate} | Amount: ₹${it.amount}`);
});

assert(!est.items.some(i => i.code === '2W-LUB-ENG-OIL-4T'), 'Deleted Engine Oil must NOT show in estimate');
assert.strictEqual(est.items.length, 1, 'Only Labour should remain in estimate');
assert.strictEqual(est.items[0].type, 'LABOUR');
assert.strictEqual(est.subtotal, 399, 'Subtotal must be ₹399 (Labour only)');
console.log('✓ Deleted parts are completely removed from estimate!\n');

// 6. Test: Auto-sync on renderEstimatesTab()
console.log('--- TEST 4: Auto-sync on renderEstimatesTab() ---');
Billing.activeEstimateId = est.id;
// Re-add Spark Plug to Job Card
testJC.parts_required.push({
  item_id: 'ITEM-PLUG-99',
  item_code: '2W-ELEC-SPARK-PLUG-01',
  item_name: 'Spark Plug NGK',
  qty: 1,
  unit_price: 120,
  issued_qty: 1,
  status: 'ISSUED'
});
DB.upsert('jobCards', testJC);

// When user renders or opens Estimates screen
Billing.renderEstimatesTab();
const activeEst = Billing.getActiveEstimate();
assert(activeEst.items.some(i => i.code === '2W-ELEC-SPARK-PLUG-01'), 'Spark plug must be present after renderEstimatesTab auto-sync');
assert.strictEqual(activeEst.items.length, 2, 'Estimate must have 2 items (Labour + Spark Plug)');
assert.strictEqual(activeEst.subtotal, 519, 'Subtotal must be ₹519 (399 + 120)');
console.log('✓ renderEstimatesTab() automatically syncs parts on opening the tab!\n');

console.log('================================================================');
console.log('SUCCESS: All 4 test cases passed flawlessly!');
console.log('================================================================');
