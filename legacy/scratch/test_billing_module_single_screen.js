const fs = require('fs');
const assert = require('assert');

console.log('=== TEST SUITE: SINGLE-SCREEN CUSTOMER BILLING MODULE ===\n');

// 1. Mock Environment
global.window = {
  location: { hash: '#/customer-billing' }
};
global.document = {
  getElementById: (id) => ({
    value: id === 'ss-amt-rcvd' ? '0' : '0',
    innerText: '',
    style: {},
    focus: () => {}
  }),
  activeElement: null
};
global.localStorage = { getItem: () => null, setItem: () => null };

// Load code files
eval(fs.readFileSync('d:/Projects/ISCM/js/data/mock-data.js', 'utf8'));
eval(fs.readFileSync('d:/Projects/ISCM/js/data/db.js', 'utf8'));
eval(fs.readFileSync('d:/Projects/ISCM/js/modules/doc-series-master.js', 'utf8'));

// Mock State
window.State = {
  toasts: [],
  modals: [],
  showToast(msg, type) {
    this.toasts.push({ msg, type });
    console.log(`[Toast ${type}]: ${msg}`);
  },
  showModal(opts) {
    this.modals.push(opts);
    console.log(`[Modal Opened]: ${opts.title}`);
  },
  closeModal() {
    console.log(`[Modal Closed]`);
  }
};

// Load Billing Module
eval(fs.readFileSync('d:/Projects/ISCM/js/modules/billing.js', 'utf8'));

console.log('--- Step 1: Initialize Module & Ensure Seed Data ---');
window.BillingModule.ensureSeedData();

const jc501 = window.DB.getById('jobCards', 'JC-000501');
assert(jc501, 'JC-000501 must be seeded in jobCards');
assert.strictEqual(jc501.customer_cin, 'CIN-000126', 'JC-000501 CIN must be CIN-000126');
assert.strictEqual(jc501.customer_name, 'Rahul Patil', 'Customer name must be Rahul Patil');
assert.strictEqual(jc501.vehicle_reg_no, 'MH12AB1234', 'Vehicle reg must be MH12AB1234');
console.log('✔ Job Card JC-000501 verified with persistent Customer CIN CIN-000126');

const db501 = window.DB.getById('draftBills', 'DBILL-000501');
assert(db501, 'DBILL-000501 must be seeded in draftBills');
assert.strictEqual(db501.customer_cin, 'CIN-000126', 'Draft Bill CIN must be CIN-000126');
assert.strictEqual(db501.status, 'DRAFT', 'Initial status must be DRAFT');
console.log('✔ Draft Bill DBILL-000501 verified in DRAFT status');

console.log('\n--- Step 2: Render Single-Screen Customer Billing (Draft State) ---');
window.BillingModule.activeBillingBillId = 'DBILL-000501';
const draftHtml = window.BillingModule.renderCustomerBillingSingleScreen();

assert(draftHtml.includes('Customer Billing'), 'UI must have title Customer Billing');
assert(draftHtml.includes('Draft'), 'Status badge must show Draft');
assert(draftHtml.includes('JC-000501'), 'Must display Job Card No JC-000501');
assert(draftHtml.includes('Generated on Finalization'), 'Bill No must display Generated on Finalization in draft');
assert(draftHtml.includes('CIN-000126'), 'Must display Customer CIN CIN-000126');
assert(draftHtml.includes('MH12AB1234'), 'Must display Vehicle No MH12AB1234');
assert(draftHtml.includes('Rahul Patil'), 'Must display Customer Name Rahul Patil');
assert(draftHtml.includes('98XXXXXX10'), 'Must display Mobile Number 98XXXXXX10');
assert(draftHtml.includes('Honda Activa'), 'Must display Vehicle Model Honda Activa');
assert(draftHtml.includes('18,500 km'), 'Must display Odometer Reading 18,500 km');
assert(draftHtml.includes('Engine Oil'), 'Must contain Engine Oil');
assert(draftHtml.includes('Oil Filter'), 'Must contain Oil Filter');
assert(draftHtml.includes('General Service Labour'), 'Must contain General Service Labour');
assert(draftHtml.includes('1,100.00'), 'Subtotal must be 1,100.00');
assert(draftHtml.includes('198.00'), 'Tax must be 198.00');
assert(draftHtml.includes('1,298.00'), 'Grand total & balance due must be 1,298.00');
assert(draftHtml.includes('Save Draft'), 'Must contain Save Draft button');
assert(draftHtml.includes('Create Final Bill'), 'Must contain Create Final Bill button');
assert(draftHtml.includes('Bill status: Draft — editable, not finalized.'), 'Must display Draft status notice');
console.log('✔ Single-Screen Draft UI contains all requested visual elements and exact prompt values!');

