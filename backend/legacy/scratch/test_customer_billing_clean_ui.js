// Test verification for:
// 1. Removal of Billing Queue clear button (🗑️)
// 2. Removal of Registered Job Cards optgroup from dropdown (Select Estimate only)
// 3. deleteCustomerBillingBill RBAC validation

global.window = global;
global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; },
  clear() { this.store = {}; }
};
global.document = {
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => []
};

require('../js/data/db.js');
require('../js/data/mock-data.js');
require('../js/state.js');
require('../js/modules/billing.js');

// DB initializes automatically

// Ensure test data exists
if (!window.DB.data.billingEstimates || window.DB.data.billingEstimates.length === 0) {
  window.DB.data.billingEstimates = [
    {
      id: 'EST-001',
      estimate_no: 'EST-PUN-26-001',
      customer_name: 'Rushikesh Dhiwar',
      customer_mobile: '9876567876',
      customer_cin: 'CIN-MSC1-000132',
      vehicle_reg_no: 'MH12VV3443',
      vehicle_model: 'Honda Activa 125',
      grand_total: 1340,
      status: 'APPROVED',
      items: [{ id: 'ITM-1', name: 'Lever', qty: 2, rate: 230, amount: 460 }]
    }
  ];
}

console.log('--- TEST 1: Check Billing Queue Header has no clearAllBills or trash button ---');
const html = window.BillingModule.renderCustomerBillingSingleScreen();

const hasClearAllBills = html.includes('window.BillingModule.clearAllBills()');
console.log('Contains clearAllBills():', hasClearAllBills, '(should be false)');
if (hasClearAllBills) throw new Error('Failed: clearAllBills button still present in header');

console.log('--- TEST 2: Check Dropdown has no Registered Job Cards optgroup ---');
const hasJobCardsOptgroup = html.includes('Registered Job Cards (with CIN)');
console.log('Contains Registered Job Cards (with CIN) in dropdown:', hasJobCardsOptgroup, '(should be false)');
if (hasJobCardsOptgroup) throw new Error('Failed: Registered Job Cards still present in dropdown');

const hasEstimatesOptgroup = html.includes('Created Estimates (with auto-fetched items)');
console.log('Contains Created Estimates in dropdown:', hasEstimatesOptgroup, '(should be true)');
if (!hasEstimatesOptgroup) throw new Error('Failed: Created Estimates missing from dropdown');

const hasSelectEstimateLabel = html.includes('Select Estimate');
console.log('Contains "Select Estimate" label:', hasSelectEstimateLabel, '(should be true)');
if (!hasSelectEstimateLabel) throw new Error('Failed: "Select Estimate" label missing');

console.log('--- TEST 3: Check Draft Bill RBAC Deletion ---');
const testDraft = {
  id: 'DBILL-TEST-999',
  draft_bill_no: 'DB-TEST-999',
  customer_name: 'Test Customer',
  status: 'DRAFT',
  grand_total: 500
};
window.DB.upsert('draftBills', testDraft);
const draftsBefore = window.DB.getAll('draftBills') || [];
console.log('Draft bills count before:', draftsBefore.length);

// 3a. Unauthorized user (Role Store Exec without delete permission)
let testUser = { id: 'USR-002', username: 'store.user', primary_role: 'ROLE-STORE-OPS-EXEC', status: 'ACTIVE' };
window.State.getCurrentUser = () => testUser;
let toastMsg = '';
window.State.showToast = (msg, type) => { toastMsg = msg; };
global.confirm = () => true;

console.log('canDeleteCustomerBill (Store Exec):', window.BillingModule.canDeleteCustomerBill());
window.BillingModule.deleteCustomerBillingBill(testDraft.id);
const draftsAfterUnauthorized = window.DB.getAll('draftBills') || [];
console.log('Draft bills count after unauthorized delete attempt:', draftsAfterUnauthorized.length);
if (draftsAfterUnauthorized.length !== draftsBefore.length) {
  throw new Error('Failed: Unauthorized user was able to delete draft bill');
}
console.log('Access Denied toast captured:', toastMsg);

// 3b. Authorized Admin user
testUser = { id: 'USR-001', username: 'p.patil', primary_role: 'ROLE-ADMIN', status: 'ACTIVE' };
console.log('canDeleteCustomerBill (Admin):', window.BillingModule.canDeleteCustomerBill());
window.BillingModule.deleteCustomerBillingBill(testDraft.id);
const draftsAfterAdmin = window.DB.getAll('draftBills') || [];
console.log('Draft bills count after Admin delete:', draftsAfterAdmin.length);
if (draftsAfterAdmin.length !== draftsBefore.length - 1) {
  throw new Error('Failed: Admin was not able to delete draft bill');
}

console.log('✓ ALL TESTS PASSED WITH 100% SUCCESS!');
