const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('Running test: Duplicate Estimate Item, Bill Sync & In-Transit Stock Finalisation...');

const rawMock = require('../js/data/mock-data.js');
const initialData = JSON.parse(JSON.stringify(rawMock.INITIAL_DATA || rawMock));

const mockWindow = {
  location: { hash: '#/estimates' },
  State: {
    currentPlantId: 'PLANT-01',
    showToast: (msg, type) => {},
    closeModal: () => {},
    showModal: () => {}
  },
  renderBillingTabs: () => '',
  renderAppNavigation: () => ''
};

const context = {
  window: mockWindow,
  global: mockWindow,
  document: {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {}
  },
  localStorage: {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
    clear() { this._data = {}; }
  },
  console,
  INITIAL_DATA: initialData,
  setTimeout: (fn) => typeof fn === 'function' ? fn() : null,
  clearTimeout: () => {}
};
mockWindow.localStorage = context.localStorage;
vm.createContext(context);

// Load DB
const dbFileContent = fs.readFileSync(path.join(__dirname, '../js/data/db.js'), 'utf8');
vm.runInContext(dbFileContent, context);

// Load BillingModule
const billingFileContent = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');
vm.runInContext(billingFileContent, context);

const DB = context.window.DB;
const Billing = context.window.BillingModule;

// Setup test data
const testPartCode = '2W-SPR-PISTON-RING-SET-005';
const testWarehouseId = 'WH-PUN-SPARE';
const initialOnHand = 97;

// Seed items
DB.data.items = [
  {
    id: 'ITEM-PISTON-005',
    code: testPartCode,
    name: 'Piston Ring Set',
    sale_price: 250,
    cost_price: 180,
    current_stock: initialOnHand,
    available_stock: initialOnHand,
    on_hand: initialOnHand,
    in_transit: 0
  }
];

// Seed inventoryBalances
DB.data.inventoryBalances = [
  {
    id: 'BAL-PISTON-005',
    item_id: testPartCode,
    warehouse_id: testWarehouseId,
    plant_id: 'PLANT-01',
    on_hand: initialOnHand,
    available: initialOnHand,
    in_transit: 0,
    valuation_rate: 180
  }
];

// Seed Job Card with 1 qty of Piston Ring Set
const testJc = {
  id: 'JC-TEST-001',
  job_card_no: 'JC-2026-0001',
  vehicle_reg_no: 'MH12AB1234',
  customer_name: 'Rahul Sharma',
  customer_mobile: '9876543210',
  store_id: testWarehouseId,
  status: 'ESTIMATE_PENDING',
  parts_required: [
    {
      item_id: testPartCode,
      item_code: testPartCode,
      item_name: 'Piston Ring Set',
      qty: 1,
      required_qty: 1,
      unit_price: 250,
      amount: 250,
      status: 'PENDING',
      stock_deducted: true
    }
  ]
};
DB.data.jobCards = [testJc];

// Seed Estimate with 1 qty
const testEst = {
  id: 'EST-TEST-001',
  estimate_no: 'EST-2026-0001',
  job_card_id: testJc.id,
  job_card_no: testJc.job_card_no,
  vehicle_reg_no: testJc.vehicle_reg_no,
  customer_name: testJc.customer_name,
  customer_mobile: testJc.customer_mobile,
  store_id: testWarehouseId,
  status: 'DRAFT',
  subtotal: 250,
  taxable_amount: 250,
  tax_amount: 0,
  estimated_total: 250,
  total_estimate: 250,
  items: [
    {
      id: 'EST-ITM-01',
      code: testPartCode,
      item_code: testPartCode,
      name: 'Piston Ring Set',
      item_name: 'Piston Ring Set',
      type: 'PART',
      qty: 1,
      rate: 250,
      amount: 250,
      from_job_card: true,
      stock_deducted: true
    }
  ]
};
DB.data.billingEstimates = [testEst];

// Seed linked Draft Bill with 1 qty
const testDraftBill = {
  id: 'DBILL-TEST-001',
  draft_bill_no: 'DB-2026-0001',
  estimate_id: testEst.id,
  estimate_no: testEst.estimate_no,
  job_card_id: testJc.id,
  job_card_no: testJc.job_card_no,
  vehicle_reg_no: testJc.vehicle_reg_no,
  customer_name: testJc.customer_name,
  customer_cin: 'CIN-001',
  next_service_due_date: '2026-11-25',
  store_id: testWarehouseId,
  status: 'DRAFT',
  items: [
    {
      id: 'DBILL-ITM-01',
      code: testPartCode,
      item_code: testPartCode,
      name: 'Piston Ring Set',
      item_name: 'Piston Ring Set',
      type: 'PART',
      qty: 1,
      rate: 250,
      amount: 250,
      from_job_card: true,
      stock_deducted: false
    }
  ]
};
DB.data.draftBills = [testDraftBill];
DB.data.finalBills = [];

