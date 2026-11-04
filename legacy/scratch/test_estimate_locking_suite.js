// Test script for Estimate Locking Mechanism
const path = require('path');
const fs = require('fs');

// Set up mock window and State/DB environment
global.window = {};
global.document = {
  getElementById: (id) => null,
  querySelectorAll: (selector) => [],
  querySelector: (selector) => null
};
global.navigator = { clipboard: { writeText: () => Promise.resolve() } };

// Mock DB
const mockDb = {
  data: {
    billingEstimates: [],
    jobCards: [],
    items: [],
    inventoryBalances: [],
    draftBills: [],
    audit_logs: []
  },
  getAll(col) { return this.data[col] || []; },
  getById(col, id) { return (this.data[col] || []).find(x => x.id === id || x.estimate_no === id); },
  upsert(col, item) {
    if (!this.data[col]) this.data[col] = [];
    const idx = this.data[col].findIndex(x => x.id === item.id);
    if (idx !== -1) {
      this.data[col][idx] = { ...this.data[col][idx], ...item };
      return this.data[col][idx];
    } else {
      this.data[col].push(item);
      return item;
    }
  },
  saveData() {},
  emitChange() {},
  logAudit(action, module, recordId, details, user) {
    this.data.audit_logs.push({ action, module, recordId, details, user, time: new Date().toISOString() });
  },
  deductItemStock() {},
  restockItemStock() {},
  getItemStockDetails() { return { available: 50, inTransit: 0, uom: 'NOS' }; },
  getDefaultTax() { return { rate: 18 }; },
  getTaxByRate(r) { return { rate: r, cgst_rate: r / 2, sgst_rate: r / 2, name: `GST ${r}%` }; },
  renderTaxSelectOptions() { return ''; }
};
global.window.DB = mockDb;

// Mock State
global.window.State = {
  currentUser: { id: 'USR-001', name: 'Pravin Patil', role: 'ADMIN' },
  getCurrentUser() { return this.currentUser; },
  currentPlantId: 'PLANT-01',
  showToast(msg, type) { console.log(`[Toast ${type || 'info'}]: ${msg}`); },
  showModal(opts) { console.log(`[Modal opened]: ${opts.title}`); },
  closeModal() { console.log(`[Modal closed]`); }
};

// Load billing.js
console.log('Testing billing.js estimate locking mechanism...');
const billingCode = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');

// Evaluate BillingModule in sandbox
const fn = new Function('window', 'document', 'navigator', billingCode);
fn(global.window, global.document, global.navigator);

const BM = global.window.BillingModule;
if (!BM) {
  console.error('FAIL: BillingModule was not attached to window');
  process.exit(1);
}

// 1. Create a Registered Job Card
const testJC = {
  id: 'JC-101',
  job_card_no: 'JC/MSC1/2026/000101',
  customer_cin: 'CIN-001',
  customer_name: 'Rahul Sharma',
  customer_mobile: '9876543210',
  vehicle_reg_no: 'MH 12 AB 1234',
  vehicle_model: 'Activa 6G',
  odometer_km: '15,000 km',
  status: 'ESTIMATE_PENDING',
  parts_required: [
    { item_id: 'PRT-001', item_code: 'PRT-001', item_name: 'Brake Pad Set', qty: 1, unit_price: 350, amount: 350 }
  ]
};
mockDb.upsert('jobCards', testJC);

