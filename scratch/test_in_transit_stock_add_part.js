const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- Testing In-Transit Stock and Add Part to Job Card ---');

// Setup mock browser globals
global.window = global;
global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; },
  clear() { this._data = {}; }
};

let toasts = [];
let modals = [];

global.State = {
  currentPlantId: 'PLANT-PUN-01',
  showToast(msg, type = 'info') {
    toasts.push({ msg, type });
    console.log(`[TOAST (${type})]: ${msg}`);
  },
  showModal(opts) {
    modals.push(opts);
  },
  closeModal() {}
};

// Create DOM elements map
const elements = {};
global.document = {
  getElementById(id) {
    if (!elements[id]) {
      elements[id] = {
        id,
        value: '',
        style: {},
        innerHTML: '',
        innerText: '',
        textContent: '',
        options: [],
        selectedOptions: [],
        querySelectorAll: () => [],
        querySelector: (sel) => {
          if (sel === 'span:first-child') return elements[id + '-first-span'] || { innerText: '' };
          return null;
        },
        contains: () => false,
        focus: () => {},
        select: () => {}
      };
    }
    return elements[id];
  },
  querySelector(sel) {
    if (sel.includes('button[type="submit"]')) {
      return this.getElementById('submit-btn');
    }
    return null;
  },
  querySelectorAll() {
    return [];
  },
  addEventListener() {}
};

// Load db.js
const { DatabaseLayer } = require('../js/data/db.js');
global.DB = new DatabaseLayer();
window.DB = global.DB;

// Load store-inventory.js
const storeCode = fs.readFileSync(path.join(__dirname, '../js/modules/store-inventory.js'), 'utf8');
eval(storeCode);

// Load billing.js
const billingCode = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');
eval(billingCode);

// Setup test data in DB
window.DB.data.items = [
  { id: 'ITM-001', code: '2W-SPR-ENGINE-VALVE-SET-007', name: 'Engine Valve Set', stock_uom: 'PCS', sale_price: 150, current_stock: 0 },
  { id: 'ITM-002', code: '2W-SPR-BRAKE-PAD-001', name: 'Front Brake Pad', stock_uom: 'SET', sale_price: 320, current_stock: 5 },
  { id: 'ITM-003', code: '2W-SPR-SPARK-PLUG-001', name: 'Spark Plug', stock_uom: 'PCS', sale_price: 90, current_stock: 0 }
];

window.DB.data.warehouses = [
  { id: 'WH-MSC1', plant_id: 'PLANT-PUN-01', name: 'Pune Main Service Center Store' },
  { id: 'WH-CENTRAL', plant_id: 'PLANT-PUN-01', name: 'Pune Central Warehouse' }
];

window.DB.data.inventoryBalances = [
  // WH-MSC1 has 0 valve sets
  { id: 'BAL-1', warehouse_id: 'WH-MSC1', plant_id: 'PLANT-PUN-01', item_id: 'ITM-001', on_hand: 0, available: 0, reserved: 0 },
  // WH-MSC1 has 5 brake pads
  { id: 'BAL-2', warehouse_id: 'WH-MSC1', plant_id: 'PLANT-PUN-01', item_id: 'ITM-002', on_hand: 5, available: 5, reserved: 0 }
  // ITM-003 has no balance records in WH-MSC1
];

// Active transfer in transit for Valve Set to WH-MSC1
window.DB.data.stockTransfers = [
  {
    id: 'TRF-001',
    transfer_number: 'TRF-2026-001',
    status: 'IN_TRANSIT',
    source_warehouse_id: 'WH-CENTRAL',
    dest_warehouse_id: 'WH-MSC1',
    dest_plant_id: 'PLANT-PUN-01',
    items: [
      { item_id: 'ITM-001', code: '2W-SPR-ENGINE-VALVE-SET-007', requested: 1, dispatched: 1, received: 0, uom: 'PCS' }
    ]
  }
];

window.DB.data.jobCards = [
  {
    id: 'JC-001',
    job_card_no: 'JC/MSC1/2026/0032',
    store_id: 'WH-MSC1',
    plant_id: 'PLANT-PUN-01',
    vehicle_model_id: 'MOD-001',
    vehicle_model: 'Splendor Plus',
    parts_required: []
  }
];

