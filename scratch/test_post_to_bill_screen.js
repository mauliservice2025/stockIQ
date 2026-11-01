const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

console.log('================================================================');
console.log('TESTING DISPLAY CUSTOMER BILL AFTER POST TO BILL');
console.log('================================================================\n');

// Mock data
let jobCards = [
  {
    id: 'JC-201',
    job_card_no: 'JC/MSC1/2026/0201',
    customer_name: 'Pravin S Patil',
    customer_mobile: '9838462423',
    cin_number: 'CIN/MSC1/2026/000036',
    vehicle_reg_no: 'MH12AC4335',
    vehicle_model: 'Honda Activa 6G',
    odometer_km: '57,545 km',
    service_type: 'Periodic Maintenance',
    status: 'READY_FOR_BILLING',
    store_id: 'STORE-1',
    plant_id: 'PLANT-1',
    parts_required: [],
    labour_tasks: []
  }
];

let billingEstimates = [
  {
    id: 'EST-201',
    estimate_no: 'EST/MSC1/2026/000201',
    job_card_id: 'JC-201',
    job_card_no: 'JC/MSC1/2026/0201',
    customer_name: 'Pravin S Patil',
    customer_mobile: '9838462423',
    customer_cin: 'CIN/MSC1/2026/000036',
    vehicle_reg_no: 'MH12AC4335',
    vehicle_model: 'Honda Activa 6G',
    items: [],
    subtotal: 0,
    grand_total: 0
  }
];

let draftBills = [
  {
    id: 'DB-201',
    draft_bill_no: 'DB/MSC1/2026/000201',
    estimate_id: 'EST-201',
    estimate_no: 'EST/MSC1/2026/000201',
    job_card_id: 'JC-201',
    job_card_no: 'JC/MSC1/2026/0201',
    customer_name: 'Pravin S Patil',
    customer_mobile: '9838462423',
    customer_cin: 'CIN/MSC1/2026/000036',
    vehicle_reg_no: 'MH12AC4335',
    vehicle_model: 'Honda Activa 6G',
    odometer_km: '57,545 km',
    bill_date: '2026-10-27',
    source_type: 'ESTIMATE',
    status: 'DRAFT',
    items: [],
    subtotal: 0,
    discount_type: 'AMOUNT',
    discount_value: 0,
    discount_amount: 0,
    tax_rate: 18,
    total_tax: 0,
    grand_total: 0,
    amount_received: 0,
    balance_due: 0
  }
];

let finalBills = [];

let items = [
  { id: '2W-SPR-ENGINE-VALVE-SET-007', code: '2W-SPR-ENGINE-VALVE-SET-007', name: 'Engine Valve Set', type: 'PART', rate: 150, stock: 37 },
  { id: '2W-SPR-ENGINE-GASKET-KIT-006', code: '2W-SPR-ENGINE-GASKET-KIT-006', name: 'Engine Gasket Kit', type: 'PART', rate: 150, stock: 505 },
  { id: 'LBR-OIL-CHANGE', code: 'LBR-OIL-CHANGE', name: 'Engine Oil Change Labour', type: 'LABOUR', rate: 120, stock: 999 }
];

let openedModal = null;
let currentHash = '#/customer-billing';
let toasts = [];

