const assert = require('assert');

// Mock localStorage
const localStorageStore = {};
global.window = global;
global.localStorage = {
  getItem: (key) => localStorageStore[key] || null,
  setItem: (key, val) => { localStorageStore[key] = String(val); },
  removeItem: (key) => { delete localStorageStore[key]; },
  clear: () => { for (const k in localStorageStore) delete localStorageStore[k]; }
};

// Simulate existing dirty localStorage with non-2W items & categories
localStorageStore['APEX_ISCM_DATABASE_V2'] = JSON.stringify({
  items: [
    { id: 'ITEM-001', code: 'RM-STL-4140', name: 'Chromoly Steel' },
    { id: 'ITEM-009', code: 'FG-ACT-1000', name: 'Actuator' },
    { id: 'ITEM-2W-001', code: '2W-BRK-PAD-01', name: 'Front Disc Brake Pad' }
  ],
  itemCategories: [
    { id: 'CAT-01', code: 'RAW-MTL', name: 'Raw Materials' },
    { id: 'CAT-BRK', code: 'BRK-PRT', name: 'Brake Parts' }
  ],
  warehouses: [
    { id: 'WH-PUN-RMS', name: 'Raw Materials Store' },
    { id: 'WH-PUN-MAIN', name: 'Main Store' }
  ]
});

// Load mock-data.js and db.js
const mockDataModule = require('../js/data/mock-data.js');
global.INITIAL_DATA = mockDataModule.INITIAL_DATA;
global.INDIAN_LOCATION_MASTER = mockDataModule.INDIAN_LOCATION_MASTER;

// Evaluate DatabaseLayer
const fs = require('fs');
const path = require('path');
const dbCode = fs.readFileSync(path.join(__dirname, '../js/data/db.js'), 'utf-8');
eval(dbCode);
const db = window.DB;

console.log('--- Testing DB Auto-Heal & Purge ---');
const items = db.getAll('items');
console.log('Total items in DB:', items.length);
assert(items.length >= 29, 'Expected at least 29 two-wheeler items');

const non2wItems = items.filter(i => !i.code.startsWith('2W-'));
console.log('Non-2W items found:', non2wItems.length);
assert.strictEqual(non2wItems.length, 0, 'Found non-2W items in DB!');

const categories = db.getAll('itemCategories');
console.log('Total categories in DB:', categories.length);
assert.strictEqual(categories.length, 20, 'Expected 20 two-wheeler categories');
const non2wCats = categories.filter(c => c.id.startsWith('CAT-0'));
console.log('Non-2W categories found:', non2wCats.length);
assert.strictEqual(non2wCats.length, 0, 'Found non-2W categories in DB!');

const warehouses = db.getAll('warehouses');
console.log('Total warehouses in DB:', warehouses.length);
assert.strictEqual(warehouses.length, 9, 'Expected 9 two-wheeler stores');
const non2wWh = warehouses.filter(w => ['WH-PUN-RMS', 'WH-PUN-WIP', 'WH-PUN-FGH', 'WH-PUN-QAR', 'WH-CHE-RMS'].includes(w.id));
console.log('Non-2W warehouses found:', non2wWh.length);
assert.strictEqual(non2wWh.length, 0, 'Found non-2W warehouses in DB!');

console.log('\n🎉 ALL MASTER DATA PURGE & TWO-WHEELER VERIFICATION CHECKS PASSED!');
