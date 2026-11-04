// Automated Unit Test for Quick Bill from Job Card
const assert = require('assert');

// Setup mock window & browser environment
global.window = global;
global.document = {
  getElementById: (id) => null
};

const DB = {
  data: {
    jobCards: [
      {
        id: 'JC-NEW-001',
        job_card_no: 'JC/MSC1/2026/0099',
        customer_name: 'Pravin Patil',
        customer_mobile: '9822001122',
        customer_cin: 'CIN/MSC1/2026/000088',
        vehicle_reg_no: 'MH12EK2342',
        vehicle_model: 'Activa 6G',
        service_type: 'General Service',
        technician_name: 'Sanket Borole',
        odometer_km: 1500,
        fuel_level: '50%',
        status: 'ESTIMATE_PENDING',
        parts_required: [
          { item_id: 'PRT-01', item_code: 'ENG-OIL-4T', item_name: 'Engine Oil 4T 10W30', qty: 1, unit_price: 450, tax_rate: 18 }
        ],
        labour_tasks: [
          { name: 'General Periodic Maintenance Service', qty: 1, rate: 350, amount: 350 }
        ]
      },
      {
        id: 'JC-NO-CIN',
        job_card_no: 'JC/MSC1/2026/0100',
        customer_name: 'Ramesh Kadam',
        customer_mobile: '9890123456',
        customer_cin: '', // Missing CIN
        cin_number: '',
        vehicle_reg_no: 'MH14CD2322',
        vehicle_model: 'Jupiter 125',
        service_type: 'General Service',
        technician_name: 'Sanket Borole',
        status: 'READY_FOR_BILLING'
      }
    ],
    billingEstimates: [],
    draftBills: [],
    finalBills: [],
    vehicleDeliveries: [],
    customers: [
      { id: 'CUST-001', customer_name: 'Pravin Patil', mobile: '9822001122', customer_cin: 'CIN/MSC1/2026/000088' }
    ],
    plants: [{ id: 'PLANT-01', code: 'MSC1', name: 'Mauli Service Center 1' }]
  },
  getAll(table) { return this.data[table] || []; },
  getById(table, id) { return (this.data[table] || []).find(r => r.id === id); },
  upsert(table, item) {
    if (!this.data[table]) this.data[table] = [];
    const idx = this.data[table].findIndex(r => r.id === item.id);
    if (idx >= 0) this.data[table][idx] = item;
    else this.data[table].push(item);
  },
  saveData() {},
  emitChange() {},
  getDefaultTax() { return { rate: 18, name: 'GST 18%' }; }
};
window.DB = DB;

let lastToast = null;
let modalClosed = false;

window.State = {
  getCurrentUser() { return { id: 'USR-001', primary_role: 'ROLE-ADMIN' }; },
  showToast(msg, type) {
    lastToast = { msg, type };
    console.log(`[Toast ${type}]: ${msg}`);
  },
  closeModal() {
    modalClosed = true;
  }
};

window.location = {
  hash: '#/job-cards'
};

// Require BillingModule
require('../js/modules/billing.js');
const billing = window.BillingModule;

console.log('Testing Quick Bill from Job Card...');

// TEST 1: Click Quick Bill on newly created job card (JC-NEW-001)
console.log('\n--- TEST 1: actionDraftBillFromJobCard for JC-NEW-001 ---');
modalClosed = false;
lastToast = null;

assert.doesNotThrow(() => {
  billing.actionDraftBillFromJobCard('JC-NEW-001');
}, 'actionDraftBillFromJobCard must not throw ReferenceError or any error');

// Verify draft bill was created
const drafts = DB.getAll('draftBills');
assert.strictEqual(drafts.length, 1, 'One draft bill should be created');
const draft = drafts[0];
console.log(`✓ Draft bill created: ${draft.draft_bill_no} (ID: ${draft.id})`);
assert.strictEqual(draft.job_card_id, 'JC-NEW-001', 'Draft bill must be linked to JC-NEW-001');
assert.strictEqual(draft.job_card_no, 'JC/MSC1/2026/0099');
assert.strictEqual(draft.customer_name, 'Pravin Patil');
assert.strictEqual(draft.customer_cin, 'CIN/MSC1/2026/000088');
assert.strictEqual(draft.vehicle_reg_no, 'MH12EK2342');

