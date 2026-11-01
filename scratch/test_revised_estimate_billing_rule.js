const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

console.log('================================================================');
console.log('VERIFYING REVISED ESTIMATE BILLING RULES');
console.log('================================================================\n');

const billingJs = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');

// 1. Static code assertions
assert(billingJs.includes('getLatestEstimateRevision(est)'), 'Must define getLatestEstimateRevision');
assert(billingJs.includes('isEstimateSuperseded(est)'), 'Must define isEstimateSuperseded');
assert(billingJs.includes('Revised Estimate Detected'), 'Must have alert banner for revised estimate in billing workspace');

console.log('✓ PASS: Static code contains revision methods and banner');

// 2. Setup mock data matching user screenshot
const estimates = [
  {
    id: 'EST-0004',
    estimate_no: 'EST/MSC1/2026/0004',
    customer_name: 'Seema Patel',
    customer_mobile: '7263037533',
    vehicle_reg_no: 'MH14BH4335',
    grand_total: 1945,
    status: 'REVISED',
    superseded_by_no: 'EST/MSC1/2026/0004-R1',
    revision_no: 0,
    created_at: '2026-10-18T10:00:00Z',
    items: [{ id: '1', name: 'General Service Labour', qty: 2, rate: 250, amount: 500 }]
  },
  {
    id: 'EST-0004-R1',
    estimate_no: 'EST/MSC1/2026/0004-R1',
    customer_name: 'Seema Patel',
    customer_mobile: '7263037533',
    vehicle_reg_no: 'MH14BH4335',
    grand_total: 855,
    status: 'REVISED',
    superseded_by_no: 'EST/MSC1/2026/0004-R2',
    revision_no: 1,
    original_estimate_id: 'EST-0004',
    created_at: '2026-10-18T11:00:00Z',
    items: [{ id: '1', name: 'General Service Labour', qty: 1, rate: 250, amount: 250 }]
  },
  {
    id: 'EST-0004-R2',
    estimate_no: 'EST/MSC1/2026/0004-R2',
    customer_name: 'Seema Patel',
    customer_mobile: '7263037533',
    vehicle_reg_no: 'MH14BH4335',
    grand_total: 1185,
    status: 'CUSTOMER_APPROVED',
    revision_no: 2,
    original_estimate_id: 'EST-0004',
    created_at: '2026-10-18T12:00:00Z',
    items: [{ id: '1', name: 'General Service Labour', qty: 1, rate: 250, amount: 250 }]
  },
  {
    id: 'EST-0003',
    estimate_no: 'EST/MSC1/2026/0003',
    customer_name: 'Sanket Patil',
    customer_mobile: '9822001122',
    vehicle_reg_no: 'MH14BH2333',
    grand_total: 892,
    status: 'DRAFT',
    revision_no: 0,
    created_at: '2026-10-18T09:00:00Z',
    items: []
  }
];

let draftBills = [];
let toasts = [];
let alerts = [];

const sandbox = {
  window: {
    DB: {
      getAll: (table) => {
        if (table === 'billingEstimates') return estimates;
        if (table === 'draftBills') return draftBills;
        if (table === 'jobCards') return [];
        return [];
      },
      getById: (table, id) => {
        if (table === 'billingEstimates') return estimates.find(e => e.id === id);
        if (table === 'draftBills') return draftBills.find(d => d.id === id);
        return null;
      },
      upsert: (table, doc) => {
        if (table === 'draftBills') {
          const idx = draftBills.findIndex(d => d.id === doc.id);
          if (idx >= 0) draftBills[idx] = doc;
          else draftBills.push(doc);
        }
      },
      saveData: () => {},
      emitChange: () => {},
      getDefaultTax: () => ({ rate: 18 })
    },
    State: {
      showToast: (msg, type) => toasts.push({ msg, type }),
      closeModal: () => {}
    },
    alert: (msg) => alerts.push(msg)
  },
  document: {
    getElementById: () => null
  },
  console: console,
  parseInt: parseInt,
  parseFloat: parseFloat,
  Number: Number,
  Date: Date,
  JSON: JSON,
  Math: Math,
  Array: Array
};

vm.createContext(sandbox);

const BM = {
  getLatestEstimateRevision: null,
  isEstimateSuperseded: null,
  getEligibleBillingSources: null,
  onBillingSourceSelected: null,
  createOrUpdateBillFromEstimate: null,
  generateDraftBillNumber: () => 'DB/MSC1/2026/0005',
  recalculateBillTotals: (b) => { b.grand_total = (b.items || []).reduce((acc, i) => acc + (i.amount || 0), 0); },
  refresh: () => {}
};

// Bind methods from billingJs dynamically
const fnDefs = [
  'getLatestEstimateRevision(est) {',
  'isEstimateSuperseded(est) {',
  'getEligibleBillingSources() {',
  'onBillingSourceSelected(val, closeModal = false) {',
  'createOrUpdateBillFromEstimate(estId, doRefresh = true) {'
];

