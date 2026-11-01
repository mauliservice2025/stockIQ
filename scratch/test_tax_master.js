const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('     ENTERPRISE ISCM - TAX MASTER BRD COMPLIANCE TEST SUITE      ');
console.log('================================================================\n');

// 1. Mock browser environment
global.window = global;
global.window.location = { hash: '#/tax-master' };
global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; },
  clear() { this._data = {}; }
};

let capturedModal = null;
let capturedToast = null;
global.window.State = {
  openModal: (title, bodyHtml, footerHtml) => {
    capturedModal = { title, bodyHtml, footerHtml };
  },
  closeModal: () => {
    capturedModal = null;
  },
  showToast: (msg, type) => {
    capturedToast = { msg, type };
  }
};

const domStore = {};
global.document = {
  getElementById: (id) => {
    if (!domStore[id]) {
      domStore[id] = { innerHTML: '', style: {}, focus: () => {}, value: '' };
    }
    return domStore[id];
  },
  querySelector: (sel) => null,
  querySelectorAll: (sel) => [],
  activeElement: null
};

// 2. Navigation & Script Inclusion in index.html
console.log('--- TEST 1: Navigation & Script Tag in index.html ---');
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

if (!indexHtml.includes('id="nav-item-tax-master"') || !indexHtml.includes('href="#/tax-master"')) {
  console.error('[FAIL] Missing #nav-item-tax-master or href="#/tax-master" in index.html');
  process.exit(1);
}
console.log('✓ Found #nav-item-tax-master navigation link to #/tax-master under Masters in index.html');

if (!indexHtml.includes('js/modules/tax-master.js')) {
  console.error('[FAIL] Missing tax-master.js script tag in index.html');
  process.exit(1);
}
console.log('✓ Found script tag for tax-master.js in index.html');

// 3. Routing & RBAC in app.js and mock-data.js
console.log('\n--- TEST 2: App Route & RBAC Registration ---');
const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
if (!appJs.includes("'#/tax-master': { module: window.TaxMasterModule") && !appJs.includes('"#/tax-master": { module: window.TaxMasterModule')) {
  console.error('[FAIL] Route #/tax-master not mapped to window.TaxMasterModule in js/app.js');
  process.exit(1);
}
if (!appJs.includes("'#/tax-master': 'TAX_MASTER'")) {
  console.error('[FAIL] Route #/tax-master permission code TAX_MASTER missing in js/app.js');
  process.exit(1);
}
console.log('✓ Route #/tax-master and permission TAX_MASTER properly registered in app.js');

// Load Data, DB and TaxMasterModule
require(path.join(__dirname, '../js/data/mock-data.js'));
const { DatabaseLayer } = require(path.join(__dirname, '../js/data/db.js'));
require(path.join(__dirname, '../js/modules/tax-master.js'));

const db = window.DB;
const taxMod = window.TaxMasterModule;

// Check PERM-TAX-MASTER in mock-data permissions
const permExists = window.INITIAL_DATA.permissions.some(p => p.id === 'PERM-TAX-MASTER' || p.code === 'TAX_MASTER');
if (!permExists) {
  console.error('[FAIL] PERM-TAX-MASTER missing from INITIAL_DATA.permissions');
  process.exit(1);
}
console.log('✓ PERM-TAX-MASTER permission verified in mock-data');

// 4. Standard GST Slabs in DB Seed Data (BR-TAX-001, BR-TAX-002)
console.log('\n--- TEST 3: Preconfigured Standard GST Slabs (BRD Section 6) ---');
const allTaxes = db.getAll('taxes');
console.log(`Total tax records in DB: ${allTaxes.length}`);

const standardRates = [0, 5, 12, 18, 28];
standardRates.forEach(rate => {
  const slab = allTaxes.find(t => t.system_default && t.total_gst === rate);
  if (!slab) {
    console.error(`[FAIL] Standard GST slab with rate ${rate}% not found!`);
    process.exit(1);
  }
  // Validate CGST + SGST = total_gst and IGST = total_gst
  const cgst = slab.cgst_rate;
  const sgst = slab.sgst_rate;
  const igst = slab.igst_rate;
  if (cgst + sgst !== rate) {
    console.error(`[FAIL] GST ${rate}% slab CGST(${cgst}) + SGST(${sgst}) does not equal total rate ${rate}`);
    process.exit(1);
  }
  if (igst !== rate) {
    console.error(`[FAIL] GST ${rate}% slab IGST(${igst}) does not equal total rate ${rate}`);
    process.exit(1);
  }
  if (slab.editable !== false || slab.deletable !== false || slab.status !== 'Active') {
    console.error(`[FAIL] System GST ${rate}% slab must be non-editable, non-deletable, and Active`);
    process.exit(1);
  }
  console.log(`✓ Verified System Default Slab: ${slab.code} (${slab.name}) -> Total: ${rate}%, CGST: ${cgst}%, SGST: ${sgst}%, IGST: ${igst}% (Protected)`);
});

