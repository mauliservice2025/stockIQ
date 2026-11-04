// Test script to verify Parts Requisition & Issue Console sub-view switching
const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Mock browser globals
global.window = global;
global.document = {
  getElementById: (id) => null
};
global.location = { hash: '#/job-cards' };

window.State = {
  currentPlantId: 'ALL',
  showModal: () => {},
  closeModal: () => {},
  showToast: (msg) => console.log('Toast:', msg)
};

window.DB = {
  data: {
    jobCards: [],
    warehouses: [],
    plants: [],
    itemCategories: [],
    items: [],
    inventoryBalances: [],
    users: [],
    vehicleModels: [],
    vehicleManufacturers: [],
    billingEstimates: [],
    draftBills: [],
    finalBills: [],
    vehicleDeliveries: []
  },
  getAll: (coll) => window.DB.data[coll] || [],
  getById: () => null,
  isWarehouseActive: () => true,
  isPlantActive: () => true,
  getActiveWarehouses: () => [],
  getRegistrationConfig: () => ({ customer_fields: [], vehicle_fields: [] }),
  saveData: () => {},
  emitChange: () => {},
  logAudit: () => {}
};

// Load modules
const storeInvCode = fs.readFileSync(path.join(__dirname, '../js/modules/store-inventory.js'), 'utf8');
eval(storeInvCode);

const billingCode = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');
eval(billingCode);

console.log('Testing Parts Requisition & Issue Console sub-view switching...');

// 1. Initial view: REGISTER
window.BillingModule.jobCardSubView = 'REGISTER';
const registerHtml = window.BillingModule.renderJobCardsTab();
assert(!registerHtml.includes('btn-sm btn-primary'), 'Switcher buttons strip must not be present');
assert(registerHtml.includes('Job Card Management') || registerHtml.includes('No Job Cards Found'), 'Must render Job Card Management directly');
console.log('✓ Clean Job Card Management renders without switcher buttons');

// 2. Switch to PARTS_WORKFLOW
console.log('Switching to PARTS_WORKFLOW...');
window.BillingModule.setJobCardsSubView('PARTS_WORKFLOW');
assert.strictEqual(window.BillingModule.jobCardSubView, 'PARTS_WORKFLOW');

// 3. Render job cards tab in PARTS_WORKFLOW mode - MUST NOT THROW STACK OVERFLOW!
const partsConsoleHtml = window.BillingModule.renderJobCardsTab();
assert(partsConsoleHtml, 'Must return HTML content');
assert(partsConsoleHtml.includes('parts-requisition-console'), 'Must contain parts-requisition-console div');
assert(partsConsoleHtml.includes('Two-Wheeler Job Cards') || partsConsoleHtml.includes('Parts Requisition & Issue Console'), 'Must contain parts workflow components');
console.log('✓ Parts Requisition & Issue Console renders cleanly without recursion error!');

// 4. Switch back to REGISTER
console.log('Switching back to REGISTER...');
window.BillingModule.setJobCardsSubView('REGISTER');
assert.strictEqual(window.BillingModule.jobCardSubView, 'REGISTER');
const backHtml = window.BillingModule.renderJobCardsTab();
assert(backHtml.includes('Job Card Management') || backHtml.includes('No Job Cards Found'), 'Must render register tab');
console.log('✓ Successfully switched back to Job Cards Registry!');

console.log('\nALL SUB-VIEW SWITCH TESTS PASSED! 🚀');
