// Automated test for Job Card date defaulting to current local date
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

let capturedModalHtml = '';
global.document = {
  activeElement: null,
  getElementById: (id) => {
    if (!global._elements) global._elements = {};
    if (!global._elements[id]) {
      global._elements[id] = { textContent: '', value: '', title: '', style: { setProperty: () => {} }, classList: { add: () => {}, remove: () => {} } };
    }
    return global._elements[id];
  },
  querySelector: () => ({ style: { setProperty: () => {} }, classList: { add: () => {}, remove: () => {} } }),
  querySelectorAll: () => [],
  addEventListener: () => {}
};
global.State = {
  currentPlantId: 'PLANT-01',
  hasPermission: () => true,
  showToast: () => {},
  showModal: (opt, content) => {
    capturedModalHtml = typeof opt === 'object' ? (opt.contentHtml || opt.content || '') : (content || opt || '');
  },
  closeModal: () => {}
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

global.alert = (msg) => { console.log('[ALERT MOCK]', msg); };

async function runTests() {
  console.log('--- Starting Job Card Current Date Tests ---');

  if (!window.DB.data) window.DB.data = {};
  window.DB.data.plants = [{ id: 'PLANT-01', code: 'MSC1', name: 'Mauli Service Center - I', is_active: true, status: 'Active' }];
  window.DB.data.jobCards = [];
  window.DB.data.vehicleModels = [];
  window.DB.data.users = [];

  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const expectedToday = `${y}-${m}-${d}`;

  console.log(`Expected local date: ${expectedToday}`);

  // TEST 1: window.DB.getTodayDateStr()
  assert(typeof window.DB.getTodayDateStr === 'function', 'window.DB.getTodayDateStr is a function');
  assert(window.DB.getTodayDateStr() === expectedToday, `window.DB.getTodayDateStr() returns ${expectedToday}`);

  // TEST 2: window.BillingModule.getTodayDateStr()
  assert(typeof window.BillingModule.getTodayDateStr === 'function', 'window.BillingModule.getTodayDateStr is a function');
  assert(window.BillingModule.getTodayDateStr() === expectedToday, `window.BillingModule.getTodayDateStr() returns ${expectedToday}`);

  // TEST 3: Modal HTML contains expected current date
  window.BillingModule.showNewJobCardModal();
  assert(capturedModalHtml.includes(`id="new-jc-date"`), 'Modal HTML contains new-jc-date input');
  assert(capturedModalHtml.includes(`value="${expectedToday}"`), `new-jc-date has value="${expectedToday}" (NOT previous day / UTC)`);
  assert(capturedModalHtml.includes(`max="${expectedToday}"`), `new-jc-date has max="${expectedToday}" constraint`);

  // TEST 4: Saving a Job Card defaults to expectedToday
  global.document.getElementById('new-jc-reg').value = 'MH12CD5678';
  global.document.getElementById('new-jc-model').value = 'Splendor Plus';
  global.document.getElementById('new-jc-km').value = '15000';
  global.document.getElementById('new-jc-customer').value = 'Ramesh Patil';
  global.document.getElementById('new-jc-mobile').value = '9876543210';
  global.document.getElementById('new-jc-date').value = expectedToday;

  window.BillingModule.saveNewJobCard();

  const savedJc = (window.DB.getAll('jobCards') || []).find(j => j.vehicle_reg_no === 'MH12CD5678');
  assert(savedJc !== undefined, 'Job Card was created');
  assert(savedJc.date === expectedToday, `Job Card date is saved as ${expectedToday} (actual: ${savedJc.date})`);

  console.log(`\n========================================`);
  console.log(`All ${passedTests}/${totalTests} tests passed successfully!`);
  console.log(`========================================\n`);
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
