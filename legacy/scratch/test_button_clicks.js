const fs = require('fs');

global.window = {
  location: { hash: '#/customer-billing' },
  print: () => { console.log('[window.print() called]'); }
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
window.BillingModule.ensureSeedData();

// Finalize bill DBILL-000501
window.BillingModule.activeBillingBillId = 'DBILL-000501';
window.BillingModule.finalizeCustomerBilling();

const activeBill = window.BillingModule.getActiveCustomerBillingBill();
console.log('\n--- Active Bill after finalization ---');
console.log('activeBill.id:', activeBill.id);
console.log('activeBill.status:', activeBill.status);
console.log('activeBill.invoice_no:', activeBill.invoice_no);

console.log('\n--- Testing button clicks on finalized activeBill ---');

// 1. Print Tax Invoice
console.log('\n1. Testing window.BillingModule.showTaxInvoicePrintModal("' + activeBill.id + '"):');
window.State.modals = [];
window.BillingModule.showTaxInvoicePrintModal(activeBill.id);
if (window.State.modals.length === 0) {
  console.log('>>> BUG CONFIRMED: showTaxInvoicePrintModal did NOT open any modal!');
} else {
  console.log('>>> SUCCESS: modal opened:', window.State.modals[0].title);
}

// 2. Download PDF
console.log('\n2. Testing window.BillingModule.downloadInvoicePDF("' + activeBill.id + '"):');
window.State.modals = [];
window.BillingModule.downloadInvoicePDF(activeBill.id);
if (window.State.modals.length === 0) {
  console.log('>>> BUG CONFIRMED: downloadInvoicePDF did NOT open any modal!');
} else {
  console.log('>>> SUCCESS: modal opened');
}

// 3. Record Payment
console.log('\n3. Testing window.BillingModule.showRecordPaymentModal("' + activeBill.id + '"):');
window.State.modals = [];
window.BillingModule.showRecordPaymentModal(activeBill.id);
if (window.State.modals.length === 0) {
  console.log('>>> BUG CONFIRMED: showRecordPaymentModal did NOT open any modal!');
} else {
  console.log('>>> SUCCESS: modal opened:', window.State.modals[0].title);
}
