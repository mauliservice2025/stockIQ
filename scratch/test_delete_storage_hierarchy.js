const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

console.log('================================================================');
console.log('VERIFYING DELETE OPTION IN STORAGE LOCATION, RACK, SHELF, BIN');
console.log('================================================================');

// 1. Sandbox setup
const mockDataContent = fs.readFileSync(path.join(__dirname, '../js/data/mock-data.js'), 'utf8');
const dbContent = fs.readFileSync(path.join(__dirname, '../js/data/db.js'), 'utf8');
const stateContent = fs.readFileSync(path.join(__dirname, '../js/state.js'), 'utf8');
const orgLocationContent = fs.readFileSync(path.join(__dirname, '../js/modules/org-location.js'), 'utf8');
const storeInvContent = fs.readFileSync(path.join(__dirname, '../js/modules/store-inventory.js'), 'utf8');

let lastConfirmed = true;
let alertMsg = '';
let toastMsg = '';

const sandbox = {
  window: {},
  HTMLElement: class {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => {},
  CustomEvent: class { constructor(t, d) { this.type = t; this.detail = d; } },
  Event: class { constructor(t) { this.type = t; } },
  location: { hash: '#/storage-locations' },
  confirm: (msg) => { return lastConfirmed; },
  alert: (msg) => { alertMsg = msg; },
  localStorage: {
    data: {},
    getItem(k) { return this.data[k] || null; },
    setItem(k, v) { this.data[k] = String(v); },
    removeItem(k) { delete this.data[k]; }
  },
  console: console,
  document: {
    addEventListener: () => {},
    documentElement: { setAttribute: () => {}, getAttribute: () => {} },
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => []
  }
};
sandbox.window = sandbox;

vm.createContext(sandbox);
vm.runInContext(mockDataContent, sandbox);
vm.runInContext(dbContent, sandbox);
vm.runInContext(stateContent, sandbox);
vm.runInContext(orgLocationContent, sandbox);
vm.runInContext(storeInvContent, sandbox);

const OrgLocationModule = sandbox.window.OrgLocationModule;
const StoreInventoryModule = sandbox.window.StoreInventoryModule;
const DB = sandbox.window.DB;

sandbox.window.State.showToast = (msg, type) => {
  toastMsg = msg;
};

// 2. Verify HTML views contain delete buttons
const locView = OrgLocationModule.renderStorageLocationsTab();
assert(locView.includes('deleteStorageLocation'), 'Storage Location table must contain delete button calling deleteStorageLocation');
assert(locView.includes('🗑️'), 'Storage Location table must display trash icon 🗑️');
console.log('✓ PASS: Storage Location Master displays Delete button (🗑️).');

const rackView = OrgLocationModule.renderRacksTab();
assert(rackView.includes('deleteRack'), 'Rack Master table must contain delete button calling deleteRack');
assert(rackView.includes('🗑️'), 'Rack Master table must display trash icon 🗑️');
console.log('✓ PASS: Rack Master displays Delete button (🗑️).');

const shelfView = OrgLocationModule.renderShelvesTab();
assert(shelfView.includes('deleteShelf'), 'Shelf Master table must contain delete button calling deleteShelf');
assert(shelfView.includes('🗑️'), 'Shelf Master table must display trash icon 🗑️');
console.log('✓ PASS: Shelf Master displays Delete button (🗑️).');

const binView = OrgLocationModule.renderBinsTab();
assert(binView.includes('deleteBin'), 'Bin Master table must contain delete button calling deleteBin');
assert(binView.includes('🗑️'), 'Bin Master table must display trash icon 🗑️');
console.log('✓ PASS: Bin Master displays Delete button (🗑️).');

// 3. Verify delete methods exist on OrgLocationModule and StoreInventoryModule
assert(typeof OrgLocationModule.deleteStorageLocation === 'function', 'OrgLocationModule.deleteStorageLocation must be a function');
assert(typeof OrgLocationModule.deleteRack === 'function', 'OrgLocationModule.deleteRack must be a function');
assert(typeof OrgLocationModule.deleteShelf === 'function', 'OrgLocationModule.deleteShelf must be a function');
assert(typeof OrgLocationModule.deleteBin === 'function', 'OrgLocationModule.deleteBin must be a function');

assert(typeof StoreInventoryModule.deleteStorageLocation === 'function', 'StoreInventoryModule.deleteStorageLocation must be a function');
assert(typeof StoreInventoryModule.deleteRack === 'function', 'StoreInventoryModule.deleteRack must be a function');
assert(typeof StoreInventoryModule.deleteShelf === 'function', 'StoreInventoryModule.deleteShelf must be a function');
assert(typeof StoreInventoryModule.deleteBin === 'function', 'StoreInventoryModule.deleteBin must be a function');
console.log('✓ PASS: All 4 delete methods exist and are delegated across modules.');

// 4. Functional Test: Delete Storage Location
const testLoc = {
  id: 'ZONE-TEST-DEL',
  warehouse_id: 'WH-01',
  code: 'LOC-TEST-DEL',
  name: 'Test Storage Location To Delete',
  status: 'Active'
};
DB.upsert('zones', testLoc);
assert(DB.getById('zones', 'ZONE-TEST-DEL'), 'Test location must exist before delete');

OrgLocationModule.deleteStorageLocation('ZONE-TEST-DEL');
assert(!DB.getById('zones', 'ZONE-TEST-DEL'), 'Test location must be deleted from DB');
console.log('✓ PASS: deleteStorageLocation removes record from database.');

// 5. Functional Test: Delete Rack
const testRack = {
  id: 'RACK-TEST-DEL',
  warehouse_id: 'WH-01',
  storage_location_id: 'LOC-01',
  code: 'RACK-TEST-DEL',
  name: 'Test Rack To Delete',
  status: 'Active'
};
DB.upsert('racks', testRack);
assert(DB.getById('racks', 'RACK-TEST-DEL'), 'Test rack must exist before delete');

OrgLocationModule.deleteRack('RACK-TEST-DEL');
assert(!DB.getById('racks', 'RACK-TEST-DEL'), 'Test rack must be deleted from DB');
console.log('✓ PASS: deleteRack removes record from database.');

// 6. Functional Test: Delete Shelf
const testShelf = {
  id: 'SHELF-TEST-DEL',
  rack_id: 'RACK-01',
  code: 'SH-TEST-DEL',
  level_number: 1,
  status: 'Active'
};
DB.upsert('shelves', testShelf);
assert(DB.getById('shelves', 'SHELF-TEST-DEL'), 'Test shelf must exist before delete');

OrgLocationModule.deleteShelf('SHELF-TEST-DEL');
assert(!DB.getById('shelves', 'SHELF-TEST-DEL'), 'Test shelf must be deleted from DB');
console.log('✓ PASS: deleteShelf removes record from database.');

// 7. Functional Test: Bin with Stock Protection
const testBinWithStock = {
  id: 'BIN-TEST-STOCK',
  warehouse_id: 'WH-01',
  code: 'BIN-STOCK-DEL',
  status: 'Active'
};
DB.upsert('bins', testBinWithStock);

// Add on-hand balance to this bin
DB.upsert('inventoryBalances', {
  id: 'BAL-TEST-BIN',
  item_id: 'ITM-001',
  bin_id: 'BIN-TEST-STOCK',
  on_hand: 25
});

OrgLocationModule.deleteBin('BIN-TEST-STOCK');
assert(DB.getById('bins', 'BIN-TEST-STOCK'), 'Bin with stock must NOT be deleted');
assert(toastMsg.includes('currently holds on-hand stock'), 'Error toast must mention on-hand stock protection');
console.log('✓ PASS: deleteBin prevents deletion when on-hand stock exists.');

// 8. Functional Test: Delete Empty Bin
const testEmptyBin = {
  id: 'BIN-TEST-EMPTY',
  warehouse_id: 'WH-01',
  code: 'BIN-EMPTY-DEL',
  status: 'Active'
};
DB.upsert('bins', testEmptyBin);
assert(DB.getById('bins', 'BIN-TEST-EMPTY'), 'Empty bin must exist before delete');

OrgLocationModule.deleteBin('BIN-TEST-EMPTY');
assert(!DB.getById('bins', 'BIN-TEST-EMPTY'), 'Empty bin must be deleted from DB');
console.log('✓ PASS: deleteBin deletes empty bin successfully.');

console.log('================================================================');
console.log('🎉 ALL DELETE OPTION CHECKS PASSED (100%)!');
console.log('================================================================');
