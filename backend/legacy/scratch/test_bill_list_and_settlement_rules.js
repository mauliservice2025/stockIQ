const assert = require('assert');
const fs = require('fs');

// Create mock browser DOM environment
global.window = {
  DB: {
    data: {
      finalBills: [],
      draftBills: [],
      jobCards: [],
      billingEstimates: [],
      vehicleDeliveries: []
    },
    getAll(col) { return this.data[col] || []; },
    getById(col, id) { return (this.data[col] || []).find(x => x.id === id); },
    upsert(col, item) {
      if (!this.data[col]) this.data[col] = [];
      const idx = this.data[col].findIndex(x => x.id === item.id);
      if (idx >= 0) this.data[col][idx] = { ...this.data[col][idx], ...item };
      else this.data[col].push(item);
      return item;
    },
    emitChange() {},
    saveData() {}
  },
  State: {
    showToast() {},
    showModal() {},
    closeModal() {}
  },
  location: { hash: '#/final-bills' }
};

// Load billing.js into environment
const billingCode = fs.readFileSync('d:/Projects/ISCM/js/modules/billing.js', 'utf8');
eval(billingCode);

console.log('--- TEST SUITE: BILL LIST 16-COLUMNS & SETTLEMENT ENGINE ---');

const mod = window.BillingModule;
assert(mod, 'BillingModule must exist');

// 1. Test calculation rules and settlement status detection
console.log('Test 1: Settlement status calculations per BR-03');

const sampleFully = {
  gross_amount: 5000,
  discount_amount: 0,
  total_tax: 0,
  net_payable: 5000,
  amount_paid: 5000,
  balance_amount: 0,
  status: 'PAID'
};
const resFully = mod.calculateSettlementStatus(sampleFully);
assert.strictEqual(resFully.code, 'FULLY_SETTLED', 'Must be FULLY_SETTLED');
assert.strictEqual(resFully.label, 'Fully Settled', 'Label must be Fully Settled');

const samplePartial = {
  gross_amount: 7500,
  discount_amount: 0,
  total_tax: 0,
  net_payable: 7500,
  amount_paid: 3000,
  balance_amount: 4500,
  status: 'PARTIALLY_PAID'
};
const resPartial = mod.calculateSettlementStatus(samplePartial);
assert.strictEqual(resPartial.code, 'PARTIALLY_SETTLED', 'Must be PARTIALLY_SETTLED');
assert.strictEqual(resPartial.label, 'Partially Settled', 'Label must be Partially Settled');

const samplePending = {
  gross_amount: 4200,
  discount_amount: 0,
  total_tax: 0,
  net_payable: 4200,
  amount_paid: 0,
  balance_amount: 4200,
  status: 'FINALIZED'
};
const resPending = mod.calculateSettlementStatus(samplePending);
assert.strictEqual(resPending.code, 'PENDING', 'Must be PENDING');
assert.strictEqual(resPending.label, 'Pending', 'Label must be Pending');

const sampleCancelled = {
  net_payable: 4000,
  amount_paid: 0,
  balance_amount: 4000,
  status: 'CANCELLED'
};
const resCancelled = mod.calculateSettlementStatus(sampleCancelled);
assert.strictEqual(resCancelled.code, 'CANCELLED', 'Must be CANCELLED');

console.log('✓ Test 1 Passed: Settlement statuses calculated accurately.');

// 2. Test getAllBillListRecords and auto-seeding of Section 4 illustrative records
console.log('Test 2: getAllBillListRecords retrieves & seeds Section 4 illustrative records');
window.DB.data.finalBills = [];
const records = mod.getAllBillListRecords();
assert(records.length >= 4, 'Must have at least 4 illustrative records');

const r1 = records.find(r => r.invoice_no === 'INV/MSC1/2026/001');
assert(r1, 'Rahul Patil record must exist');
assert.strictEqual(r1.customer_name, 'Rahul Patil');
assert.strictEqual(r1.vehicle_reg_no, 'MH12AB1234');
assert.strictEqual(mod.calculateSettlementStatus(r1).code, 'FULLY_SETTLED');

const r2 = records.find(r => r.invoice_no === 'INV/MSC1/2026/002');
assert(r2, 'Amit Sharma record must exist');
assert.strictEqual(r2.customer_name, 'Amit Sharma');
assert.strictEqual(mod.calculateSettlementStatus(r2).code, 'PARTIALLY_SETTLED');

const r3 = records.find(r => r.invoice_no === 'INV/MSC1/2026/003');
assert(r3, 'Sneha Jadhav record must exist');
assert.strictEqual(r3.customer_name, 'Sneha Jadhav');
assert.strictEqual(mod.calculateSettlementStatus(r3).code, 'PENDING');

