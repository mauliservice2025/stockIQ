// scratch/test_facility_and_logo.js
// Verification of Facility keyword replacement, database aliasing, logo persistence & invoice/estimate logo integration

const fs = require('fs');
const path = require('path');

console.log('=== TEST SUITE: FACILITY REPLACEMENT & FACILITY LOGO UPLOAD ===\n');

// Mock browser globals
global.window = global;
global.localStorage = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, val) { this.store[key] = String(val); },
  removeItem(key) { delete this.store[key]; },
  clear() { this.store = {}; }
};
global.document = {
  getElementById: (id) => null,
  querySelector: (sel) => null,
  querySelectorAll: (sel) => []
};

// 1. Load mock data & DB
require('../js/data/mock-data.js');
require('../js/data/db.js');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${message}`);
    process.exitCode = 1;
  }
}

// Test 1: DB Aliasing for 'facilities'
console.log('--- Suite 1: Database Facility Aliasing ---');
const facilities = window.DB.getAll('facilities');
assert(Array.isArray(facilities) && facilities.length > 0, `window.DB.getAll('facilities') returns array of ${facilities.length} items`);
assert(facilities[0].id === 'PLANT-01', `First facility has id PLANT-01`);

const fac1 = window.DB.getById('facilities', 'PLANT-01');
assert(fac1 && fac1.name === 'Mauli Service Center 1', `window.DB.getById('facilities', 'PLANT-01') resolves plant`);

const activeFacs = window.DB.getActiveFacilities();
assert(Array.isArray(activeFacs) && activeFacs.length > 0, `window.DB.getActiveFacilities() returns active facilities`);
assert(window.DB.isFacilityActive('PLANT-01') === true, `window.DB.isFacilityActive('PLANT-01') is true`);

// Test 2: Logo Persistence into Facility
console.log('\n--- Suite 2: Facility Logo Persistence ---');
const sampleLogoData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
window.DB.update('facilities', 'PLANT-01', { logo: sampleLogoData });

const updatedFac = window.DB.getById('facilities', 'PLANT-01');
assert(updatedFac.logo === sampleLogoData, 'Updated facility has base64 logo preserved');

const plantDirect = window.DB.getById('plants', 'PLANT-01');
assert(plantDirect.logo === sampleLogoData, 'Aliased update correctly reflected in plants collection');

// Test 3: OrgLocationModule Facility Master Modals
console.log('\n--- Suite 3: OrgLocationModule Modal UI Labels & Screenshot Verification ---');
// Mock Modal component
let renderedModal = null;
global.window.State = {
  showToast: () => {},
  auditAction: () => {},
  hasPermission: () => true,
  showModal: (options) => {
    renderedModal = {
      title: options.title,
      body: (options.contentHtml || '') + (options.footerHtml || '')
    };
  },
  closeModal: () => {
    renderedModal = null;
  }
};
global.window.Modal = {
  show: (options) => {
    renderedModal = {
      title: options.title || '',
      body: (options.contentHtml || options.body || '') + (options.footerHtml || '')
    };
  },
  hide: () => {
    renderedModal = null;
  }
};

require('../js/modules/org-location.js');

// Test showEditBranchModal (Edit Facility)
window.OrgLocationModule.showEditBranchModal('PLANT-01');
assert(renderedModal !== null, 'Edit Facility modal opened');
assert(renderedModal.title.includes('Edit Facility: Mauli Service Center 1'), `Modal title is "${renderedModal.title}" (matches screenshot Edit Facility)`);
assert(renderedModal.body.includes('Facility Code'), 'Form contains "Facility Code *" label');
assert(renderedModal.body.includes('Facility Name'), 'Form contains "Facility Name *" label');
assert(renderedModal.body.includes('Facility Type'), 'Form contains "Facility Type *" label');
assert(renderedModal.body.includes('Update Facility'), 'Action button is "Update Facility" (matches screenshot)');
assert(!renderedModal.body.includes('Edit Branch'), 'Does not contain legacy "Edit Branch" in body');
assert(!renderedModal.body.includes('Branch Code *'), 'Does not contain "Branch Code *"');
assert(!renderedModal.body.includes('Branch Name *'), 'Does not contain "Branch Name *"');
assert(!renderedModal.body.includes('Branch Type *'), 'Does not contain "Branch Type *"');
assert(!renderedModal.body.includes('Update Branch'), 'Does not contain "Update Branch"');
assert(renderedModal.body.includes('Facility Logo'), 'Contains Facility Logo upload section');
assert(renderedModal.body.includes('edit-branch-logo-data'), 'Contains hidden input for logo data storage');
assert(renderedModal.body.includes('facility-logo-preview-container'), 'Contains logo preview container');

// Test showAddBranchModal (Register Facility)
window.OrgLocationModule.showAddBranchModal();
assert(renderedModal.title.includes('Register New Facility'), `Add modal title is "${renderedModal.title}"`);
assert(renderedModal.body.includes('Facility Code'), 'Add form contains "Facility Code *"');
assert(renderedModal.body.includes('Save Facility'), 'Add form contains "Save Facility" button');
assert(renderedModal.body.includes('Facility Logo'), 'Add form contains logo upload option');

// Test 4: Billing Module Facility & Logo Integration
console.log('\n--- Suite 4: Billing Module Facility Logo on Invoices & Estimates ---');
require('../js/modules/billing.js');

const facDetails = window.BillingModule.getFacilityDetails('PLANT-01');
assert(facDetails.id === 'PLANT-01', 'Facility details resolved');
assert(facDetails.logo === sampleLogoData, 'Facility details contains the uploaded logo');

// Insert a sample test final bill linked to PLANT-01
const testBill = {
  id: 'TEST-BILL-01',
  invoice_no: 'INV/MSC1/2026/0001',
  branch_id: 'PLANT-01',
  facility_id: 'PLANT-01',
  customer_name: 'Sanket Borole',
  vehicle_reg_no: 'MH 12 AB 1234',
  grand_total: 1500,
  amount_received: 1500
};
window.DB.upsert('finalBills', testBill);

// Test printInvoice with custom logo
window.BillingModule.printInvoice('TEST-BILL-01');
assert(renderedModal && (renderedModal.body.includes('Facility Logo') || renderedModal.body.includes(sampleLogoData)), 'Tax Invoice header embeds the facility logo');
assert(renderedModal && renderedModal.body.includes(facDetails.displayName), 'Tax Invoice contains facility display name');

// Insert a sample estimate linked to PLANT-01
const testEst = {
  id: 'TEST-EST-01',
  estimate_no: 'EST/MSC1/2026/0001',
  branch_id: 'PLANT-01',
  facility_id: 'PLANT-01',
  customer_name: 'Sanket Borole',
  grand_total: 1200
};
window.DB.upsert('billingEstimates', testEst);

// Test Estimate modal with custom logo
window.BillingModule.showPrintEstimateModal('TEST-EST-01');
assert(renderedModal && renderedModal.body.includes(sampleLogoData), 'Estimate Print modal embeds the facility logo');

// Insert a sample payment receipt linked to PLANT-01
const testReceipt = {
  id: 'TEST-RCT-01',
  receipt_no: 'RCT/MSC1/2026/0001',
  branch_id: 'PLANT-01',
  facility_id: 'PLANT-01',
  customer_name: 'Sanket Borole',
  amount_paid: 1500,
  payment_date: '2026-10-19',
  payment_time: '12:00:00 PM'
};
window.DB.upsert('paymentReceipts', testReceipt);

// Test Payment Receipt with custom logo
window.BillingModule.printPaymentReceipt('TEST-RCT-01');
assert(renderedModal && renderedModal.body.includes(sampleLogoData), 'Payment Receipt modal embeds the facility logo');

console.log(`\n========================================`);
console.log(`TEST RUN COMPLETE: ${passedTests}/${totalTests} tests passed.`);
console.log(`========================================\n`);

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
