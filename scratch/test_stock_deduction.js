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

let capturedModalHtml = '';
global.window = {
  DB: null,
  State: {
    currentPlantId: 'PLANT-01',
    currentUser: { name: 'Pravin Patil' },
    showModal(opts) { capturedModalHtml = opts.contentHtml; },
    closeModal() {},
    showToast(msg, type) { /* console.log(`[TOAST ${type || 'info'}]: ${msg}`); */ },
    hasPermission() { return true; }
  },
  StoreInventoryModule: null,
  BillingModule: null,
  location: { hash: '' }
};

// Load DB
const { DatabaseLayer } = require('../js/data/db.js');
window.DB = new DatabaseLayer();

// Seed sample items and inventory balances
window.DB.data.items = [
  { id: 'ITEM-2W-001', code: '2W-BRK-PAD-01', name: 'Front Disc Brake Pad Set - Activa / Jupiter / Access', sale_price: 380, base_uom: 'SET', current_stock: 25 },
  { id: 'ITEM-2W-009', code: '2W-TRN-CLT-01', name: 'Wet Multi-Plate Clutch Friction Plate Set', sale_price: 550, base_uom: 'SET', current_stock: 15 }
];

window.DB.data.itemVehicleCompatibility = [
  { id: 'COMPAT-001', model_id: 'MOD-01', item_id: 'ITEM-2W-009' }
];

window.DB.data.inventoryBalances = [
  { id: 'BAL-001', item_id: 'ITEM-2W-001', warehouse_id: 'WH-PUN-SPARE', on_hand: 25, available: 25 },
  { id: 'BAL-002', item_id: 'ITEM-2W-009', warehouse_id: 'WH-PUN-SPARE', on_hand: 15, available: 15 }
];

window.DB.data.jobCards = [
  {
    id: 'JC-001',
    job_card_no: 'JC/MSC1/2026/000001',
    vehicle_model_id: 'MOD-01',
    vehicle_model: 'Activa 6G',
    parts_required: [],
    store_id: 'WH-PUN-SPARE',
    plant_id: 'PLANT-01'
  }
];

window.DB.data.billingEstimates = [
  {
    id: 'EST-001',
    estimate_no: 'EST-2026-0001',
    job_card_id: 'JC-001',
    items: [],
    store_id: 'WH-PUN-SPARE',
    plant_id: 'PLANT-01'
  }
];

window.DB.data.draftBills = [
  {
    id: 'BILL-001',
    draft_bill_no: 'DB-2026-0001',
    job_card_id: 'JC-001',
    items: [],
    store_id: 'WH-PUN-SPARE',
    plant_id: 'PLANT-01'
  }
];

// Load billing.js and store-inventory.js
const billingSource = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');
eval(billingSource);

const storeInventorySource = fs.readFileSync(path.join(__dirname, '../js/modules/store-inventory.js'), 'utf8');
eval(storeInventorySource);

console.log('Testing Stock Deduction Functionality...');

const testItem = window.DB.getAll('items').find(i => i.code === '2W-BRK-PAD-01');
const balBefore = window.DB.getAll('inventoryBalances').find(b => b.item_id === testItem.id);
assert.strictEqual(balBefore.on_hand, 25, 'Initial on_hand should be 25');
assert.strictEqual(balBefore.available, 25, 'Initial available should be 25');

// Test 1: Direct DB.deductItemStock
const d1 = window.DB.deductItemStock({
  itemId: testItem.id,
  itemCode: testItem.code,
  qty: 2,
  warehouseId: 'WH-PUN-SPARE',
  plantId: 'PLANT-01',
  docType: 'Manual Test'
});
console.log('Test 1: DB.deductItemStock result:', d1);
assert.strictEqual(d1.on_hand, 23, 'on_hand should now be 23');
assert.strictEqual(d1.available, 23, 'available should now be 23');

// Test 2: Direct DB.restockItemStock
const r1 = window.DB.restockItemStock({
  itemId: testItem.id,
  itemCode: testItem.code,
  qty: 2,
  warehouseId: 'WH-PUN-SPARE',
  plantId: 'PLANT-01',
  docType: 'Manual Test'
});
console.log('Test 2: DB.restockItemStock result:', r1);
assert.strictEqual(r1.on_hand, 25, 'on_hand should be restored to 25');
assert.strictEqual(r1.available, 25, 'available should be restored to 25');

// Test 3: Adding part to Job Card via StoreInventoryModule.submitAddPartToJobCard
const jc = window.DB.getById('jobCards', 'JC-001');
global.document.getElementById = (id) => {
  if (id === 'add-jc-part-id') return { value: testItem.id };
  if (id === 'add-jc-part-qty') return { value: '3' };
  return elements[id] || createMockElement(id);
};

window.StoreInventoryModule.submitAddPartToJobCard('JC-001');
const balAfterJC = window.DB.getAll('inventoryBalances').find(b => b.item_id === testItem.id);
console.log('Test 3: After Job Card add 3 units: on_hand =', balAfterJC.on_hand);
assert.strictEqual(balAfterJC.on_hand, 22, 'on_hand should be 22 after 3 deducted by Job Card');
assert.strictEqual(balAfterJC.available, 22, 'available should be 22 after 3 deducted by Job Card');
assert.strictEqual(jc.parts_required.length, 1);
assert.strictEqual(jc.parts_required[0].qty, 3);
assert.strictEqual(jc.parts_required[0].stock_deducted, true);

