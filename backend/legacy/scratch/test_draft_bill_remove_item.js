// Verification script for Bug: Service/Item Not Removed from Draft Bill
const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Mock localStorage
const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { for (const k in storage) delete storage[k]; }
};

// Mock DOM
global.window = global;
global.document = {
  getElementById: (id) => ({ value: '', innerHTML: '', style: {}, focus: () => {} }),
  querySelectorAll: () => [],
  addEventListener: () => {}
};

// Mock Toast & State
let toasts = [];
global.State = {
  showToast: (msg, type) => {
    toasts.push({ msg, type });
  },
  showModal: () => {},
  closeModal: () => {}
};

// Load db.js
const { DatabaseLayer } = require('../js/data/db.js');
window.DatabaseLayer = DatabaseLayer;
window.DB = new DatabaseLayer();

// Load service-master.js
const serviceMasterSource = fs.readFileSync(path.join(__dirname, '../js/modules/service-master.js'), 'utf8');
eval(serviceMasterSource);

// Load billing.js
const billingSource = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');
eval(billingSource);

// Mock refresh to avoid full DOM rendering
window.BillingModule.refresh = function() {
  // Simulates calling renderCustomerBillingSingleScreen to test re-injection prevention
  return window.BillingModule.renderCustomerBillingSingleScreen();
};

console.log('--- TEST 1: Remove Service (Labour) from Draft Bill ---');
// Setup draft bill with labour items and parts
const testBill = {
  id: 'DBILL-TEST-001',
  draft_bill_no: 'DB-TEST-001',
  job_card_id: 'JC-TEST-001',
  job_card_no: 'JC-2026-001',
  status: 'DRAFT',
  items: [
    {
      id: 'DBILL-ITM-LBR-001',
      code: 'LBR-001',
      name: 'General Service Labour',
      type: 'LABOUR',
      qty: 1,
      rate: 399,
      amount: 399
    },
    {
      id: 'DBILL-ITM-LBR-002',
      code: 'LBR-002',
      name: 'Oil & Filter Change Service',
      type: 'LABOUR',
      qty: 1,
      rate: 199,
      amount: 199
    },
    {
      id: 'DBILL-ITM-PART-001',
      item_id: 'ITEM-2W-001',
      code: 'ITEM-2W-001',
      name: 'Front Brake Pad Set (Disc)',
      type: 'PART',
      qty: 1,
      rate: 380,
      amount: 380,
      from_job_card: true
    }
  ],
  subtotal: 978,
  final_total: 978
};

const testJc = {
  id: 'JC-TEST-001',
  job_card_no: 'JC-2026-001',
  status: 'READY_FOR_BILLING',
  parts_required: [
    {
      id: 'PR-001',
      item_id: 'ITEM-2W-001',
      code: 'ITEM-2W-001',
      name: 'Front Brake Pad Set (Disc)',
      qty: 1,
      rate: 380,
      status: 'ISSUED'
    }
  ],
  labour_tasks: [
    {
      id: 'LT-001',
      code: 'LBR-001',
      desc: 'General Service Labour',
      hours: 1,
      rate: 399
    },
    {
      id: 'LT-002',
      code: 'LBR-002',
      desc: 'Oil & Filter Change Service',
      hours: 1,
      rate: 199
    }
  ]
};

window.DB.data.draftBills = [testBill];
window.DB.data.jobCards = [testJc];
window.BillingModule.activeBillingBillId = testBill.id;

// Verify initial item count is 3
assert.strictEqual(testBill.items.length, 3, 'Initial bill must have 3 items');

// Act: Remove 'General Service Labour' (LBR-001)
toasts = [];
window.BillingModule.removeSingleScreenItem('DBILL-ITM-LBR-001', 0);

// Check toast
assert.strictEqual(toasts.length, 1, 'Exactly one toast should be displayed');
assert.strictEqual(toasts[0].type, 'success', 'Toast must be success');
assert(toasts[0].msg.includes('General Service Labour'), 'Toast must mention General Service Labour');
console.log('Service Removal Toast:', toasts[0].msg);

// Verify item is removed from bill.items
const activeBill = window.BillingModule.getActiveCustomerBillingBill();
const hasLbr1 = activeBill.items.some(i => i.code === 'LBR-001' || (i.name || '').includes('General Service'));
assert.strictEqual(hasLbr1, false, 'LBR-001 must NOT exist in bill.items after removal');
assert.strictEqual(activeBill.items.length, 2, 'Active bill items count must be 2');

// Verify saved draft in DB.data.draftBills
const savedDraft = window.DB.getById('draftBills', testBill.id);
assert.strictEqual(savedDraft.items.some(i => i.code === 'LBR-001'), false, 'Saved draft must NOT contain LBR-001');

// Verify calling render/refresh does NOT resurrect LBR-001
window.BillingModule.renderCustomerBillingSingleScreen();
const afterRenderBill = window.BillingModule.getActiveCustomerBillingBill();
assert.strictEqual(afterRenderBill.items.some(i => i.code === 'LBR-001'), false, 'LBR-001 must NOT reappear after render/refresh');

console.log('✓ TEST 1 PASSED: Labour service removed and never resurrected!');

console.log('--- TEST 2: Remove Spare Part from Draft Bill ---');
toasts = [];
// Remove Front Brake Pad Set (Disc)
window.BillingModule.removeSingleScreenItem('DBILL-ITM-PART-001', 1);

assert.strictEqual(toasts.length, 1, 'Exactly one toast should be displayed');
assert.strictEqual(toasts[0].type, 'success', 'Toast must be success');
console.log('Part Removal Toast:', toasts[0].msg);

const afterPartRemovalBill = window.BillingModule.getActiveCustomerBillingBill();
const hasPart = afterPartRemovalBill.items.some(i => i.code === 'ITEM-2W-001');
assert.strictEqual(hasPart, false, 'ITEM-2W-001 must NOT exist in bill.items after removal');
assert.strictEqual(afterPartRemovalBill.items.length, 1, 'Only 1 item should remain (LBR-002)');

// Verify linked job card part was cancelled
const updatedJc = window.DB.getById('jobCards', testJc.id);
const jcPart = updatedJc.parts_required.find(p => p.code === 'ITEM-2W-001');
assert.strictEqual(jcPart.status, 'CANCELLED', 'Job card part status must be CANCELLED');

// Simulate screen refresh
window.BillingModule.renderCustomerBillingSingleScreen();
const refreshedBill = window.BillingModule.getActiveCustomerBillingBill();
assert.strictEqual(refreshedBill.items.some(i => i.code === 'ITEM-2W-001'), false, 'Part must NOT reappear after refresh');
assert.strictEqual(refreshedBill.items.length, 1, 'Bill must consistently retain only 1 item');

console.log('✓ TEST 2 PASSED: Spare part removed and never resurrected!');

console.log('\nALL TESTS PASSED SUCCESSFULLY!');
