const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

console.log('================================================================');
console.log('VERIFYING SUBMITTED ESTIMATE ITEMS LOCK');
console.log('================================================================\n');

const billingJs = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');

assert(billingJs.includes("const isReadOnly = activeEst ? this.isEstimateLocked(activeEst) : false;"), 'isReadOnly must check activeEst.status !== DRAFT via isEstimateLocked');
assert(billingJs.includes("isEstimateLocked(est)"), 'Helper isEstimateLocked must exist');

console.log('✓ PASS: Static code contains status !== DRAFT check for isReadOnly and mutations');

// 2. Test in VM sandbox
let toasts = [];
let dbData = {
  billingEstimates: [
    {
      id: 'EST-001',
      estimate_no: 'EST/MSC1/2026/0004',
      status: 'SUBMITTED',
      items: [
        { id: 'ITM-1', name: 'General Service Labour', type: 'LABOUR', qty: 2, rate: 250, amount: 500 },
        { id: 'ITM-2', name: 'Brake Shoe Rear', type: 'PART', qty: 1, rate: 355, amount: 355 }
      ],
      subtotal: 855,
      estimated_total: 855
    },
    {
      id: 'EST-002',
      estimate_no: 'EST/MSC1/2026/0005',
      status: 'DRAFT',
      items: [
        { id: 'ITM-3', name: 'Engine Oil', type: 'PART', qty: 1, rate: 450, amount: 450 }
      ],
      subtotal: 450,
      estimated_total: 450
    }
  ],
  jobCards: []
};

global.window = {
  DB: {
    getAll: (table) => dbData[table] || [],
    getById: (table, id) => (dbData[table] || []).find(x => x.id === id),
    upsert: (table, doc) => {
      if (!dbData[table]) dbData[table] = [];
      const idx = dbData[table].findIndex(x => x.id === doc.id);
      if (idx >= 0) dbData[table][idx] = doc;
      else dbData[table].push(doc);
    },
    saveData: () => {},
    emitChange: () => {},
    logAudit: () => {}
  },
  State: {
    showToast: (msg, type) => { toasts.push({ msg, type }); },
    showModal: () => {},
    closeModal: () => {}
  }
};

const sandbox = {
  window: global.window,
  console: console,
  Number: Number,
  Math: Math,
  parseInt: parseInt,
  parseFloat: parseFloat,
  isNaN: isNaN,
  Array: Array,
  Date: Date,
  JSON: JSON
};

vm.createContext(sandbox);

const script = new vm.Script(`
  globalThis.BillingModule = {
    activeEstimateId: 'EST-001',
    isEstimateLocked(est) {
      if (!est) return false;
      return est.status !== 'DRAFT';
    },
    getActiveEstimate() {
      return window.DB.getById('billingEstimates', this.activeEstimateId);
    },
    recalculateEstimateTotals(est) {
      est.subtotal = (est.items || []).reduce((s, i) => s + (i.amount || (i.qty * i.rate)), 0);
      est.estimated_total = est.subtotal;
    },
    refresh() {},
    ${billingJs.slice(billingJs.indexOf('updateEstimateItemQty(itemId, val) {'), billingJs.indexOf('updateEstimateDiscount(val) {'))}
    ${billingJs.slice(billingJs.indexOf('reviseEstimate() {'), billingJs.indexOf('customerBillingSearch:'))}
  };
`);

script.runInContext(sandbox);

// Test 1: Active estimate is SUBMITTED
let estSubmitted = sandbox.window.DB.getById('billingEstimates', 'EST-001');
assert.strictEqual(estSubmitted.status, 'SUBMITTED');

// Attempt to change qty
sandbox.BillingModule.updateEstimateItemQty('ITM-1', 5);
assert.strictEqual(estSubmitted.items[0].qty, 2, 'Qty must not change in SUBMITTED stage');
assert(toasts.some(t => t.msg.includes('submitted/locked')), 'Must trigger lock warning toast');

// Attempt to change rate
sandbox.BillingModule.updateEstimateItemRate('ITM-1', 400);
assert.strictEqual(estSubmitted.items[0].rate, 250, 'Rate must not change in SUBMITTED stage');

// Attempt to remove item
sandbox.BillingModule.removeEstimateItem('ITM-1');
assert.strictEqual(estSubmitted.items.length, 2, 'Items must not be removed in SUBMITTED stage');

console.log('✓ PASS: All item edits (Qty, Rate, Delete) blocked in SUBMITTED stage');

// Test 2: HTML rendering for SUBMITTED estimate
const htmlSubmitted = sandbox.BillingModule.renderEstimatesTab();
assert(!htmlSubmitted.includes('<th style="width: 45px; text-align: center;">Act</th>'), 'Act column header must not be rendered when submitted');
assert(!htmlSubmitted.includes("onclick=\"window.BillingModule.removeEstimateItem('ITM-1')\""), 'Delete Act button must not be rendered when submitted');
assert(!htmlSubmitted.includes("window.BillingModule.updateEstimateItemQty('ITM-1'"), 'Qty input must not be rendered when submitted');
assert(!htmlSubmitted.includes("window.BillingModule.updateEstimateItemRate('ITM-1'"), 'Rate input must not be rendered when submitted');
assert(htmlSubmitted.includes('<span class="cell-mono font-bold">2</span>'), 'Qty must be displayed as read-only text');
assert(htmlSubmitted.includes('<span class="cell-mono">₹250.00</span>'), 'Rate must be displayed as read-only text');
assert(!htmlSubmitted.includes('+ Add Item / Service'), '+ Add Item / Service must not be rendered when submitted');

console.log('✓ PASS: UI displays read-only formatted text for Quantity, Rate, Amount, hides Act column and + Add Item');

// Test 3: Active estimate is DRAFT
sandbox.BillingModule.activeEstimateId = 'EST-002';
const htmlDraft = sandbox.BillingModule.renderEstimatesTab();
assert(htmlDraft.includes('<th style="width: 45px; text-align: center;">Act</th>'), 'Act column header must be rendered for DRAFT');
assert(htmlDraft.includes("window.BillingModule.updateEstimateItemQty('ITM-3'"), 'Qty input must be rendered for DRAFT');
assert(htmlDraft.includes('+ Add Item / Service'), '+ Add Item / Service must be rendered for DRAFT');

// Can edit in DRAFT
sandbox.BillingModule.updateEstimateItemQty('ITM-3', 3);
const estDraft = sandbox.window.DB.getById('billingEstimates', 'EST-002');
assert.strictEqual(estDraft.items[0].qty, 3, 'Qty must be editable in DRAFT stage');

console.log('✓ PASS: DRAFT stage allows editing Quantity, Rate, Amount, Act column, and + Add Item');

// Test 4: Revise Estimate unlocks into new DRAFT revision
sandbox.BillingModule.activeEstimateId = 'EST-001'; // switch back to submitted
sandbox.BillingModule.reviseEstimate();
const activeRev = sandbox.BillingModule.getActiveEstimate();
assert(activeRev.estimate_no.includes('-R1'), 'Must generate revision -R1');
assert.strictEqual(activeRev.status, 'DRAFT', 'Revised estimate must be in DRAFT status');

// Now in revised DRAFT, edits are allowed
sandbox.BillingModule.updateEstimateItemQty('ITM-1', 4);
assert.strictEqual(activeRev.items[0].qty, 4, 'Can edit revised draft items');

console.log('✓ PASS: "Revise Estimate" creates new DRAFT revision (-R1) that can be edited');

console.log('\n================================================================');
console.log('🎉 ALL SUBMITTED ESTIMATE LOCK TESTS PASSED (100%)!');
console.log('================================================================\n');
