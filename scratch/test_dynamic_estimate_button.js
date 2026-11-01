const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

console.log('================================================================');
console.log('TESTING DYNAMIC ESTIMATE BUTTON ON JOB CARD SCREEN');
console.log('================================================================\n');

// Mock data
let jobCards = [
  {
    id: 'JC-101',
    job_card_no: 'JC/MSC1/2026/0101',
    customer_name: 'Pravin S Patil',
    customer_mobile: '9838462423',
    cin_number: 'CIN/MSC1/2026/000036',
    vehicle_reg_no: 'MH12AC4335',
    vehicle_model: 'Honda Activa',
    odometer_km: '57,545 km',
    service_type: 'Periodic Maintenance',
    complaints: ['Engine noise', 'Brake loose'],
    status: 'OPEN',
    parts_required: [
      { item_code: '2W-BRK-SHO-01', name: 'Rear Brake Shoe', qty: 1, unit_price: 150, status: 'PENDING' }
    ],
    labour_tasks: [
      { desc: 'General Service Labour', qty: 1, rate: 399 }
    ]
  },
  {
    id: 'JC-102',
    job_card_no: 'JC/MSC1/2026/0102',
    customer_name: 'Rajesh Sesi',
    customer_mobile: '9876543456',
    cin_number: 'CIN/MSC1/2026/000034',
    vehicle_reg_no: 'MH12PL1234',
    vehicle_model: 'Honda Activa',
    odometer_km: '12,234 km',
    service_type: 'General Service',
    status: 'OPEN'
  }
];

let billingEstimates = [];
let draftBills = [];
let finalBills = [];

let openedModal = null;
let currentHash = '#/job-cards';
let toasts = [];

const mockWindow = {
  DB: {
    data: {
      jobCards,
      billingEstimates,
      draftBills,
      finalBills
    },
    getAll: (table) => {
      if (table === 'jobCards') return jobCards;
      if (table === 'billingEstimates') return billingEstimates;
      if (table === 'draftBills') return draftBills;
      if (table === 'finalBills') return finalBills;
      return [];
    },
    getById: (table, id) => {
      if (table === 'jobCards') return jobCards.find(j => j.id === id || j.job_card_no === id) || null;
      if (table === 'billingEstimates') return billingEstimates.find(e => e.id === id || e.estimate_no === id) || null;
      if (table === 'draftBills') return draftBills.find(b => b.id === id) || null;
      if (table === 'finalBills') return finalBills.find(b => b.id === id) || null;
      return null;
    },
    upsert: (table, obj) => {
      if (table === 'jobCards') {
        const idx = jobCards.findIndex(j => j.id === obj.id);
        if (idx !== -1) jobCards[idx] = obj; else jobCards.push(obj);
      }
      if (table === 'billingEstimates') {
        const idx = billingEstimates.findIndex(e => e.id === obj.id);
        if (idx !== -1) billingEstimates[idx] = obj; else billingEstimates.push(obj);
      }
    },
    saveData: () => {},
    emitChange: () => {},
    logAudit: () => {}
  },
  State: {
    showModal: (config) => { openedModal = config; },
    closeModal: () => { openedModal = null; },
    showToast: (msg, type) => {
      toasts.push({ msg, type });
      console.log(`[Toast ${type}]: ${msg}`);
    },
    currentPlantId: 'PLANT-01'
  },
  location: {
    get hash() { return currentHash; },
    set hash(val) { currentHash = val; }
  },
  document: {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => []
  }
};

const billingCode = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');

const sandbox = {
  window: mockWindow,
  document: mockWindow.document,
  console: console,
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  Intl: Intl,
  Math: Math,
  Date: Date,
  parseInt: parseInt,
  parseFloat: parseFloat,
  isNaN: isNaN,
  Array: Array,
  Object: Object,
  String: String,
  Number: Number,
  Boolean: Boolean,
  JSON: JSON
};

vm.createContext(sandbox);
vm.runInContext(billingCode, sandbox);

// Provide StoreInventoryModule dummy
mockWindow.StoreInventoryModule = {
  showAddPartsToJobCardModal: () => {}
};

console.log('--- Test 1: Created, No Estimate -> Must display "Create Estimate" ---');
const jc1 = jobCards[0];
let htmlBtn = mockWindow.BillingModule.renderJobCardActionToolbar(jc1.id, true);
assert(htmlBtn.includes('Create Estimate'), 'Button must show Create Estimate when no estimate exists');
assert(!htmlBtn.includes('View Estimate'), 'Button must NOT show View Estimate when no estimate exists');
console.log('✓ Rendered toolbar button correctly shows "📝 Create Estimate"');

console.log('\n--- Test 2: Clicking "Create Estimate" -> Navigates to Estimate Screen with prefilled details ---');
mockWindow.BillingModule.actionEstimateFromJobCard(jc1.id);

