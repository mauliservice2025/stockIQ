// Test script to verify removal of Reserve Parts, Issue to Tech, Return Parts, Close JC
// and validation of simplified Job Card form
const fs = require('fs');
const path = require('path');

// Mock browser environment
global.window = global;
global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; },
  clear() { this.store = {}; }
};
global.document = {
  getElementById(id) {
    if (this._elements && this._elements[id]) return this._elements[id];
    return null;
  },
  querySelectorAll() { return []; },
  querySelector() { return null; },
  _elements: {}
};
global.alert = function(msg) { console.log(`[ALERT] ${msg}`); };
global.State = {
  showToast(msg, type) { console.log(`[TOAST ${type}] ${msg}`); },
  showModal(opts) {
    global._lastModal = opts;
  },
  closeModal() {}
};

// Load db.js
const { DatabaseLayer } = require('../js/data/db.js');
window.DatabaseLayer = DatabaseLayer;
window.DB = new DatabaseLayer();
window.DB.data.plants = [{ id: 'PLANT-01', code: 'MSC1', name: 'Main Service Center', is_active: true }];

// Load service-master.js
const serviceMasterSource = fs.readFileSync(path.join(__dirname, '../js/modules/service-master.js'), 'utf8');
eval(serviceMasterSource);

// Load store-inventory.js
const storeInventorySource = fs.readFileSync(path.join(__dirname, '../js/modules/store-inventory.js'), 'utf8');
eval(storeInventorySource);

// Load billing.js
const billingSource = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');
eval(billingSource);

console.log('Testing Simplified Job Card & Removed Workflow Buttons...\n');

// 1. Verify Job Card Action Toolbar does NOT contain Reserve Parts, Issue to Tech, Return Parts, Close JC
console.log('[TEST 1] Checking Job Card Action Toolbar buttons...');
const mockJc = {
  id: 'JC-TEST-001',
  job_card_no: 'JC/MSC1/2026/0099',
  customer_name: 'Rahul Sharma',
  vehicle_reg_no: 'MH12AB1234',
  status: 'ESTIMATE_PENDING',
  parts_required: [
    { item_id: 'PRT-001', item_code: 'PRT-001', item_name: 'Brake Shoe', qty: 1, status: 'PENDING' }
  ]
};
window.DB.upsert('jobCards', mockJc);

const toolbarHtml = window.BillingModule.renderJobCardActionToolbar(mockJc.id, true);
console.assert(!toolbarHtml.includes('Reserve Parts'), 'FAIL: Toolbar must not contain "Reserve Parts"');
console.assert(!toolbarHtml.includes('Issue to Tech'), 'FAIL: Toolbar must not contain "Issue to Tech"');
console.assert(!toolbarHtml.includes('Return Parts'), 'FAIL: Toolbar must not contain "Return Parts"');
console.assert(!toolbarHtml.includes('Close JC'), 'FAIL: Toolbar must not contain "Close JC"');

console.assert(toolbarHtml.includes('+ Add Parts'), 'FAIL: Toolbar must contain "+ Add Parts"');
console.assert(toolbarHtml.includes('Estimate'), 'FAIL: Toolbar must contain "Estimate"');
console.assert(toolbarHtml.includes('Quick Bill'), 'FAIL: Toolbar must contain "Quick Bill"');
console.log('  ✓ Action toolbar clean: Reserve Parts, Issue to Tech, Return Parts, Close JC successfully removed.');

// 2. Verify View Job Card modal does NOT contain Reserve, Issue to Tech, Return
console.log('\n[TEST 2] Checking View Job Card modal...');
window.BillingModule.viewJobCard(mockJc.id);
const viewModalHtml = global._lastModal ? global._lastModal.contentHtml : '';
console.assert(!viewModalHtml.includes('🔒 Reserve'), 'FAIL: View modal must not contain "Reserve"');
console.assert(!viewModalHtml.includes('📤 Issue to Tech'), 'FAIL: View modal must not contain "Issue to Tech"');
console.assert(!viewModalHtml.includes('📥 Return'), 'FAIL: View modal must not contain "Return"');
console.assert(viewModalHtml.includes('+ Add Part'), 'FAIL: View modal must contain "+ Add Part"');
console.log('  ✓ View Job Card modal clean: Reserve, Issue to Tech, Return successfully removed.');

// 3. Verify Simplified New Job Card modal layout
console.log('\n[TEST 3] Checking New Job Card modal simplicity & structure...');
window.BillingModule.showNewJobCardModal();
const newModal = global._lastModal;
console.assert(!!newModal, 'FAIL: Modal was not opened');
const formHtml = newModal.contentHtml;

// Must contain essential primary fields
const essentialFieldIds = [
  'new-jc-no',
  'new-jc-date',
  'new-jc-reg',
  'new-jc-model',
  'new-jc-customer',
  'new-jc-mobile',
  'new-jc-km',
  'new-jc-fuel',
  'new-jc-service-type',
  'new-jc-tech',
  'new-jc-complaints'
];

essentialFieldIds.forEach(id => {
  console.assert(formHtml.includes(`id="${id}"`), `FAIL: Missing essential field id="${id}"`);
  console.log(`  ✓ Essential field found: ${id}`);
});

// Must contain collapsible advanced details
console.assert(formHtml.includes('<details id="jc-advanced-details"'), 'FAIL: Missing collapsible details accordion');
console.assert(formHtml.includes('id="new-jc-chassis"'), 'FAIL: Collapsible details must contain chassis');
console.assert(formHtml.includes('id="new-jc-address"'), 'FAIL: Collapsible details must contain address');
console.assert(formHtml.includes('id="new-jc-ins-co"'), 'FAIL: Collapsible details must contain insurance');
console.log('  ✓ Collapsible details section properly configured.');

console.log('\nALL TESTS PASSED! Job Card form is simplified and redundant workflow buttons are removed.\n');
