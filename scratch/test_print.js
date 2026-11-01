const fs = require('fs');

global.window = {
  location: { hash: '#/customer-billing' },
  print: () => { console.log('[window.print() called]'); }
};
global.document = {
  getElementById: (id) => null,
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

// Create a draft bill and finalize it
const bill = {
  id: 'DBILL-999',
  job_card_id: 'JC-999',
  job_card_no: 'JC-000101',
  customer_cin: 'CIN-000126',
  customer_name: 'Rahul Patil',
  customer_mobile: '9822119810',
  vehicle_reg_no: 'MH12AB1234',
  vehicle_model: 'Honda Activa',
  status: 'DRAFT',
  items: [
    { id: '1', name: 'Engine Oil', qty: 1, rate: 450, amount: 450, type: 'PART' },
    { id: '2', name: 'General Labour', qty: 1, rate: 500, amount: 500, type: 'LABOUR' }
  ]
};
window.DB.upsert('draftBills', bill);
window.BillingModule.activeBillingBillId = 'DBILL-999';

console.log('--- Calling finalizeCustomerBilling() ---');
window.BillingModule.finalizeCustomerBilling();

const finalBills = window.DB.getAll('finalBills');
console.log('finalBills count:', finalBills.length);
console.log('finalBills[0].id:', finalBills[0].id);

const activeBill = window.BillingModule.getActiveCustomerBillingBill();
console.log('activeBill.id:', activeBill.id);

console.log('\n--- Calling showTaxInvoicePrintModal(activeBill.id) ---');
window.State.modals = [];
window.BillingModule.showTaxInvoicePrintModal(activeBill.id);
console.log('Modals opened count:', window.State.modals.length);

console.log('\n--- Calling downloadInvoicePDF(activeBill.id) ---');
window.State.modals = [];
window.BillingModule.downloadInvoicePDF(activeBill.id);
console.log('Modals opened count:', window.State.modals.length);

console.log('\n--- Calling showRecordPaymentModal(activeBill.id) ---');
window.State.modals = [];
window.BillingModule.showRecordPaymentModal(activeBill.id);
console.log('Modals opened count:', window.State.modals.length);
