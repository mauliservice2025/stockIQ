const fs = require('fs');
const assert = require('assert');

console.log('=== TEST SUITE: BILLING QUEUE DEDUPLICATION VERIFICATION ===\n');

global.window = {
  location: { hash: '#/customer-billing' },
  print: () => {}
};
global.document = {
  getElementById: () => null,
  createElement: () => ({ setAttribute: () => {}, click: () => {}, style: {} }),
  body: { appendChild: () => {}, removeChild: () => {} }
};
global.localStorage = { getItem: () => null, setItem: () => null };

// Load code files
eval(fs.readFileSync('d:/Projects/ISCM/js/data/mock-data.js', 'utf8'));
eval(fs.readFileSync('d:/Projects/ISCM/js/data/db.js', 'utf8'));
eval(fs.readFileSync('d:/Projects/ISCM/js/modules/doc-series-master.js', 'utf8'));

window.State = {
  showToast: (msg, type) => console.log(`[Toast ${type}]: ${msg}`),
  showModal: (opts) => {},
  closeModal: () => {},
  getCurrentUser: () => ({ id: 'USR-001', primary_role: 'ROLE-ADMIN' }),
  hasPermission: () => true
};

eval(fs.readFileSync('d:/Projects/ISCM/js/modules/billing.js', 'utf8'));

console.log('--- Step 1: Simulate user state from screenshot ---');
// In screenshot:
// 1. Pratik Kate (JC-EST-EST-PUN-26-003, ₹200.00, Finalized)
// 2. Rushikesh Dhiwar (JC-PUN-26-001, ₹780.00, Paid)
// Both were present in draftBills AND finalBills, causing 4 queue cards!

window.DB.data.draftBills = [
  {
    id: 'DBILL-001',
    draft_bill_no: 'DB-PUN-26-001',
    job_card_no: 'JC-EST-EST-PUN-26-003',
    customer_name: 'Pratik Kate',
    vehicle_reg_no: 'MH12RF3432',
    grand_total: 200,
    status: 'FINALIZED',
    invoice_no: 'INV/MSC1/2026/000003'
  },
  {
    id: 'DBILL-002',
    draft_bill_no: 'DB-PUN-26-002',
    job_card_no: 'JC-PUN-26-001',
    customer_name: 'Rushikesh Dhiwar',
    vehicle_reg_no: 'MH12VV3443',
    grand_total: 780,
    status: 'PAID',
    invoice_no: 'INV/MSC1/2026/000001'
  }
];

window.DB.data.finalBills = [
  {
    id: 'INV-001',
    invoice_no: 'INV/MSC1/2026/000003',
    draft_bill_id: 'DBILL-001',
    job_card_no: 'JC-EST-EST-PUN-26-003',
    customer_name: 'Pratik Kate',
    vehicle_reg_no: 'MH12RF3432',
    grand_total: 200,
    status: 'FINALIZED'
  },
  {
    id: 'INV-002',
    invoice_no: 'INV/MSC1/2026/000001',
    draft_bill_id: 'DBILL-002',
    job_card_no: 'JC-PUN-26-001',
    customer_name: 'Rushikesh Dhiwar',
    vehicle_reg_no: 'MH12VV3443',
    grand_total: 780,
    status: 'PAID'
  }
];

console.log(`Current raw counts: draftBills = ${window.DB.data.draftBills.length}, finalBills = ${window.DB.data.finalBills.length}`);
console.log('Without fix, naive concatenation gives 4 items.');

// Call method on window.BillingModule directly
const testQueue = window.BillingModule.getUnifiedCustomerBillingQueue();
console.log('Resulting queue length from BillingModule:', testQueue.length);
testQueue.forEach((item, idx) => {
  console.log(`  [${idx + 1}] ${item.job_card_no} - ${item.customer_name} - ${item.status} - ₹${item.grand_total}`);
});

// Also test renderCustomerBillingSingleScreen HTML rendering
const renderedHtml = window.BillingModule.renderCustomerBillingSingleScreen();
assert(renderedHtml.includes('📋 Billing Queue'), 'Should render billing queue');
assert(renderedHtml.includes('Pratik Kate'), 'Should render Pratik Kate');
assert(renderedHtml.includes('Rushikesh Dhiwar'), 'Should render Rushikesh Dhiwar');

// Count occurrences of Pratik Kate in the rendered HTML queue cards
const pratikCount = (renderedHtml.match(/Pratik Kate/g) || []).length;
console.log(`Pratik Kate occurrences in single-screen view: ${pratikCount} (expected 2: 1 in left queue card, 1 in right workspace details)`);
assert.strictEqual(pratikCount, 2, 'Pratik Kate should appear only once in queue list and once in details panel');

assert.strictEqual(testQueue.length, 2, 'Queue must have exactly 2 bills instead of 4');
assert.strictEqual(testQueue[0].customer_name, 'Pratik Kate', 'First customer should be Pratik Kate');
assert.strictEqual(testQueue[1].customer_name, 'Rushikesh Dhiwar', 'Second customer should be Rushikesh Dhiwar');
console.log('✔ Screenshot scenario test passed! Deduplication resolved 4 duplicate items down to 2 distinct bills.');

console.log('\n--- Step 2: Test mixed scenario with an active draft + finalized bills ---');
window.DB.data.draftBills.push({
  id: 'DBILL-003',
  draft_bill_no: 'DB-PUN-26-003',
  job_card_no: 'JC-PUN-26-004',
  customer_name: 'Anita Deshmukh',
  vehicle_reg_no: 'MH12CD5678',
  grand_total: 1250,
  status: 'DRAFT'
});

const mixedQueue = window.BillingModule.getUnifiedCustomerBillingQueue();
console.log('Resulting mixed queue length:', mixedQueue.length);
mixedQueue.forEach((item, idx) => {
  console.log(`  [${idx + 1}] ${item.job_card_no} - ${item.customer_name} - [${item._type}] ${item.status} - ₹${item.grand_total}`);
});

assert.strictEqual(mixedQueue.length, 3, 'Mixed queue must have exactly 3 bills (2 finalized + 1 draft)');
assert.strictEqual(mixedQueue[2].customer_name, 'Anita Deshmukh');
assert.strictEqual(mixedQueue[2]._type, 'DRAFT');
console.log('✔ Active unfinalized draft was preserved and added correctly!');

console.log('\n======================================================');
console.log('ALL DEDUPLICATION TESTS PASSED SUCCESSFULLY! 🚀');
console.log('======================================================');