// 2. Create an Estimate in DRAFT status
const draftEst = {
  id: 'EST-TEST-001',
  estimate_no: 'EST/MSC1/2026/000101',
  job_card_id: testJC.id,
  job_card_no: testJC.job_card_no,
  customer_cin: testJC.customer_cin,
  customer_name: testJC.customer_name,
  customer_mobile: testJC.customer_mobile,
  vehicle_reg_no: testJC.vehicle_reg_no,
  vehicle_model: testJC.vehicle_model,
  odometer_km: '15,000 km',
  status: 'DRAFT',
  items: [
    { id: 'ITM-1', code: 'PRT-001', name: 'Brake Pad Set', type: 'PART', qty: 1, rate: 350, amount: 350 },
    { id: 'ITM-2', code: 'LBR-001', name: 'General Service Labour', type: 'LABOUR', qty: 1, rate: 399, amount: 399 }
  ],
  subtotal: 749,
  discount_amount: 0,
  tax_rate: 18,
  tax_amount: 134.82,
  estimated_total: 883.82
};
mockDb.upsert('billingEstimates', draftEst);
BM.activeEstimateId = draftEst.id;
BM.refresh = () => {};

console.log('\n--- TEST 1: Draft Estimate Modification Permitted ---');
console.log('isEstimateLocked for DRAFT:', BM.isEstimateLocked(draftEst));
if (BM.isEstimateLocked(draftEst) !== false) {
  console.error('FAIL: Draft estimate should not be locked');
  process.exit(1);
}

// Modify qty in draft
BM.updateEstimateItemQty('ITM-1', 2);
let currentEst = BM.getActiveEstimate();
console.log('Updated qty in DRAFT:', currentEst.items.find(i => i.id === 'ITM-1').qty);
if (currentEst.items.find(i => i.id === 'ITM-1').qty !== 2) {
  console.error('FAIL: Could not update item quantity in DRAFT');
  process.exit(1);
}

console.log('\n--- TEST 2: Submit Estimate and Lock ---');
BM.submitEstimate();
currentEst = BM.getActiveEstimate();
console.log('Status after submitEstimate:', currentEst.status);
console.log('isEstimateLocked after submit:', BM.isEstimateLocked(currentEst));
console.log('Original snapshot captured:', !!currentEst.original_submission_snapshot);
console.log('Snapshot items count:', currentEst.original_submission_snapshot?.items?.length);
console.log('Audit history length:', currentEst.audit_history?.length);

if (currentEst.status !== 'SUBMITTED' || !BM.isEstimateLocked(currentEst)) {
  console.error('FAIL: Estimate was not locked after submission');
  process.exit(1);
}

console.log('\n--- TEST 3: Block All Modifications on Submitted Estimate ---');
// Try to update qty
const prevQty = currentEst.items.find(i => i.id === 'ITM-1').qty;
BM.updateEstimateItemQty('ITM-1', 5);
if (currentEst.items.find(i => i.id === 'ITM-1').qty !== prevQty) {
  console.error('FAIL: Quantity modification was not blocked on submitted estimate');
  process.exit(1);
}
console.log('✓ Update Qty successfully blocked');

// Try to update rate
const prevRate = currentEst.items.find(i => i.id === 'ITM-1').rate;
BM.updateEstimateItemRate('ITM-1', 999);
if (currentEst.items.find(i => i.id === 'ITM-1').rate !== prevRate) {
  console.error('FAIL: Rate modification was not blocked on submitted estimate');
  process.exit(1);
}
console.log('✓ Update Rate successfully blocked');

// Try to remove item
const prevItemCount = currentEst.items.length;
BM.removeEstimateItem('ITM-1', 0);
if (currentEst.items.length !== prevItemCount) {
  console.error('FAIL: Remove item was not blocked on submitted estimate');
  process.exit(1);
}
console.log('✓ Remove item successfully blocked');

// Try to add item via postBatchEstimateItems
BM.postBatchEstimateItems([{ code: 'PRT-999', name: 'Illegal Part', type: 'PART', qty: 1, rate: 500 }]);
if (currentEst.items.some(i => i.code === 'PRT-999')) {
  console.error('FAIL: Adding item was not blocked on submitted estimate');
  process.exit(1);
}
console.log('✓ Add item successfully blocked');

