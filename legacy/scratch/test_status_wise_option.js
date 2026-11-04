// Automated test for Status-Wise Options across Job Card History and Lock Banner
const fs = require('fs');
const path = require('path');

// Mock browser environment
global.window = global;
global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] !== undefined ? this._store[k] : null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; },
  clear() { this._store = {}; }
};

let capturedModalOpts = null;
global.document = {
  activeElement: null,
  getElementById: (id) => {
    if (!global._elements) global._elements = {};
    if (!global._elements[id]) {
      global._elements[id] = { textContent: '', value: '', title: '', style: { setProperty: () => {} }, classList: { add: () => {}, remove: () => {} }, querySelectorAll: () => [] };
    }
    return global._elements[id];
  },
  querySelector: () => ({ style: { setProperty: () => {} }, classList: { add: () => {}, remove: () => {} }, querySelectorAll: () => [], querySelector: () => null }),
  querySelectorAll: () => [],
  addEventListener: () => {}
};

global.alert = () => {};
global.confirm = () => true;

let closeModalCalled = false;
global.State = {
  currentPlantId: 'PLANT-01',
  hasPermission: () => true,
  showToast: () => {},
  showModal: (opt) => {
    capturedModalOpts = opt;
  },
  closeModal: () => {
    closeModalCalled = true;
  }
};

// Load DB
const dbCode = fs.readFileSync(path.join(__dirname, '../js/data/db.js'), 'utf8');
eval(dbCode);

