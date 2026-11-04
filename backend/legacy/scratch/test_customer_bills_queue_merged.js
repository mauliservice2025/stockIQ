const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

console.log('================================================================');
console.log('TESTING MERGED CUSTOMER BILLS QUEUE WITH SEARCH BILL FUNCTIONALITY');
console.log('================================================================\n');

// Mock data
const mockDbData = {
  vehicles: [
    { id: 'VEH-01', vehicle_reg_no: 'MH12AC4335', model_name: 'Honda Activa', customer_name: 'Pravin S Patil' },
    { id: 'VEH-02', vehicle_reg_no: 'MH12PL1234', model_name: 'Honda Activa', customer_name: 'Rajesh Sesi' },
    { id: 'VEH-03', vehicle_reg_no: 'MH12SC3737', model_name: 'Yamaha Ray', customer_name: 'Rushikesh Dhiwar' }
  ],
  jobCards: [
    { id: 'JC-01', job_card_no: 'JC/MSC1/2026/0038', vehicle_reg_no: 'MH12AC4335', customer_name: 'Pravin S Patil' },
    { id: 'JC-02', job_card_no: 'JC/MSC1/2026/0039', vehicle_reg_no: 'MH12PL1234', customer_name: 'Rajesh Sesi' },
    { id: 'JC-03', job_card_no: 'JC/MSC1/2026/0040', vehicle_reg_no: 'MH12SC3737', customer_name: 'Rushikesh Dhiwar' }
  ],
  billingEstimates: [
    { id: 'EST-01', estimate_no: 'EST/MSC1/2026/0826-R3', job_card_id: 'JC-01' },
    { id: 'EST-02', estimate_no: 'EST/MSC1/2026/0827', job_card_id: 'JC-02' },
    { id: 'EST-03', estimate_no: 'EST/MSC1/2026/0828', job_card_id: 'JC-03' }
  ],
  draftBills: [
    {
      id: 'DB-01',
      draft_bill_no: 'DB/MSC1/2026/0030',
      job_card_no: 'JC/MSC1/2026/0038',
      estimate_no: 'EST/MSC1/2026/0826-R3',
      customer_name: 'Pravin S Patil',
      customer_cin: 'CIN/MSC/2026/000036',
      customer_mobile: '9838462423',
      vehicle_reg_no: 'MH12AC4335',
      vehicle_model: 'Honda Activa',
      status: 'DRAFT',
      subtotal: 1799,
      discount_amount: 0,
      total_tax: 0,
      grand_total: 1799,
      net_payable: 1799,
      amount_received: 0,
      balance_due: 1799,
      payment_mode: 'Cash',
      draft_date: '2026-10-27'
    }
  ],
  finalBills: [
    {
      id: 'FB-01',
      invoice_no: 'INV/MSC1/2026/0022',
      job_card_no: 'JC/MSC1/2026/0038',
      estimate_no: 'EST/MSC1/2026/0826-R3',
      customer_name: 'Pravin S Patil',
      customer_cin: 'CIN/MSC/2026/000036',
      customer_mobile: '9838462423',
      vehicle_reg_no: 'MH12AC4335',
      vehicle_model: 'Honda Activa',
      status: 'PAID',
      subtotal: 1799,
      discount_amount: 0,
      total_tax: 0,
      grand_total: 1799,
      net_payable: 1799,
      amount_paid: 1799,
      amount_received: 1799,
      balance_amount: 0,
      balance_due: 0,
      payment_mode: 'UPI',
      invoice_date: '2026-10-27'
    },
    {
      id: 'FB-02',
      invoice_no: 'INV/MSC1/2026/0023',
      job_card_no: 'JC/MSC1/2026/0039',
      estimate_no: 'EST/MSC1/2026/0827',
      customer_name: 'Rajesh Sesi',
      customer_cin: 'CIN/MSC/2026/000034',
      customer_mobile: '9876543456',
      vehicle_reg_no: 'MH12PL1234',
      vehicle_model: 'Honda Activa',
      status: 'PARTIALLY_PAID',
      subtotal: 1099,
      discount_amount: 0,
      total_tax: 0,
      grand_total: 1099,
      net_payable: 1099,
      amount_paid: 999,
      amount_received: 999,
      balance_amount: 100,
      balance_due: 100,
      payment_mode: 'UPI',
      invoice_date: '2026-10-27'
    },
    {
      id: 'FB-03',
      invoice_no: 'INV/MSC1/2026/0024',
      job_card_no: 'JC/MSC1/2026/0040',
      estimate_no: 'EST/MSC1/2026/0828',
      customer_name: 'Rushikesh Dhiwar',
      customer_cin: 'CIN/MSC/2026/000035',
      customer_mobile: '9866435234',
      vehicle_reg_no: 'MH12SC3737',
      vehicle_model: 'Yamaha Ray',
      status: 'PARTIALLY_PAID',
      subtotal: 2948,
      discount_amount: 0,
      total_tax: 0,
      grand_total: 2948,
      net_payable: 2948,
      amount_paid: 948,
      amount_received: 948,
      balance_amount: 2000,
      balance_due: 2000,
      payment_mode: 'UPI',
      invoice_date: '2026-10-27'
    }
  ]
};

