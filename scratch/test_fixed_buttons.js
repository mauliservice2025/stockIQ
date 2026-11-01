const fs = require('fs');

global.window = {
  location: { hash: '#/customer-billing' },
  print: () => { console.log('[window.print() called]'); }
};
global.document = {
  getElementById: (id) => {
    if (id === 'pay-mode') return { value: 'UPI' };
    if (id === 'pay-amount') return { value: '100' };
    if (id === 'pay-ref') return { value: 'UPI-TEST-123' };
    if (id === 'cn-amount') return { value: '50' };
    if (id === 'cn-reason') return { value: 'DISCOUNT_CORRECTION' };
    if (id === 'cn-approver') return { value: 'Workshop Manager' };
    if (id === 'cn-remarks') return { value: 'Customer goodwill' };
    return { value: '0', style: {}, innerText: '' };
  },
  querySelectorAll: () => []
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

eval(fs.readFileSync('d:/Projects/ISCM/js/modules/billing.js', 'utf8'));

// Test creating and finalizing a bill
const testBill = {
  id: 'DBILL-000501',
  draft_bill_no: 'DB-000501',
  job_card_id: 'JC-000501',
  job_card_no: 'JC-000501',
  customer_cin: 'CIN-000126',
  customer_name: 'Rahul Patil',
  customer_mobile: '9822119810',
  vehicle_reg_no: 'MH12AB1234',
  vehicle_model: 'Honda Activa',
  status: 'DRAFT',
  items: [
    { id: '1', name: 'Engine Oil', qty: 1, rate: 450, amount: 450, type: 'PART' },
    { id: '2', name: 'Oil Filter', qty: 1, rate: 150, amount: 150, type: 'PART' },
    { id: '3', name: 'General Service Labour', qty: 1, rate: 500, amount: 500, type: 'LABOUR' }
  ]
};
window.DB.upsert('draftBills', testBill);
window.BillingModule.activeBillingBillId = 'DBILL-000501';

console.log('--- 1. Finalizing Bill ---');
window.BillingModule.finalizeCustomerBilling();

const activeBill = window.BillingModule.getActiveCustomerBillingBill();
console.log('Active Bill ID:', activeBill.id);
console.log('Active Bill Status:', activeBill.status);
console.log('Active Bill Invoice No:', activeBill.invoice_no);

console.log('\n--- 2. Upgrading BillingModule with resolveInvoiceOrBill ---');
window.BillingModule.resolveInvoiceOrBill = function(idOrObj) {
  if (!idOrObj) return this.getActiveCustomerBillingBill();
  if (typeof idOrObj === 'object') return idOrObj;

  const id = String(idOrObj).trim();
  const allFinals = window.DB.getAll('finalBills') || [];
  const allDrafts = window.DB.getAll('draftBills') || [];

  let found = allFinals.find(f => f.id === id || f.invoice_no === id || f.draft_bill_id === id || f.draft_bill_no === id || f.bill_no === id || f.job_card_no === id);
  if (found) return found;

  found = allDrafts.find(d => d.id === id || d.draft_bill_no === id || d.invoice_no === id || d.bill_no === id || d.job_card_no === id);
  if (found) {
    const linkedFinal = allFinals.find(f => f.draft_bill_id === found.id || (found.invoice_no && f.invoice_no === found.invoice_no) || f.job_card_no === found.job_card_no);
    if (linkedFinal) return linkedFinal;
    return found;
  }

  if (id.startsWith('DBILL-')) {
    const invId = id.replace('DBILL-', 'INV-');
    found = allFinals.find(f => f.id === invId);
    if (found) return found;
  } else if (id.startsWith('INV-')) {
    const dbId = id.replace('INV-', 'DBILL-');
    found = allDrafts.find(d => d.id === dbId);
    if (found) return found;
  }

  const active = this.getActiveCustomerBillingBill();
  if (active && (active.id === id || active.draft_bill_id === id || active.invoice_no === id || active.draft_bill_no === id)) {
    return active;
  }

  return active || null;
};

// Update showTaxInvoicePrintModal
window.BillingModule.showTaxInvoicePrintModal = function(billId) {
  const bill = this.resolveInvoiceOrBill(billId);
  if (!bill) {
    window.State.showToast('No bill found to print.', 'warning');
    return;
  }
  this.printInvoice(bill.id || billId);
};

// Update printInvoice
const oldPrintInvoice = window.BillingModule.printInvoice.bind(window.BillingModule);
window.BillingModule.printInvoice = function(invId) {
  const inv = this.resolveInvoiceOrBill(invId);
  if (!inv) {
    window.State.showToast('No invoice found to display.', 'warning');
    return;
  }
  // Call original logic with resolved invoice id
  return oldPrintInvoice(inv.id);
};

// Update downloadInvoicePDF
window.BillingModule.downloadInvoicePDF = function(billId) {
  const bill = this.resolveInvoiceOrBill(billId);
  if (!bill) return;
  this.printInvoice(bill.id);
  console.log('[downloadInvoicePDF] Triggered print and download');
};

// Update showRecordPaymentModal
window.BillingModule.showRecordPaymentModal = function(billId) {
  const bill = this.resolveInvoiceOrBill(billId);
  if (!bill) return;
  this.showPaymentModal(bill.id);
};

// Update showPaymentModal
const oldShowPaymentModal = window.BillingModule.showPaymentModal.bind(window.BillingModule);
window.BillingModule.showPaymentModal = function(invId) {
  const inv = this.resolveInvoiceOrBill(invId);
  if (!inv) return;
  return oldShowPaymentModal(inv.id);
};

console.log('\n--- 3. Testing Print Tax Invoice with activeBill.id ("' + activeBill.id + '") ---');
window.State.modals = [];
window.BillingModule.showTaxInvoicePrintModal(activeBill.id);
console.log('Result modals count:', window.State.modals.length);
if (window.State.modals.length > 0) {
  console.log('Modal title:', window.State.modals[0].title);
}

console.log('\n--- 4. Testing Download PDF with activeBill.id ("' + activeBill.id + '") ---');
window.State.modals = [];
window.BillingModule.downloadInvoicePDF(activeBill.id);
console.log('Result modals count:', window.State.modals.length);

console.log('\n--- 5. Testing Record Payment with activeBill.id ("' + activeBill.id + '") ---');
window.State.modals = [];
window.BillingModule.showRecordPaymentModal(activeBill.id);
console.log('Result modals count:', window.State.modals.length);
if (window.State.modals.length > 0) {
  console.log('Modal title:', window.State.modals[0].title);
}

console.log('\n--- 6. Testing WhatsApp Share with activeBill.id ("' + activeBill.id + '") ---');
window.State.modals = [];
window.BillingModule.shareInvoiceWhatsApp(activeBill.id);
console.log('Result modals count:', window.State.modals.length);
if (window.State.modals.length > 0) {
  console.log('Modal title:', window.State.modals[0].title);
}

console.log('\n--- 7. Testing Credit Note with activeBill.id ("' + activeBill.id + '") ---');
window.State.modals = [];
window.BillingModule.showCreditNoteModal(activeBill.id);
console.log('Result modals count:', window.State.modals.length);
if (window.State.modals.length > 0) {
  console.log('Modal title:', window.State.modals[0].title);
}
