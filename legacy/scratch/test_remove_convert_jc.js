const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Setup mock DOM & State
global.window = global;
global.document = {
  getElementById: (id) => ({
    value: '',
    checked: false,
    innerHTML: '',
    appendChild: () => {},
    focus: () => {}
  }),
  createElement: (tag) => ({
    style: {},
    setAttribute: () => {},
    appendChild: () => {}
  }),
  body: {
    appendChild: () => {}
  }
};

window.location = { hash: '#/billing-estimates' };
window.State = {
  user: { id: 'usr-1', username: 'admin', role: 'ADMIN' },
  showToast: (msg, type) => console.log(`[Toast ${type}]: ${msg}`)
};

window.DB = {
  data: {
    billingEstimates: [
      {
        id: 'EST-TEST-001',
        estimate_no: 'EST-2026-001',
        customer_cin: 'CIN-001',
        customer_name: 'Satish Shinde',
        customer_mobile: '9876543210',
        vehicle_reg_no: 'MH12AB1234',
        vehicle_model: 'Hero Splendor',
        status: 'CUSTOMER_APPROVED',
        subtotal: 1000,
        estimated_total: 1000,
        items: [
          { id: '1', code: 'LBR-001', name: 'General Service Labour', type: 'LABOUR', qty: 1, rate: 399, amount: 399 },
          { id: '2', code: 'PRT-001', name: 'Engine Oil', type: 'PART', qty: 1, rate: 601, amount: 601 }
        ]
      },
      // Legacy estimate with JOB_CARD conversion to verify DB cleansing
      {
        id: 'EST-LEGACY-002',
        estimate_no: 'EST-2026-002',
        status: 'CONVERTED',
        converted_to_type: 'JOB_CARD',
        converted_to_no: 'JC/MSC1/2026/0010',
        converted_to_id: 'JC-10'
      }
    ],
    jobCards: [],
    draftBills: [],
    finalBills: [],
    customers: [],
    vehicles: []
  },
  getAll(col) {
    return this.data[col] || [];
  },
  getById(col, id) {
    return (this.data[col] || []).find(x => x.id === id);
  },
  upsert(col, item) {
    if (!this.data[col]) this.data[col] = [];
    const idx = this.data[col].findIndex(x => x.id === item.id);
    if (idx >= 0) this.data[col][idx] = item;
    else this.data[col].push(item);
  },
  saveData() {},
  emitChange() {}
};

// Load billing.js
const billingCode = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');
eval(billingCode);

console.log('--- TEST 1: Verify convertEstimateToJobCard is removed from code ---');
assert.strictEqual(typeof window.BillingModule.convertEstimateToJobCard, 'undefined', 'convertEstimateToJobCard must be undefined');
console.log('✓ convertEstimateToJobCard workflow method is completely removed from BillingModule');

console.log('--- TEST 2: Verify DB cleansing of legacy JOB_CARD converted estimates ---');
window.DB.data._workshop_all_customers_purged_v3 = true;
window.BillingModule.ensureSeedData();
const cleansedLegacyEst = window.DB.getById('billingEstimates', 'EST-LEGACY-002');
assert.strictEqual(typeof cleansedLegacyEst.converted_to_type, 'undefined', 'converted_to_type must be deleted');
assert.strictEqual(typeof cleansedLegacyEst.converted_to_no, 'undefined', 'converted_to_no must be deleted');
assert.strictEqual(typeof cleansedLegacyEst.converted_to_id, 'undefined', 'converted_to_id must be deleted');
assert.strictEqual(cleansedLegacyEst.status, 'CUSTOMER_APPROVED', 'Status should reset to CUSTOMER_APPROVED');
console.log('✓ DB cleansing successfully removed converted_to_type: JOB_CARD and restored to CUSTOMER_APPROVED');

console.log('--- TEST 3: Verify Rendered HTML has NO Convert to Job Card button ---');
window.BillingModule.activeEstimateId = 'EST-TEST-001';
const renderedHtml = window.BillingModule.renderEstimatesTab();
assert.ok(!renderedHtml.includes('Convert to Job Card'), 'HTML must NOT contain "Convert to Job Card"');
assert.ok(!renderedHtml.includes('convertEstimateToJobCard'), 'HTML must NOT contain "convertEstimateToJobCard"');
assert.ok(renderedHtml.includes('Convert to Draft Bill'), 'HTML must contain "Convert to Draft Bill"');
assert.ok(renderedHtml.includes('Step 5: Convert to Draft Bill'), 'HTML stepper must contain "Step 5: Convert to Draft Bill"');
assert.ok(!renderedHtml.includes('Step 5: Convert (JC / Bill)'), 'HTML must NOT contain legacy "Step 5: Convert (JC / Bill)"');
console.log('✓ UI Render check passed: No "Convert to Job Card" button or Job Card step references exist in HTML');

console.log('--- TEST 4: Verify Convert to Draft Bill workflow ---');
window.BillingModule.convertEstimateToDraftBill();
const convertedEst = window.BillingModule.getActiveEstimate();
assert.strictEqual(convertedEst.status, 'CONVERTED', 'Estimate status must be CONVERTED');
assert.strictEqual(convertedEst.converted_to_type, 'DRAFT_BILL', 'converted_to_type must be DRAFT_BILL');
assert.ok(convertedEst.converted_to_no.startsWith('DB/'), 'converted_to_no must be a draft bill number');

const allDrafts = window.DB.getAll('draftBills');
assert.strictEqual(allDrafts.length, 1, 'Draft bill must be created');
assert.strictEqual(allDrafts[0].draft_bill_no, convertedEst.converted_to_no, 'Draft bill no must match');
console.log('✓ Convert to Draft Bill successfully works as the single conversion path:', convertedEst.converted_to_no);

console.log('--- TEST 5: Verify Converted UI state has NO Job Card references ---');
const convertedHtml = window.BillingModule.renderEstimatesTab();
assert.ok(!convertedHtml.includes('Converted to Job Card'), 'Converted UI must NOT say "Converted to Job Card"');
assert.ok(!convertedHtml.includes('View Job Cards'), 'Converted UI must NOT have "View Job Cards"');
assert.ok(convertedHtml.includes('✓ Converted to Draft Bill'), 'Converted UI must display "✓ Converted to Draft Bill"');
assert.ok(convertedHtml.includes('✓ Step 5: Converted to Draft Bill'), 'Converted UI stepper must show "✓ Step 5: Converted to Draft Bill"');
console.log('✓ Converted UI state successfully verified: Only Draft Bill references are present');

console.log('\n========================================');
console.log('🎉 ALL 5 INTEGRATION & REGRESSION TESTS PASSED!');
console.log('========================================\n');
