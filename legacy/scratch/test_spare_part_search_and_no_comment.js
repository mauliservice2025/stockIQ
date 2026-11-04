// Verification test for:
// 1. Removal of comment banner "Smart Compatibility Filter (BRD §6.9)"
// 2. Type search provision under Select Spare Part Item
// 3. Searchable dropdown UI retaining exact same option list and formatting

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Mock DOM
const domNodes = {};
function getOrCreateMockElement(id) {
  if (!domNodes[id]) {
    domNodes[id] = {
      id,
      value: '',
      style: {},
      innerHTML: '',
      innerText: '',
      selectedOptions: [],
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
    return getOrCreateMockElement(id);
  },
  querySelectorAll(sel) {
    return [];
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

let capturedModalHtml = '';
global.window = {
  DB: null,
  State: {
    currentPlantId: 'PLANT-01',
    currentUser: { name: 'Pravin Patil' },
    showModal(opts) { capturedModalHtml = opts.contentHtml; },
    closeModal() {},
    showToast() {},
    hasPermission() { return true; }
  },
  StoreInventoryModule: null
};

// Load DB
const { DatabaseLayer } = require('../js/data/db.js');
window.DB = new DatabaseLayer();

// Seed sample items, compatibility, and inventory balances
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

window.DB.data.jobCards = [
  {
    id: 'JC-0019',
    job_card_no: 'JC/MSC1/2026/0019',
    vehicle_model_id: 'MOD-ACTIVA',
    vehicle_model: 'Activa 6G',
    store_id: 'WH-01',
    parts_required: []
  }
];

// Load store-inventory.js
const storeInvCode = fs.readFileSync(path.join(__dirname, '../js/modules/store-inventory.js'), 'utf8');
eval(storeInvCode);

console.log('--- TEST 1: Check Modal Generation ---');
window.StoreInventoryModule.showAddPartsToJobCardModal('JC-0019');

// 1. Verify Comment is removed
assert(!capturedModalHtml.includes('Smart Compatibility Filter'), 'Comment banner Smart Compatibility Filter must be removed');
assert(!capturedModalHtml.includes('BRD §6.9'), 'BRD §6.9 reference comment must be removed');
console.log('✓ PASS: Comment banner removed from UI');

// 2. Verify type search input is present
assert(capturedModalHtml.includes('id="add-jc-part-search"'), 'Search input #add-jc-part-search must be present');
assert(capturedModalHtml.includes('placeholder="Search spare part item by code or name..."'), 'Search input placeholder present');
console.log('✓ PASS: Type-to-search input provision is present under Select Spare Part Item');

// 3. Verify dropdown container and group headers
assert(capturedModalHtml.includes('id="add-jc-part-dropdown"'), 'Searchable dropdown container present');
assert(capturedModalHtml.includes('⭐ Compatible Parts for Activa 6G'), 'Compatible parts group header present');
assert(capturedModalHtml.includes('All Workshop Parts'), 'All Workshop Parts group header present');

// 4. Verify item list formatting in dropdown
assert(capturedModalHtml.includes('✓ 2W-SPR-ENGINE-VALVE-SET-007 - [Stock: 0] Engine Valve Set (₹150)'), 'Compatible option format matches');
assert(capturedModalHtml.includes('2W-BRK-PAD-01 - [Stock: 25] Front Disc Brake Pad Set (₹380)'), 'Workshop option format matches');
console.log('✓ PASS: Dropdown options and UI structure match expected item list');

// 5. Verify backing select is present for seamless form submission
assert(capturedModalHtml.includes('id="add-jc-part-id"'), 'Backing select present');

console.log('\n--- TEST 2: Dropdown Search & Selection Functions ---');
assert(typeof window.StoreInventoryModule.openAddPartDropdown === 'function', 'openAddPartDropdown exists');
assert(typeof window.StoreInventoryModule.closeAddPartDropdown === 'function', 'closeAddPartDropdown exists');
assert(typeof window.StoreInventoryModule.toggleAddPartDropdown === 'function', 'toggleAddPartDropdown exists');
assert(typeof window.StoreInventoryModule.filterAddPartDropdown === 'function', 'filterAddPartDropdown exists');
assert(typeof window.StoreInventoryModule.selectAddPartItem === 'function', 'selectAddPartItem exists');
console.log('✓ PASS: Dropdown interaction helper methods all exist');

// Test selectAddPartItem behavior
window.StoreInventoryModule.selectAddPartItem('ITEM-2W-001');
const backingSelect = document.getElementById('add-jc-part-id');
const searchInput = document.getElementById('add-jc-part-search');
const dropdown = document.getElementById('add-jc-part-dropdown');

assert.strictEqual(backingSelect.value, 'ITEM-2W-001', 'Backing select updated to selected item');
assert(searchInput.value.includes('2W-BRK-PAD-01'), 'Search input updated with selected item label');
assert.strictEqual(dropdown.style.display, 'none', 'Dropdown closes on selection');
console.log('✓ PASS: Item selection updates backing select, input label, and closes dropdown');

console.log('\n🎉 ALL VERIFICATION TESTS PASSED SUCCESSFULLY!');
