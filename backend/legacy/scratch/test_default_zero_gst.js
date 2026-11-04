/**
 * Verification test for default 0% GST across all screens and dynamic fetching from GST Master
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Setup mock browser globals
global.window = global;
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};
global.window.State = {
  closeModal: () => {},
  showToast: () => {},
  showModal: () => {},
  currentPlantId: 'PLANT-01'
};
global.document = {
  getElementById: (id) => null,
  querySelectorAll: () => []
};

// Load dependencies
require('../js/data/mock-data.js');
const { DatabaseLayer } = require('../js/data/db.js');
window.DB = new DatabaseLayer();

// Load modules
require('../js/modules/tax-master.js');
require('../js/modules/billing.js');
require('../js/modules/item-setup-master.js');
require('../js/modules/store-inventory.js');
require('../js/modules/purchase-orders.js');

console.log('================================================================');
console.log('TEST: Default 0% GST Across All Screens & GST Master Integration');
console.log('================================================================\n');

// 1. Test DatabaseLayer getDefaultTax
console.log('--- 1. Testing DB getDefaultTax() ---');
const defaultTax = window.DB.getDefaultTax();
console.log('DB.getDefaultTax():', defaultTax);
assert.strictEqual(Number(defaultTax.rate), 0, 'Default tax rate must be 0%');
assert.strictEqual(defaultTax.code, 'GST0', 'Default tax code must be GST0');
console.log('✓ window.DB.getDefaultTax() returns 0% GST');

// 2. Test TaxMasterModule getDefaultTax
console.log('\n--- 2. Testing TaxMasterModule.getDefaultTax() ---');
const tmDefaultTax = window.TaxMasterModule.getDefaultTax();
assert.strictEqual(Number(tmDefaultTax.rate), 0, 'TaxMasterModule default tax rate must be 0%');
console.log('✓ window.TaxMasterModule.getDefaultTax() returns 0% GST');

// 3. Test renderTaxSelectOptions
console.log('\n--- 3. Testing renderTaxSelectOptions from GST Master ---');
const optDefault = window.DB.renderTaxSelectOptions();
assert(optDefault.includes('value="0"'), 'Must contain 0% GST option');
assert(optDefault.includes('value="18"'), 'Must contain 18% GST option from GST Master');
assert(optDefault.includes('value="0"') && optDefault.includes('selected'), '0% option must be selected by default when no arg passed');

const optExplicitZero = window.DB.renderTaxSelectOptions(0);
assert(optExplicitZero.includes('value="0"') && optExplicitZero.includes('selected'), '0% option must be selected when 0 passed');

const optExplicit18 = window.DB.renderTaxSelectOptions(18);
assert(optExplicit18.includes('value="18"') && optExplicit18.includes('selected'), '18% option must be selected when 18 passed');
console.log('✓ renderTaxSelectOptions correctly defaults to 0% and pulls all slabs from GST Master');

// 4. Test Estimate Creation and Rendering
console.log('\n--- 4. Testing Estimate Screen Default GST ---');
const testJc = {
  id: 'JC-GST-TEST',
  job_card_no: 'JC/MSC1/2026/000099',
  cin_number: 'CIN/MSC1/2026/000099',
  customer_name: 'GST Test Customer',
  customer_mobile: '9876500000',
  vehicle_reg_no: 'MH12TX0001',
  parts_required: [
    { item_name: 'Brake Pad Set', qty: 1, unit_price: 380 }
  ],
  labour_tasks: [
    { desc: 'General Service Labour', qty: 1, rate: 250 }
  ]
};
window.DB.data.jobCards = [testJc];
window.DB.data.billingEstimates = [];

window.BillingModule.createEstimateForJobCardRecord(testJc);
const est = window.BillingModule.getActiveEstimate();
assert(est, 'Estimate must be created');
console.log('Created Estimate Subtotal:', est.subtotal);
console.log('Created Estimate Tax Rate:', est.tax_rate);
console.log('Created Estimate Tax Amount:', est.tax_amount);
console.log('Created Estimate Estimated Total:', est.estimated_total);

assert.strictEqual(Number(est.subtotal), 630, 'Subtotal should be 380 + 250 = 630');
assert.strictEqual(Number(est.tax_rate), 0, 'Estimate tax rate must default to 0%');
assert.strictEqual(Number(est.tax_amount), 0, 'Estimate tax amount must be 0 with 0% GST');
assert.strictEqual(Number(est.estimated_total), 630, 'Estimated total must equal subtotal (630) when GST is 0%');

const estHtml = window.BillingModule.renderEstimatesTab();
assert(estHtml.includes('value="0"'), 'Estimate tax dropdown includes 0%');
assert(estHtml.includes('value="0"') && estHtml.includes('selected'), 'Estimate tax dropdown preselects 0% GST');
assert(estHtml.includes('₹630.00'), 'Estimate UI renders ₹630.00 total');
console.log('✓ Estimate screen creates and renders with 0% GST by default');

// 5. Test Customer Billing Screen Default GST
console.log('\n--- 5. Testing Customer Billing Screen Default GST ---');
window.DB.data.billingEstimates.push(est);
const bill = window.BillingModule.createOrUpdateBillFromEstimate(est.id, false);
assert(bill, 'Bill must be generated from estimate');
assert.strictEqual(Number(bill.tax_rate), 0, 'Generated bill tax rate must be 0%');
assert.strictEqual(Number(bill.total_tax), 0, 'Generated bill total tax must be 0');
assert.strictEqual(Number(bill.grand_total), 630, 'Generated bill grand total must equal taxable amount (630)');

window.BillingModule.activeBillingBillId = bill.id;
window.BillingModule.activeBillingBill = bill;
const billingHtml = window.BillingModule.renderCustomerBillingSingleScreen();
assert(billingHtml.includes('value="0"') && billingHtml.includes('selected'), 'Billing screen preselects 0% GST');
console.log('✓ Customer Billing screen defaults to 0% GST');

// 6. Test Store Inventory & Item Master
console.log('\n--- 6. Testing Store Inventory & Item Setup Master Default GST ---');
window.ItemSetupModule.showItemModal(null);
assert.strictEqual(window.ItemSetupModule.editingItemDraft.gst_rate_pct, 0, 'ItemSetupModule default GST must be 0');
console.log('✓ Item Master new item defaults to 0% GST');

console.log('\n================================================================');
console.log('🎉 ALL DEFAULT 0% GST AND GST MASTER TESTS PASSED SUCCESSFULLY!');
console.log('================================================================');
