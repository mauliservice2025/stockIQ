// scratch/test_jobcard_cancelled_parts_readd.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('================================================================');
console.log('TEST SUITE: RE-ADDING CANCELLED/RETURNED PARTS TO JOB CARD');
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

// Add master items matching user's case
const pistonItem = {
  id: 'ITEM-PISTON-01',
  code: '2W-SPR-PISTON-RING-SET-005',
  name: 'Piston Ring Set',
  sale_price: 150,
  current_stock: 10,
  stock: 10,
  available_stock: 10,
  base_uom: 'SET',
  type: 'PART'
};
const gasketItem = {
  id: 'ITEM-GASKET-01',
  code: '2W-SPR-ENGINE-GASKET-KIT-006',
  name: 'Engine Gasket Kit',
  sale_price: 150,
  current_stock: 5,
  stock: 5,
  available_stock: 5,
  base_uom: 'KIT',
  type: 'PART'
};
initialData.items.push(pistonItem, gasketItem);

initialData.inventoryBalances.push(
  {
    id: 'BAL-PISTON',
    plant_id: 'PLANT-01',
    warehouse_id: 'WH-PUN-SPARE',
    bin_id: 'BIN-PUN-A01',
    item_id: pistonItem.id,
    on_hand: 10,
    available: 10,
    reserved: 0
  },
  {
    id: 'BAL-GASKET',
    plant_id: 'PLANT-01',
    warehouse_id: 'WH-PUN-SPARE',
    bin_id: 'BIN-PUN-A01',
    item_id: gasketItem.id,
    on_hand: 5,
    available: 5,
    reserved: 0
  }
);

let lastToast = null;
const mockWindow = {
  location: { hash: '#/job-cards' },
  State: {
    currentPlantId: 'PLANT-01',
    showToast: (msg, type) => {
      lastToast = { msg, type };
      console.log(`  [Toast ${type || 'info'}]: ${msg}`);
    },
    closeModal: () => {},
    showModal: () => {}
  }
};

