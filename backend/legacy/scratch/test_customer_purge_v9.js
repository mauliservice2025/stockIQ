const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Mock localStorage with dirty data from prior sessions
const mockStore = {
  inventory_store_data: JSON.stringify({
    customers: [
      { id: 'CUST-001', name: 'Pravin S Patil', mobile: '9838462423' },
      { id: 'CUST-002', name: 'Swara Murmure', mobile: '8765432323' }
    ],
    vehicles: [
      { id: 'VEH-001', vehicle_reg_no: 'MH12AC4335', customer_id: 'CUST-001' }
    ],
    jobCards: [
      { id: 'JC-001', job_card_no: 'JC/MSC1/2026/0050', customer_name: 'Swara Murmure' }
    ],
    billingEstimates: [
      { id: 'EST-001', estimate_no: 'EST/MSC1/2026/0001', customer_name: 'Pravin S Patil' }
    ],
    draftBills: [
      { id: 'DB-001', draft_bill_no: 'DB/MSC1/2026/0001', customer_name: 'Pravin S Patil' }
    ],
    finalBills: [
      { id: 'FB-001', invoice_no: 'INV/MSC1/2026/0001', customer_name: 'Pravin S Patil' }
    ],
    vehicleDeliveries: [
      { id: 'GP-001', gate_pass_no: 'GP-2026-0001', customer_name: 'Pravin S Patil' }
    ],
    plants: [{ id: 'PLANT-01', name: 'Mauli Service Center' }],
    // Prior migration flags that already ran
    _workshop_all_customers_purged_v3: true,
    _jobcards_estimates_billing_deliveries_customers_purged_upto_date_v7: true
  })
};

global.localStorage = {
  getItem: (k) => mockStore[k] || null,
  setItem: (k, v) => { mockStore[k] = String(v); },
  removeItem: (k) => { delete mockStore[k]; }
};

global.window = global;
global.document = {
  getElementById: (id) => null,
  querySelectorAll: () => [],
  addEventListener: () => {}
};
global.State = {
  showToast: () => {},
  showModal: () => {},
  closeModal: () => {}
};

// Load db.js
const { DatabaseLayer } = require('../js/data/db.js');
window.DatabaseLayer = DatabaseLayer;
window.DB = new DatabaseLayer();

console.log('--- TEST 1: Database Migration Clears All Customers and Related Records ---');
assert.strictEqual(window.DB.getAll('customers').length, 0, 'Customers must be 0');
assert.strictEqual(window.DB.getAll('jobCards').length, 0, 'Job Cards must be 0');
assert.strictEqual(window.DB.getAll('billingEstimates').length, 0, 'Estimates must be 0');
assert.strictEqual(window.DB.getAll('draftBills').length, 0, 'Draft Bills must be 0');
assert.strictEqual(window.DB.getAll('finalBills').length, 0, 'Final Bills must be 0');
assert.strictEqual(window.DB.getAll('vehicleDeliveries').length, 0, 'Vehicle Deliveries must be 0');
assert.strictEqual(window.DB.getAll('vehicles').length, 0, 'Vehicles must be 0');
console.log('✓ TEST 1 PASSED: Database collections are all 0!');

console.log('--- TEST 2: BillingModule Screens Render Empty Data ---');
// Load billing.js
const billingSource = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');
eval(billingSource);

window.BillingModule.ensureSeedData();

// Test Job Cards screen
const jcHtml = window.BillingModule.renderJobCardsTab();
assert(!jcHtml.includes('Pravin S Patil'), 'Job cards tab must not contain past customers');
assert(!jcHtml.includes('Swara Murmure'), 'Job cards tab must not contain past customers');
console.log('✓ Job Cards tab verified clean');

// Test Estimates screen
const estHtml = window.BillingModule.renderEstimatesTab();
assert(!estHtml.includes('Pravin S Patil'), 'Estimates tab must not contain past customers');
console.log('✓ Estimates tab verified clean');

// Test Draft Bills & Billing Single Screen / Queue
const billQueueHtml = window.BillingModule.renderCustomerBillsQueueScreen();
assert(!billQueueHtml.includes('Pravin S Patil'), 'Billing queue must not contain past customers');
assert(!billQueueHtml.includes('Swara Murmure'), 'Billing queue must not contain past customers');
console.log('✓ Customer Billing & Queue verified clean');

// Test Vehicle Delivery
const deliveryHtml = window.BillingModule.renderDeliveryTab();
assert(!deliveryHtml.includes('Pravin S Patil'), 'Vehicle delivery must not contain past customers');
console.log('✓ Vehicle Delivery tab verified clean');

console.log('\nALL CUSTOMER PURGE TESTS PASSED SUCCESSFULLY! ✅');