console.log('\n--- Step 3: Test Interactive Draft Adjustments (Same Screen) ---');
// Modify Quantity of Engine Oil
const oilItem = db501.items.find(i => i.name === 'Engine Oil');
window.BillingModule.updateSingleScreenItemQty(oilItem.id, 2); // 2 * 450 = 900
// Subtotal = 900 + 150 + 500 = 1550
// Tax = 1550 * 0.18 = 279
// Grand total = 1829
assert.strictEqual(db501.subtotal, 1550, 'Recalculated subtotal must be 1550');
assert.strictEqual(db501.grand_total, 1829, 'Recalculated grand total must be 1829');
console.log('✔ Updated item quantity; subtotal & taxes recalculated in real time on the same screen');

// Reset to prompt standard: Qty = 1
window.BillingModule.updateSingleScreenItemQty(oilItem.id, 1);
assert.strictEqual(db501.subtotal, 1100, 'Subtotal restored to 1100');
assert.strictEqual(db501.grand_total, 1298, 'Grand total restored to 1298');

// Test Save Draft
window.BillingModule.saveCustomerBillingDraft();
assert.strictEqual(db501.status, 'DRAFT', 'Status remains DRAFT after saving');
console.log('✔ Save Draft executed successfully without issuing final invoice number');

console.log('\n--- Step 4 & 5: Review & Finalize Bill (Same Screen, Zero Navigation) ---');
window.BillingModule.finalizeCustomerBilling();

const finDb = window.DB.getById('draftBills', 'DBILL-000501');
assert.strictEqual(finDb.status, 'FINALIZED', 'Draft bill status must update to FINALIZED');
assert(finDb.invoice_no, 'Invoice number must be set');
assert(finDb.invoice_no.startsWith('INV/'), `Invoice number must follow Document Series Master format: ${finDb.invoice_no}`);
console.log(`✔ Finalized Bill Number generated from Document Number Series: ${finDb.invoice_no}`);

// Verify Job Card was marked BILLED
const updatedJc = window.DB.getById('jobCards', 'JC-000501');
assert.strictEqual(updatedJc.status, 'BILLED', 'Parent Job Card status must be BILLED');
console.log('✔ Job Card JC-000501 marked as BILLED');

// Render Finalized Single-Screen UI
const finHtml = window.BillingModule.renderCustomerBillingSingleScreen();
assert(finHtml.includes('Finalized'), 'Status badge must show Finalized');
assert(finHtml.includes(finDb.invoice_no), 'Must display official invoice number in Bill No card');
assert(!finHtml.includes('Generated on Finalization'), 'Must no longer say Generated on Finalization');
assert(finHtml.includes('Print Tax Invoice'), 'Must contain Print Tax Invoice button');
assert(finHtml.includes('WhatsApp Share'), 'Must contain WhatsApp Share button');
assert(finHtml.includes('Download PDF'), 'Must contain Download PDF button');
assert(finHtml.includes('Credit Note / Adjustment'), 'Must contain Credit Note / Adjustment button');
assert(finHtml.includes('Bill status: Finalized — official bill generated, locked.'), 'Must display Finalized status notice');
console.log('✔ Single-Screen Finalized UI rendered in-place with official invoice number and locked controls!');

console.log('\n--- Step 6: Test Payment Recording and Outstanding Balance ---');
// Record partial payment of 500
window.BillingModule.updateSingleScreenAmountReceived(500);
const activeAfterPartial = window.BillingModule.getActiveCustomerBillingBill();
assert.strictEqual(activeAfterPartial.balance_due, 798, 'Balance due must be 798 for partial payment');
console.log(`✔ Partial payment recorded: Received ₹500, Outstanding Balance Due: ₹${activeAfterPartial.balance_due}`);

// Record full settlement
window.BillingModule.updateSingleScreenAmountReceived(1298);
const activeAfterFull = window.BillingModule.getActiveCustomerBillingBill();
assert.strictEqual(activeAfterFull.balance_due, 0, 'Balance due must be 0 for full payment');
console.log('✔ Full settlement recorded: Balance Due: ₹0.00');

console.log('\n--- Step 7: Test Authorized Credit Note Adjustment (Rule 4) ---');
// Open credit note modal
window.BillingModule.showCreditNoteModal(finDb.id);
assert(window.State.modals.length > 0, 'Credit Note modal must be opened');
const lastModal = window.State.modals[window.State.modals.length - 1];
assert(lastModal.contentHtml.includes('Credit Note No (Doc Series)'), 'Modal must have Doc Series Credit Note field');
assert(lastModal.contentHtml.includes('CN/'), 'Credit Note field must show CN format');

console.log('✔ Authorized Credit Note modal and Doc Series numbering verified!');

console.log('\n======================================================');
console.log('ALL TESTS PASSED WITH 100% SUCCESS! 🚀');
console.log('======================================================');