const mockWindow = {
  DB: {
    data: {
      _workshop_all_customers_purged_v3: true,
      _workshop_all_customers_purged_v2: true,
      _workshop_all_customers_and_vehicles_cleared_v1: true,
      _workshop_all_customers_data_cleared_v1: true,
      _deliveries_cleared_by_user_request: true,
      jobCards,
      billingEstimates,
      draftBills,
      finalBills,
      items
    },
    getAll(tbl) {
      return this.data[tbl] || [];
    },
    getById(tbl, id) {
      return (this.data[tbl] || []).find(x => x.id === id || x.draft_bill_no === id || x.invoice_no === id || x.job_card_no === id);
    },
    upsert(tbl, record) {
      if (!this.data[tbl]) this.data[tbl] = [];
      const idx = this.data[tbl].findIndex(x => x.id === record.id);
      if (idx !== -1) {
        this.data[tbl][idx] = record;
      } else {
        this.data[tbl].push(record);
      }
    },
    saveData() {},
    subscribers: {},
    subscribe(key, cb) {
      if (!this.subscribers[key]) this.subscribers[key] = [];
      this.subscribers[key].push(cb);
    },
    emitChange(key) {
      if (this.subscribers[key]) {
        this.subscribers[key].forEach(cb => cb({ table: key }));
      }
      if (this.subscribers['*']) {
        this.subscribers['*'].forEach(cb => cb({ table: key }));
      }
    },
    logAudit() {},
    deductItemStock() {},
    getTaxByRate(rate) {
      return { rate: Number(rate) || 0, cgst_rate: (Number(rate) || 0) / 2, sgst_rate: (Number(rate) || 0) / 2, name: `GST ${rate}%` };
    },
    getDefaultTax() {
      return { rate: 18, cgst_rate: 9, sgst_rate: 9, name: 'GST 18%' };
    }
  },
  State: {
    currentUser: { id: 'U-001', name: 'Admin User', role: 'Billing Operator' },
    getCurrentUser() { return this.currentUser; },
    getCurrentPlant() { return { id: 'PLANT-1', name: 'Main Workshop' }; },
    getCurrentFacility() { return { id: 'PLANT-1', name: 'Main Workshop' }; },
    getCurrentPersona() { return { id: 'BILLING', name: 'Billing' }; },
    isLoggedIn: true,
    showToast(msg, type) {
      toasts.push({ msg, type });
      console.log(`[TOAST (${type})]: ${msg}`);
    },
    showModal(cfg) {
      openedModal = cfg;
    },
    closeModal() {
      openedModal = null;
    },
    subscribe() {}
  },
  location: {
    get hash() { return currentHash; },
    set hash(val) {
      currentHash = val;
      if (mockWindow.App && typeof mockWindow.App.handleRoute === 'function') {
        mockWindow.App.handleRoute(true);
      }
    }
  },
  addEventListener(evt, cb) {},
  removeEventListener(evt, cb) {},
  dispatchEvent(evt) {},
  document: {
    documentElement: {
      setAttribute(k, v) {},
      getAttribute(k) { return null; }
    },
    addEventListener(evt, cb) {},
    removeEventListener(evt, cb) {},
    title: '',
    getElementById(id) {
      return null;
    },
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
    activeElement: null,
    body: {
      classList: {
        add() {},
        remove() {},
        toggle() {}
      }
    }
  }
};

const mockLocalStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; },
  clear() { this.store = {}; }
};

mockWindow.localStorage = mockLocalStorage;
global.localStorage = mockLocalStorage;
global.CustomEvent = class CustomEvent { constructor(name, opts) { this.name = name; this.opts = opts; } };
global.window = mockWindow;
global.document = mockWindow.document;

// Load app.js and billing.js
const appCode = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const billingCode = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');

vm.runInThisContext(appCode);
vm.runInThisContext(billingCode);

// Wire App and BillingModule
mockWindow.BillingModule.init();
mockWindow.App.routes['#/customer-billing'] = { module: mockWindow.BillingModule, title: 'Customer Billing' };

// Setup DB subscription as in app.js
mockWindow.DB.subscribe('*', () => {
  mockWindow.App.handleRoute(false);
});

console.log('Testing Scenario 1: Initial state and direct open shows Customer Bills Queue');
mockWindow.BillingModule.activeBillingBillId = null;
mockWindow.BillingModule._explicitNavigationContext = false;
let initialHtml = mockWindow.BillingModule.renderCustomerBillingSingleScreen();
assert(initialHtml.includes('Customer Bills Queue') || initialHtml.includes('Bills Ready for Invoicing'), 'Direct open must display Customer Bills Queue');
assert(!initialHtml.includes('WORKSPACE HEADER WITH COMPACT INLINE STEPPER'), 'Must not display single bill workspace');
console.log('✓ Scenario 1 Passed: Direct open or refresh correctly displays Customer Bills Queue.\n');

console.log('Testing Scenario 2: User selects bill from queue');
mockWindow.BillingModule.selectCustomerBillingBill('DB-201');
assert.strictEqual(mockWindow.BillingModule.activeBillingBillId, 'DB-201', 'activeBillingBillId must be set');
let billHtml = mockWindow.BillingModule.renderCustomerBillingSingleScreen();
assert(billHtml.includes('DB/MSC1/2026/000201'), 'Must display active bill number');
assert(billHtml.includes('Pravin S Patil'), 'Must display customer name');
assert(billHtml.includes('MH12AC4335'), 'Must display vehicle registration');
assert(billHtml.includes('Draft Bill'), 'Must display Draft Bill header');
console.log('✓ Scenario 2 Passed: Selected customer bill opened on Billing Screen.\n');

console.log('Testing Scenario 3: Click "Post to Bill" with selected items');
// Stage items as if selected from catalog
const itemsToPost = [
  { code: '2W-SPR-ENGINE-VALVE-SET-007', name: 'Engine Valve Set', type: 'PART', qty: 2, rate: 150, amount: 300 },
  { code: '2W-SPR-ENGINE-GASKET-KIT-006', name: 'Engine Gasket Kit', type: 'PART', qty: 1, rate: 150, amount: 150 },
  { code: 'LBR-OIL-CHANGE', name: 'Engine Oil Change Labour', type: 'LABOUR', qty: 1, rate: 120, amount: 120 }
];

mockWindow.BillingModule.postBatchBillItems(itemsToPost);