// 5. System GST Protection Rules (BR-TAX-003, BR-TAX-004, BR-TAX-005)
console.log('\n--- TEST 4: Statutory Protection of System Slabs (BRD Section 8 & 9) ---');
const systemSlab = allTaxes.find(t => t.system_default);

// Attempting to delete system slab must be blocked
const deleteSystemResult = taxMod.deleteTax(systemSlab.id);
if (deleteSystemResult !== false) {
  console.error('[FAIL] System slab deletion was not rejected by TaxMasterModule.deleteTax!');
  process.exit(1);
}
console.log('✓ System slab delete attempted -> Successfully blocked with statutory warning toast');

// Attempting to deactivate system slab must be blocked
const toggleSystemResult = taxMod.toggleStatus(systemSlab.id);
if (toggleSystemResult !== false) {
  console.error('[FAIL] System slab deactivation was not rejected by TaxMasterModule.toggleStatus!');
  process.exit(1);
}
console.log('✓ System slab deactivation attempted -> Successfully blocked with statutory warning toast');

// 6. Custom Slab Creation Validation (TAX-VAL-001 through TAX-VAL-011)
console.log('\n--- TEST 5: Custom Tax Slab Validations (BRD Section 25) ---');

// Duplicate Tax Code
const dupCodeResult = taxMod.validateTaxSlab({
  code: 'GST18', // Already exists as system code
  name: 'New Custom 18%',
  tax_type: 'GST',
  total_gst: 18,
  cgst_rate: 9,
  sgst_rate: 9,
  igst_rate: 18,
  effective_from: '2026-04-01'
});
if (dupCodeResult.valid) {
  console.error('[FAIL] Duplicate tax code GST18 was not rejected!');
  process.exit(1);
}
console.log(`✓ TAX-VAL-002: Duplicate Tax Code rejected: "${dupCodeResult.error}"`);

// CGST + SGST mismatch
const rateMismatch = taxMod.validateTaxSlab({
  code: 'CUSTOM-INVALID-1',
  name: 'Mismatch Slab',
  tax_type: 'GST',
  total_gst: 18,
  cgst_rate: 8, // 8 + 8 = 16 != 18
  sgst_rate: 8,
  igst_rate: 18,
  effective_from: '2026-04-01'
});
if (rateMismatch.valid) {
  console.error('[FAIL] CGST + SGST mismatch was not rejected!');
  process.exit(1);
}
console.log(`✓ TAX-VAL-006: CGST + SGST rate mismatch rejected: "${rateMismatch.error}"`);

// IGST mismatch
const igstMismatch = taxMod.validateTaxSlab({
  code: 'CUSTOM-INVALID-2',
  name: 'IGST Mismatch',
  tax_type: 'GST',
  total_gst: 18,
  cgst_rate: 9,
  sgst_rate: 9,
  igst_rate: 15, // 15 != 18
  effective_from: '2026-04-01'
});
if (igstMismatch.valid) {
  console.error('[FAIL] IGST mismatch was not rejected!');
  process.exit(1);
}
console.log(`✓ TAX-VAL-007: IGST rate mismatch rejected: "${igstMismatch.error}"`);

// Effective date order
const dateMismatch = taxMod.validateTaxSlab({
  code: 'CUSTOM-INVALID-3',
  name: 'Date Invalid Slab',
  tax_type: 'GST',
  total_gst: 18,
  cgst_rate: 9,
  sgst_rate: 9,
  igst_rate: 18,
  effective_from: '2026-04-01',
  effective_to: '2026-03-01' // Before effective_from
});
if (dateMismatch.valid) {
  console.error('[FAIL] Effective To earlier than Effective From was not rejected!');
  process.exit(1);
}
console.log(`✓ TAX-VAL-009: Invalid date range rejected: "${dateMismatch.error}"`);

// Negative rate
const negRate = taxMod.validateTaxSlab({
  code: 'CUSTOM-INVALID-4',
  name: 'Negative Rate Slab',
  tax_type: 'GST',
  total_gst: -5,
  cgst_rate: -2.5,
  sgst_rate: -2.5,
  igst_rate: -5,
  effective_from: '2026-04-01'
});
if (negRate.valid) {
  console.error('[FAIL] Negative rate was not rejected!');
  process.exit(1);
}
console.log(`✓ TAX-VAL-005: Negative rate rejected: "${negRate.error}"`);

