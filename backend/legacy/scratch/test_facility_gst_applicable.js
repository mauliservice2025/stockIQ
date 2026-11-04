const assert = require('assert');
const fs = require('fs');

console.log('=== RUNNING FACILITY LEVEL GST APPLICABLE TESTS ===\n');

// 1. Setup mock DOM and window environment
global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; },
  clear() { this._data = {}; }
};
global.window = global;
global.document = {
  getElementById: (id) => {
    return global._mockElements ? global._mockElements[id] : null;
  },
  createElement: () => ({ style: {}, appendChild: () => {} }),
  body: { appendChild: () => {} }
};
global.alert = function(msg) { console.log('[ALERT]', msg); };

// Load modules
require('../js/data/mock-data.js');
require('../js/data/db.js');
require('../js/modules/org-location.js');
require('../js/modules/billing.js');
require('../js/modules/tax-master.js');

// Mock window.State
window.State = {
  currentPlantId: 'PLANT-01',
  currentUser: { id: 'USR-001', role: 'ADMIN' },
  showModal: (cfg) => {
    window._lastModal = cfg;
  },
  closeModal: () => {
    window._lastModal = null;
  },
  showToast: (msg, type) => {
    console.log(`[TOAST ${type}] ${msg}`);
  }
};

// --- TEST 1: Check Database & Plant Records ---
console.log('[TEST 1] Verifying isFacilityGstApplicable() API in db.js');
const plant1 = window.DB.getById('plants', 'PLANT-01');
assert(plant1, 'PLANT-01 must exist');
console.log('PLANT-01 is_gst_applicable:', plant1.is_gst_applicable);
assert.strictEqual(window.DB.isFacilityGstApplicable('PLANT-01'), true, 'PLANT-01 should default to GST applicable');

// Create a Non-GST facility
const nonGstPlant = {
  id: 'PLANT-NON-GST',
  code: 'NG-01',
  branch_code: 'NG01',
  name: 'Non GST Workshop',
  is_gst_applicable: false,
  gst_applicable: false,
  is_active: true
};
window.DB.insert('plants', nonGstPlant);

assert.strictEqual(window.DB.isFacilityGstApplicable('PLANT-NON-GST'), false, 'PLANT-NON-GST must evaluate to isFacilityGstApplicable === false');
assert.strictEqual(window.DB.isFacilityGstApplicable(nonGstPlant), false, 'Object parameter check must evaluate to false');
console.log('✓ isFacilityGstApplicable works correctly for both GST and Non-GST facilities.');

// --- TEST 2: Check renderTaxSelectOptions for Non-GST facility ---
console.log('\n[TEST 2] Verifying renderTaxSelectOptions() with facility flag');
const gstTaxOptions = window.DB.renderTaxSelectOptions(18, false, '', 'PLANT-01');
assert(gstTaxOptions.includes('value="18"'), 'GST facility options include tax slabs');

const nonGstTaxOptions = window.DB.renderTaxSelectOptions(18, false, '', 'PLANT-NON-GST');
assert(nonGstTaxOptions.includes('GST Not Applicable for Facility'), 'Non-GST facility options must show GST Not Applicable');
console.log('✓ renderTaxSelectOptions outputs Non-GST option correctly for Non-GST facility.');

// --- TEST 3: Check Estimate recalculation with Facility GST Flag ---
console.log('\n[TEST 3] Verifying BillingModule.recalculateEstimateTotals()');
const estGst = {
  items: [{ qty: 1, rate: 1000, amount: 1000 }],
  discount_amount: 100,
  tax_rate: 18,
  branch_id: 'PLANT-01'
};
window.BillingModule.recalculateEstimateTotals(estGst);
console.log('GST Facility Estimate Totals:', {
  taxable: estGst.taxable_amount,
  tax_rate: estGst.tax_rate,
  tax_amount: estGst.tax_amount,
  estimated_total: estGst.estimated_total
});
assert.strictEqual(estGst.taxable_amount, 900);
assert.strictEqual(estGst.tax_amount, 162);
assert.strictEqual(estGst.estimated_total, 1062);

const estNonGst = {
  items: [{ qty: 1, rate: 1000, amount: 1000 }],
  discount_amount: 100,
  tax_rate: 18, // User/item might have had 18% set previously
  branch_id: 'PLANT-NON-GST'
};
window.BillingModule.recalculateEstimateTotals(estNonGst);
console.log('Non-GST Facility Estimate Totals:', {
  taxable: estNonGst.taxable_amount,
  tax_rate: estNonGst.tax_rate,
  tax_amount: estNonGst.tax_amount,
  estimated_total: estNonGst.estimated_total
});
assert.strictEqual(estNonGst.taxable_amount, 900);
assert.strictEqual(estNonGst.tax_rate, 0, 'Tax rate must be forced to 0 for Non-GST facility');
assert.strictEqual(estNonGst.tax_amount, 0, 'Tax amount must be 0 for Non-GST facility');
assert.strictEqual(estNonGst.cgst_amount, 0, 'CGST must be 0');
assert.strictEqual(estNonGst.sgst_amount, 0, 'SGST must be 0');
assert.strictEqual(estNonGst.estimated_total, 900, 'Estimated total must equal taxable without GST');
console.log('✓ Estimate recalculation strictly respects facility GST flag.');