// Test 4: Adding item to Estimate via BillingModule.handleAddEstimateItemSubmit
const est = window.DB.getById('billingEstimates', 'EST-001');
window.BillingModule.activeEstimateId = 'EST-001';
window.BillingModule.getActiveEstimate = () => est;

global.document.getElementById = (id) => {
  if (id === 'est-add-item-name') return { value: testItem.name };
  if (id === 'est-add-item-type') return { value: 'PART' };
  if (id === 'est-add-item-code') return { value: testItem.code };
  if (id === 'est-add-item-qty') return { value: '2' };
  if (id === 'est-add-item-rate') return { value: '380' };
  return elements[id] || createMockElement(id);
};

window.BillingModule.handleAddEstimateItemSubmit();
if (window.BillingModule._pendingDuplicateAction) {
  window.BillingModule.confirmDuplicateItemAdd();
}
const balAfterEst = window.DB.getAll('inventoryBalances').find(b => b.item_id === testItem.id);
console.log('Test 4: After Estimate add 2 units: on_hand =', balAfterEst.on_hand);
assert.strictEqual(balAfterEst.on_hand, 20, 'on_hand should be 20 after 2 deducted by Estimate');
assert.strictEqual(balAfterEst.available, 20, 'available should be 20 after 2 deducted by Estimate');

// Test 5: Adding item to Bill via BillingModule.submitAddSingleScreenItem
const bill = window.DB.getById('draftBills', 'BILL-001');
window.BillingModule.getActiveCustomerBillingBill = () => bill;

global.document.getElementById = (id) => {
  if (id === 'add-item-name') return { value: testItem.name };
  if (id === 'add-item-type') return { value: 'PART' };
  if (id === 'add-item-code') return { value: testItem.code };
  if (id === 'add-item-qty') return { value: '1' };
  if (id === 'add-item-rate') return { value: '380' };
  return elements[id] || createMockElement(id);
};

window.BillingModule.submitAddSingleScreenItem();
if (window.BillingModule._pendingDuplicateAction) {
  window.BillingModule.confirmDuplicateItemAdd();
}
const balAfterBill = window.DB.getAll('inventoryBalances').find(b => b.item_id === testItem.id);
console.log('Test 5: After Bill add 1 unit: on_hand =', balAfterBill.on_hand);
assert.strictEqual(balAfterBill.on_hand, 19, 'on_hand should be 19 after 1 deducted by Bill');
assert.strictEqual(balAfterBill.available, 19, 'available should be 19 after 1 deducted by Bill');

// Test 6: Adjusting Estimate item quantity (5 -> 7, adding 2 more units)
const addedEstItem = est.items[0];
assert.strictEqual(addedEstItem.qty, 5, 'Estimate item qty should be 5 (3 from JC + 2 from Est)');
window.BillingModule.updateEstimateItemQty(addedEstItem.id, 7);
const balAfterEstQtyChange = window.DB.getAll('inventoryBalances').find(b => b.item_id === testItem.id);
console.log('Test 6: After Estimate qty increased 5 -> 7: on_hand =', balAfterEstQtyChange.on_hand);
assert.strictEqual(balAfterEstQtyChange.on_hand, 17, 'on_hand should be 17 after adding 2 more units');

// Test 7: Removing item from Estimate restocks it (7 units restocked)
window.BillingModule.removeEstimateItem(addedEstItem.id, 0);
const balAfterRemove = window.DB.getAll('inventoryBalances').find(b => b.item_id === testItem.id);
console.log('Test 7: After removing item from Estimate (restocked 7): on_hand =', balAfterRemove.on_hand);
assert.strictEqual(balAfterRemove.on_hand, 24, 'on_hand should be restored to 24 (17 + 7)');

// Test 8: Adjusting Bill item quantity (4 -> 6, adding 2 more units)
const addedBillItem = bill.items[0];
assert.strictEqual(addedBillItem.qty, 4, 'Bill item qty should be 4 (3 from JC + 1 from Bill)');
window.BillingModule.updateSingleScreenItemQty(addedBillItem.id, 6);
const balAfterBillQtyChange = window.DB.getAll('inventoryBalances').find(b => b.item_id === testItem.id);
console.log('Test 8: After Bill qty increased 4 -> 6: on_hand =', balAfterBillQtyChange.on_hand);
assert.strictEqual(balAfterBillQtyChange.on_hand, 22, 'on_hand should be 22 (24 - 2)');

// Test 9: Removing item from Bill restocks it (6 units restocked)
window.BillingModule.removeSingleScreenItem(addedBillItem.id, 0);
const balAfterBillRemove = window.DB.getAll('inventoryBalances').find(b => b.item_id === testItem.id);
console.log('Test 9: After removing item from Bill (restocked 6): on_hand =', balAfterBillRemove.on_hand);
assert.strictEqual(balAfterBillRemove.on_hand, 28, 'on_hand should be restored to 28 (22 + 6)');

console.log('\n========================================');
console.log('🎉 ALL 9 STOCK DEDUCTION TESTS PASSED!');
console.log('========================================');
