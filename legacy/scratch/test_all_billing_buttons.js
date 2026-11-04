const fs = require('fs');
const assert = require('assert');

console.log('=== TEST SUITE: BILLING SCREEN BUTTONS VERIFICATION ===\n');

global.window = {
  location: { hash: '#/customer-billing' },
  printCalled: false,
  print() {
    this.printCalled = true;
    console.log('[window.print() invoked]');
  }
};

let capturedDownloads = [];
global.document = {
  getElementById(id) {
    if (id === 'pay-mode') return { value: 'UPI' };
    if (id === 'pay-amount') return { value: '298' };
    if (id === 'pay-ref') return { value: 'UPI/9876543210' };
    if (id === 'cn-amount') return { value: '200' };
    if (id === 'cn-reason') return { value: 'Customer Goodwill / Loyalty Discount' };
    if (id === 'cn-approver') return { value: 'Workshop Manager (Santosh Shinde)' };
    if (id === 'cn-remarks') return { value: 'Goodwill adjustment' };
    if (id === 'printable-tax-invoice') return { outerHTML: '<div id="printable-tax-invoice">Test Tax Invoice</div>' };
    return { value: '0', style: {}, innerText: '' };
  },
  createElement(tag) {
    return {
      tagName: tag,
      setAttribute(name, val) { this[name] = val; },
      click() { capturedDownloads.push(this.download); },
      style: {}
    };
  },
  body: {
    appendChild() {},
    removeChild() {}
  },
  querySelectorAll: () => []
};
global.URL = {
  createObjectURL: (blob) => 'blob:mock-url'
};
global.Blob = class Blob {
  constructor(content, opts) {
    this.content = content;
    this.opts = opts;
  }
};
global.localStorage = { getItem: () => null, setItem: () => null };

// Load code files
eval(fs.readFileSync('d:/Projects/ISCM/js/data/mock-data.js', 'utf8'));
eval(fs.readFileSync('d:/Projects/ISCM/js/data/db.js', 'utf8'));
eval(fs.readFileSync('d:/Projects/ISCM/js/modules/doc-series-master.js', 'utf8'));

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
    this.modals.pop();
    console.log(`[Modal Closed]`);
  }
};

eval(fs.readFileSync('d:/Projects/ISCM/js/modules/billing.js', 'utf8'));

console.log('--- Step 1: Create a Job Card and Draft Bill ---');
const jc = {
  id: 'JC-TEST-001',
  job_card_no: 'JC-PUN-001',
  customer_cin: 'CIN-000126',
  customer_name: 'Rahul Patil',
  customer_mobile: '9822119810',
  vehicle_reg_no: 'MH12AB1234',
  vehicle_model: 'Honda Activa',
  status: 'READY_FOR_BILLING'
};
window.DB.upsert('jobCards', jc);

const bill = {
  id: 'DBILL-TEST-001',
  draft_bill_no: 'DB-TEST-001',
  job_card_id: jc.id,
  job_card_no: jc.job_card_no,
  customer_cin: jc.customer_cin,
  customer_name: jc.customer_name,
  customer_mobile: jc.customer_mobile,
  vehicle_reg_no: jc.vehicle_reg_no,
  vehicle_model: jc.vehicle_model,
  status: 'DRAFT',
  items: [
    { id: '1', name: 'Engine Oil 10W30', qty: 1, rate: 450, amount: 450, type: 'PART', hsn: '27101980' },
    { id: '2', name: 'Oil Filter O-Ring', qty: 1, rate: 150, amount: 150, type: 'PART', hsn: '87141090' },
    { id: '3', name: 'Periodic General Service Labour', qty: 1, rate: 500, amount: 500, type: 'LABOUR', hsn: '998729' }
  ]
};
window.DB.upsert('draftBills', bill);
window.BillingModule.activeBillingBillId = bill.id;

console.log('--- Step 2: Finalize Customer Bill ---');
window.BillingModule.finalizeCustomerBilling();

const activeBill = window.BillingModule.getActiveCustomerBillingBill();
assert(activeBill, 'Active bill must exist');
assert.strictEqual(activeBill.status, 'FINALIZED', 'Status must be FINALIZED');
assert(activeBill.invoice_no, 'Invoice number must be generated');
console.log(`✔ Bill finalized successfully with invoice_no: ${activeBill.invoice_no}`);

// Render Single-Screen Customer Billing HTML
const renderedHtml = window.BillingModule.renderCustomerBillingSingleScreen();
assert(renderedHtml.includes('Print Tax Invoice'), 'Must contain Print Tax Invoice button');
assert(renderedHtml.includes('Download PDF'), 'Must contain Download PDF button');
assert(renderedHtml.includes('WhatsApp Share'), 'Must contain WhatsApp Share button');
assert(renderedHtml.includes('Record Payment'), 'Must contain Record Payment button');
assert(renderedHtml.includes('Credit Note / Adjustment'), 'Must contain Credit Note / Adjustment button');
console.log('✔ All 5 action buttons rendered on screen');

