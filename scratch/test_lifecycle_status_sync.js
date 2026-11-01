const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const localStorageData = {};
const mockLocalStorage = {
  getItem: (k) => localStorageData[k] || null,
  setItem: (k, v) => { localStorageData[k] = String(v); },
  removeItem: (k) => { delete localStorageData[k]; },
  clear: () => { Object.keys(localStorageData).forEach(k => delete localStorageData[k]); }
};

let lastModal = null;
const domElements = {};
const sandbox = {
  window: {
    location: { hash: '' }
  },
  localStorage: mockLocalStorage,
  document: {
    getElementById: (id) => domElements[id] || null,
    querySelector: () => null,
    querySelectorAll: () => []
  },
  alert: (msg) => console.log('[ALERT]:', msg),
  confirm: () => true,
  console,
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  Date
};
sandbox.window.localStorage = mockLocalStorage;
sandbox.window.window = sandbox.window;
sandbox.window.State = {
  currentPlantId: 'PLANT-01',
  currentUser: { full_name: 'Santosh Shinde', name: 'Santosh Shinde', role: 'ADMIN' },
  showToast: (msg, type) => console.log(`[TOAST] (${type}): ${msg}`),
  showModal: (opts) => { lastModal = opts; },
  closeModal: () => {}
};

vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('js/data/mock-data.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('js/data/db.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('js/modules/doc-series-master.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('js/modules/billing.js', 'utf8'), sandbox);

console.log('\n=== TEST SUITE: WORKSHOP LIFECYCLE STATUS SYNCHRONIZATION ===');

// Setup: Create a Job Card with initial ESTIMATE_PENDING status (matches user's screenshot)
const testJc = {
  id: 'JC-PULSAR-001',
  job_card_no: 'JC/MSC1/2026/000001',
  customer_name: 'Sanket Borole',
  customer_mobile: '9822123456',
  customer_cin: 'CIN-MSC1-00001',
  vehicle_reg_no: 'MH12AC4335',
  vehicle_model: 'Bajaj Pulsar 150',
  service_type: 'General Service',
  odometer_km: 45677,
  fuel_level: '50%',
  technician_name: 'Sanket Borole',
  status: 'ESTIMATE_PENDING',
  parts_required: [{ item_name: 'Engine Oil', qty: 1, rate: 450 }],
  labour_tasks: [{ desc: 'General Service Labour', hours: 2, rate: 250, amount: 500 }]
};

sandbox.window.DB.data.jobCards = [testJc];
sandbox.window.DB.data.billingEstimates = [];
sandbox.window.DB.data.draftBills = [];
sandbox.window.DB.data.finalBills = [];
sandbox.window.DB.data.vehicleDeliveries = [];

// Step 1: Create Estimate
console.log('\n[Step 1] Creating Estimate for Job Card...');
sandbox.window.BillingModule.createEstimateForJobCardRecord(testJc.id);
let activeEst = sandbox.window.BillingModule.getActiveEstimate();
assert(activeEst !== null, 'Active estimate should be created');
assert.strictEqual(activeEst.vehicle_reg_no, 'MH12AC4335');
console.log('✅ Step 1: Estimate initiated successfully!');

// Save estimate draft
sandbox.window.BillingModule.saveDraftEstimate();
activeEst = sandbox.window.BillingModule.getActiveEstimate();
assert.strictEqual(activeEst.status, 'DRAFT');
let currentJc = sandbox.window.DB.getById('jobCards', testJc.id);
console.log(`Current Job Card status after estimate created: ${currentJc.status}`);

// Step 2: Customer Approves Estimate
console.log('\n[Step 2] Customer Approves Estimate...');
sandbox.window.BillingModule.customerApproveEstimate();
activeEst = sandbox.window.BillingModule.getActiveEstimate();
assert.strictEqual(activeEst.status, 'CUSTOMER_APPROVED');

currentJc = sandbox.window.DB.getById('jobCards', testJc.id);
assert.strictEqual(currentJc.status, 'ESTIMATE_APPROVED', `Expected ESTIMATE_APPROVED, got ${currentJc.status}`);
console.log(`✅ Step 2: Customer approved estimate -> Job Card status updated to ${currentJc.status}!`);

// Step 3: Convert Estimate to Draft Bill
console.log('\n[Step 3] Convert Estimate to Draft Bill...');
sandbox.window.BillingModule.convertEstimateToDraftBill();
currentJc = sandbox.window.DB.getById('jobCards', testJc.id);
assert.strictEqual(currentJc.status, 'READY_FOR_BILLING', `Expected READY_FOR_BILLING, got ${currentJc.status}`);
console.log(`✅ Step 3: Converted to Draft Bill -> Job Card status updated to ${currentJc.status}!`);

// Step 4: Finalize Bill and Settle Payment
console.log('\n[Step 4] Finalize Bill and Settle Payment...');
const draft = sandbox.window.DB.getAll('draftBills')[0];
assert(draft !== null, 'Draft bill should exist');

// Finalize Draft Bill
sandbox.window.BillingModule.finalizeDraftBill(draft.id);
const finalBill = sandbox.window.DB.getAll('finalBills')[0];
assert(finalBill !== null, 'Final bill should be generated');

// Record Payment to settle bill completely
domElements['pay-amount'] = { value: String(finalBill.balance_due || finalBill.net_payable || 950) };
domElements['pay-mode'] = { value: 'Cash' };
domElements['pay-ref'] = { value: 'REC-1234' };
sandbox.window.BillingModule.submitPayment(finalBill.id);

currentJc = sandbox.window.DB.getById('jobCards', testJc.id);
assert.strictEqual(currentJc.status, 'READY_FOR_DELIVERY', `Expected READY_FOR_DELIVERY, got ${currentJc.status}`);
assert.strictEqual(currentJc.payment_status, 'PAID');
console.log(`✅ Step 4: Bill Settled -> Job Card status updated to ${currentJc.status}!`);

// Step 5: Test Auto-Reconciliation of Stale Data (The exact scenario in user's screenshot)
console.log('\n[Step 5] Testing syncAllJobCardStatuses automatically fixes stale ESTIMATE_PENDING status...');
// Simulate user having stale ESTIMATE_PENDING in DB while estimate is approved & bill settled
currentJc.status = 'ESTIMATE_PENDING';
sandbox.window.DB.upsert('jobCards', currentJc);
assert.strictEqual(sandbox.window.DB.getById('jobCards', testJc.id).status, 'ESTIMATE_PENDING');

// Run sync or render Job Cards tab
const htmlOutput = sandbox.window.BillingModule.renderJobCardsTab();
const reconciledJc = sandbox.window.DB.getById('jobCards', testJc.id);
assert.strictEqual(reconciledJc.status, 'READY_FOR_DELIVERY', `Expected auto-reconciled to READY_FOR_DELIVERY, got ${reconciledJc.status}`);
assert(htmlOutput.includes('READY FOR DELIVERY'), 'Job Card table HTML should display READY FOR DELIVERY badge');
assert(htmlOutput.includes('⚡ Gate Pass'), 'Job Card row should show ⚡ Gate Pass button for immediate handover');
console.log('✅ Step 5: Auto-reconciliation fixed stale ESTIMATE_PENDING -> READY FOR DELIVERY badge rendered in table!');

// Step 6: Complete Gate Pass / Handover
console.log('\n[Step 6] Complete Handover & Close Job Card...');
domElements['new-gp-no'] = { value: 'GP/MSC1/2026/000001' };
domElements['new-gp-date'] = { value: '2026-10-16T11:00' };
domElements['new-gp-jc'] = { value: testJc.id };
domElements['new-gp-remarks'] = { value: 'Done' };
domElements['new-gp-inv'] = { value: finalBill.invoice_no };
domElements['chk-parts'] = { checked: true };
domElements['chk-ack'] = { checked: true };

sandbox.window.BillingModule.saveGatePass();
const closedJc = sandbox.window.DB.getById('jobCards', testJc.id);
assert.strictEqual(closedJc.status, 'CLOSED', `Expected CLOSED, got ${closedJc.status}`);
console.log(`✅ Step 6: Handover completed -> Job Card is CLOSED (${closedJc.gate_pass_no})!`);

console.log('\n🎉 ALL LIFECYCLE TESTS PASSED 100% SUCCESSFULLY!\n');
