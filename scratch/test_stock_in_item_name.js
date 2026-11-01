// Test Stock Display in front of Item Name in Add Part to Job Card modal
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
  }
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
  { id: 'ITEM-2W-001', code: '2W-BRK-PAD-01', name: 'Front Disc Brake Pad Set - Activa / Jupiter / Access', sale_price: 380, base_uom: 'SET' },
  { id: 'ITEM-2W-009', code: '2W-TRN-CLT-01', name: 'Wet Multi-Plate Clutch Friction Plate Set', sale_price: 550, base_uom: 'SET' }
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
    vehicle_model: 'Hero Splendor Plus',
    store_id: 'WH-PUN-SPARE',
    parts_required: []
  }
];

// Load store-inventory.js
const storeInvCode = fs.readFileSync(path.join(__dirname, '../js/modules/store-inventory.js'), 'utf8');
eval(storeInvCode);

console.log('Testing Stock display in Add Spare Part to Job Card modal...');

window.StoreInventoryModule.showAddPartsToJobCardModal('JC-001');

// Verify captured modal HTML
console.log('\n--- Checking Modal HTML ---');
assert(capturedModalHtml.includes('[Stock: 15]'), 'Modal must include [Stock: 15] in front of compatible item name');
assert(capturedModalHtml.includes('[Stock: 25]'), 'Modal must include [Stock: 25] in front of workshop part item name');

console.log('  -> PASS: Compatible part has stock in front of item name:');
const compMatch = capturedModalHtml.match(/✓ 2W-TRN-CLT-01 - \[Stock: 15\] Wet Multi-Plate Clutch Friction Plate Set/);
console.log('     ', compMatch ? compMatch[0] : 'MATCH NOT FOUND');
assert(compMatch, 'Exact format match for compatible part');

console.log('  -> PASS: Workshop part has stock in front of item name:');
const wkMatch = capturedModalHtml.match(/2W-BRK-PAD-01 - \[Stock: 25\] Front Disc Brake Pad Set/);
console.log('     ', wkMatch ? wkMatch[0] : 'MATCH NOT FOUND');
assert(wkMatch, 'Exact format match for all workshop part');

// Verify live stock indicator exists in modal
assert(capturedModalHtml.includes('id="add-jc-stock-indicator"'), 'Live stock indicator banner must be present');
assert(capturedModalHtml.includes('id="add-jc-selected-stock"'), 'Selected stock span must be present');
console.log('  -> PASS: Live stock & price indicator banner present');

// Test onAddPartSelectChange
const mockSelect = {
  selectedOptions: [
    {
      getAttribute(k) {
        if (k === 'data-stock') return '15';
        if (k === 'data-price') return '550';
        if (k === 'data-uom') return 'SET';
        return null;
      }
    }
  ]
};

window.StoreInventoryModule.onAddPartSelectChange(mockSelect);
const stockEl = document.getElementById('add-jc-selected-stock');
const priceEl = document.getElementById('add-jc-selected-price');

console.log('Selected Stock HTML:', stockEl.innerHTML);
console.log('Selected Price:', priceEl.innerText);

assert(stockEl.innerHTML.includes('15 SET'), 'Stock element must display 15 SET');
assert(priceEl.innerText === '₹550', 'Price element must display ₹550');

console.log('\n🎉 ALL STOCK IN ITEM NAME TESTS PASSED (100%)!');
