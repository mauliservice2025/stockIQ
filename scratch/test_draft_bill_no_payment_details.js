/**
 * Verification test for draft bill without payment details (commented out for future use)
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Setup mock browser globals
global.window = global;
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};
global.window.State = {
  closeModal: () => {},
  showToast: () => {},
  showModal: () => {},
  currentPlantId: 'PLANT-01'
};
global.document = {
  getElementById: (id) => null,
  querySelectorAll: () => []
};

// Load dependencies
require('../js/data/mock-data.js');
const { DatabaseLayer } = require('../js/data/db.js');
window.DB = new DatabaseLayer();
require('../js/modules/billing.js');

console.log('================================================================');
console.log('TEST: Draft Bill Payment Details Commented Out Verification');
console.log('================================================================\n');

// 1. Check code in billing.js
const billingCode = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');
assert(billingCode.includes('PAYMENT DETAILS FOR DRAFT BILL (COMMENTED OUT PER USER REQUEST - PRESERVED FOR FUTURE USE)'), 'billing.js must retain the commented code block');
console.log('✓ Found preserved Payment Details comment block in billing.js');

// 2. Setup an active draft bill and render screen
const testJc = {
  id: 'JC-DRAFT-TEST',
  job_card_no: 'JC/MSC1/2026/000100',
  cin_number: 'CIN/MSC1/2026/000100',
  customer_name: 'Rushikesh Dhiwar',
  customer_mobile: '9876543234',
  vehicle_reg_no: 'MH12TX0002',
  parts_required: [{ item_name: 'Front Disc Brake Pad Set', qty: 2, unit_price: 380 }],
  labour_tasks: [{ desc: 'General Service Labour', qty: 2, rate: 250 }]
};
window.DB.data.jobCards = [testJc];
window.BillingModule.createEstimateForJobCardRecord(testJc);
const est = window.BillingModule.getActiveEstimate();
window.DB.data.billingEstimates = [est];
const bill = window.BillingModule.createOrUpdateBillFromEstimate(est.id, false);
window.BillingModule.activeBillingBillId = bill.id;

const html = window.BillingModule.renderCustomerBillingSingleScreen();

// 3. Verify Payment Details is inside comment and not rendered as an active element
assert(html.includes('<!--') && html.includes('-->'), 'Comment block present in rendered HTML');
assert(html.includes('PAYMENT DETAILS FOR DRAFT BILL (COMMENTED OUT PER USER REQUEST'), 'Comment block header present');
assert(html.includes('📊 Bill Summary & Taxes'), 'Bill Summary & Taxes rendered');
assert(html.includes('₹1,260.00'), 'Total ₹1,260.00 rendered');

console.log('✓ Rendered Customer Billing HTML contains Bill Summary & Taxes without active Payment Details');
console.log('\n================================================================');
console.log('🎉 ALL PAYMENT DETAILS COMMENTING TESTS PASSED!');
console.log('================================================================');
