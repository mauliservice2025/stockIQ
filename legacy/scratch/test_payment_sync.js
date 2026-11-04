const fs = require('fs');

global.window = {
  location: { hash: '#/customer-billing' },
  print: () => { console.log('[window.print() called]'); }
};
global.document = {
  getElementById: (id) => {
    if (id === 'pay-mode') return { value: 'UPI' };
    if (id === 'pay-amount') return { value: '500' };
    if (id === 'pay-ref') return { value: 'UPI-TEST-123' };
    return { value: '0', style: {}, innerText: '' };
  },
  querySelectorAll: () => []
};
global.localStorage = { getItem: () => null, setItem: () => null };

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

window.BillingModule.finalizeCustomerBilling();

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

window.BillingModule.submitPayment = function(invId) {
  const inv = this.resolveInvoiceOrBill(invId);
  if (!inv) return;

  const mode = (document.getElementById('pay-mode') && document.getElementById('pay-mode').value) || 'Cash';
  const amount = Number(document.getElementById('pay-amount') && document.getElementById('pay-amount').value) || 0;
  const ref = (document.getElementById('pay-ref') && document.getElementById('pay-ref').value.trim()) || `${mode} Payment`;

  const netPayable = Number(inv.net_payable !== undefined ? inv.net_payable : (inv.grand_total || 0));
  const previousPaid = Number(inv.amount_paid !== undefined ? inv.amount_paid : (inv.amount_received || 0));
  const newPaid = previousPaid + amount;
  const newBalance = Math.max(0, netPayable - newPaid);
  const newStatus = newBalance <= 0 ? 'PAID' : (newPaid > 0 ? 'PARTIALLY_PAID' : inv.status);

  inv.amount_paid = newPaid;
  inv.amount_received = newPaid;
  inv.balance_amount = newBalance;
  inv.balance_due = newBalance;
  inv.payment_mode = mode;
  inv.payment_ref = ref;
  inv.payment_date = new Date().toISOString().split('T')[0];
  inv.status = newStatus;

  window.DB.upsert('finalBills', inv);

  const draftId = inv.draft_bill_id || (inv.id.startsWith('INV-') ? inv.id.replace('INV-', 'DBILL-') : null);
  if (draftId) {
    const draft = window.DB.getById('draftBills', draftId);
    if (draft) {
      draft.amount_paid = newPaid;
      draft.amount_received = newPaid;
      draft.balance_amount = newBalance;
      draft.balance_due = newBalance;
      draft.payment_mode = mode;
      draft.payment_ref = ref;
      draft.status = newStatus;
      window.DB.upsert('draftBills', draft);
    }
  }

  window.State.closeModal();
  window.State.showToast(`Payment of ₹${amount} recorded for ${inv.invoice_no || inv.id}! Status: ${newStatus}`, 'success');
  console.log(`Payment processed! Balance remaining: ₹${newBalance}`);
};

console.log('\n--- Testing submitPayment with DBILL-000501 ---');
window.BillingModule.submitPayment('DBILL-000501');

const updatedDraft = window.DB.getById('draftBills', 'DBILL-000501');
const updatedFinal = window.DB.getById('finalBills', 'INV-000501');

console.log('updatedDraft balance_due:', updatedDraft.balance_due, 'status:', updatedDraft.status);
console.log('updatedFinal balance_amount:', updatedFinal.balance_amount, 'status:', updatedFinal.status);