Billing.activeEstimate = testEst;
Billing.activeEstimateId = testEst.id;
Billing.activeBillingBillId = testDraftBill.id;

// Put the initial 1 qty in transit
DB.deductItemStock({
  itemCode: testPartCode,
  qty: 1,
  warehouseId: testWarehouseId,
  docType: 'Estimate',
  docNo: testEst.estimate_no,
  isPermanent: false
});

let bal = DB.data.inventoryBalances.find(b => b.item_id === testPartCode);
assert.strictEqual(bal.available, 96, 'Initial available should be 96 (97 - 1 in transit)');
assert.strictEqual(bal.in_transit, 1, 'Initial in_transit should be 1');
assert.strictEqual(bal.on_hand, 97, 'Initial on_hand should remain 97 (not deducted yet)');
console.log('✔ Initial state: 1 qty held in transit. Available: 96, In-Transit: 1, On-Hand: 97');

// -------------------------------------------------------------
// Step 1: User adds another 1 qty of Piston Ring Set in Estimate
// -------------------------------------------------------------
// Simulate duplicate action setup as done by handleAddEstimateItemSubmit
Billing._pendingDuplicateAction = {
  docType: 'Estimate',
  targetDoc: testEst,
  existingItem: testEst.items[0],
  addQty: 1,
  rate: 250,
  type: 'PART',
  code: testPartCode,
  name: 'Piston Ring Set'
};

// User clicks "Yes"
Billing.confirmDuplicateItemAdd();

// Assert Estimate was updated to 2 qty
assert.strictEqual(testEst.items[0].qty, 2, 'Estimate item qty should be 2');
assert.strictEqual(testEst.items[0].amount, 500, 'Estimate item amount should be 500');
console.log('✔ Step 1 Passed: Estimate item qty updated to 2');

// Assert Job Card was updated to 2 qty
const updatedJc = DB.getById('jobCards', testJc.id);
const jcPart = updatedJc.parts_required.find(p => p.item_code === testPartCode);
assert.strictEqual(jcPart.qty, 2, 'Job card part qty should be 2');
console.log('✔ Step 1 Passed: Linked Job Card part qty updated to 2');

// Assert Draft Bill was updated to 2 qty
const updatedDraft = DB.getById('draftBills', testDraftBill.id);
const draftItem = updatedDraft.items.find(i => i.code === testPartCode);
assert.strictEqual(draftItem.qty, 2, 'Draft bill item qty should be 2');
assert.strictEqual(draftItem.amount, 500, 'Draft bill item amount should be 500');
console.log('✔ Step 1 Passed: Linked Draft Bill item qty updated to 2');

// -------------------------------------------------------------
// Step 2: Ensure syncEstimateWithJobCardParts does NOT downgrade qty back to 1
// -------------------------------------------------------------
Billing.syncEstimateWithJobCardParts(testEst);
assert.strictEqual(testEst.items[0].qty, 2, 'Estimate qty MUST remain 2 after sync');
console.log('✔ Step 2 Passed: Estimate qty remains 2 after syncEstimateWithJobCardParts (not reverted to 1)');

// -------------------------------------------------------------
// Step 3: Stock in-transit verification (Pre-finalization)
// -------------------------------------------------------------
bal = DB.data.inventoryBalances.find(b => b.item_id === testPartCode);
assert.strictEqual(bal.available, 95, 'Available should be 95 (97 - 2)');
assert.strictEqual(bal.in_transit, 2, 'In-transit should be 2');
assert.strictEqual(bal.on_hand, 97, 'Physical on_hand should STILL be 97 before bill finalisation');
console.log('✔ Step 3 Passed: Stock in transit = 2, Available = 95, On-Hand = 97 (held in transit, not permanently deducted yet)');

// -------------------------------------------------------------
// Step 4: Bill Finalisation: permanent stock deduction
// -------------------------------------------------------------
// Finalize customer billing
Billing.finalizeCustomerBilling();

// Check final bills
const finalBills = DB.getAll('finalBills');
assert.strictEqual(finalBills.length, 1, 'Final bill must be created');
const fb = finalBills[0];
assert(fb.invoice_no, 'Final bill has invoice_no');

// Verify inventory balances after final bill
bal = DB.data.inventoryBalances.find(b => b.item_id === testPartCode);
assert.strictEqual(bal.on_hand, 95, 'Physical on_hand must now be permanently deducted to 95 (97 - 2)');
assert.strictEqual(bal.in_transit, 0, 'In-transit must now be cleared to 0');
assert.strictEqual(bal.available, 95, 'Available stock remains 95');

// Verify item catalog stock
const catalogItem = DB.data.items.find(i => i.code === testPartCode);
assert.strictEqual(catalogItem.current_stock, 95, 'Catalog item current_stock must be permanently deducted to 95');

console.log('✔ Step 4 Passed: Bill finalised! On-Hand permanently deducted to 95, In-Transit cleared to 0.');
console.log('\nAll tests PASSED successfully!');
