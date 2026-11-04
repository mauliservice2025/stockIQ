const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Mock localStorage and window
const elements = {};
function createMockElement(id) {
  return {
    id,
    value: '',
    style: {},
    innerHTML: '',
    innerText: '',
    selectedOptions: [],
    getAttribute(k) { return this[k]; },
    setAttribute(k, v) { this[k] = v; }
  };
}

global.document = {
  getElementById(id) {
    if (!elements[id]) {
      elements[id] = createMockElement(id);
    }
    return elements[id];
  },
  querySelectorAll: () => [],
  addEventListener: () => {}
};

global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; },
  clear() { this.store = {}; }
};

let capturedModalOpts = null;
let lastToast = null;
global.window = {
  DB: null,
  State: {
    currentPlantId: 'PLANT-01',
    currentUser: { name: 'Pravin Patil' },
    showModal(opts) { capturedModalOpts = opts; },
    closeModal() { capturedModalOpts = null; },
    showToast(msg, type) { lastToast = { msg, type }; },
    hasPermission() { return true; }
  },
  StoreInventoryModule: null,
  BillingModule: null,
  location: { hash: '' }
};

// Load DB
const { DatabaseLayer } = require('../js/data/db.js');
window.DB = new DatabaseLayer();

window.DB.data.items = [
  { id: 'ITEM-GSK-006', code: '2W-SPR-ENGINE-GASKET-KIT-006', name: 'Engine Gasket Kit', sale_price: 150, base_uom: 'SET', current_stock: 50 },
  { id: 'ITEM-BRK-001', code: '2W-BRK-PAD-01', name: 'Front Disc Brake Pad', sale_price: 150, base_uom: 'SET', current_stock: 30 }
];

window.DB.data.inventoryBalances = [
  { id: 'BAL-001', item_id: 'ITEM-GSK-006', warehouse_id: 'WH-PUN-SPARE', on_hand: 50, available: 50 },
  { id: 'BAL-002', item_id: 'ITEM-BRK-001', warehouse_id: 'WH-PUN-SPARE', on_hand: 30, available: 30 }
];

window.DB.data.billingEstimates = [
  {
    id: 'EST-TEST-001',
    estimate_no: 'EST-2026-0001',
    items: [
      {
        id: 'EST-ITM-1',
        code: '2W-SPR-ENGINE-GASKET-KIT-006',
        item_code: '2W-SPR-ENGINE-GASKET-KIT-006',
        name: 'Engine Gasket Kit',
        item_name: 'Engine Gasket Kit',
        type: 'PART',
        qty: 1,
        rate: 150,
        amount: 150
      }
    ],
    store_id: 'WH-PUN-SPARE',
    plant_id: 'PLANT-01'
  }
];

window.DB.data.draftBills = [];

// Load billing.js
const billingSource = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');
eval(billingSource);

console.log('--- TEST 1: Initial State of Estimate ---');
const est = window.DB.getById('billingEstimates', 'EST-TEST-001');
window.BillingModule.activeEstimateId = 'EST-TEST-001';
window.BillingModule.getActiveEstimate = () => est;

assert.strictEqual(est.items.length, 1, 'Estimate should initially have 1 item');
assert.strictEqual(est.items[0].qty, 1, 'Initial quantity should be 1');

console.log('--- TEST 2: Attempting to Add Duplicate Item (Engine Gasket Kit) ---');
// Setup DOM mocks for Add Item modal with duplicate item
global.document.getElementById = (id) => {
  if (id === 'est-add-item-name') return { value: 'Engine Gasket Kit' };
  if (id === 'est-add-item-type') return { value: 'PART' };
  if (id === 'est-add-item-code') return { value: '2W-SPR-ENGINE-GASKET-KIT-006' };
  if (id === 'est-add-item-qty') return { value: '2' };
  if (id === 'est-add-item-rate') return { value: '150' };
  return elements[id] || createMockElement(id);
};

capturedModalOpts = null;
window.BillingModule.handleAddEstimateItemSubmit();

// Verify duplicate confirmation popup was triggered
assert(capturedModalOpts !== null, 'Modal should be displayed for duplicate item warning');
console.log('Captured modal title:', capturedModalOpts.title);
assert(capturedModalOpts.title.includes('Duplicate Item Warning'));
assert(capturedModalOpts.contentHtml.includes('Item is already added in Estimate still you want to add'), 'Popup message must match user requirement');
assert(capturedModalOpts.contentHtml.includes('Yes'), 'Popup must have Yes button');
assert(capturedModalOpts.contentHtml.includes('No'), 'Popup must have No button');
assert.strictEqual(est.items.length, 1, 'No new item should be added yet');

console.log('--- TEST 3: User clicks "No" (cancel) ---');
window.BillingModule.cancelDuplicateItemPrompt();
assert.strictEqual(est.items.length, 1, 'Items count should still be 1 after No');
assert.strictEqual(est.items[0].qty, 1, 'Quantity should still be 1 after No');

console.log('--- TEST 4: User clicks "Yes" (confirm) ---');
// Trigger submit again to open prompt
window.BillingModule.handleAddEstimateItemSubmit();
assert(capturedModalOpts !== null);

const balBeforeConfirm = window.DB.getAll('inventoryBalances').find(b => b.item_id === 'ITEM-GSK-006');
const onHandBeforeConfirm = balBeforeConfirm.on_hand;

window.BillingModule.confirmDuplicateItemAdd();

assert.strictEqual(est.items.length, 1, 'Should NOT add a new line item (items count remains 1)');
assert.strictEqual(est.items[0].qty, 3, 'Existing item qty should increase from 1 to 3 (1 + 2)');
assert.strictEqual(est.items[0].amount, 450, 'Existing item amount should be updated to 3 * 150 = 450');

const balAfterConfirm = window.DB.getAll('inventoryBalances').find(b => b.item_id === 'ITEM-GSK-006');
console.log(`Stock: Before=${onHandBeforeConfirm}, After=${balAfterConfirm.on_hand}`);
assert.strictEqual(balAfterConfirm.on_hand, onHandBeforeConfirm - 2, 'Stock should be deducted for the 2 newly added units');

console.log('--- TEST 5: Adding a Non-Duplicate Item (Front Disc Brake Pad) ---');
global.document.getElementById = (id) => {
  if (id === 'est-add-item-name') return { value: 'Front Disc Brake Pad' };
  if (id === 'est-add-item-type') return { value: 'PART' };
  if (id === 'est-add-item-code') return { value: '2W-BRK-PAD-01' };
  if (id === 'est-add-item-qty') return { value: '1' };
  if (id === 'est-add-item-rate') return { value: '150' };
  return elements[id] || createMockElement(id);
};

capturedModalOpts = null;
window.BillingModule.handleAddEstimateItemSubmit();

// Since Front Disc Brake Pad is not in the estimate, it should be added immediately without duplicate warning
assert.strictEqual(est.items.length, 2, 'New line item should be added for distinct item');
assert.strictEqual(est.items[1].code, '2W-BRK-PAD-01');

console.log('\n======================================================');
console.log('🎉 ALL DUPLICATE ITEM WARNING & QTY INCREASE TESTS PASSED!');
console.log('======================================================');
