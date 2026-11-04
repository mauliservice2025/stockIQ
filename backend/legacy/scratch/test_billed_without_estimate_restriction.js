const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('--- Testing "If bill is generated without Estimate then cannot create Estimate" ---');

// Mock browser environment
const dom = {
  getElementById: (id) => null,
  querySelectorAll: () => []
};

global.window = {
  location: { hash: '#/billing' },
  State: {
    toasts: [],
    modals: [],
    currentPlantId: 'PLANT-01',
    showToast(msg, type) {
      this.toasts.push({ msg, type });
    },
    showModal(opts) {
      this.modals.push(opts);
    },
    closeModal() {}
  },
  DB: {
    data: {
      jobCards: [],
      billingEstimates: [],
      draftBills: [],
      finalBills: [],
      vehicles: [],
      customers: [],
      plants: [{ id: 'PLANT-01', name: 'Pune Central Workshop' }]
    },
    getAll(col) {
      return this.data[col] || [];
    },
    getById(col, id) {
      return (this.data[col] || []).find(item => item.id === id);
    },
    upsert(col, item) {
      if (!this.data[col]) this.data[col] = [];
      const idx = this.data[col].findIndex(x => x.id === item.id);
      if (idx >= 0) this.data[col][idx] = item;
      else this.data[col].push(item);
    },
    saveData() {},
    emitChange() {},
    isPlantActive() { return true; },
    getDefaultTax() { return { rate: 18, name: 'GST 18%' }; }
  },
  StoreInventoryModule: {},
  DocSeriesMasterModule: {
    previewNextNumber: () => 'EST-001'
  }
};
global.document = dom;

// Read billing.js
const billingCode = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');

// Execute billing.js in VM
vm.runInThisContext(billingCode);
const BM = window.BillingModule;
assert(BM, 'BillingModule should be defined on window');

// Setup test records:
// JC1: Normal Job Card with NO estimate and NO bill (can create estimate)
const jc1 = {
  id: 'JC-101',
  job_card_no: 'JC-PUN-00101',
  customer_name: 'Rahul Patil',
  customer_mobile: '9800000001',
  customer_cin: 'CIN-00101',
  vehicle_reg_no: 'MH12AB1234',
  vehicle_model: 'Activa 6G',
  status: 'READY_FOR_BILLING',
  parts_required: []
};

// JC2: Job Card with Bill generated directly (Quick Bill) WITHOUT Estimate
const jc2 = {
  id: 'JC-102',
  job_card_no: 'JC-PUN-00102',
  customer_name: 'Suresh Patil',
  customer_mobile: '9800000002',
  customer_cin: 'CIN-00102',
  vehicle_reg_no: 'MH12CD9876',
  vehicle_model: 'Activa 125',
  status: 'READY_FOR_DELIVERY',
  payment_status: 'PAID',
  invoice_no: 'INV-PUN-2026-0001',
  parts_required: []
};
const bill2 = {
  id: 'BILL-201',
  invoice_no: 'INV-PUN-2026-0001',
  job_card_id: 'JC-102',
  job_card_no: 'JC-PUN-00102',
  status: 'PAID',
  grand_total: 1500
};

// JC3: Job Card with an Estimate AND a Bill
const jc3 = {
  id: 'JC-103',
  job_card_no: 'JC-PUN-00103',
  customer_name: 'Amit Kumar',
  customer_mobile: '9800000003',
  customer_cin: 'CIN-00103',
  vehicle_reg_no: 'MH12EF5678',
  vehicle_model: 'Jupiter',
  status: 'READY_FOR_DELIVERY',
  payment_status: 'PAID',
  invoice_no: 'INV-PUN-2026-0002',
  parts_required: []
};
const est3 = {
  id: 'EST-301',
  estimate_no: 'EST-PUN-2026-0001',
  job_card_id: 'JC-103',
  job_card_no: 'JC-PUN-00103',
  status: 'CUSTOMER_APPROVED',
  estimated_total: 2000
};
const bill3 = {
  id: 'BILL-301',
  invoice_no: 'INV-PUN-2026-0002',
  job_card_id: 'JC-103',
  job_card_no: 'JC-PUN-00103',
  status: 'PAID',
  grand_total: 2000
};

// JC4: Job Card with Draft Bill (in progress) generated without estimate
const jc4 = {
  id: 'JC-104',
  job_card_no: 'JC-PUN-00104',
  customer_name: 'Vikas Sharma',
  customer_mobile: '9800000004',
  customer_cin: 'CIN-00104',
  vehicle_reg_no: 'MH12GH2209',
  vehicle_model: 'Pulsar 150',
  status: 'READY_FOR_BILLING',
  parts_required: []
};
const draft4 = {
  id: 'DB-401',
  draft_bill_no: 'DB-PUN-001',
  job_card_id: 'JC-104',
  job_card_no: 'JC-PUN-00104',
  status: 'DRAFT',
  grand_total: 800
};