// Check that estimate was created
assert.strictEqual(billingEstimates.length, 1, 'Billing estimates count should be 1');
const createdEst = billingEstimates[0];
assert.strictEqual(createdEst.job_card_id, jc1.id, 'Estimate must link to JC id');
assert.strictEqual(createdEst.customer_name, jc1.customer_name, 'Estimate customer name prefilled');
assert.strictEqual(createdEst.customer_mobile, jc1.customer_mobile, 'Estimate customer phone prefilled');
assert.strictEqual(createdEst.vehicle_reg_no, jc1.vehicle_reg_no, 'Estimate vehicle reg no prefilled');
assert.strictEqual(createdEst.vehicle_model, jc1.vehicle_model, 'Estimate vehicle model prefilled');
assert.strictEqual(createdEst.service_type, jc1.service_type, 'Estimate service type prefilled');
assert.strictEqual(createdEst.status, 'DRAFT', 'Estimate must be in DRAFT status');
assert.strictEqual(currentHash, '#/billing-estimates', 'Must navigate to #/billing-estimates');
console.log('✓ Created estimate successfully prefilled with Job Card, customer, vehicle and service details');

console.log('\n--- Test 3: Button State immediately updates to "View Estimate" (Draft) ---');
htmlBtn = mockWindow.BillingModule.renderJobCardActionToolbar(jc1.id, true);
assert(htmlBtn.includes('View Estimate'), 'Button must show View Estimate when Draft estimate exists');
assert(!htmlBtn.includes('Create Estimate'), 'Button must NOT show Create Estimate when estimate exists');
console.log('✓ Rendered toolbar button dynamically updated to "📝 View Estimate"');

console.log('\n--- Test 4: Estimate in SUBMITTED status -> Button displays "View Estimate" ---');
createdEst.status = 'SUBMITTED';
htmlBtn = mockWindow.BillingModule.renderJobCardActionToolbar(jc1.id, true);
assert(htmlBtn.includes('View Estimate'), 'Button must show View Estimate when Submitted estimate exists');
console.log('✓ Rendered toolbar button shows "📝 View Estimate" for Submitted estimate');

console.log('\n--- Test 5: Estimate Converted to Bill -> Button displays "View Estimate" ---');
createdEst.status = 'CONVERTED';
htmlBtn = mockWindow.BillingModule.renderJobCardActionToolbar(jc1.id, true);
assert(htmlBtn.includes('View Estimate'), 'Button must show View Estimate when Converted estimate exists');
console.log('✓ Rendered toolbar button shows "📝 View Estimate" for Converted estimate');

console.log('\n--- Test 6: Clicking "View Estimate" -> Opens existing estimate ---');
currentHash = '#/job-cards';
mockWindow.BillingModule.viewEstimateForJobCard(jc1.id);
assert.strictEqual(mockWindow.BillingModule.activeEstimateId, createdEst.id, 'activeEstimateId should match existing estimate');
assert.strictEqual(currentHash, '#/billing-estimates', 'Must navigate to #/billing-estimates');
console.log('✓ viewEstimateForJobCard successfully opened existing estimate');

console.log('\n--- Test 7: Backend Duplicate Prevention: Calling createEstimate when estimate exists opens existing estimate ---');
const estCountBefore = billingEstimates.length;
mockWindow.BillingModule.actionEstimateFromJobCard(jc1.id);
assert.strictEqual(billingEstimates.length, estCountBefore, 'Must NOT create duplicate estimate');
assert.strictEqual(mockWindow.BillingModule.activeEstimateId, createdEst.id, 'Must open existing estimate');
console.log('✓ Backend duplicate prevention verified: No duplicate estimate created');

console.log('\n--- Test 8: Cancelled / Voided Estimate -> Returns to "Create Estimate" ---');
createdEst.status = 'CANCELLED';
// Re-sync
mockWindow.BillingModule.syncAllJobCardStatuses();
assert.strictEqual(mockWindow.BillingModule.hasEstimateForJobCard(jc1), false, 'Cancelled estimate should not count as active estimate');
htmlBtn = mockWindow.BillingModule.renderJobCardActionToolbar(jc1.id, true);
assert(htmlBtn.includes('Create Estimate'), 'Button must return to Create Estimate when estimate is cancelled');
assert(!htmlBtn.includes('View Estimate'), 'Button must NOT show View Estimate when estimate is cancelled');
console.log('✓ Cancelled estimate allows "📝 Create Estimate" button to appear again');

console.log('\n--- Test 9: Create new estimate after cancellation ---');
mockWindow.BillingModule.actionEstimateFromJobCard(jc1.id);
assert.strictEqual(billingEstimates.length, 2, 'Should create new estimate after previous one was cancelled');
const newEst = billingEstimates[1];
assert.strictEqual(newEst.status, 'DRAFT');
htmlBtn = mockWindow.BillingModule.renderJobCardActionToolbar(jc1.id, true);
assert(htmlBtn.includes('View Estimate'), 'Button updates back to View Estimate for new active estimate');
console.log('✓ Successfully created fresh estimate after cancellation and updated button to "📝 View Estimate"');

console.log('\n================================================================');
console.log('ALL DYNAMIC ESTIMATE BUTTON TESTS PASSED (100%)!');
console.log('================================================================');
