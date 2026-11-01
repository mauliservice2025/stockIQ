const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const localStorageData = {};
const mockLocalStorage = {
  getItem: (k) => localStorageData[k] || null,
  setItem: (k, v) => { localStorageData[k] = String(v); },
  removeItem: (k) => { delete localStorageData[k]; },
  clear: () => { Object.keys(localStorageData).forEach(k => delete localStorageData[k]); }
};

const domElements = {};
const sandbox = {
  window: {
    location: { hash: '' }
  },
  localStorage: mockLocalStorage,
  document: {
    getElementById: (id) => domElements[id] || null,
    querySelector: () => null,
    createElement: () => ({ setAttribute: () => {}, appendChild: () => {}, click: () => {} }),
    body: { appendChild: () => {}, removeChild: () => {}, insertAdjacentHTML: () => {} }
  },
  alert: (msg) => console.log('[ALERT]:', msg),
  confirm: () => true,
  console,
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  Date
};
sandbox.window.localStorage = mockLocalStorage;
sandbox.window.window = sandbox.window;
sandbox.window.alert = (msg) => console.log('[ALERT]:', msg);
sandbox.window.confirm = () => true;
sandbox.window.State = {
  currentPlantId: 'PLANT-01',
  currentUser: { full_name: 'Pravin Patil', role: 'ADMIN' },
  showToast: (msg, type) => console.log(`[TOAST] (${type}): ${msg}`),
  showModal: () => {},
  closeModal: () => {}
};

vm.createContext(sandbox);