// Minimal DOM & Browser environment
const domElements = {};
global.window = global;
global.document = {
  body: {
    appendChild: () => {},
    classList: { add() {}, remove() {}, toggle() {} }
  },
  getElementById: (id) => domElements[id] || null,
  querySelectorAll: (selector) => [],
  addEventListener: () => {},
  removeEventListener: () => {}
};

global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; }
};

global.window.DB = {
  data: mockDbData,
  getAll: (table) => mockDbData[table] || [],
  getById: (table, id) => (mockDbData[table] || []).find(r => r.id === id),
  upsert: (table, record) => {
    if (!mockDbData[table]) mockDbData[table] = [];
    const idx = mockDbData[table].findIndex(r => r.id === record.id);
    if (idx >= 0) mockDbData[table][idx] = { ...record };
    else mockDbData[table].push({ ...record });
  },
  emitChange: () => {},
  saveData: () => {}
};

global.window.State = {
  showToast: (msg, type) => console.log(`[TOAST (${type})]: ${msg}`),
  closeModal: () => {}
};

// Load billing.js
const billingCode = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');
eval(billingCode);

// Test 1: Queue initial render contains all merged elements from Search Bill modal
console.log('Testing Test 1: Customer Bills Queue HTML Structure and Controls');
window.BillingModule.activeBillingBillId = null;
window.BillingModule.customerBillingStatusFilter = 'ALL';
window.BillingModule.customerBillingPaymentFilter = 'ALL';
window.BillingModule.customerBillingViewMode = 'TABLE';
window.BillingModule.customerBillingSearch = '';

const queueHtml = window.BillingModule.renderCustomerBillsQueueScreen();

// Verify Header
assert(queueHtml.includes('Customer Bills Queue'), 'Header must contain Customer Bills Queue');
assert(!queueHtml.includes('📑 Customer Bills Queue'), 'Header must NOT have icon 📑');
assert(!queueHtml.includes('4 Total'), 'Header must NOT display Total badge');
assert(!queueHtml.includes('Select a bill from the queue below to view details'), 'Header must NOT display subtitle description');
assert(!queueHtml.includes('🔍 Search Bill'), 'Header must NOT display Search Bill button');

// Verify Filter Tabs (Status pills matching Search Bill modal)
assert(queueHtml.includes('id="queue-status-all"'), 'Must contain All status pill');
assert(queueHtml.includes('✓ Fully Settled'), 'Must contain Fully Settled pill');
assert(queueHtml.includes('⏳ Partially Settled'), 'Must contain Partially Settled pill');
assert(queueHtml.includes('⚠️ Pending'), 'Must contain Pending pill');

// Verify View Mode Toggle
assert(queueHtml.includes('id="btn-queue-view-table"'), 'Must contain Table View button');
assert(queueHtml.includes('id="btn-queue-view-cards"'), 'Must contain Card View button');

// Verify Payment Mode Filter Dropdown
assert(queueHtml.includes('id="queue-bill-pay-filter"'), 'Must contain Payment Mode filter dropdown');
assert(queueHtml.includes('<option value="ALL" selected>All Modes</option>'), 'Default mode must be All Modes');
assert(queueHtml.includes('value="Cash"'), 'Must contain Cash mode');
assert(queueHtml.includes('value="UPI"'), 'Must contain UPI mode');

// Verify Search Input
assert(queueHtml.includes('id="billing-queue-search-input"'), 'Must contain search input');

// Verify 11 Table Columns (Bill Amt, Disc, Tax removed)
assert(queueHtml.includes('>Sr<'), 'Table must contain Sr header');
assert(queueHtml.includes('>Bill No / Date<'), 'Table must contain Bill No / Date header');
assert(queueHtml.includes('>Job Card / Est<'), 'Table must contain Job Card / Est header');
assert(queueHtml.includes('>Customer / CIN<'), 'Table must contain Customer / CIN header');
assert(queueHtml.includes('>Vehicle<'), 'Table must contain Vehicle header');
assert(!queueHtml.includes('>Bill Amt<'), 'Table must NOT contain Bill Amt header');
assert(!queueHtml.includes('>Disc<'), 'Table must NOT contain Disc header');
assert(!queueHtml.includes('>Tax<'), 'Table must NOT contain Tax header');
assert(queueHtml.includes('>Net Bill<'), 'Table must contain Net Bill header');
assert(queueHtml.includes('>Paid<'), 'Table must contain Paid header');
assert(queueHtml.includes('>Balance<'), 'Table must contain Balance header');
assert(queueHtml.includes('>Status<'), 'Table must contain Status header');
assert(queueHtml.includes('>Mode<'), 'Table must contain Mode header');
assert(queueHtml.includes('>Action<'), 'Table must contain Action header');