// --- TEST 4: Check Bill recalculation with Facility GST Flag ---
console.log('\n[TEST 4] Verifying BillingModule.recalculateBillTotals()');
const billGst = {
  items: [{ qty: 1, rate: 2000, amount: 2000 }],
  discount: 0,
  tax_rate: 18,
  branch_id: 'PLANT-01'
};
window.BillingModule.recalculateBillTotals(billGst);
assert.strictEqual(billGst.tax_amount, 360);
assert.strictEqual(billGst.grand_total, 2360);

const billNonGst = {
  items: [{ qty: 1, rate: 2000, amount: 2000 }],
  discount: 0,
  tax_rate: 18,
  branch_id: 'PLANT-NON-GST'
};
window.BillingModule.recalculateBillTotals(billNonGst);
console.log('Non-GST Facility Bill Totals:', {
  taxable: billNonGst.taxable_amount,
  tax_rate: billNonGst.tax_rate,
  tax_amount: billNonGst.tax_amount,
  grand_total: billNonGst.grand_total
});
assert.strictEqual(billNonGst.tax_rate, 0, 'Bill tax rate must be 0 for Non-GST facility');
assert.strictEqual(billNonGst.tax_amount, 0, 'Bill tax amount must be 0');
assert.strictEqual(billNonGst.cgst_amount, 0, 'CGST amount must be 0');
assert.strictEqual(billNonGst.sgst_amount, 0, 'SGST amount must be 0');
assert.strictEqual(billNonGst.grand_total, 2000, 'Bill grand total must be 2000 (no GST added)');
console.log('✓ Bill recalculation strictly respects facility GST flag.');

// --- TEST 5: Check Edit Facility Modal UI and Submission ---
console.log('\n[TEST 5] Verifying Edit Facility modal and submission in org-location.js');
window.OrgLocationModule.showEditBranchModal('PLANT-01');
assert(window._lastModal, 'Edit Facility modal must open');
assert(window._lastModal.contentHtml.includes('edit-branch-gst-applicable'), 'Modal must contain edit-branch-gst-applicable select');
assert(window._lastModal.contentHtml.includes('Yes (GST Applicable for this Facility)'), 'Modal must contain Yes option');
assert(window._lastModal.contentHtml.includes('No (GST Not Applicable for this Facility)'), 'Modal must contain No option');

// Simulate setting PLANT-01 to NO
global._mockElements = {
  'edit-branch-org-id': { value: 'ORG-001' },
  'edit-branch-code': { value: 'MSC-01' },
  'edit-branch-name': { value: 'Mauli Service Center - I' },
  'edit-branch-type': { value: 'TWO_WHEELER_WORKSHOP' },
  'edit-branch-contact': { value: 'Sanket' },
  'edit-branch-mobile': { value: '7888010210' },
  'edit-branch-address': { value: 'Chintamani chowk, Ravet' },
  'edit-branch-city': { value: 'Ravet' },
  'edit-branch-state': { value: 'Maharashtra' },
  'edit-branch-pincode': { value: '412101' },
  'edit-branch-gst-applicable': { value: 'NO' },
  'edit-branch-gstin': { value: '' },
  'edit-branch-logo-data': { value: '' }
};

window.OrgLocationModule.submitEditBranch('PLANT-01');
const updatedPlant1 = window.DB.getById('plants', 'PLANT-01');
assert.strictEqual(updatedPlant1.is_gst_applicable, false, 'PLANT-01 is_gst_applicable must now be false');
assert.strictEqual(updatedPlant1.gst_applicable, false, 'PLANT-01 gst_applicable must now be false');
assert.strictEqual(window.DB.isFacilityGstApplicable('PLANT-01'), false, 'window.DB.isFacilityGstApplicable must now return false for PLANT-01');
console.log('✓ Updating facility GST Applicable to NO successfully updates record and disables GST facility-wide.');

// --- TEST 6: Check Print Header and Document Title for Non-GST ---
console.log('\n[TEST 6] Verifying Invoice header and title for Non-GST facility');
const facDetails = window.BillingModule.getFacilityDetails('PLANT-01');
assert.strictEqual(facDetails.isGstApplicable, false, 'Facility details must indicate isGstApplicable === false');
assert.strictEqual(facDetails.gstin, '', 'GSTIN must be empty when GST is not applicable');

const headerHtml = window.BillingModule.renderFacilityPrintHeader(facDetails, {
  centered: false,
  docTitle: 'TAX INVOICE',
  docNo: 'INV-001',
  docDate: '2026-10-25'
});
assert(!headerHtml.includes('<strong>GSTIN:</strong>'), 'Header must NOT display GSTIN for non-GST facility');
assert(headerHtml.includes('INVOICE / BILL OF SUPPLY'), 'Document title must switch from TAX INVOICE to INVOICE / BILL OF SUPPLY');
console.log('✓ Print template converts TAX INVOICE to INVOICE / BILL OF SUPPLY and suppresses GSTIN.');

// Reset PLANT-01 back to YES
global._mockElements['edit-branch-gst-applicable'].value = 'YES';
global._mockElements['edit-branch-gstin'].value = '27AAAAA0000A1Z5';
window.OrgLocationModule.submitEditBranch('PLANT-01');
assert.strictEqual(window.DB.isFacilityGstApplicable('PLANT-01'), true, 'PLANT-01 reset to GST applicable === true');

console.log('\n======================================================');
console.log('ALL TESTS PASSED! FACILITY LEVEL GST FLAG IS WORKING!');
console.log('======================================================');