// Try to update discount and tax
const prevTotal = currentEst.estimated_total;
BM.updateEstimateDiscount(200);
BM.updateEstimateTaxRate(0);
if (currentEst.estimated_total !== prevTotal) {
  console.error('FAIL: Total-affecting fields were not blocked on submitted estimate');
  process.exit(1);
}
console.log('✓ Discount & Tax modifications successfully blocked');

console.log('\n--- TEST 4: Authorized Revise / Reopen Workflow ---');
// Set reason textarea mock
global.document.getElementById = (id) => {
  if (id === 'est-revision-reason') return { value: 'Customer requested additional spark plug replacement' };
  return null;
};
global.document.querySelector = (selector) => {
  if (selector === 'input[name="est-rev-type"]:checked') return { value: 'NEW_REVISION' };
  return null;
};

BM.submitEstimateRevision(currentEst.id);

// Check if original is archived as REVISED and new revision created as DRAFT
const archived = mockDb.getById('billingEstimates', currentEst.id);
console.log('Archived original status:', archived.status);
console.log('Archived superseded_by_no:', archived.superseded_by_no);

const activeRev = BM.getActiveEstimate();
console.log('Active revision estimate_no:', activeRev.estimate_no);
console.log('Active revision status:', activeRev.status);
console.log('Active revision revision_no:', activeRev.revision_no);
console.log('Active revision audit history count:', activeRev.audit_history.length);
console.log('Original submission snapshot retained:', !!activeRev.original_submission_snapshot);

if (archived.status !== 'REVISED' || activeRev.status !== 'DRAFT' || activeRev.revision_no !== 1) {
  console.error('FAIL: Versioned revision was not properly created');
  process.exit(1);
}

// In the new revision (which is DRAFT), editing is permitted
BM.updateEstimateItemQty('ITM-1', 4);
if (activeRev.items.find(i => i.id === 'ITM-1').qty !== 4) {
  console.error('FAIL: Editable revision did not allow modification');
  process.exit(1);
}
console.log('✓ Revision allows modifications in DRAFT');

console.log('\n--- TEST 5: Test Reopen Estimate to Draft ---');
// Submit the revision
BM.submitEstimate();
const subRev = BM.getActiveEstimate();
console.log('Revision submitted and locked:', BM.isEstimateLocked(subRev), 'Status:', subRev.status);

// Now test reopening
global.document.querySelector = (selector) => {
  if (selector === 'input[name="est-rev-type"]:checked') return { value: 'REOPEN_DRAFT' };
  return null;
};
global.document.getElementById = (id) => {
  if (id === 'est-revision-reason') return { value: 'Manager reopening estimate for customer rate adjustment' };
  return null;
};

BM.submitEstimateRevision(activeRev.id);
const reopenedEst = BM.getActiveEstimate();
console.log('Reopened estimate status:', reopenedEst.status);
console.log('Reopened estimate locked:', BM.isEstimateLocked(reopenedEst));
if (reopenedEst.status !== 'DRAFT' || BM.isEstimateLocked(reopenedEst) !== false) {
  console.error('FAIL: Reopening estimate did not restore DRAFT state');
  process.exit(1);
}
console.log('✓ Reopen estimate successfully restored DRAFT state with audit log');

console.log('\n--- TEST 6: Audit Trail Verification ---');
const lastAudit = reopenedEst.audit_history[reopenedEst.audit_history.length - 1];
console.log('Last audit action:', lastAudit.action);
console.log('Last audit reason:', lastAudit.reason);
console.log('Last audit user:', lastAudit.user);
console.log('Last audit timestamp:', lastAudit.timestamp);

if (lastAudit.action !== 'ESTIMATE_REOPENED' || !lastAudit.reason || !lastAudit.user) {
  console.error('FAIL: Audit trail missing mandatory fields');
  process.exit(1);
}

console.log('\n=========================================');
console.log('ALL ESTIMATE LOCKING & REVISION TESTS PASSED!');
console.log('=========================================');