window.DB.data.itemVehicleCompatibility = [
  { item_id: 'ITM-001', model_id: 'MOD-001' }
];

// TEST 1: DB.getItemStockDetails
console.log('\n--- TEST 1: DB.getItemStockDetails ---');
const valveDetails = window.DB.getItemStockDetails({ itemId: 'ITM-001', warehouseId: 'WH-MSC1' });
console.log('Valve Set details:', valveDetails);
assert.strictEqual(valveDetails.available, 0, 'Valve Set available in WH-MSC1 must be 0');
assert.strictEqual(valveDetails.inTransit, 1, 'Valve Set in transit to WH-MSC1 must be 1');
assert.strictEqual(valveDetails.isInTransit, true, 'isInTransit must be true');

const brakeDetails = window.DB.getItemStockDetails({ itemId: 'ITM-002', warehouseId: 'WH-MSC1' });
console.log('Brake Pad details:', brakeDetails);
assert.strictEqual(brakeDetails.available, 5, 'Brake Pad available in WH-MSC1 must be 5');
assert.strictEqual(brakeDetails.inTransit, 0, 'Brake Pad in transit must be 0');
assert.strictEqual(brakeDetails.isInTransit, false, 'isInTransit must be false');

const plugDetails = window.DB.getItemStockDetails({ itemId: 'ITM-003', warehouseId: 'WH-MSC1' });
console.log('Spark Plug details:', plugDetails);
assert.strictEqual(plugDetails.available, 0, 'Spark Plug available must be 0');
assert.strictEqual(plugDetails.inTransit, 0, 'Spark Plug in transit must be 0');
assert.strictEqual(plugDetails.isInTransit, false, 'isInTransit must be false');
console.log('✓ TEST 1 PASSED');

// TEST 2: StoreInventoryModule.showAddPartsToJobCardModal
console.log('\n--- TEST 2: StoreInventoryModule.showAddPartsToJobCardModal ---');
window.StoreInventoryModule.showAddPartsToJobCardModal('JC-001');
assert(modals.length > 0, 'Modal must be shown');
const lastModal = modals[modals.length - 1];
console.log('Modal title:', lastModal.title);
assert(lastModal.title.includes('JC/MSC1/2026/0032'), 'Modal title matches JC number');
// Check that the dropdown option for Valve Set displays "[Stock is in transit: 1]" instead of "[Stock: 1]"
assert(lastModal.contentHtml.includes('Stock is in transit: 1'), 'Option HTML must show "[Stock is in transit: 1]"');
assert(!lastModal.contentHtml.includes('2W-SPR-ENGINE-VALVE-SET-007 - [Stock: 1]'), 'Option HTML must NOT show [Stock: 1] for in-transit item');
assert(lastModal.contentHtml.includes('data-transit="1"'), 'Option must have data-transit="1"');
console.log('✓ TEST 2 PASSED');

// TEST 3: StoreInventoryModule.onAddPartSelectChange
console.log('\n--- TEST 3: StoreInventoryModule.onAddPartSelectChange ---');
const selectEl = document.getElementById('add-jc-part-id');
const optEl = {
  getAttribute: (name) => {
    if (name === 'data-stock') return '0';
    if (name === 'data-transit') return '1';
    if (name === 'data-price') return '150';
    if (name === 'data-uom') return 'PCS';
    return null;
  }
};
selectEl.selectedOptions = [optEl];
window.StoreInventoryModule.onAddPartSelectChange(selectEl);

const stockIndicatorText = document.getElementById('add-jc-selected-stock').innerHTML;
console.log('Stock indicator text:', stockIndicatorText);
assert(stockIndicatorText.includes('Stock is in transit'), 'Indicator must show "Stock is in transit"');
assert(stockIndicatorText.includes('1 PCS pending inward receipt'), 'Indicator must show pending qty');
assert.strictEqual(document.getElementById('add-jc-part-qty').value, '0', 'Quantity input clamped to 0 for in-transit stock');
console.log('✓ TEST 3 PASSED');