// Verify items populated from job card parts and labour
assert(draft.items.length >= 2, 'Draft bill should contain parts and labour from Job Card');
console.log(`✓ Items in draft bill: ${draft.items.map(i => i.name).join(', ')}`);

// Verify state & routing updates
assert.strictEqual(billing.activeBillingBillId, draft.id, 'activeBillingBillId should be set to target draft bill');
assert.strictEqual(billing.activeTab, 'CUSTOMER_BILLING', 'activeTab should be switched to CUSTOMER_BILLING');
assert.strictEqual(window.location.hash, '#/customer-billing', 'window.location.hash should route to #/customer-billing');
assert.strictEqual(modalClosed, true, 'Any open modal should be closed');
console.log('✓ activeBillingBillId, activeTab, and hash correctly updated to Customer Billing!');

// Verify getActiveCustomerBillingBill returns this draft bill
const activeBill = billing.getActiveCustomerBillingBill();
assert(activeBill, 'getActiveCustomerBillingBill must return active bill');
assert.strictEqual(activeBill.id, draft.id, 'Active bill must match the created draft bill');
console.log(`✓ getActiveCustomerBillingBill returned ${activeBill.draft_bill_no} (${activeBill.customer_name})`);

// TEST 2: Job Card with missing CIN (auto-generates/assigns CIN)
console.log('\n--- TEST 2: actionDraftBillFromJobCard for Job Card with missing CIN (JC-NO-CIN) ---');
assert.doesNotThrow(() => {
  billing.actionDraftBillFromJobCard('JC-NO-CIN');
});
const jc2 = DB.getById('jobCards', 'JC-NO-CIN');
assert(jc2.customer_cin && jc2.customer_cin.startsWith('CIN/'), 'Job Card should have auto-assigned CIN');
console.log(`✓ Auto-assigned CIN to job card: ${jc2.customer_cin}`);

const bill2 = billing.getActiveCustomerBillingBill();
assert(bill2, 'Active bill should exist for JC-NO-CIN');
assert.strictEqual(bill2.customer_name, 'Ramesh Kadam');
assert.strictEqual(bill2.vehicle_reg_no, 'MH14CD2322');
console.log(`✓ Quick bill successfully created for customer with missing CIN: ${bill2.draft_bill_no}`);

// TEST 3: Calling Quick Bill again reuses the existing draft bill
console.log('\n--- TEST 3: Calling Quick Bill again reuses existing draft bill ---');
const prevDraftsCount = DB.getAll('draftBills').length;
billing.actionDraftBillFromJobCard('JC-NEW-001');
const currentDraftsCount = DB.getAll('draftBills').length;
assert.strictEqual(currentDraftsCount, prevDraftsCount, 'Draft bill count should not increase (existing draft reused)');
assert.strictEqual(billing.activeBillingBillId, draft.id, 'activeBillingBillId should be original draft bill');
console.log('✓ Existing draft bill was reused and updated without creating duplicates.');

// TEST 4: Action Toolbar button rendering
console.log('\n--- TEST 4: renderJobCardActionToolbar button rendering ---');
const toolbarHtml = billing.renderJobCardActionToolbar('JC-NEW-001', true);
assert(toolbarHtml.includes("window.BillingModule.actionDraftBillFromJobCard('JC-NEW-001')"), 'Toolbar must have actionDraftBillFromJobCard click handler');
assert(toolbarHtml.includes('⚡ Quick Bill'), 'Toolbar must render ⚡ Quick Bill button');
console.log('✓ Quick Bill button rendered properly in action toolbar.');

console.log('\n========================================');
console.log('ALL QUICK BILL UNIT TESTS PASSED! ✅');
console.log('========================================');