window.DB.data.jobCards = [jc1, jc2, jc3, jc4];
window.DB.data.billingEstimates = [est3];
window.DB.data.draftBills = [draft4];
window.DB.data.finalBills = [bill2, bill3];

// 1. Test hasEstimateForJobCard
console.log('\nTest 1: hasEstimateForJobCard');
assert.strictEqual(BM.hasEstimateForJobCard(jc1), false, 'JC1 should have no estimate');
assert.strictEqual(BM.hasEstimateForJobCard(jc2), false, 'JC2 should have no estimate');
assert.strictEqual(BM.hasEstimateForJobCard(jc3), true, 'JC3 should have estimate');
assert.strictEqual(BM.hasEstimateForJobCard('JC-103'), true, 'JC3 by ID should have estimate');
assert.strictEqual(BM.hasEstimateForJobCard(jc4), false, 'JC4 should have no estimate');
console.log('✓ hasEstimateForJobCard passed!');

// 2. Test isJobCardBilledWithoutEstimate
console.log('\nTest 2: isJobCardBilledWithoutEstimate');
assert.strictEqual(BM.isJobCardBilledWithoutEstimate(jc1), false, 'JC1 is unbilled, so isJobCardBilledWithoutEstimate is false');
assert.strictEqual(BM.isJobCardBilledWithoutEstimate(jc2), true, 'JC2 has Final Bill without Estimate -> should be true');
assert.strictEqual(BM.isJobCardBilledWithoutEstimate('JC-102'), true, 'JC2 by ID -> should be true');
assert.strictEqual(BM.isJobCardBilledWithoutEstimate(jc3), false, 'JC3 has Estimate -> should be false');
assert.strictEqual(BM.isJobCardBilledWithoutEstimate(jc4), true, 'JC4 has Draft Bill without Estimate -> should be true');
console.log('✓ isJobCardBilledWithoutEstimate passed!');

// 3. Test renderJobCardActionToolbar
console.log('\nTest 3: renderJobCardActionToolbar for billed rows');
const toolbarJC2 = BM.renderJobCardActionToolbar('JC-102', true);
assert(!toolbarJC2.includes('View Estimate'), 'JC2 toolbar should NOT contain "View Estimate" button');
assert(toolbarJC2.includes('View Bill'), 'JC2 toolbar should contain "View Bill" button');

const toolbarJC3 = BM.renderJobCardActionToolbar('JC-103', true);
assert(toolbarJC3.includes('View Estimate'), 'JC3 toolbar SHOULD contain "View Estimate" button since estimate exists');
assert(toolbarJC3.includes('View Bill'), 'JC3 toolbar should contain "View Bill" button');

const toolbarJC4 = BM.renderJobCardActionToolbar('JC-104', true);
assert(toolbarJC4.includes('disabled') && toolbarJC4.includes('Estimate'), 'JC4 toolbar should have disabled Estimate button');
assert(toolbarJC4.includes('Bill is already generated for this Job Card without an estimate'), 'JC4 toolbar should explain why estimate is disabled');
console.log('✓ renderJobCardActionToolbar passed!');

// 4. Test actionEstimateFromJobCard blocked
console.log('\nTest 4: actionEstimateFromJobCard blocked for billed without estimate');
window.State.toasts = [];
BM.actionEstimateFromJobCard('JC-102');
assert.strictEqual(window.State.toasts.length, 1, 'Toast should be emitted for JC2');
assert(window.State.toasts[0].msg.includes('Cannot create estimate: Bill has already been generated'), 'Toast message should warn about existing bill without estimate');

// 5. Test createNewEstimate(targetJobCardId) blocked
console.log('\nTest 5: createNewEstimate(targetJobCardId) blocked');
window.State.toasts = [];
BM.createNewEstimate('JC-102');
assert.strictEqual(window.State.toasts.length, 1, 'Toast should be emitted for JC2');
assert(window.State.toasts[0].msg.includes('Cannot create estimate'), 'Toast message should warn about existing bill without estimate');

// 6. Test createEstimateForJobCardRecord(jc) blocked
console.log('\nTest 6: createEstimateForJobCardRecord blocked');
window.State.toasts = [];
BM.createEstimateForJobCardRecord(jc2);
assert.strictEqual(window.State.toasts.length, 1, 'Toast should be emitted for JC2');
assert(window.State.toasts[0].msg.includes('Cannot create estimate'), 'Toast message should warn about existing bill without estimate');

// 7. Test saveDraftEstimate and submitEstimate blocked
console.log('\nTest 7: saveDraftEstimate and submitEstimate validation');
BM.activeEstimate = {
  id: 'EST-UNSAVED',
  estimate_no: 'Generated on Save',
  status: 'DRAFT',
  job_card_id: 'JC-102',
  job_card_no: 'JC-PUN-00102',
  customer_cin: 'CIN-00102',
  vehicle_reg_no: 'MH12CD9876',
  items: [{ id: '1', name: 'Service', qty: 1, rate: 500, amount: 500 }],
  _isNewUnsaved: true
};
BM.getActiveEstimate = () => BM.activeEstimate;
window.State.toasts = [];
BM.saveDraftEstimate();
assert(window.State.toasts.some(t => t.msg.includes('Cannot save estimate for a Job Card that has already been billed without an estimate')), 'saveDraftEstimate should fail validation');

