const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Setup mock window & DOM
global.window = global;
global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; },
  clear() { this._data = {}; }
};

global.State = {
  currentPlantId: 'ALL',
  currentUser: { name: 'Pravin Patil' }
};

// Load db.js
const { DatabaseLayer } = require('../js/data/db.js');
window.DB = new DatabaseLayer();

// Load inventory.js
const invCode = fs.readFileSync(path.join(__dirname, '../js/modules/inventory.js'), 'utf8');
eval(invCode);

console.log('=== TEST SUITE: INVENTORY STOCK BALANCE UI ===\n');

// Seed test item and balance
window.DB.upsert('items', {
  id: 'ITEM-TEST-INV-1',
  code: '2W-SPR-ENGINE-GASKET-KIT-006',
  name: 'Engine Gasket Kit',
  base_uom: 'PCS',
  sale_price: 100
});

window.DB.upsert('inventoryBalances', {
  id: 'BAL-INV-1',
  item_id: 'ITEM-TEST-INV-1',
  warehouse_id: 'WH-01',
  bin_id: 'BIN-01',
  plant_id: 'PLANT-01',
  batch_number: 'JHG78',
  on_hand: 10,
  available: 10,
  reserved: 0,
  valuation_rate: 100,
  stock_status: 'AVAILABLE'
});

window.DB.upsert('warehouses', {
  id: 'WH-01',
  code: 'MSC-001',
  name: 'Main Workshop Store',
  plant_id: 'PLANT-01',
  status: 'ACTIVE'
});

window.DB.upsert('plants', {
  id: 'PLANT-01',
  name: 'Mauli Service Center',
  status: 'ACTIVE'
});

const dummyContainer = { innerHTML: '' };
window.InventoryModule.render(dummyContainer);
const html = dummyContainer.innerHTML;

// 1. Check Search button and filter in one line
console.log('--- TEST 1: Check Search button and filters in one line ---');
assert(html.includes('Stock Balance'), 'Card title must be renamed to Stock Balance');
assert(!html.includes('Live Inventory Ledger & Multi-Bin Balances'), 'Old title "Live Inventory Ledger & Multi-Bin Balances" must be removed');
assert(html.includes('id="inv-search"'), 'Search input must exist');
assert(html.includes('<span>Search</span>'), 'Search button must exist');
assert(html.includes('id="inv-wh-filter"'), 'Warehouse filter must exist');
assert(html.includes('id="inv-status-filter"'), 'Status filter must exist');
assert(html.includes('flex-wrap: nowrap'), 'Toolbar must enforce flex-wrap nowrap for one-line display');
console.log('✓ PASS: Title renamed to "Stock Balance", and search/filter fields moved to upper side.');

// 2. Check Item Name and Item Code are separate columns
console.log('\n--- TEST 2: Check separate Item Code and Item Name columns ---');
assert(html.includes('<th>Item Code</th>'), 'Table header must have separate "Item Code" column');
assert(html.includes('<th>Item Name</th>'), 'Table header must have separate "Item Name" column');
assert(!html.includes('<th>Item SKU & Description</th>'), 'Combined "Item SKU & Description" must not be present');

assert(html.includes('2W-SPR-ENGINE-GASKET-KIT-006'), 'Item code must be rendered');
assert(html.includes('Engine Gasket Kit'), 'Item name must be rendered in its own cell');
console.log('✓ PASS: Item Code and Item Name are cleanly separated into distinct table columns.');

// 3. Check App.js breadcrumb hiding for #/inventory
console.log('\n--- TEST 3: Check breadcrumb hiding for #/inventory in app.js ---');
const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
assert(appJs.includes("hash === '#/inventory'"), "app.js must hide breadcrumbs when hash is '#/inventory'");
console.log('✓ PASS: Breadcrumb label "Inventory / Central Inventory Stock & Ledger" is removed/hidden on #/inventory route.');

console.log('\n🎉 ALL INVENTORY STOCK BALANCE UI TESTS PASSED (100%)!');