// TEST 4: StoreInventoryModule.submitAddPartToJobCard with in-transit item
console.log('\n--- TEST 4: submitAddPartToJobCard rejection for in-transit stock ---');
toasts = [];
document.getElementById('add-jc-part-id').value = 'ITM-001';
document.getElementById('add-jc-part-qty').value = '1';
window.StoreInventoryModule.submitAddPartToJobCard('JC-001');

assert.strictEqual(window.DB.data.jobCards[0].parts_required.length, 0, 'Part must not be added when stock is in transit');
assert(toasts.length > 0, 'Toast must be triggered');
console.log('Toast message:', toasts[0]);
assert(toasts[0].msg.includes('Stock is in transit (1 PCS) and not yet received in store'), 'Toast must inform user that stock is in transit');
console.log('✓ TEST 4 PASSED');

// TEST 5: submitAddPartToJobCard rejection for out-of-stock item (not in transit)
console.log('\n--- TEST 5: submitAddPartToJobCard rejection for out-of-stock item ---');
toasts = [];
document.getElementById('add-jc-part-id').value = 'ITM-003';
document.getElementById('add-jc-part-qty').value = '1';
window.StoreInventoryModule.submitAddPartToJobCard('JC-001');

assert.strictEqual(window.DB.data.jobCards[0].parts_required.length, 0, 'Part must not be added when out of stock');
assert(toasts.length > 0, 'Toast must be triggered');
console.log('Toast message:', toasts[0]);
assert(toasts[0].msg.includes('Available stock is 0!'), 'Toast must show available stock is 0');
console.log('✓ TEST 5 PASSED');

// TEST 6: submitAddPartToJobCard success for available item
console.log('\n--- TEST 6: submitAddPartToJobCard success for available item ---');
toasts = [];
document.getElementById('add-jc-part-id').value = 'ITM-002';
document.getElementById('add-jc-part-qty').value = '2';
window.StoreInventoryModule.submitAddPartToJobCard('JC-001');

assert.strictEqual(window.DB.data.jobCards[0].parts_required.length, 1, 'Brake pad part must be added');
assert.strictEqual(window.DB.data.jobCards[0].parts_required[0].qty, 2, 'Qty 2 added');
// Check remaining balance
const updatedBrake = window.DB.getItemStockDetails({ itemId: 'ITM-002', warehouseId: 'WH-MSC1' });
console.log('Updated Brake Pad available stock:', updatedBrake.available);
assert.strictEqual(updatedBrake.available, 3, 'Available stock should be reduced from 5 to 3');
console.log('✓ TEST 6 PASSED');

// TEST 7: BillingModule getAvailableItemStock and validation
console.log('\n--- TEST 7: BillingModule in-transit stock handling ---');
toasts = [];
const billingValveStock = window.BillingModule.getAvailableItemStock('2W-SPR-ENGINE-VALVE-SET-007', 'WH-MSC1');
console.log('BillingModule Valve Set stock:', billingValveStock);
assert.strictEqual(billingValveStock, 0, 'BillingModule must report 0 available stock');

window.BillingModule.getActiveEstimate = () => ({
  id: 'EST-001',
  store_id: 'WH-MSC1',
  job_card_id: 'JC-001',
  items: []
});
document.getElementById('est-add-item-type').value = 'PART';
document.getElementById('est-add-item-code').value = '2W-SPR-ENGINE-VALVE-SET-007';
document.getElementById('est-add-item-name').value = 'Engine Valve Set';
document.getElementById('est-add-item-qty').value = '1';
document.getElementById('est-add-item-rate').value = '150';

window.BillingModule.handleAddEstimateItemSubmit();
assert(toasts.length > 0, 'Estimate toast must be triggered');
console.log('Estimate Toast message:', toasts[toasts.length - 1]);
assert(toasts[toasts.length - 1].msg.includes('Stock is in transit (1 PCS) and not yet received in store'), 'Estimate must notify stock is in transit');
console.log('✓ TEST 7 PASSED');

console.log('\n===========================================');
console.log('ALL TESTS PASSED SUCCESSFULLY! (7/7)');
console.log('===========================================');
