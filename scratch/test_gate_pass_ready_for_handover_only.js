const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('================================================================');
console.log('TEST: Gate Pass Allowed ONLY for READY FOR HANDOVER Customers');
console.log('      & Automatic Duplicate Prevention Verification');
console.log('================================================================');

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
    querySelectorAll: () => [],
    createElement: () => ({ setAttribute: () => {}, appendChild: () => {}, click: () => {} }),
    body: { appendChild: () => {}, removeChild: () => {}, insertAdjacentHTML: () => {} }
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
  closeModal: () => { lastModal = null; }
};

vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('js/data/mock-data.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('js/data/db.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('js/modules/doc-series-master.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('js/modules/billing.js', 'utf8'), sandbox);

const mod = sandbox.window.BillingModule;
const DB = sandbox.window.DB;

// Initialize clean data
DB.data.jobCards = [
  {
    id: 'JC-UNREADY-01',
    job_card_no: 'JC/MSC1/2026/000010',
    customer_name: 'Unready Customer 1',
    vehicle_reg_no: 'MH12UN0001',
    status: 'ESTIMATE_PENDING',
    branch_id: 'PLANT-01'
  },
  {
    id: 'JC-UNREADY-02',
    job_card_no: 'JC/MSC1/2026/000020',
    customer_name: 'Unready Customer 2',
    vehicle_reg_no: 'MH12UN0002',
    status: 'IN_PROGRESS',
    branch_id: 'PLANT-01'
  }
];
DB.data.finalBills = [];
DB.data.vehicleDeliveries = [];

// -------------------------------------------------------------
// Test 1: Gate Pass NOT allowed when customers are NOT ready for handover
// -------------------------------------------------------------
console.log('\n--- 1. Testing Gate Pass blocked when no customers are Ready for Handover ---');
mod.showNewGatePassModal();
assert(lastModal, 'Modal should open');
assert(lastModal.contentHtml.includes('No Customers Ready for Handover'), 'Must show No Customers Ready for Handover');
assert(!lastModal.contentHtml.includes('new-gp-delivery-select'), 'Must NOT display delivery selector when none ready');
console.log('✓ Gate Pass blocked for unready customers (ESTIMATE_PENDING, IN_PROGRESS).');

// -------------------------------------------------------------
// Test 2: Settled customer becomes READY FOR HANDOVER & selectable
// -------------------------------------------------------------
console.log('\n--- 2. Testing Settled Customer becomes Ready for Handover ---');
const readyJc = {
  id: 'JC-READY-01',
  job_card_no: 'JC/MSC1/2026/000030',
  customer_name: 'Rushikesh Dhiwar',
  customer_mobile: '8762345676',
  vehicle_reg_no: 'MH12AC4335',
  vehicle_model: 'Bajaj Pulsar 150',
  status: 'READY_FOR_DELIVERY',
  payment_status: 'PAID',
  invoice_no: 'INV/MSC1/2026/000001',
  branch_id: 'PLANT-01'
};
const readyBill = {
  id: 'BILL-01',
  invoice_no: 'INV/MSC1/2026/000001',
  job_card_id: readyJc.id,
  job_card_no: readyJc.job_card_no,
  customer_name: readyJc.customer_name,
  vehicle_reg_no: readyJc.vehicle_reg_no,
  status: 'PAID',
  balance_due: 0
};
DB.upsert('jobCards', readyJc);
DB.upsert('finalBills', readyBill);

mod.syncEligibleDeliveries();
const readyDels = DB.getAll('vehicleDeliveries').filter(d => d.status === 'READY_FOR_DELIVERY');
assert.strictEqual(readyDels.length, 1, 'Exactly 1 delivery should be in READY_FOR_DELIVERY');
assert.strictEqual(readyDels[0].customer_name, 'Rushikesh Dhiwar');

// Open modal now that customer is ready
mod.showNewGatePassModal();
assert(lastModal.contentHtml.includes('Rushikesh Dhiwar'), 'Modal must list ready customer Rushikesh Dhiwar');
assert(lastModal.contentHtml.includes('MH12AC4335'), 'Modal must show vehicle reg MH12AC4335');
assert(lastModal.contentHtml.includes('INV/MSC1/2026/000001'), 'Modal must show invoice INV/MSC1/2026/000001');
assert(!lastModal.contentHtml.includes('Unready Customer'), 'Modal must NOT include unready customers');
console.log('✓ Only the Ready for Handover customer appears in Gate Pass modal!');

// -------------------------------------------------------------
// Test 3: Issue Gate Pass without creating duplicates
// -------------------------------------------------------------
console.log('\n--- 3. Testing Gate Pass issuance updates existing record without duplicate ---');
domElements['new-gp-delivery-select'] = { value: readyDels[0].id };
domElements['new-gp-del-id'] = { value: readyDels[0].id };
domElements['new-gp-jc'] = { value: readyJc.id };
domElements['new-gp-date'] = { value: '2026-10-16T11:30' };
domElements['new-gp-remarks'] = { value: 'Vehicle delivered in good order', trim: () => 'Vehicle delivered in good order' };
domElements['chk-parts'] = { checked: true };
domElements['chk-ack'] = { checked: true };

mod.saveGatePass();

const allDels = DB.getAll('vehicleDeliveries');
assert.strictEqual(allDels.length, 1, `Must have exactly 1 delivery record, found ${allDels.length}`);
assert.strictEqual(allDels[0].status, 'DELIVERED', 'Status must be DELIVERED');
assert(allDels[0].gate_pass_no.startsWith('GP/'), `Gate Pass must be generated: ${allDels[0].gate_pass_no}`);

const closedJc = DB.getById('jobCards', readyJc.id);
assert.strictEqual(closedJc.status, 'CLOSED', 'Job card must be CLOSED');
assert.strictEqual(closedJc.gate_pass_no, allDels[0].gate_pass_no);
console.log(`✓ Gate pass ${allDels[0].gate_pass_no} successfully issued and Job Card closed.`);

// -------------------------------------------------------------
// Test 4: Deduplication of existing corrupted duplicate data (user screenshot scenario)
// -------------------------------------------------------------
console.log('\n--- 4. Testing Deduplication of existing user duplicate entries ---');
// Inject duplicate user rows from screenshot
DB.data.vehicleDeliveries = [
  {
    id: 'DEL-1',
    gate_pass_no: 'GP/MSC1/2026/000007',
    job_card_no: 'JC/MSC1/2026/0007',
    invoice_no: 'INV/MSC1/2026/000001',
    customer_name: 'Rushikesh Dhiwar',
    vehicle_reg_no: 'MH12AC4335',
    status: 'DELIVERED'
  },
  {
    id: 'DEL-2',
    gate_pass_no: 'GP/MSC1/2026/000006',
    job_card_no: 'JC/MSC1/2026/0008',
    invoice_no: 'INV/MSC1/2026/000001',
    customer_name: 'Sagar Sabale',
    vehicle_reg_no: 'MH14BH4335',
    status: 'DELIVERED'
  },
  {
    id: 'DEL-3',
    gate_pass_no: 'GP/MSC1/2026/000005',
    job_card_no: 'JC/MSC1/2026/000001',
    invoice_no: 'INV/MSC1/2026/000001',
    customer_name: 'Rushikesh Dhiwar',
    vehicle_reg_no: 'MH12AC4335',
    status: 'DELIVERED'
  },
  {
    id: 'DEL-4',
    gate_pass_no: 'Pending Gate Pass',
    job_card_no: 'JC-EST-EST/MSC1/2026/000002',
    invoice_no: 'INV/MSC1/2026/000001',
    customer_name: 'Rushikesh Dhiwar',
    vehicle_reg_no: 'MH12AC4335',
    status: 'READY_FOR_DELIVERY'
  }
];

mod.cleanDuplicateDeliveries();
const cleanedDels = DB.getAll('vehicleDeliveries');

// Rushikesh Dhiwar duplicate delivered and duplicate pending must be purged:
const rushiDels = cleanedDels.filter(d => d.customer_name === 'Rushikesh Dhiwar');
const sagarDels = cleanedDels.filter(d => d.customer_name === 'Sagar Sabale');

assert.strictEqual(rushiDels.length, 1, `Rushikesh Dhiwar must have exactly 1 record, found ${rushiDels.length}`);
assert.strictEqual(sagarDels.length, 1, `Sagar Sabale must have exactly 1 record, found ${sagarDels.length}`);
assert.strictEqual(cleanedDels.length, 2, `Total deliveries should be deduplicated to 2, found ${cleanedDels.length}`);

// No pending delivery left because the vehicle/invoice has already been delivered
assert(!cleanedDels.some(d => d.gate_pass_no === 'Pending Gate Pass'), 'No dangling Pending Gate Pass should remain');
console.log('✓ Multiple duplicate entries successfully deduplicated and reconciled!');

console.log('\n================================================================');
console.log('🎉 ALL GATE PASS READY-FOR-HANDOVER & DEDUPLICATION TESTS PASSED!');
console.log('================================================================\n');