// Run whole BillingModule context or direct function evaluation
const billingFuncsScript = `
  const BM = {
    generateDraftBillNumber: () => 'DB/MSC1/2026/0005',
    recalculateBillTotals: (b) => { b.grand_total = (b.items || []).reduce((acc, i) => acc + (i.amount || 0), 0); },
    refresh: () => {},
    ${billingJs.slice(billingJs.indexOf('getLatestEstimateRevision(est) {'), billingJs.indexOf('resolveInvoiceOrBill(idOrObj) {'))}
    ${billingJs.slice(billingJs.indexOf('onBillingSourceSelected(val, closeModal = false) {'), billingJs.indexOf('createOrUpdateBillFromJobCard(jcId, doRefresh = true) {'))}
  };
  globalThis.BillingModule = BM;
`;

vm.runInContext(billingFuncsScript, sandbox);
const BMInst = sandbox.BillingModule;

// Test 1: Revision resolution
console.log('--- Test 1: Revision Resolution & Identification ---');
const est0 = estimates[0];
const estR1 = estimates[1];
const estR2 = estimates[2];
const est3 = estimates[3];

const latestFor0 = BMInst.getLatestEstimateRevision(est0);
assert.strictEqual(latestFor0.estimate_no, 'EST/MSC1/2026/0004-R2', 'Latest for base estimate 0004 must be 0004-R2');

const latestForR1 = BMInst.getLatestEstimateRevision(estR1);
assert.strictEqual(latestForR1.estimate_no, 'EST/MSC1/2026/0004-R2', 'Latest for 0004-R1 must be 0004-R2');

const latestForR2 = BMInst.getLatestEstimateRevision(estR2);
assert.strictEqual(latestForR2.estimate_no, 'EST/MSC1/2026/0004-R2', 'Latest for 0004-R2 must be itself');

assert.strictEqual(BMInst.isEstimateSuperseded(est0), true, 'Base 0004 must be marked superseded');
assert.strictEqual(BMInst.isEstimateSuperseded(estR1), true, 'Revision 0004-R1 must be marked superseded');
assert.strictEqual(BMInst.isEstimateSuperseded(estR2), false, 'Latest revision 0004-R2 must NOT be marked superseded');
assert.strictEqual(BMInst.isEstimateSuperseded(est3), false, 'Unrevised estimate 0003 must NOT be marked superseded');

console.log('✓ PASS: getLatestEstimateRevision correctly resolves 0004-R2');
console.log('✓ PASS: isEstimateSuperseded accurately identifies 0004 and 0004-R1 as superseded');

// Test 2: System shows ONLY latest revised estimates in billing screen (no disabled/superseded estimates)
console.log('\n--- Test 2: System Shows Only Latest Estimates in Billing Screen ---');
const { eligibleEstimates } = BMInst.getEligibleBillingSources();
assert.strictEqual(eligibleEstimates.length, 2, 'Must return only the 2 latest active estimates (0004-R2 and 0003)');
assert(eligibleEstimates.some(e => e.estimate_no === 'EST/MSC1/2026/0004-R2'), 'Latest revision 0004-R2 must be present');
assert(eligibleEstimates.some(e => e.estimate_no === 'EST/MSC1/2026/0003'), 'Active estimate 0003 must be present');
assert(!eligibleEstimates.some(e => e.estimate_no === 'EST/MSC1/2026/0004-R1'), 'Superseded 0004-R1 must NOT be present on billing screen');
assert(!eligibleEstimates.some(e => e.estimate_no === 'EST/MSC1/2026/0004'), 'Superseded base 0004 must NOT be present on billing screen');

console.log('✓ PASS: Previous disabled estimates are removed from billing screen');
console.log('✓ PASS: System shows only latest estimate on billing screen for final bill');

// Test 3: Bill Creation Allowed Only for Latest Revision
console.log('\n--- Test 3: Bill Creation Intercepts Superseded Estimates ---');
toasts = [];
// User or code attempts to select the older superseded base estimate EST-0004
BMInst.onBillingSourceSelected('EST:EST-0004');
assert(draftBills.length > 0, 'Draft bill should be created');
const createdBill = draftBills[0];
assert.strictEqual(createdBill.estimate_no, 'EST/MSC1/2026/0004-R2', 'Bill MUST be created for latest revision 0004-R2, not superseded 0004!');
assert(toasts.some(t => t.msg.includes('EST/MSC1/2026/0004-R2')), 'Toast notification must inform switch to latest revision');

console.log('✓ PASS: Attempt to create bill for superseded estimate automatically switches to latest revision 0004-R2');

// Test 4: Direct attempt with createOrUpdateBillFromEstimate
console.log('\n--- Test 4: createOrUpdateBillFromEstimate Protection ---');
toasts = [];
draftBills = [];
BMInst.activeBillingBillId = null;
const billRes = BMInst.createOrUpdateBillFromEstimate('EST-0004-R1', false);
assert.strictEqual(billRes.estimate_no, 'EST/MSC1/2026/0004-R2', 'Must redirect R1 to latest revision R2');
assert.strictEqual(draftBills[0].estimate_no, 'EST/MSC1/2026/0004-R2');

console.log('✓ PASS: createOrUpdateBillFromEstimate redirects superseded R1 to latest revision R2');

console.log('\n================================================================');
console.log('🎉 ALL REVISED ESTIMATE BILLING RULE TESTS PASSED (100%)!');
console.log('================================================================\n');