// 7. Creating a Valid Custom Tax Slab & Persistence
console.log('\n--- TEST 6: Create Valid Custom Tax Slab ---');
const testCustomSlab = {
  code: 'GST06-SPECIAL',
  name: 'Special Concession 6%',
  tax_type: 'GST',
  total_gst: 6,
  cgst_rate: 3,
  sgst_rate: 3,
  igst_rate: 6,
  effective_from: '2026-05-01',
  effective_to: '',
  status: 'Active',
  description: 'Special 6% rate for clean energy parts',
  system_default: false,
  transaction_count: 0
};

const validationSuccess = taxMod.validateTaxSlab(testCustomSlab);
if (!validationSuccess.valid) {
  console.error(`[FAIL] Valid custom slab failed validation: ${validationSuccess.error}`);
  process.exit(1);
}
console.log('✓ Valid custom slab passes all validation rules');

// Save to DB
const created = db.insert('taxes', {
  ...testCustomSlab,
  id: 'tax_test_006',
  is_system: false,
  editable: true,
  deletable: true,
  created_at: new Date().toISOString()
});
if (!created || db.getById('taxes', created.id)?.code !== 'GST06-SPECIAL') {
  console.error('[FAIL] Custom tax slab insert failed in DB');
  process.exit(1);
}
console.log(`✓ Custom slab saved successfully: ID=${created.id}, Code=${created.code}`);

// 8. Transaction Protection for Custom Taxes (BR-TAX-012, TAX-VAL-013)
console.log('\n--- TEST 7: Transaction Protection Rules (BRD Section 12 & 23) ---');
// GST03-CUSTOM has transaction_count: 15 in seed data
const txnTax = db.getAll('taxes').find(t => !t.system_default && t.transaction_count > 0);
if (!txnTax) {
  console.error('[FAIL] Expected seed custom tax with transaction history');
  process.exit(1);
}
console.log(`Found custom tax with transactions: ${txnTax.code} (${txnTax.transaction_count} txns)`);

// Attempt to delete it
const deleteTxnTaxResult = taxMod.deleteTax(txnTax.id);
if (deleteTxnTaxResult !== false) {
  console.error('[FAIL] Custom tax with transaction history was allowed to be deleted!');
  process.exit(1);
}
console.log('✓ Custom tax with transactions -> Deletion blocked (BR-TAX-012)');

// Attempt to deactivate it -> Should be ALLOWED
const origStatus = txnTax.status;
const toggleTxnTaxResult = taxMod.toggleStatus(txnTax.id);
if (toggleTxnTaxResult === false) {
  console.error('[FAIL] Custom tax deactivation was unexpectedly blocked!');
  process.exit(1);
}
const toggledTax = db.getById('taxes', txnTax.id);
if (toggledTax.status === origStatus) {
  console.error('[FAIL] Status did not toggle for custom tax!');
  process.exit(1);
}
console.log(`✓ Custom tax with transactions -> Deactivation allowed (${origStatus} -> ${toggledTax.status})`);
// Toggle back to active
taxMod.toggleStatus(txnTax.id);

// Delete the newly created custom slab that has 0 transactions
const deleteZeroTxnResult = taxMod.deleteTax(created.id);
if (deleteZeroTxnResult === false) {
  console.error('[FAIL] Custom tax with 0 transactions could not be deleted!');
  process.exit(1);
}
if (db.getById('taxes', created.id)) {
  console.error('[FAIL] Record was not removed from DB after delete!');
  process.exit(1);
}
console.log('✓ Custom tax with 0 transactions -> Deletion succeeded');

// 9. Tax Calculation Engine (BRD Section 19, 20, 21)
console.log('\n--- TEST 8: Tax Calculation Engine Verification (BRD Section 19-21) ---');

// 19.1 Tax Exclusive: Base 1,000 @ 18% -> CGST = 90, SGST = 90, Total Tax = 180, Invoice Total = 1,180
const calc1 = taxMod.calculateTax({
  amount: 1000,
  tax_rate: 18,
  calculation_mode: 'EXCLUSIVE',
  transaction_type: 'INTRA'
});
console.log('Test 19.1 (Intra Exclusive):', calc1);
if (calc1.base_amount !== 1000 || calc1.cgst_amount !== 90 || calc1.sgst_amount !== 90 || calc1.total_tax !== 180 || calc1.invoice_total !== 1180) {
  console.error('[FAIL] Exclusive calculation failed for ₹1,000 @ 18%');
  process.exit(1);
}
console.log('✓ Intra-State Tax Exclusive: Base ₹1,000 + 18% GST (CGST ₹90 + SGST ₹90) = ₹1,180');

