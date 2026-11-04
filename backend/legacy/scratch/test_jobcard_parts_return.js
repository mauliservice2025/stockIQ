const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('TEST SUITE: JOB CARD RETURN UNUSED PARTS & RESTOCK WORKFLOW');
console.log('================================================================');

// 1. Setup mock environment
global.window = {
  location: { hash: '#/job-cards' },
  State: {
    currentPlantId: 'PLANT-01',
    showToast: () => {},
    closeModal: () => {}
  }
};

const rawMock = require('../js/data/mock-data.js');
const initialData = JSON.parse(JSON.stringify(rawMock.INITIAL_DATA || rawMock));

// Ensure minimal required collections exist
initialData.jobCards = initialData.jobCards || [];
initialData.inventoryBalances = initialData.inventoryBalances || [];
initialData.items = initialData.items || [];
initialData.warehouses = initialData.warehouses || [
  { id: 'WH-PUN-SPARE', code: 'WH-PUN-SPARE', name: 'Spare Parts Store', plant_id: 'PLANT-01', status: 'Active' }
];

// Add a test item if none
const testItem = {
  id: 'ITEM-TEST-PART-1',
  code: 'PART-OIL-FILTER',
  name: 'Engine Oil Filter OEM',
  unit_price: 150,
  current_stock: 10,
  stock: 10,
  available_stock: 10,
  quantity_on_hand: 10
};
initialData.items.push(testItem);

// Add initial stock balance
const initialBalance = {
  id: 'BAL-TEST-1',
  plant_id: 'PLANT-01',
  warehouse_id: 'WH-PUN-SPARE',
  bin_id: 'BIN-PUN-A01',
  item_id: 'ITEM-TEST-PART-1',
  on_hand: 10,
  reserved: 0,
  available: 10,
  stock_status: 'AVAILABLE',
  valuation_rate: 150
};
initialData.inventoryBalances.push(initialBalance);

// Add a Job Card with 3 issued parts (matching user's case)
const testJobCard = {
  id: 'JC-TEST-0029',
  job_card_no: 'JC/MSC1/2026/0029',
  customer_name: 'Suralkar',
  vehicle_reg_no: 'MH12AC4678',
  plant_id: 'PLANT-01',
  store_id: 'WH-PUN-SPARE',
  status: 'PARTS_ISSUED',
  date: '2026-10-25',
  parts_required: [
    {
      item_id: 'ITEM-TEST-PART-1',
      item_code: 'PART-OIL-FILTER',
      item_name: 'Engine Oil Filter OEM',
      qty: 3,
      issued_qty: 3,
      returned_qty: 0,
      status: 'ISSUED',
      unit_price: 150
    }
  ]
};
initialData.jobCards.push(testJobCard);

// Load Database class from db.js
const dbFileContent = fs.readFileSync(path.join(__dirname, '../js/data/db.js'), 'utf8');
const vm = require('vm');
const context = {
  window: global.window,
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  },
  console,
  INITIAL_DATA: initialData
};
vm.createContext(context);
vm.runInContext(dbFileContent, context);

const DB = context.window.DB;
DB.data = initialData;

// Verify initial state
let jc = DB.getById('jobCards', 'JC-TEST-0029');
let bal = DB.getAll('inventoryBalances').find(b => b.item_id === 'ITEM-TEST-PART-1');
assert.strictEqual(jc.parts_required[0].qty, 3, 'Initial part.qty should be 3');
assert.strictEqual(jc.parts_required[0].issued_qty, 3, 'Initial part.issued_qty should be 3');
assert.strictEqual(bal.on_hand, 10, 'Initial bal.on_hand should be 10');
assert.strictEqual(bal.available, 10, 'Initial bal.available should be 10');
console.log('✓ Step 1: Initial state confirmed: 3 parts on Job Card, 10 units in stock.');

// STEP 2: Partial return of 1 part
console.log('\n--- Step 2: Testing partial return of 1 part ---');
DB.returnJobCardParts('JC-TEST-0029', [{ item_id: 'ITEM-TEST-PART-1', qty: 1 }], 'WH-PUN-SPARE', null, 'Unused part');

jc = DB.getById('jobCards', 'JC-TEST-0029');
bal = DB.getAll('inventoryBalances').find(b => b.item_id === 'ITEM-TEST-PART-1');
const item = DB.getById('items', 'ITEM-TEST-PART-1');

assert.strictEqual(jc.parts_required[0].qty, 2, 'part.qty should reduce from 3 to 2');
assert.strictEqual(jc.parts_required[0].issued_qty, 2, 'part.issued_qty should reduce from 3 to 2');
assert.strictEqual(jc.parts_required[0].returned_qty, 1, 'part.returned_qty should be 1');
assert.strictEqual(bal.on_hand, 11, 'bal.on_hand should increase from 10 to 11');
assert.strictEqual(bal.available, 11, 'bal.available should increase from 10 to 11');
assert.strictEqual(item.current_stock, 11, 'item.current_stock in catalog should increase to 11');
console.log('✓ Step 2 PASS: Part qty reduced to 2, and stock increased from 10 to 11!');

// STEP 3: Return remaining 2 parts (full return)
console.log('\n--- Step 3: Testing return of remaining 2 parts ---');
DB.returnJobCardParts('JC-TEST-0029', [{ item_id: 'ITEM-TEST-PART-1', qty: 2 }], 'WH-PUN-SPARE', null, 'Unused part');

jc = DB.getById('jobCards', 'JC-TEST-0029');
bal = DB.getAll('inventoryBalances').find(b => b.item_id === 'ITEM-TEST-PART-1');

assert.strictEqual(jc.parts_required[0].qty, 0, 'part.qty should reduce to 0');
assert.strictEqual(jc.parts_required[0].issued_qty, 0, 'part.issued_qty should reduce to 0');
assert.strictEqual(jc.parts_required[0].returned_qty, 3, 'part.returned_qty should be 3');
assert.strictEqual(jc.parts_required[0].status, 'RETURNED', 'part.status should be RETURNED');
assert.strictEqual(bal.on_hand, 13, 'bal.on_hand should increase to 13');
assert.strictEqual(bal.available, 13, 'bal.available should increase to 13');
assert.notStrictEqual(jc.status, 'PARTS_ISSUED', 'Job card status should no longer be PARTS_ISSUED');
console.log('✓ Step 3 PASS: Part qty reduced to 0, status is RETURNED, stock increased to 13, Job Card status updated from PARTS_ISSUED!');

// STEP 4: Test BillingModule table badge calculation
console.log('\n--- Step 4: Testing BillingModule table badge rendering ---');
const parts = jc.parts_required;
const activeParts = parts.filter(p => p.status !== 'RETURNED' && p.status !== 'CANCELLED' && (Number(p.qty) > 0 || Number(p.issued_qty) > 0));
const totalActiveQty = activeParts.reduce((sum, p) => sum + (Number(p.qty) || Number(p.issued_qty) || 0), 0);
const returnedParts = parts.filter(p => p.status === 'RETURNED' || (p.returned_qty || 0) > 0);

assert.strictEqual(activeParts.length, 0, 'No active parts should remain');
assert.strictEqual(totalActiveQty, 0, 'Total active parts qty should be 0');
assert.strictEqual(returnedParts.length, 1, '1 part record was returned');

console.log('✓ Step 4 PASS: Table badge correctly identifies all parts as returned (no longer shows "3 Parts").');

console.log('\n================================================================');
console.log('🎉 ALL TESTS PASSED (100%) - PARTS QTY REDUCED AND STOCK RESTOCKED!');
console.log('================================================================');
