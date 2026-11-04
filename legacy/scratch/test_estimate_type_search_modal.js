// Test Suite: Estimate + Add button UI with Type and Search provision
const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Setup mock browser environment
const domNodes = {};
function getMockEl(id) {
  if (!domNodes[id]) {
    domNodes[id] = {
      id,
      value: '',
      style: {},
      innerHTML: '',
      innerText: '',
      textContent: '',
      selectedOptions: [],
      options: [],
      classList: {
        contains() { return false; },
        add() {},
        remove() {}
      },
      getAttribute(k) { return this[k]; },
      setAttribute(k, v) { this[k] = v; },
      select() {}
    };
  }
  return domNodes[id];
}

global.document = {
  getElementById(id) {
    return getMockEl(id);
  },
  querySelectorAll(sel) {
    return [];
  },
  querySelector(sel) {
    return null;
  },
  addEventListener() {}
};

global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; },
  clear() { this.store = {}; }
};

let capturedModal = null;
global.window = {
  DB: null,
  State: {
    currentPlantId: 'PLANT-01',
    currentUser: { name: 'Pravin Patil' },
    showModal(opts) { capturedModal = opts; },
    closeModal() {},
    showToast() {},
    hasPermission() { return true; }
  },
  BillingModule: null,
  StoreInventoryModule: null
};

// Load DB
const { DatabaseLayer } = require('../js/data/db.js');
window.DB = new DatabaseLayer();

// Seed items
window.DB.data.items = [
  { id: 'ITEM-2W-001', code: '2W-BRK-PAD-01', name: 'Front Disc Brake Pad Set', sale_price: 380, base_uom: 'SET' },
  { id: 'ITEM-2W-007', code: '2W-SPR-ENGINE-VALVE-SET-007', name: 'Engine Valve Set', sale_price: 150, base_uom: 'SET' },
  { id: 'ITEM-2W-009', code: '2W-TRN-CLT-01', name: 'Wet Multi-Plate Clutch Friction Plate Set', sale_price: 550, base_uom: 'SET' }
];

window.DB.data.itemVehicleCompatibility = [
  { id: 'COMPAT-001', model_id: 'MOD-ACTIVA', item_id: 'ITEM-2W-007' }
];

window.DB.data.inventoryBalances = [
  { id: 'BAL-001', item_id: 'ITEM-2W-001', warehouse_id: 'WH-01', on_hand: 25, available: 25 },
  { id: 'BAL-002', item_id: 'ITEM-2W-007', warehouse_id: 'WH-01', on_hand: 0, available: 0 },
  { id: 'BAL-003', item_id: 'ITEM-2W-009', warehouse_id: 'WH-01', on_hand: 15, available: 15 }
];

// Seed active estimate with vehicle model
window.DB.data.billingEstimates = [
  {
    id: 'EST-2026-001',
    estimate_no: 'EST/MSC1/2026/0001',
    status: 'DRAFT',
    customer_name: 'Pravin Patil',
    vehicle_reg_no: 'MH12AB1234',
    vehicle_model_id: 'MOD-ACTIVA',
    vehicle_model: 'Activa 6G',
    job_card_id: 'JC-0019',
    job_card_no: 'JC/MSC1/2026/0019',
    items: [],
    estimated_total: 0
  }
];

// Load billing.js
const billingCode = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');
eval(billingCode);

console.log('=== TEST 1: Open Estimate Add Item Modal ===');
window.BillingModule.activeEstimateId = 'EST-2026-001';
window.BillingModule.showAddEstimateItemModal();

assert(capturedModal, 'Modal must be launched');
const html = capturedModal.contentHtml;

// 1. Verify Title has "from Item Master" removed and banner is absent
assert.strictEqual(capturedModal.title, 'Add Item', 'Modal title must be simply "Add Item"');
assert(!capturedModal.title.includes('from Item Master'), 'Title must not include "from Item Master"');
assert(!html.includes('from Item Master'), 'No "from Item Master" in content');
assert(!html.includes('Estimate: Generated on Save'), 'No "Estimate: Generated on Save" in content');
assert(!html.includes('Smart Compatibility Filter'), 'No comment banner');
assert(!html.includes('BRD §6.9'), 'No BRD §6.9 comment');
console.log('✓ PASS: Modal title is "Add Item" and extra banners are absent');