const domElements = {};
const context = {
  window: mockWindow,
  global: mockWindow,
  document: {
    getElementById: (id) => domElements[id] || null,
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

// Load StoreInventoryModule
const storeInventoryFileContent = fs.readFileSync(path.join(__dirname, '../js/modules/store-inventory.js'), 'utf8');
vm.runInContext(storeInventoryFileContent, context);

const DB = context.window.DB;
const Billing = context.window.BillingModule;
const StoreInv = context.window.StoreInventoryModule;

// 1. Setup Job Card with CANCELLED parts (exact scenario from user screenshot)
const testJC = {
  id: 'JC-0029',
  job_card_no: 'JC/MSC1/2026/0029',
  customer_name: 'Suralkar',
  customer_cin: 'CIN/MSC1/2026/000021',
  customer_mobile: '8765432345',
  vehicle_reg_no: 'MH12AC4678',
  vehicle_model: 'Activa 6G',
  service_type: 'General Service',
  status: 'IN_PROGRESS',
  store_id: 'WH-PUN-SPARE',
  plant_id: 'PLANT-01',
  labour_tasks: [
    { task_id: 'TSK-01', desc: 'General Service Labour', hours: 2, rate: 250, amount: 500, status: 'IN_PROGRESS' }
  ],
  parts_required: [
    {
      item_id: gasketItem.id,
      item_code: gasketItem.code,
      item_name: gasketItem.name,
      qty: 0,
      reserved_qty: 0,
      issued_qty: 0,
      unit_price: 150,
      status: 'CANCELLED',
      cancelled: true
    },
    {
      item_id: pistonItem.id,
      item_code: pistonItem.code,
      item_name: pistonItem.name,
      qty: 0,
      reserved_qty: 0,
      issued_qty: 0,
      unit_price: 150,
      status: 'CANCELLED',
      cancelled: true
    }
  ]
};
DB.upsert('jobCards', testJC);

// Also create linked Estimate
const testEst = {
  id: 'EST-0029',
  estimate_no: 'EST/MSC1/2026/0029',
  job_card_id: testJC.id,
  job_card_no: testJC.job_card_no,
  customer_name: 'Suralkar',
  vehicle_reg_no: 'MH12AC4678',
  status: 'DRAFT',
  subtotal: 500,
  estimated_total: 500,
  tax_rate: 0,
  items: [
    { id: 'ITM-LBR-1', name: 'General Service Labour', type: 'LABOUR', qty: 2, rate: 250, amount: 500 }
  ],
  removed_item_keys: [pistonItem.id, pistonItem.code, gasketItem.id, gasketItem.code]
};
DB.upsert('billingEstimates', testEst);

console.log('--- Initial Job Card State (Cancelled Parts) ---');
testJC.parts_required.forEach((p, idx) => {
  console.log(`  ${idx + 1}. [${p.status}] ${p.item_code} | ${p.item_name} | Qty: ${p.qty}`);
});

// 2. USER ACTION: Re-add the cancelled Piston Ring Set via submitAddPartToJobCard
console.log('\n--- TEST 1: User tries to add previously cancelled Piston Ring Set ---');
domElements['add-jc-part-id'] = { value: pistonItem.id };
domElements['add-jc-part-qty'] = { value: '2' };

lastToast = null;
StoreInv.submitAddPartToJobCard(testJC.id);

// Verify no blocking error toast was triggered
assert.notStrictEqual(lastToast && lastToast.type, 'warning', 'Should NOT show warning toast blocking re-addition!');
assert.strictEqual(lastToast && lastToast.type, 'success', 'Should show success toast!');

// Verify Job Card parts_required updated
const updatedJC = DB.getById('jobCards', testJC.id);
const readdedPart = updatedJC.parts_required.find(p => p.item_id === pistonItem.id);
assert(readdedPart, 'Piston part must exist in job card');
assert.strictEqual(readdedPart.status, 'PENDING', 'Re-added part status must be PENDING');
assert.strictEqual(readdedPart.qty, 2, 'Re-added part qty must be 2');
assert.strictEqual(readdedPart.cancelled, false, 'cancelled flag must be reset to false');
console.log('✓ Successfully re-added cancelled part to Job Card! Status is now PENDING with qty 2.\n');

// 3. Verify Estimate automatically synced the re-added part
console.log('--- TEST 2: Verify Estimate shows the re-added part ---');
const updatedEst = DB.getById('billingEstimates', testEst.id);
console.log(`Estimate: ${updatedEst.estimate_no} | Subtotal: ₹${updatedEst.subtotal}`);
updatedEst.items.forEach((it, idx) => {
  console.log(`  ${idx + 1}. [${it.type}] ${it.code} | ${it.name} | Qty: ${it.qty} | Rate: ₹${it.rate} | Amount: ₹${it.amount}`);
});

const pistonInEst = updatedEst.items.find(i => i.code === pistonItem.code);
assert(pistonInEst, 'Piston Ring Set must now be in Estimate items!');
assert.strictEqual(pistonInEst.qty, 2, 'Piston Ring Set qty in estimate must be 2');
assert.strictEqual(pistonInEst.amount, 300, 'Piston Ring Set amount must be ₹300 (2 * 150)');
assert.strictEqual(updatedEst.subtotal, 800, 'Estimate subtotal must be ₹800 (500 labour + 300 parts)');
console.log('✓ Estimate automatically shows the newly re-added part from Job Card!\n');

// 4. TEST 3: User deletes cancelled Gasket row via removeJobCardPart
console.log('--- TEST 3: User removes cancelled Gasket row completely via removeJobCardPart ---');
StoreInv.removeJobCardPart(testJC.id, gasketItem.id);
const jcAfterDelete = DB.getById('jobCards', testJC.id);
assert(!jcAfterDelete.parts_required.some(p => p.item_id === gasketItem.id), 'Gasket must be completely removed from Job Card');
console.log('Job Card parts remaining:');
jcAfterDelete.parts_required.forEach((p, idx) => {
  console.log(`  ${idx + 1}. [${p.status}] ${p.item_code} | ${p.item_name} | Qty: ${p.qty}`);
});
console.log('✓ removeJobCardPart successfully deleted the cancelled part row!\n');

console.log('================================================================');
console.log('SUCCESS: All tests passed! Cancelled parts can now be added from Job Card.');
console.log('================================================================');
