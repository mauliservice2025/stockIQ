const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('=== TEST SUITE: PAYMENT RECEIPT REMOVALS & PRINT REFINEMENT ===\n');

const storage = {};
const mockLocalStorage = {
  getItem: (key) => storage[key] || null,
  setItem: (key, val) => { storage[key] = String(val); },
  removeItem: (key) => { delete storage[key]; },
  clear: () => {}
};

let capturedModal = null;
const sandbox = {
  console: console,
  localStorage: mockLocalStorage,
  window: {},
  document: {
    getElementById: (id) => null,
    body: { appendChild: () => {}, removeChild: () => {} },
    createElement: () => ({ style: {}, setAttribute: () => {}, click: () => {} })
  },
  State: {
    showModal: (opts) => { capturedModal = opts; },
    closeModal: () => {},
    showToast: () => {}
  },
  setTimeout: (fn) => fn(),
  clearTimeout: () => {}
};
sandbox.window = sandbox;
sandbox.window.State = sandbox.State;
sandbox.window.localStorage = mockLocalStorage;

// Load db.js
const { INITIAL_DATA } = require('../js/data/mock-data.js');
sandbox.INITIAL_DATA = INITIAL_DATA;
const dbCode = fs.readFileSync(path.join(__dirname, '../js/data/db.js'), 'utf8');
vm.runInNewContext(dbCode, sandbox);
sandbox.window.DB = sandbox.window.DB || new sandbox.DatabaseLayer();

// Insert a sample receipt
const sampleReceipt = {
  id: 'RCP-001',
  receipt_no: 'RCP/MSC1/2026/000004',
  bill_id: 'BILL-001',
  invoice_no: 'INV/MSC1/2026/0002',
  customer_name: 'Rushikesh Dhiwar',
  customer_cin: 'CIN/MSC/2026/000001',
  customer_mobile: '9876543567',
  vehicle_reg_no: 'MH12AC4335',
  payment_date: '2026-10-16',
  payment_time: '03:56:22 pm',
  payment_mode: 'UPI',
  payment_ref: 'UPI Payment',
  amount_paid: 640.00,
  previous_outstanding: 1640.00,
  remaining_outstanding: 1000.00,
  total_bill_amount: 1640.00,
  collected_by: 'Pravin Patil',
  facility_id: 'PLANT-01',
  facility_name: 'Mauli Service Center 1 (MSC1)',
  status: 'ACTIVE'
};
sandbox.window.DB.upsert('paymentReceipts', sampleReceipt);

// Load billing.js
const billingCode = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');
vm.runInNewContext(billingCode, sandbox);

// 1. Test printPaymentReceipt modal generation
console.log('1. Testing printPaymentReceipt("RCP-001"):');
sandbox.window.BillingModule.printPaymentReceipt('RCP-001');

if (!capturedModal) {
  throw new Error('FAILED: Modal was not opened by printPaymentReceipt!');
}

const html = capturedModal.contentHtml;

// Check 1: (MSC1) must be removed
console.log('   Checking (MSC1) removal from workshop header:');
if (html.includes('(MSC1)')) {
  throw new Error('FAILED: (MSC1) was found in receipt modal header!');
}
if (!html.includes('Mauli Service Center 1')) {
  throw new Error('FAILED: Clean workshop name "Mauli Service Center 1" not found!');
}
console.log('   [PASS] (MSC1) removed, clean "Mauli Service Center 1" present.');

// Check 2: Customer acknowledgment sentence must be removed
console.log('   Checking customer acknowledgment sentence removal:');
if (html.includes('Received with thanks from') || html.includes('towards settlement of Bill')) {
  throw new Error('FAILED: "Received with thanks from..." sentence was found in receipt modal!');
}
console.log('   [PASS] "Received with thanks from..." sentence removed.');

// Check 3: Receipt # in bottom footer toolbar must be removed
console.log('   Checking bottom-left footer Receipt # removal:');
if (html.includes('Receipt <strong>#') || html.includes('Receipt #RCP/MSC1/2026/000004')) {
  throw new Error('FAILED: Bottom-left "Receipt #..." toolbar text was found!');
}
console.log('   [PASS] Bottom-left Receipt # text removed from toolbar.');

// Check 4: Print Receipt button hook
console.log('   Checking Print Receipt button hook:');
if (!html.includes('BillingModule.triggerPrintReceipt')) {
  throw new Error('FAILED: Print Receipt button does not invoke BillingModule.triggerPrintReceipt!');
}
console.log('   [PASS] Print Receipt button triggers BillingModule.triggerPrintReceipt.');

// 2. Test triggerPrintReceipt method exists
console.log('\n2. Testing triggerPrintReceipt existence and callable:');
if (typeof sandbox.window.BillingModule.triggerPrintReceipt !== 'function') {
  throw new Error('FAILED: triggerPrintReceipt is not a function on BillingModule!');
}
console.log('   [PASS] triggerPrintReceipt function is available.');

// 3. Test downloadReceiptHtml
console.log('\n3. Testing downloadReceiptHtml:');
if (typeof sandbox.window.BillingModule.downloadReceiptHtml !== 'function') {
  throw new Error('FAILED: downloadReceiptHtml is not a function on BillingModule!');
}
console.log('   [PASS] downloadReceiptHtml function is available.');

console.log('\n ALL PAYMENT RECEIPT PRINT & DISPLAY TESTS PASSED!');
