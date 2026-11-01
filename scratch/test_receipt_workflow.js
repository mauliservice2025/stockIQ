const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- 1. Testing Document Number Series Master for RCP ---');
const docSeriesCode = fs.readFileSync(path.resolve('js/modules/doc-series-master.js'), 'utf8');
assert(docSeriesCode.includes("code: 'RCP'"), "DOC_TYPES must contain 'RCP'");
assert(docSeriesCode.includes("ensureStandardSeries('RCP'"), "ensureStandardSeries must be called for 'RCP'");
console.log('✓ doc-series-master.js has RCP document type and standard series seeding');

console.log('--- 2. Testing BillingModule Receipt Methods ---');
const billingCode = fs.readFileSync(path.resolve('js/modules/billing.js'), 'utf8');

assert(billingCode.includes('generateReceiptNumber(facilityId'), 'generateReceiptNumber must exist');
assert(billingCode.includes('showPaymentSuccessModal(receiptRecord'), 'showPaymentSuccessModal must exist');
assert(billingCode.includes('showBillReceiptsModal(billId)'), 'showBillReceiptsModal must exist');
assert(billingCode.includes('printPaymentReceipt(receiptIdOrNo)'), 'printPaymentReceipt must exist');
assert(billingCode.includes('downloadReceiptHtml(receiptIdOrNo)'), 'downloadReceiptHtml must exist');
assert(billingCode.includes('numberToWords(num)'), 'numberToWords must exist');
console.log('✓ All 6 core receipt methods present in BillingModule');

console.log('--- 3. Testing Screen Access / Buttons ---');
// Bill Screen
assert(billingCode.includes("onclick=\"window.BillingModule.showBillReceiptsModal('${activeBill.id}')\""), 'Bill screen must have showBillReceiptsModal trigger');
// Search Bill Screen
assert(billingCode.includes("onclick=\"window.BillingModule.showBillReceiptsModal('${b.id}')\""), 'Search Bill table must have showBillReceiptsModal trigger');
// Bill List Screen Table View
assert(billingCode.includes("title=\"View & Print Payment Receipts\" onclick=\"window.BillingModule.showBillReceiptsModal('${b.id}')\""), 'Final bills table must have showBillReceiptsModal trigger');
// Bill List Screen Card View
assert(billingCode.includes("onclick=\"window.BillingModule.showBillReceiptsModal('${b.id}')\" style=\"font-size: 11px; padding: 4px 8px; color: #10b981;\" title=\"View & Print Payment Receipts\">"), 'Final bills card view must have Receipts trigger');
console.log('✓ All 3 screens (Bill Screen, Bill Search Screen, Bill List Screen) have Receipt options');

console.log('--- 4. Testing Simulation of BRD Section 3 (₹1,000 in 3 Installments) ---');
// Mock environment
global.window = {
  State: {
    currentPlantId: 'PLANT-01',
    currentUser: { name: 'Santosh Shinde', full_name: 'Santosh Shinde' },
    showToast: (msg, type) => console.log(`  [Toast ${type}]: ${msg}`),
    showModal: ({ title }) => console.log(`  [Modal opened]: ${title}`),
    closeModal: () => console.log('  [Modal closed]')
  },
  DB: {
    data: {
      paymentReceipts: [],
      finalBills: [],
      draftBills: [],
      jobCards: []
    },
    getAll(coll) {
      this.data[coll] = this.data[coll] || [];
      return this.data[coll];
    },
    getById(coll, id) {
      return (this.data[coll] || []).find(x => x.id === id);
    },
    upsert(coll, item) {
      this.data[coll] = this.data[coll] || [];
      const idx = this.data[coll].findIndex(x => x.id === item.id);
      if (idx >= 0) this.data[coll][idx] = item;
      else this.data[coll].push(item);
    },
    emitChange: () => {},
    saveData: () => {}
  }
};

// Create a simulated bill of ₹1,000
const bill = {
  id: 'INV-TEST-001',
  invoice_no: 'INV/MSC1/2026/000001',
  job_card_no: 'JC/MSC1/2026/000001',
  estimate_no: 'EST/MSC1/2026/000001',
  customer_cin: 'CIN-000126',
  customer_name: 'Rahul Patil',
  customer_mobile: '9822012345',
  vehicle_reg_no: 'MH12AB1234',
  vehicle_model: 'Activa 6G',
  branch_id: 'PLANT-01',
  net_payable: 1000,
  amount_paid: 0,
  balance_due: 1000,
  status: 'FINALIZED',
  payment_history: []
};
window.DB.upsert('finalBills', bill);

// Load BillingModule
eval(billingCode);