window.State.toasts = [];
BM.submitEstimate();
assert(window.State.toasts.some(t => t.msg.includes('Cannot submit an estimate for a Job Card that has already been billed without an estimate')), 'submitEstimate should fail validation');

// 8. Test onEstimateJobCardChange blocked
console.log('\nTest 8: onEstimateJobCardChange blocked');
BM.activeEstimate = {
  id: 'EST-UNSAVED',
  estimate_no: 'Generated on Save',
  status: 'DRAFT',
  job_card_id: 'JC-101',
  job_card_no: 'JC-PUN-00101',
  customer_cin: 'CIN-00101',
  vehicle_reg_no: 'MH12AB1234',
  _isNewUnsaved: true
};
BM.refresh = () => {};
window.State.toasts = [];
BM.onEstimateJobCardChange('JC-102');
assert(window.State.toasts.some(t => t.msg.includes('Cannot link Job Card') && t.msg.includes('Bill already generated without an estimate')), 'onEstimateJobCardChange should block selecting JC2');
assert.strictEqual(BM.activeEstimate.job_card_id, 'JC-101', 'activeEstimate should NOT be switched to JC-102');

// 9. Test modal showSelectJobCardForEstimateModal shows disabled button
console.log('\nTest 9: showSelectJobCardForEstimateModal marks billed without estimate');
window.State.modals = [];
BM.showSelectJobCardForEstimateModal([jc1, jc2, jc3, jc4]);
assert.strictEqual(window.State.modals.length, 1);
const modalHtml = window.State.modals[0].contentHtml;
assert(modalHtml.includes('🚫 Billed without Estimate'), 'Modal HTML should contain disabled button with "🚫 Billed without Estimate"');
assert(modalHtml.includes('Billed without Estimate'), 'Modal HTML should contain badge for billed without estimate');

// 10. Test CLOSED Job Card billed without estimate (matching user screenshot)
console.log('\nTest 10: CLOSED Job Card billed without estimate (actions column & view modal)');
const jc5 = {
  id: 'JC-105',
  job_card_no: 'JC/MSC1/2026/0041',
  customer_name: 'Vishal Kumar',
  customer_mobile: '9874336533',
  vehicle_reg_no: 'MH12SC3745',
  vehicle_model: 'Tvs Jupiter 125',
  status: 'CLOSED',
  bill_status: 'COMPLETED',
  payment_status: 'PAID',
  invoice_no: 'INV-2026-0041',
  parts_required: [{ id: 'p1', name: 'Engine Oil', status: 'ISSUED', issued_qty: 1 }]
};
const bill5 = {
  id: 'BILL-501',
  invoice_no: 'INV-2026-0041',
  job_card_id: 'JC-105',
  job_card_no: 'JC/MSC1/2026/0041',
  status: 'PAID',
  grand_total: 1200
};
window.DB.data.jobCards.push(jc5);
window.DB.data.finalBills.push(bill5);

const toolbarJC5 = BM.renderJobCardActionToolbar('JC-105', true);
assert(toolbarJC5.includes('disabled'), 'JC5 toolbar MUST have disabled attribute for Create Estimate button');
assert(toolbarJC5.includes('cursor: not-allowed;'), 'JC5 toolbar MUST have disabled styling');
assert(toolbarJC5.includes('🚫 Billed without Estimate'), 'JC5 toolbar button text MUST be "🚫 Billed without Estimate"');
assert(!toolbarJC5.includes("actionEstimateFromJobCard('JC-105')"), 'JC5 toolbar MUST NOT have active actionEstimateFromJobCard onclick');
assert(toolbarJC5.includes('Cannot create estimate: Bill is already generated'), 'JC5 toolbar button tooltip should explain restriction');

window.State.modals = [];
BM.viewJobCard('JC-105');
assert.strictEqual(window.State.modals.length, 1);
const viewModalHtml = window.State.modals[0].contentHtml;
assert(viewModalHtml.includes('cursor: not-allowed;'), 'View modal footer MUST disable Create Estimate button');
assert(viewModalHtml.includes('🚫 Billed without Estimate'), 'View modal button text MUST be "🚫 Billed without Estimate"');
assert(!viewModalHtml.includes("actionEstimateFromJobCard('JC-105')"), 'View modal footer MUST NOT have active actionEstimateFromJobCard onclick');
console.log('✓ Test 10: CLOSED Job Card billed without estimate passed!');

console.log('\nALL 10 TESTS PASSED SUCCESSFULLY! ✅');