// Load Billing Module
const billingCode = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');
eval(billingCode);

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Test failed: ${message}`);
  }
  passedTests++;
  console.log(`✅ PASS: ${message}`);
}

async function runTests() {
  console.log('--- Starting Status-Wise Option Tests ---');

  // Test 1: Helper function getStatusWiseActionButton for ESTIMATE_PENDING
  const jcEstPending = { id: 'JC-101', job_card_no: 'JC/MSC1/2026/0030', status: 'ESTIMATE_PENDING', vehicle_reg_no: 'MH 12 AC 4378' };
  const btnEstPending = window.BillingModule.getStatusWiseActionButton(jcEstPending, true);
  assert(btnEstPending.includes('📝 Estimate'), `ESTIMATE_PENDING returns '📝 Estimate' button (got: ${btnEstPending})`);
  assert(btnEstPending.includes('actionEstimateFromJobCard'), 'Button calls actionEstimateFromJobCard');

  // Test 2: Helper function getStatusWiseActiveBannerButton for ESTIMATE_PENDING
  const bannerEstPending = window.BillingModule.getStatusWiseActiveBannerButton(jcEstPending);
  assert(bannerEstPending.includes('Estimate ↗'), `Active banner returns Estimate button (got: ${bannerEstPending})`);

  // Test 3: Status READY_FOR_BILLING
  const jcReadyBilling = { id: 'JC-102', job_card_no: 'JC/MSC1/2026/0031', status: 'READY_FOR_BILLING', vehicle_reg_no: 'MH 12 AC 4378' };
  const btnReadyBilling = window.BillingModule.getStatusWiseActionButton(jcReadyBilling, true);
  assert(btnReadyBilling.includes('🧾 Bill'), `READY_FOR_BILLING returns '🧾 Bill' button (got: ${btnReadyBilling})`);
  assert(btnReadyBilling.includes('actionDraftBillFromJobCard'), 'Calls actionDraftBillFromJobCard');

  const bannerReadyBilling = window.BillingModule.getStatusWiseActiveBannerButton(jcReadyBilling);
  assert(bannerReadyBilling.includes('🧾 Go to Billing ↗'), `Active banner returns '🧾 Go to Billing ↗' (got: ${bannerReadyBilling})`);

  // Test 4: Status BILLED
  const jcBilled = { id: 'JC-103', job_card_no: 'JC/MSC1/2026/0032', status: 'BILLED', vehicle_reg_no: 'MH 12 AC 4378' };
  const btnBilled = window.BillingModule.getStatusWiseActionButton(jcBilled, true);
  assert(btnBilled.includes('📑 View Bill'), `BILLED returns '📑 View Bill' button (got: ${btnBilled})`);

  const bannerBilled = window.BillingModule.getStatusWiseActiveBannerButton(jcBilled);
  assert(bannerBilled.includes('📑 Settle Bill ↗'), `Active banner returns '📑 Settle Bill ↗' (got: ${bannerBilled})`);

  // Test 5: Status READY_FOR_DELIVERY
  const jcDelivery = { id: 'JC-104', job_card_no: 'JC/MSC1/2026/0033', status: 'READY_FOR_DELIVERY', vehicle_reg_no: 'MH 12 AC 4378' };
  const btnDelivery = window.BillingModule.getStatusWiseActionButton(jcDelivery, true);
  assert(btnDelivery.includes('🛵 Gate Pass'), `READY_FOR_DELIVERY returns '🛵 Gate Pass' button (got: ${btnDelivery})`);

  const bannerDelivery = window.BillingModule.getStatusWiseActiveBannerButton(jcDelivery);
  assert(bannerDelivery.includes('🛵 Issue Gate Pass ↗'), `Active banner returns '🛵 Issue Gate Pass ↗' (got: ${bannerDelivery})`);

  // Test 6: Status DELIVERED / CLOSED without Bill
  const jcClosedNoBill = { id: 'JC-105', job_card_no: 'JC/MSC1/2026/0034', status: 'CLOSED', vehicle_reg_no: 'MH 12 AC 4378' };
  const btnClosedNoBill = window.BillingModule.getStatusWiseActionButton(jcClosedNoBill, true);
  assert(btnClosedNoBill.includes('🔍 View JC'), `CLOSED without bill returns '🔍 View JC' button (got: ${btnClosedNoBill})`);

  // Test 6b: Past History Job Card WITH Bill created -> returns '📑 View Bill'
  const jcClosedWithBill = { id: 'JC-106', job_card_no: 'JC/MSC1/2026/0040', status: 'CLOSED', invoice_no: 'INV-2026-0040', vehicle_reg_no: 'MH 12 SC 3737' };
  const bill106 = { id: 'BILL-106', invoice_no: 'INV-2026-0040', job_card_id: 'JC-106', job_card_no: 'JC/MSC1/2026/0040', status: 'PAID' };
  window.DB.data.jobCards.push(jcClosedWithBill);
  window.DB.data.finalBills.push(bill106);

  const btnClosedWithBill = window.BillingModule.getStatusWiseActionButton(jcClosedWithBill, true);
  assert(btnClosedWithBill.includes('📑 View Bill'), `Past History Job Card WITH Bill returns '📑 View Bill' (got: ${btnClosedWithBill})`);
  assert(btnClosedWithBill.includes("viewBillForJobCard('JC-106')"), 'Calls viewBillForJobCard');

  // Test 6c: viewBillForJobCard opens in Bill screen
  window.BillingModule.viewBillForJobCard('JC-106');
  assert(window.BillingModule.activeBillingBillId === 'BILL-106', 'viewBillForJobCard selects activeBillingBillId for Bill screen');

  // Test 7: Integration in renderVehicleHistoryInModal
  if (!global._elements) global._elements = {};
  const histContainer = { innerHTML: '', style: {} };
  global._elements['new-jc-history-container'] = histContainer;

  window.BillingModule.renderVehicleHistoryInModal([jcEstPending], null, 'MH12AC4378');
  assert(histContainer.innerHTML.includes('Action / Details'), 'Table header contains "Action / Details"');
  assert(histContainer.innerHTML.includes('📝 Estimate'), 'History table row contains "📝 Estimate" button for ESTIMATE_PENDING');
  assert(histContainer.innerHTML.includes('togglePastJcDetailsRow'), 'Accordion toggle button is also present');

  // Test 8: actionEstimateFromJobCard closes modal
  closeModalCalled = false;
  window.DB.data = {
    jobCards: [jcEstPending],
    billingEstimates: [],
    plants: [{ id: 'PLANT-01', code: 'MSC1', name: 'Pune', is_active: true }]
  };
  window.BillingModule.actionEstimateFromJobCard('JC-101');
  assert(closeModalCalled === true, 'actionEstimateFromJobCard closes the active modal');
  assert(window.BillingModule.activeTab === 'ESTIMATES', 'actionEstimateFromJobCard switches activeTab to ESTIMATES');

  console.log(`\n========================================`);
  console.log(`All ${passedTests}/${totalTests} tests passed successfully!`);
  console.log(`========================================\n`);
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
