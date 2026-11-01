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

let lastModalOptions = null;
const sandbox = {
  window: {
    location: { hash: '' }
  },
  localStorage: mockLocalStorage,
  document: {
    getElementById: () => null,
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
  showModal: (opts) => {
    lastModalOptions = opts;
  },
  closeModal: () => {}
};

vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('js/data/mock-data.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('js/data/db.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('js/modules/doc-series-master.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('js/modules/billing.js', 'utf8'), sandbox);

console.log('\n--- TEST SUITE: Job Card Number Display in Gate Pass Modal ---');

// Test Case 1: Job Cards created with initial status ESTIMATE_PENDING (like real user flow)
console.log('\n[Test 1] Testing Job Card with status ESTIMATE_PENDING appears in Gate Pass modal...');
sandbox.window.DB.data.jobCards = [
  {
    id: 'JC-101',
    job_card_no: 'JC/MSC1/2026/000001',
    customer_name: 'Rajesh Patil',
    vehicle_reg_no: 'MH12AB1234',
    status: 'ESTIMATE_PENDING',
    branch_id: 'PLANT-01'
  },
  {
    id: 'JC-102',
    job_card_no: 'JC/MSC1/2026/000002',
    customer_name: 'Pooja Kadam',
    vehicle_reg_no: 'MH14XY5678',
    status: 'IN_PROGRESS',
    branch_id: 'PLANT-01'
  }
];
sandbox.window.DB.data.vehicleDeliveries = [];

sandbox.window.BillingModule.showNewGatePassModal();

assert(lastModalOptions !== null, 'Modal should be shown');
assert(lastModalOptions.contentHtml.includes('JC/MSC1/2026/000001'), 'Dropdown should include JC/MSC1/2026/000001');
assert(lastModalOptions.contentHtml.includes('Rajesh Patil'), 'Dropdown should include customer Rajesh Patil');
assert(lastModalOptions.contentHtml.includes('MH12AB1234'), 'Dropdown should include vehicle MH12AB1234');
assert(lastModalOptions.contentHtml.includes('JC/MSC1/2026/000002'), 'Dropdown should include JC/MSC1/2026/000002');
assert(lastModalOptions.contentHtml.includes('2 Job Cards available'), 'Dropdown header should show available count');
console.log('✅ Test 1 Passed: Both ESTIMATE_PENDING and IN_PROGRESS Job Cards show their Job Card numbers in dropdown!');

// Test Case 2: Preselection by job_card_no
console.log('\n[Test 2] Testing preselection by job_card_no...');
sandbox.window.BillingModule.showNewGatePassModal('JC/MSC1/2026/000002');
assert(lastModalOptions.contentHtml.includes('value="JC-102" selected'), 'Should select JC-102');
console.log('✅ Test 2 Passed: Preselected by job_card_no properly selected in dropdown!');

// Test Case 3: Empty Job Cards in DB
console.log('\n[Test 3] Testing empty Job Cards list handles gracefully without blank select...');
sandbox.window.DB.data.jobCards = [];
sandbox.window.BillingModule.showNewGatePassModal();
assert(lastModalOptions.contentHtml.includes('No Job Cards available in system'), 'Should show informative message');
assert(lastModalOptions.contentHtml.includes('+ Create Job Card'), 'Should show + Create Job Card button');
console.log('✅ Test 3 Passed: Empty DB displays clear informative option and create button!');

console.log('\n🎉 ALL 3 TESTS PASSED PERFECTLY!\n');