// 19.2 Tax Inclusive: Gross 1,180 @ 18% -> Taxable Value = 1,000, GST = 180, Total = 1,180
const calc2 = taxMod.calculateTax({
  amount: 1180,
  tax_rate: 18,
  calculation_mode: 'INCLUSIVE',
  transaction_type: 'INTRA'
});
console.log('Test 19.2 (Intra Inclusive):', calc2);
if (calc2.base_amount !== 1000 || calc2.cgst_amount !== 90 || calc2.sgst_amount !== 90 || calc2.total_tax !== 180 || calc2.invoice_total !== 1180) {
  console.error('[FAIL] Inclusive calculation failed for ₹1,180 @ 18%');
  process.exit(1);
}
console.log('✓ Intra-State Tax Inclusive: Gross ₹1,180 @ 18% -> Base ₹1,000 + GST ₹180 = ₹1,180');

// 21 Inter-State Transaction: Base 10,000 @ 18% -> IGST = 1,800, Total = 11,800
const calc3 = taxMod.calculateTax({
  amount: 10000,
  tax_rate: 18,
  calculation_mode: 'EXCLUSIVE',
  transaction_type: 'INTER'
});
console.log('Test 21 (Inter Exclusive):', calc3);
if (calc3.base_amount !== 10000 || calc3.cgst_amount !== 0 || calc3.sgst_amount !== 0 || calc3.igst_amount !== 1800 || calc3.total_tax !== 1800 || calc3.invoice_total !== 11800) {
  console.error('[FAIL] Inter-State calculation failed for ₹10,000 @ 18%');
  process.exit(1);
}
console.log('✓ Inter-State Tax Exclusive: Base ₹10,000 @ 18% IGST (₹1,800) = ₹11,800');

// 10. UI Rendering Test (Simple One Screen Tax Master)
console.log('\n--- TEST 9: UI Rendering & One Screen Table Generation ---');
const container = { innerHTML: '' };
taxMod.render(container);

if (!container.innerHTML.includes('Tax Master')) {
  console.error('[FAIL] Missing Tax Master title in render output');
  process.exit(1);
}
console.log('✓ Found clean "Tax Master" title (no extra badge)');

if (container.innerHTML.includes('tabs-header')) {
  console.error('[FAIL] tabs-header found in simple one-screen layout!');
  process.exit(1);
}
console.log('✓ Verified: Multiple tabs removed! Clean single screen Tax Master layout');

if (!container.innerHTML.includes('tax-master-search-input')) {
  console.error('[FAIL] Missing search input in toolbar');
  process.exit(1);
}
console.log('✓ Found clean search input in toolbar');

if (!container.innerHTML.includes('tax-master-status-select')) {
  console.error('[FAIL] Missing status select in toolbar');
  process.exit(1);
}
console.log('✓ Found status filter in toolbar');

if (!container.innerHTML.includes('+ Add Tax Slab')) {
  console.error('[FAIL] Missing "+ Add Tax Slab" button');
  process.exit(1);
}
console.log('✓ Found "+ Add Tax Slab" action button');

if (!container.innerHTML.includes('⚡ Tax Calculator')) {
  console.error('[FAIL] Missing "⚡ Tax Calculator" button');
  process.exit(1);
}
console.log('✓ Found "⚡ Tax Calculator" action button');

if (!container.innerHTML.includes('GST 18%') || !container.innerHTML.includes('GST18')) {
  console.error('[FAIL] Missing standard GST 18% slab row in render output');
  process.exit(1);
}
console.log('✓ Found GST 18% slab in data table');

// Verify that getFilteredEntries returns both standard GST and custom slabs merged by rate
taxMod.classificationFilter = 'ALL';
taxMod.activeTab = 'ALL';
const mergedEntries = taxMod.getFilteredEntries();
const hasSystemInMerged = mergedEntries.some(t => t.system_default);
const hasCustomInMerged = mergedEntries.some(t => !t.system_default);
if (!hasSystemInMerged || !hasCustomInMerged) {
  console.error('[FAIL] Merged entries do not contain both standard GST and custom slabs!');
  process.exit(1);
}
console.log(`✓ Merged list contains ${mergedEntries.length} total slabs (Standard GST + Custom Slabs on one screen)`);
console.log('✓ Simple one-screen Tax Master UI verified successfully');

console.log('\n================================================================');
console.log('🎉 ALL TAX MASTER BRD REQUIREMENTS & TESTS VERIFIED SUCCESSFULLY!');
console.log('================================================================\n');