vm.runInContext(fs.readFileSync('js/data/mock-data.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('js/data/db.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('js/modules/doc-series-master.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('js/modules/billing.js', 'utf8'), sandbox);

console.log('Testing End-to-End Document Flow Sequences:');

// Step 1: Preview Job Card in modal
const previewJc = sandbox.window.BillingModule.previewJobCardNumber('PLANT-01');
console.log('Step 1: Modal Preview Job Card No:', previewJc);
assert.strictEqual(previewJc, 'JC/MSC1/2026/000001');

// Mock form fields for saveNewJobCard
domElements['new-jc-no'] = { value: previewJc, trim: () => previewJc };
domElements['new-jc-date'] = { value: '2026-10-12', trim: () => '2026-10-12' };
domElements['new-jc-customer'] = { value: 'Rahul Sharma', trim: () => 'Rahul Sharma' };
domElements['new-jc-mobile'] = { value: '9876543210', trim: () => '9876543210' };
domElements['new-jc-alt-mobile'] = { value: '', trim: () => '' };
domElements['new-jc-email'] = { value: 'rahul@example.com', trim: () => 'rahul@example.com' };
domElements['new-jc-address'] = { value: 'Pune', trim: () => 'Pune' };
domElements['new-jc-city'] = { value: 'Pune', trim: () => 'Pune' };
domElements['new-jc-district'] = { value: 'Pune', trim: () => 'Pune' };
domElements['new-jc-state'] = { value: 'Maharashtra', trim: () => 'Maharashtra' };
domElements['new-jc-pincode'] = { value: '411001', trim: () => '411001' };
domElements['new-jc-reg'] = { value: 'MH12ZZ9999', trim: () => 'MH12ZZ9999' };
domElements['new-jc-model'] = { value: 'Activa 6G', trim: () => 'Activa 6G', tagName: 'INPUT' };
domElements['new-jc-kms'] = { value: '15000', trim: () => '15000' };
domElements['new-jc-fuel'] = { value: 'Half', trim: () => 'Half' };
domElements['new-jc-service-type'] = { value: 'Paid Service', trim: () => 'Paid Service' };
domElements['new-jc-supervisor'] = { value: 'Sunil Jagtap', trim: () => 'Sunil Jagtap' };
domElements['new-jc-tech'] = { value: 'Sanket Borole', trim: () => 'Sanket Borole' };
domElements['new-jc-del-date'] = { value: '2026-10-13', trim: () => '2026-10-13' };
domElements['new-jc-complaints'] = { value: 'General checkup', trim: () => 'General checkup' };
domElements['new-jc-remarks'] = { value: 'OK', trim: () => 'OK' };

sandbox.window.BillingModule.saveNewJobCard();

const savedJcs = sandbox.window.DB.getAll('jobCards') || [];
const newJc = savedJcs.find(j => j.customer_name === 'Rahul Sharma');
assert(newJc, 'New job card must be saved');
console.log('Step 1 Saved: Job Card No:', newJc.job_card_no);
assert.strictEqual(newJc.job_card_no, 'JC/MSC1/2026/000001');

// Step 2: Create Estimate for this Job Card
const estNo = sandbox.window.BillingModule.generateEstimateNumber('PLANT-01');
console.log('Step 2: Estimate No Generated:', estNo);
assert.strictEqual(estNo, 'EST/MSC1/2026/000001');

const newEst = {
  id: `EST-${Date.now()}`,
  estimate_no: estNo,
  job_card_id: newJc.id,
  job_card_no: newJc.job_card_no,
  customer_name: newJc.customer_name,
  customer_cin: newJc.cin_number || newJc.customer_cin,
  customer_mobile: newJc.customer_mobile,
  vehicle_reg_no: newJc.vehicle_reg_no,
  vehicle_model: newJc.vehicle_model,
  branch_id: 'PLANT-01',
  status: 'CUSTOMER_APPROVED',
  items: [{ id: 'ITM-1', name: 'Engine Oil', type: 'PART', qty: 1, rate: 450, amount: 450 }],
  subtotal: 450,
  tax_rate: 18,
  estimated_total: 531
};
sandbox.window.DB.upsert('billingEstimates', newEst);

// Step 3: Convert Estimate to Draft Bill
sandbox.window.BillingModule.convertEstimateToDraftBill(newEst.id);
const drafts = sandbox.window.DB.getAll('draftBills') || [];
const newDraft = drafts.find(d => d.estimate_id === newEst.id);
assert(newDraft, 'Draft bill must be generated from estimate');
console.log('Step 3: Draft Bill No Converted:', newDraft.draft_bill_no);
assert.strictEqual(newDraft.draft_bill_no, 'DB/MSC1/2026/000001');

// Step 4: Finalize Draft Bill into Tax Invoice / Final Bill
newDraft.balance_due = 0;
newDraft.amount_received = 531;
sandbox.window.BillingModule.finalizeCustomerBilling(newDraft.id);
const finals = sandbox.window.DB.getAll('finalBills') || [];
const finalBill = finals.find(f => f.draft_bill_id === newDraft.id);
assert(finalBill, 'Final bill must be created');
console.log('Step 4: Final Tax Invoice / Bill No:', finalBill.invoice_no);
assert.strictEqual(finalBill.invoice_no, 'INV/MSC1/2026/000001');

// Step 5: Issue Delivery Gate Pass
// Preview Gate Pass
const previewGp = sandbox.window.BillingModule.previewGatePassNumber('PLANT-01');
console.log('Step 5: Modal Preview Gate Pass No:', previewGp);
assert.strictEqual(previewGp, 'GP/MSC1/2026/000001');

domElements['new-gp-no'] = { value: previewGp };
domElements['new-gp-date'] = { value: '2026-10-12T15:00' };
domElements['new-gp-jc'] = { value: newJc.id };
domElements['new-gp-remarks'] = { value: 'Delivered', trim: () => 'Delivered' };

sandbox.window.BillingModule.saveGatePass();
const gatePasses = sandbox.window.DB.getAll('vehicleDeliveries') || [];
const newGp = gatePasses.find(g => g.job_card_id === newJc.id);
assert(newGp, 'Gate pass must be recorded');
console.log('Step 5: Saved Delivery Gate Pass No:', newGp.gate_pass_no);
assert.strictEqual(newGp.gate_pass_no, 'GP/MSC1/2026/000001');

console.log('\n>>> COMPLETE END-TO-END FLOW VERIFICATION PASSED! <<<');