// Verify active bill was maintained
assert.strictEqual(mockWindow.BillingModule.activeBillingBillId, 'DB-201', 'activeBillingBillId must STILL be DB-201 after postBatchBillItems');

// Verify DB bill items
const updatedBill = mockWindow.DB.getById('draftBills', 'DB-201');
assert.strictEqual(updatedBill.items.length, 3, 'Bill must have 3 items posted');
assert.strictEqual(updatedBill.subtotal, 570, 'Subtotal must be 300 + 150 + 120 = 570');
assert.strictEqual(updatedBill.parts_total, 450, 'Parts total must be 450');
assert.strictEqual(updatedBill.labour_total, 120, 'Labour total must be 120');
assert.strictEqual(updatedBill.tax_rate, 18, 'Tax rate must be 18%');
// 18% of 570 = 102.60, grand total = 673 (rounded)
assert.strictEqual(updatedBill.total_tax, 102.6, 'Total tax must be 102.6');
assert.strictEqual(updatedBill.grand_total, 673, 'Grand total must be 673');

// Verify the screen rendering immediately after Post to Bill:
let screenAfterPost = mockWindow.BillingModule.renderCustomerBillingSingleScreen();
assert(!screenAfterPost.includes('Bills Ready for Invoicing'), 'CRITICAL: Must NOT redirect to Customer Bills Queue after Post to Bill!');
assert(screenAfterPost.includes('DB/MSC1/2026/000201'), 'Must display customer bill number');
assert(screenAfterPost.includes('Pravin S Patil'), 'Must display customer details');
assert(screenAfterPost.includes('MH12AC4335'), 'Must display vehicle details');
assert(screenAfterPost.includes('Engine Valve Set'), 'Must display newly posted Engine Valve Set');
assert(screenAfterPost.includes('Engine Gasket Kit'), 'Must display newly posted Engine Gasket Kit');
assert(screenAfterPost.includes('Engine Oil Change Labour'), 'Must display newly posted Labour service');
console.log('✓ Scenario 3 Passed: Successfully posted items, recalculated totals, and automatically displayed customer bill details without redirecting to queue.\n');

console.log('Testing Scenario 4: Post additional item / update existing item quantity');
const additionalPost = [
  { code: '2W-SPR-ENGINE-VALVE-SET-007', name: 'Engine Valve Set', type: 'PART', qty: 1, rate: 150, amount: 150 }
];
mockWindow.BillingModule.postBatchBillItems(additionalPost);

const billAfterAdd = mockWindow.DB.getById('draftBills', 'DB-201');
assert.strictEqual(billAfterAdd.items.length, 3, 'Existing item must be updated rather than duplicated');
const valveItem = billAfterAdd.items.find(i => i.code === '2W-SPR-ENGINE-VALVE-SET-007');
assert.strictEqual(valveItem.qty, 3, 'Valve set quantity should be increased from 2 to 3');
assert.strictEqual(valveItem.amount, 450, 'Valve set amount should be 450');
assert.strictEqual(billAfterAdd.subtotal, 720, 'Subtotal must be 450 + 150 + 120 = 720');

let screenAfterAdd = mockWindow.BillingModule.renderCustomerBillingSingleScreen();
assert(!screenAfterAdd.includes('Bills Ready for Invoicing'), 'Must remain on bill screen');
assert(screenAfterAdd.includes('DB/MSC1/2026/000201'), 'Must still display bill number');
console.log('✓ Scenario 4 Passed: Updating existing item increases quantity and recalculates totals while keeping bill displayed.\n');

console.log('Testing Scenario 5: User explicitly returns to queue via Back button');
mockWindow.BillingModule.returnToBillsQueue();
assert.strictEqual(mockWindow.BillingModule.activeBillingBillId, null, 'activeBillingBillId must be null');
let queueHtml = mockWindow.BillingModule.renderCustomerBillingSingleScreen();
assert(queueHtml.includes('Customer Bills Queue') || queueHtml.includes('Bills Ready for Invoicing'), 'Must return to queue on explicit back action');
console.log('✓ Scenario 5 Passed: Explicit return to queue works properly.\n');

console.log('Testing Scenario 6: Posting fails or has error');
toasts = [];
mockWindow.BillingModule.activeBillingBillId = null;
mockWindow.BillingModule.postBatchBillItems([{ code: 'TEST', name: 'Test', qty: 1, rate: 10 }]);
assert(toasts.some(t => t.type === 'danger' && t.msg.includes('No active bill selected')), 'Must show error toast if posting has no bill');
assert.strictEqual(mockWindow.BillingModule.activeBillingBillId, null, 'Must not navigate to an incorrect bill');
console.log('✓ Scenario 6 Passed: Error handling shows error toast and avoids navigation to an incomplete or incorrect bill.\n');

console.log('================================================================');
console.log('ALL TESTS PASSED SUCCESSFULLY! (6/6)');
console.log('================================================================');
