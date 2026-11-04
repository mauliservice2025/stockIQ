const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('================================================================');
console.log('TEST: Remove All Customers Across Workshop & Database');
console.log('================================================================');

const localStorageData = {
  iscm_db: JSON.stringify({
    jobCards: [{ id: 'JC-1', customer_name: 'Rushikesh Dhiwar', status: 'ACTIVE' }],
    billingEstimates: [{ id: 'EST-1', customer_name: 'Rushikesh Dhiwar' }],
    draftBills: [{ id: 'DB-1', customer_name: 'Rushikesh Dhiwar' }],
    finalBills: [{ id: 'INV-1', customer_name: 'Rushikesh Dhiwar', invoice_no: 'INV-001' }],
    vehicleDeliveries: [{ id: 'DEL-1', customer_name: 'Rushikesh Dhiwar' }],
    customers: [{ id: 'CUST-1', name: 'Rushikesh Dhiwar' }],
    vehicles: [{ id: 'VEH-1', vehicle_reg_no: 'MH12AC4335' }]
  })
};

const mockLocalStorage = {
  getItem: (k) => localStorageData[k] || null,
  setItem: (k, v) => { localStorageData[k] = String(v); },
  removeItem: (k) => { delete localStorageData[k]; },
  clear: () => { Object.keys(localStorageData).forEach(k => delete localStorageData[k]); }
};

const sandbox = {
  window: {
    location: { hash: '' }
  },
  localStorage: mockLocalStorage,
  document: {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => ({ setAttribute: () => {}, appendChild: () => {}, click: () => {} }),
    body: { appendChild: () => {}, removeChild: () => {}, insertAdjacentHTML: () => {} }
  },
  alert: () => {},
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
  currentUser: { full_name: 'Admin', name: 'Admin', role: 'ADMIN' },
  showToast: (msg, type) => console.log(`[TOAST] (${type}): ${msg}`),
  showModal: () => {},
  closeModal: () => {}
};

vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('js/data/mock-data.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('js/data/db.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('js/modules/doc-series-master.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('js/modules/billing.js', 'utf8'), sandbox);

const DB = sandbox.window.DB;
const Billing = sandbox.window.BillingModule;

console.log('\n--- 1. Testing DB and Billing ensureSeedData() purge ---');
Billing.ensureSeedData();

assert.strictEqual(DB.data.jobCards.length, 0, 'jobCards must be 0');
assert.strictEqual(DB.data.billingEstimates.length, 0, 'billingEstimates must be 0');
assert.strictEqual(DB.data.draftBills.length, 0, 'draftBills must be 0');
assert.strictEqual(DB.data.finalBills.length, 0, 'finalBills must be 0');
assert.strictEqual(DB.data.vehicleDeliveries.length, 0, 'vehicleDeliveries must be 0');
assert.strictEqual(DB.data.customers.length, 0, 'customers must be 0');
assert.strictEqual(DB.data.vehicles.length, 0, 'vehicles must be 0');
console.log('✓ All 7 collections successfully purged to 0 records!');

console.log('\n--- 2. Testing UI screen render methods with empty state ---');
const jcHtml = Billing.renderJobCardsTab();
assert(!jcHtml.includes('Rushikesh Dhiwar'), 'Job cards screen must not contain any customer');
assert(jcHtml.includes('No Job Cards Found') || jcHtml.includes('No job cards'), 'Job cards screen shows empty state');
console.log('✓ Job Cards screen rendered empty');

const estHtml = Billing.renderEstimatesTab();
assert(!estHtml.includes('Rushikesh Dhiwar'), 'Estimates screen must not contain any customer');
console.log('✓ Estimates screen rendered empty');

const billHtml = Billing.renderCustomerBillingSingleScreen();
assert(!billHtml.includes('Rushikesh Dhiwar'), 'Billing screen must not contain any customer');
console.log('✓ Billing screen rendered empty');

const billListHtml = Billing.renderFinalBillsTab();
assert(!billListHtml.includes('Rushikesh Dhiwar'), 'Bill list screen must not contain any customer');
assert(billListHtml.includes('No bills found') || billListHtml.includes('No bills match'), 'Bill list shows empty state');
console.log('✓ Bill list screen rendered empty');

const delHtml = Billing.renderDeliveryTab();
assert(!delHtml.includes('Rushikesh Dhiwar'), 'Vehicle delivery screen must not contain any customer');
assert(delHtml.includes('No Vehicle Delivery & Gate Pass Records Found'), 'Delivery screen shows empty state');
console.log('✓ Vehicle Delivery screen rendered empty');

console.log('\n--- 3. Testing manual purgeAllCustomerData() method ---');
DB.data.jobCards.push({ id: 'TEMP-JC', customer_name: 'Temp' });
Billing.purgeAllCustomerData();
assert.strictEqual(DB.data.jobCards.length, 0, 'purgeAllCustomerData flushes job cards');
console.log('✓ purgeAllCustomerData() flushes state cleanly');

console.log('\n================================================================');
console.log('🎉 ALL PURGE TESTS PASSED SUCCESSFULLY! ZERO CUSTOMERS REMAIN.');
console.log('================================================================\n');