// Test numberToWords
assert.strictEqual(window.BillingModule.numberToWords(300), 'Three Hundred Rupees Only');
assert.strictEqual(window.BillingModule.numberToWords(400), 'Four Hundred Rupees Only');
assert.strictEqual(window.BillingModule.numberToWords(1000), 'One Thousand Rupees Only');
console.log('✓ numberToWords accurate');

// Simulate 3 installments
// Installment 1: Cash ₹300
global.document = {
  getElementById: (id) => {
    if (id === 'pay-mode') return { value: 'Cash' };
    if (id === 'pay-amount') return { value: '300' };
    if (id === 'pay-ref') return { value: 'Cash Counter' };
    return null;
  }
};
window.BillingModule.submitPayment('INV-TEST-001');

let storedBill = window.DB.getById('finalBills', 'INV-TEST-001');
assert.strictEqual(storedBill.amount_paid, 300);
assert.strictEqual(storedBill.balance_due, 700);
assert.strictEqual(storedBill.status, 'PARTIALLY_PAID');
assert.strictEqual(window.DB.data.paymentReceipts.length, 1);

const r1 = window.DB.data.paymentReceipts[0];
assert.strictEqual(r1.amount_paid, 300);
assert.strictEqual(r1.previous_outstanding, 1000);
assert.strictEqual(r1.remaining_outstanding, 700);
assert.strictEqual(r1.payment_mode, 'Cash');
console.log(`✓ Payment 1 (Cash ₹300): Receipt #${r1.receipt_no}, Prev ₹${r1.previous_outstanding}, Paid ₹${r1.amount_paid}, Balance ₹${r1.remaining_outstanding}`);

// Installment 2: UPI ₹400
global.document = {
  getElementById: (id) => {
    if (id === 'pay-mode') return { value: 'UPI' };
    if (id === 'pay-amount') return { value: '400' };
    if (id === 'pay-ref') return { value: 'UPI Ref #123456789' };
    return null;
  }
};
window.BillingModule.submitPayment('INV-TEST-001');

storedBill = window.DB.getById('finalBills', 'INV-TEST-001');
assert.strictEqual(storedBill.amount_paid, 700);
assert.strictEqual(storedBill.balance_due, 300);
assert.strictEqual(storedBill.status, 'PARTIALLY_PAID');
assert.strictEqual(window.DB.data.paymentReceipts.length, 2);

const r2 = window.DB.data.paymentReceipts[1];
assert.strictEqual(r2.amount_paid, 400);
assert.strictEqual(r2.previous_outstanding, 700);
assert.strictEqual(r2.remaining_outstanding, 300);
assert.strictEqual(r2.payment_mode, 'UPI');
assert.notStrictEqual(r1.receipt_no, r2.receipt_no);
console.log(`✓ Payment 2 (UPI ₹400): Receipt #${r2.receipt_no}, Prev ₹${r2.previous_outstanding}, Paid ₹${r2.amount_paid}, Balance ₹${r2.remaining_outstanding}`);

// Installment 3: Card ₹300
global.document = {
  getElementById: (id) => {
    if (id === 'pay-mode') return { value: 'Card' };
    if (id === 'pay-amount') return { value: '300' };
    if (id === 'pay-ref') return { value: 'POS Swipe #5544' };
    return null;
  }
};
window.BillingModule.submitPayment('INV-TEST-001');

storedBill = window.DB.getById('finalBills', 'INV-TEST-001');
assert.strictEqual(storedBill.amount_paid, 1000);
assert.strictEqual(storedBill.balance_due, 0);
assert.strictEqual(storedBill.status, 'PAID');
assert.strictEqual(window.DB.data.paymentReceipts.length, 3);

const r3 = window.DB.data.paymentReceipts[2];
assert.strictEqual(r3.amount_paid, 300);
assert.strictEqual(r3.previous_outstanding, 300);
assert.strictEqual(r3.remaining_outstanding, 0);
assert.strictEqual(r3.payment_mode, 'Card');
assert.notStrictEqual(r2.receipt_no, r3.receipt_no);
console.log(`✓ Payment 3 (Card ₹300): Receipt #${r3.receipt_no}, Prev ₹${r3.previous_outstanding}, Paid ₹${r3.amount_paid}, Balance ₹${r3.remaining_outstanding} (FULLY SETTLED)`);

console.log('--- 5. Testing Reprinting Integrity ---');
const r1NoBefore = r1.receipt_no;
// Call printPaymentReceipt for r1
window.BillingModule.printPaymentReceipt(r1.id);
assert.strictEqual(r1.receipt_no, r1NoBefore, 'Reprinting must retain original receipt number');
console.log(`✓ Reprinting receipt #${r1.receipt_no} retained original number without incrementing or re-generating`);

console.log('\n🎉 ALL ACCEPTANCE CRITERIA VERIFIED 100% SUCCESSFULLY!');