const r4 = records.find(r => r.invoice_no === 'INV/MSC1/2026/004');
assert(r4, 'Vikas More record must exist');
assert.strictEqual(r4.customer_name, 'Vikas More');
assert.strictEqual(mod.calculateSettlementStatus(r4).code, 'FULLY_SETTLED');

console.log('✓ Test 2 Passed: Section 4 illustrative records verified.');

// 3. Test synchronization from draftBills after full settlement
console.log('Test 3: Patient settled in customer billing draft/final appears in Bill List');
window.DB.upsert('draftBills', {
  id: 'DBILL-999',
  draft_bill_no: 'DB-2026-999',
  job_card_no: 'JC-PUN-26-999',
  estimate_no: 'EST-PUN-26-999',
  customer_cin: 'CIN-MSC1-000999',
  customer_name: 'Dr. Ramesh Kulkarni',
  vehicle_reg_no: 'MH12ZZ9999',
  gross_amount: 3500,
  discount_amount: 200,
  total_tax: 594,
  net_payable: 3894,
  amount_received: 3894,
  amount_paid: 3894,
  balance_due: 0,
  balance_amount: 0,
  payment_mode: 'UPI',
  status: 'PAID'
});

const refreshedBills = mod.getAllBillListRecords();
const syncedPatient = refreshedBills.find(b => b.customer_name === 'Dr. Ramesh Kulkarni');
assert(syncedPatient, 'Dr. Ramesh Kulkarni must appear in final bills list after full settlement');
assert.strictEqual(mod.calculateSettlementStatus(syncedPatient).code, 'FULLY_SETTLED', 'Must be Fully Settled');
assert.strictEqual(syncedPatient.balance_amount, 0, 'Balance must be 0');

console.log('✓ Test 3 Passed: Settled patient is automatically visible in Bill List screen.');

// 4. Test renderFinalBillsTab contains all 16 required columns
console.log('Test 4: Verify 16 columns present in HTML output of renderFinalBillsTab');
const html = mod.renderFinalBillsTab();

const expectedColumns = [
  'Sr. No.',
  'Bill Number',
  'Bill Date',
  'Job Card No.',
  'Estimate No.',
  'CIN',
  'Customer Name',
  'Vehicle Number',
  'Bill Amount',
  'Discount',
  'Tax Amount',
  'Net Bill Amount',
  'Paid Amount',
  'Balance Amount',
  'Settlement Status',
  'Payment Mode',
  'Action'
];

expectedColumns.forEach(col => {
  assert(html.includes(col), `Column header "${col}" must be present in HTML table`);
});

// Check category tabs
assert(html.includes('All'), 'Must have All category tab');
assert(html.includes('Fully Settled'), 'Must have Fully Settled category tab');
assert(html.includes('Partially Settled'), 'Must have Partially Settled category tab');
assert(html.includes('Pending'), 'Must have Pending category tab');

console.log('✓ Test 4 Passed: All 16 required columns and category tabs verified in HTML output.');

// 5. Test Receive Payment flow & auto settlement update
console.log('Test 5: Receive Payment updates settlement status automatically');
const pendingBill = refreshedBills.find(b => b.invoice_no === 'INV/MSC1/2026/003'); // Sneha Jadhav
assert(pendingBill, 'Sneha Jadhav pending bill exists');
assert.strictEqual(mod.calculateSettlementStatus(pendingBill).code, 'PENDING');

// Partial settlement of ₹2,000
pendingBill.amount_paid = 2000;
pendingBill.amount_received = 2000;
pendingBill.balance_amount = 2200;
pendingBill.balance_due = 2200;
pendingBill.status = 'PARTIALLY_PAID';
window.DB.upsert('finalBills', pendingBill);

assert.strictEqual(mod.calculateSettlementStatus(pendingBill).code, 'PARTIALLY_SETTLED', 'Must become Partially Settled');

// Full settlement of remaining ₹2,200
pendingBill.amount_paid = 4200;
pendingBill.amount_received = 4200;
pendingBill.balance_amount = 0;
pendingBill.balance_due = 0;
pendingBill.status = 'PAID';
window.DB.upsert('finalBills', pendingBill);

assert.strictEqual(mod.calculateSettlementStatus(pendingBill).code, 'FULLY_SETTLED', 'Must become Fully Settled');

console.log('✓ Test 5 Passed: Settlement status transitions from Pending -> Partially Settled -> Fully Settled.');

// 6. Test Navigation header in customer billing
console.log('Test 6: Verify View Bill List button is removed and stepper is inline');
mod.activeBillingBillId = 'DBILL-999';
const cbHtml = mod.renderCustomerBillingSingleScreen();
assert(!cbHtml.includes('View Bill List'), 'View Bill List button should be removed from header actions');
assert(cbHtml.includes('Step 1: Open JC/Est'), 'Stepper must be present');

console.log('✓ Test 6 Passed: View Bill List button removed and Stepper verified.');

console.log('--- ALL TESTS PASSED SUCCESSFULLY! ---');