// Verify Records present in Table
assert(queueHtml.includes('INV/MSC1/2026/0022'), 'Must list bill 0022');
assert(queueHtml.includes('INV/MSC1/2026/0023'), 'Must list bill 0023');
assert(queueHtml.includes('INV/MSC1/2026/0024'), 'Must list bill 0024');
assert(queueHtml.includes('DB/MSC1/2026/0030'), 'Must list draft bill 0030');
assert(queueHtml.includes('Pravin S Patil'), 'Must list Pravin S Patil');
assert(queueHtml.includes('Rajesh Sesi'), 'Must list Rajesh Sesi');
assert(queueHtml.includes('Rushikesh Dhiwar'), 'Must list Rushikesh Dhiwar');
assert(queueHtml.includes('Showing 4 of 4 total bill records'), 'Status footer must display correct count');

console.log('✓ Test 1 Passed: Queue rendered with labels, columns, and Search Bill removed.\n');

// Test 2: Status filtering
console.log('Testing Test 2: Status filtering (Fully Settled, Partially Settled, Pending)');
window.BillingModule.customerBillingStatusFilter = 'FULLY_SETTLED';
const fullySettledBills = window.BillingModule.getFilteredCustomerBillingQueue();
assert.strictEqual(fullySettledBills.length, 1, 'Should find 1 Fully Settled bill');
assert.strictEqual(fullySettledBills[0].invoice_no, 'INV/MSC1/2026/0022');

window.BillingModule.customerBillingStatusFilter = 'PARTIALLY_SETTLED';
const partialBills = window.BillingModule.getFilteredCustomerBillingQueue();
assert.strictEqual(partialBills.length, 2, 'Should find 2 Partially Settled bills');

window.BillingModule.customerBillingStatusFilter = 'PENDING';
const pendingBills = window.BillingModule.getFilteredCustomerBillingQueue();
assert.strictEqual(pendingBills.length, 1, 'Should find 1 Pending bill');
assert.strictEqual(pendingBills[0].draft_bill_no, 'DB/MSC1/2026/0030');
console.log('✓ Test 2 Passed: Status filtering correctly partitions bills into Fully Settled, Partially Settled, and Pending.\n');

// Test 3: Payment Mode filtering
console.log('Testing Test 3: Payment mode filtering');
window.BillingModule.customerBillingStatusFilter = 'ALL';
window.BillingModule.customerBillingPaymentFilter = 'Cash';
const cashBills = window.BillingModule.getFilteredCustomerBillingQueue();
assert.strictEqual(cashBills.length, 1, 'Should find 1 Cash bill');
assert.strictEqual(cashBills[0].id, 'DB-01');

window.BillingModule.customerBillingPaymentFilter = 'UPI';
const upiBills = window.BillingModule.getFilteredCustomerBillingQueue();
assert.strictEqual(upiBills.length, 3, 'Should find 3 UPI bills');
console.log('✓ Test 3 Passed: Payment mode filtering correctly isolates Cash and UPI bills.\n');

// Test 4: Live search filtering
console.log('Testing Test 4: Search term filtering');
window.BillingModule.customerBillingPaymentFilter = 'ALL';
window.BillingModule.customerBillingSearch = 'Yamaha';
const yamahaBills = window.BillingModule.getFilteredCustomerBillingQueue();
assert.strictEqual(yamahaBills.length, 1, 'Search for Yamaha should return 1 bill');
assert.strictEqual(yamahaBills[0].customer_name, 'Rushikesh Dhiwar');

window.BillingModule.customerBillingSearch = '9838462423';
const mobileBills = window.BillingModule.getFilteredCustomerBillingQueue();
assert.strictEqual(mobileBills.length, 2, 'Search by mobile should return 2 bills for Pravin');
console.log('✓ Test 4 Passed: Search filtering by vehicle model and customer mobile works as expected.\n');

// Test 5: Card View mode
console.log('Testing Test 5: Card View mode rendering');
window.BillingModule.customerBillingSearch = '';
window.BillingModule.customerBillingViewMode = 'CARDS';
const cardsHtml = window.BillingModule.renderCustomerBillsQueueScreen();
assert(cardsHtml.includes('btn-modal-view-cards') || cardsHtml.includes('btn-queue-view-cards'), 'Card view toggle present');
assert(cardsHtml.includes('Net Bill'), 'Cards must contain Net Bill summary');
assert(cardsHtml.includes('Paid'), 'Cards must contain Paid summary');
assert(cardsHtml.includes('Balance'), 'Cards must contain Balance summary');
assert(cardsHtml.includes('Open &rarr;'), 'Cards must contain Open action button');
console.log('✓ Test 5 Passed: Card view renders interactive card preview grid with financial metrics and actions.\n');

// Test 6: Selecting bill from queue opens in Customer Billing single-screen workspace
console.log('Testing Test 6: Select bill opens in Customer Billing Workspace');
window.BillingModule.selectCustomerBillingBill('FB-01');
assert.strictEqual(window.BillingModule.activeBillingBillId, 'FB-01');
assert.strictEqual(window.BillingModule._explicitNavigationContext, true);
console.log('✓ Test 6 Passed: Selecting bill sets activeBillingBillId and navigation context.\n');

console.log('================================================================');
console.log('ALL TESTS PASSED SUCCESSFULLY! (6/6)');
console.log('================================================================');