console.log('\n--- Step 3: Test "Print Tax Invoice" Button Click ---');
window.State.modals = [];
window.BillingModule.showTaxInvoicePrintModal(activeBill.id);
assert.strictEqual(window.State.modals.length, 1, 'Modal must open when clicking Print Tax Invoice');
const printModal = window.State.modals[0];
assert(printModal.title.includes(activeBill.invoice_no), 'Modal title must contain invoice number');
assert(printModal.contentHtml.includes('TAX INVOICE'), 'Content must contain TAX INVOICE');
assert(printModal.contentHtml.includes('Engine Oil 10W30'), 'Content must contain line items');
assert(printModal.contentHtml.includes('Periodic General Service Labour'), 'Content must contain labour line item');
assert(printModal.contentHtml.includes('Print / Save as PDF'), 'Content must contain Print / Save as PDF button');
assert(printModal.contentHtml.includes('Download File'), 'Content must contain Download File button');
console.log('✔ Print Tax Invoice button opens full official GST invoice preview modal');

console.log('\n--- Step 4: Test "Download PDF" Button Click ---');
window.State.modals = [];
window.printCalled = false;
window.BillingModule.downloadInvoicePDF(activeBill.id);
assert.strictEqual(window.State.modals.length, 1, 'Modal must open when clicking Download PDF');

setTimeout(() => {
  assert(window.printCalled, 'window.print must be invoked to trigger browser PDF saving');
  console.log('✔ Download PDF button opens invoice preview and invokes print dialog with Save as PDF instructions');

  console.log('\n--- Step 5: Test Standalone Download HTML / PDF File ---');
  capturedDownloads = [];
  window.BillingModule.downloadInvoiceHtml(activeBill.id);
  assert.strictEqual(capturedDownloads.length, 1, 'File download must be triggered');
  assert(capturedDownloads[0].includes('Tax_Invoice_'), 'Downloaded file name must start with Tax_Invoice_');
  console.log(`✔ Download File executed successfully: ${capturedDownloads[0]}`);

  console.log('\n--- Step 6: Test "WhatsApp Share" Button Click ---');
  window.State.modals = [];
  window.BillingModule.shareInvoiceWhatsApp(activeBill.id);
  assert.strictEqual(window.State.modals.length, 1, 'Modal must open when clicking WhatsApp Share');
  const waModal = window.State.modals[0];
  assert(waModal.title.includes('WhatsApp Invoice Share'), 'Modal title must be WhatsApp Invoice Share');
  assert(waModal.contentHtml.includes('https://wa.me/91'), 'Content must contain valid wa.me link');
  console.log('✔ WhatsApp Share modal opens with direct WhatsApp Web link and message preview');

  console.log('\n--- Step 7: Test "Record Payment" Button Click & Submission ---');
  window.State.modals = [];
  window.BillingModule.showRecordPaymentModal(activeBill.id);
  assert.strictEqual(window.State.modals.length, 1, 'Modal must open when clicking Record Payment');
  const payModal = window.State.modals[0];
  assert(payModal.title.includes('Record Payment'), 'Modal title must be Record Payment');
  assert(payModal.contentHtml.includes('pay-mode'), 'Content must contain pay-mode input');

  // Submit partial payment: 298 out of 1298 -> Balance 1000
  window.BillingModule.submitPayment(activeBill.id);
  const billAfterPay = window.BillingModule.resolveInvoiceOrBill(activeBill.id);
  assert.strictEqual(billAfterPay.amount_paid, 298, 'Amount paid must be 298');
  assert.strictEqual(billAfterPay.balance_amount, 1000, 'Balance amount must be 1000');
  assert.strictEqual(billAfterPay.status, 'PARTIALLY_PAID', 'Status must be PARTIALLY_PAID');
  console.log(`✔ Payment recorded: Received ₹298, Remaining Balance: ₹${billAfterPay.balance_amount}`);

  console.log('\n--- Step 8: Test "Credit Note / Adjustment" Button Click & Submission ---');
  window.State.modals = [];
  window.BillingModule.showCreditNoteModal(activeBill.id);
  assert.strictEqual(window.State.modals.length, 1, 'Modal must open when clicking Credit Note');
  const cnModal = window.State.modals[0];
  assert(cnModal.title.includes('Issue Credit Note'), 'Modal title must be Issue Credit Note');

  // Submit Credit Note of 200 -> Grand total drops to 1098, balance drops to 800
  window.BillingModule.submitCreditNote(activeBill.id);
  const billAfterCn = window.BillingModule.resolveInvoiceOrBill(activeBill.id);
  assert.strictEqual(billAfterCn.credit_note_amount, 200, 'Credit note amount must be 200');
  assert.strictEqual(billAfterCn.grand_total, 1098, 'Grand total must be 1098');
  assert.strictEqual(billAfterCn.balance_amount, 800, 'Balance must be 800');
  console.log(`✔ Credit Note applied: ₹200 adjustment, New Net Total: ₹${billAfterCn.grand_total}, Remaining Balance: ₹${billAfterCn.balance_amount}`);

  console.log('\n======================================================');
  console.log('ALL BILLING BUTTON TESTS PASSED WITH 100% SUCCESS! 🚀');
  console.log('======================================================');
}, 500);