// 2. Verify Select Spare Part Item label and search input
assert(html.includes('Select Spare Part Item'), 'Field label Select Spare Part Item is present');
assert(html.includes('id="est-part-search"'), 'Type-to-search input #est-part-search is present');
assert(html.includes('placeholder="Search spare part item by code or name..."'), 'Placeholder matches');
assert(html.includes('id="est-dropdown-arrow"'), 'Dropdown arrow toggle is present');
console.log('✓ PASS: Type-to-search input and dropdown toggle are present');

// 3. Verify dropdown container and grouped option UI
assert(html.includes('id="est-part-dropdown"'), 'Dropdown container present');
assert(html.includes('⭐ Compatible Parts for Activa 6G'), 'Compatible group header for Activa 6G present');
assert(html.includes('All Workshop Parts'), 'All Workshop Parts group header present');

// 4. Verify option formatting in dropdown
assert(html.includes('✓ 2W-SPR-ENGINE-VALVE-SET-007 - [Stock: 0] Engine Valve Set (₹150)'), 'Compatible part label formatting matches');
assert(html.includes('2W-BRK-PAD-01 - [Stock: 25] Front Disc Brake Pad Set (₹380)'), 'Workshop part label formatting matches');
console.log('✓ PASS: Option grouping and UI formatting match Job Card parts dropdown');

// 5. Verify live stock & price indicator
assert(html.includes('id="est-stock-indicator"'), 'Stock indicator banner present');
assert(html.includes('id="est-selected-stock"'), 'Selected stock element present');
assert(html.includes('id="est-selected-price"'), 'Selected price element present');
console.log('✓ PASS: Live stock and price indicator banner present');

// 6. Verify quantity, rate, and line total elements
assert(html.includes('id="est-add-item-qty"'), 'Quantity input present');
assert(html.includes('id="est-add-item-rate"'), 'Unit rate input present');
assert(html.includes('id="est-add-item-amount-display"'), 'Line total display present');
assert(html.includes('+ Add Item to Estimate'), 'Add Item submit button present');
console.log('✓ PASS: Form inputs and submit button present');

console.log('\n=== TEST 2: Helper Functions & Selection Logic ===');
assert(typeof window.BillingModule.openAddEstimatePartDropdown === 'function', 'openAddEstimatePartDropdown exists');
assert(typeof window.BillingModule.closeAddEstimatePartDropdown === 'function', 'closeAddEstimatePartDropdown exists');
assert(typeof window.BillingModule.toggleAddEstimatePartDropdown === 'function', 'toggleAddEstimatePartDropdown exists');
assert(typeof window.BillingModule.filterAddEstimatePartDropdown === 'function', 'filterAddEstimatePartDropdown exists');
assert(typeof window.BillingModule.selectAddEstimatePartItem === 'function', 'selectAddEstimatePartItem exists');

// Test selection
window.BillingModule.selectAddEstimatePartItem('2W-BRK-PAD-01');
assert.strictEqual(document.getElementById('est-add-item-code').value, '2W-BRK-PAD-01', 'Selected code updated');
assert.strictEqual(document.getElementById('est-add-item-name').value, 'Front Disc Brake Pad Set', 'Selected name updated');
assert.strictEqual(document.getElementById('est-add-item-rate').value, 380, 'Selected rate updated');
assert(document.getElementById('est-part-search').value.includes('2W-BRK-PAD-01'), 'Search input updated with item label');
assert.strictEqual(document.getElementById('est-part-dropdown').style.display, 'none', 'Dropdown closed on selection');
console.log('✓ PASS: Item selection correctly updates fields, price, and closes dropdown');

console.log('\n=== TEST 3: Submit and Add to Estimate ===');
document.getElementById('est-add-item-qty').value = '2';
window.BillingModule.handleAddEstimateItemSubmit();

const updatedEst = window.BillingModule.getActiveEstimate();
assert.strictEqual(updatedEst.items.length, 1, '1 item added to estimate');
assert.strictEqual(updatedEst.items[0].code, '2W-BRK-PAD-01', 'Item code matches');
assert.strictEqual(updatedEst.items[0].qty, 2, 'Qty matches');
assert.strictEqual(updatedEst.items[0].rate, 380, 'Rate matches');
assert.strictEqual(updatedEst.items[0].amount, 760, 'Line amount matches');
console.log('✓ PASS: Item successfully persisted to Estimate items list');

console.log('\n🎉 ALL ESTIMATE TYPE SEARCH MODAL TESTS PASSED (100%)!');
