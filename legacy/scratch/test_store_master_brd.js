// Comprehensive Test Script for Store Master Functional Requirements (BRD v1.0)
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('Testing Store Master BRD v1.0 Compliance...');

// 1. Syntax check on db.js and store-inventory.js
const dbJs = fs.readFileSync(path.join(__dirname, '../js/data/db.js'), 'utf-8');
const storeInvJs = fs.readFileSync(path.join(__dirname, '../js/modules/store-inventory.js'), 'utf-8');

global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = v; },
  removeItem(k) { delete this._store[k]; }
};

global.document = {
  getElementById: (id) => null,
  querySelectorAll: (sel) => [],
  querySelector: (sel) => null
};

global.window = {
  State: {
    hasPermission: () => true,
    showModal: (cfg) => { window.lastModal = cfg; },
    closeModal: () => { window.lastModal = null; },
    showToast: (msg, type) => { window.lastToast = { msg, type }; }
  }
};

eval(dbJs);
eval(storeInvJs);

console.log('✔ Files loaded and syntax valid.');

// 2. Setup mock data
const plants = [
  { id: 'PLANT-01', code: 'PUN-MAIN', name: 'Mauli Service Center 1', city: 'Pune', status: 'Active' },
  { id: 'PLANT-02', code: 'PUN-SUB', name: 'Mauli Service Center 2', city: 'Pune', status: 'Active' },
  { id: 'PLANT-03', code: 'MUM-01', name: 'Mumbai Central Workshop', city: 'Mumbai', status: 'Active' }
];
window.DB.data.plants = plants;
window.DB.data.organizations = [{ id: 'ORG-01', name: 'Mauli Service Center Pvt. Ltd.' }];
window.DB.data.warehouses = [];

const categories = [
  { id: 'CAT-SPARE', code: 'SPARE', name: 'Spare Parts' },
  { id: 'CAT-CONS', code: 'CONS', name: 'Consumables' }
];
window.DB.data.itemCategories = categories;

const subcategories = [
  { id: 'SCAT-BRAKE', category_id: 'CAT-SPARE', code: 'BRAKE', name: 'Brake Parts' },
  { id: 'SCAT-ENGINE', category_id: 'CAT-SPARE', code: 'ENGINE', name: 'Engine Parts' },
  { id: 'SCAT-CLEAN', category_id: 'CAT-CONS', code: 'CLEAN', name: 'Cleaning Materials' }
];
window.DB.data.itemSubcategories = subcategories;

const items = [
  { id: 'ITEM-001', code: 'SP-001', name: 'Front Brake Pad', category_id: 'CAT-SPARE', subcategory_id: 'SCAT-BRAKE', status: 'Active' },
  { id: 'ITEM-002', code: 'SP-002', name: 'Rear Brake Shoe', category_id: 'CAT-SPARE', subcategory_id: 'SCAT-BRAKE', status: 'Active' },
  { id: 'ITEM-003', code: 'SP-003', name: 'Piston Ring Set', category_id: 'CAT-SPARE', subcategory_id: 'SCAT-ENGINE', status: 'Active' },
  { id: 'ITEM-004', code: 'CO-001', name: 'Brake Cleaner Spray', category_id: 'CAT-CONS', subcategory_id: 'SCAT-CLEAN', status: 'Active' },
  { id: 'ITEM-005', code: 'SP-005', name: 'Engine Oil Filter', category_id: 'CAT-SPARE', subcategory_id: 'SCAT-ENGINE', status: 'Active' }
];
window.DB.data.items = items;

// 3. Test Store Creation (BRD §7.1 & STR-BR-01 to 07)
console.log('Testing Store Creation...');
window.DB.data.warehouses.push({
  id: 'WH-STR-MAIN',
  code: 'STR-MAIN',
  name: 'Main Parts Store',
  warehouse_type: 'MAIN_STORE',
  store_type: 'Main Store',
  parent_store_id: null,
  facility_ids: ['PLANT-01', 'PLANT-02'],
  plant_id: 'PLANT-01',
  gstin: '27AABCT2345M1Z9',
  address: 'Building A, Ground Floor',
  manager: 'Ramesh Kadam',
  contact_number: '9822011223',
  email: 'store@mauliservice.com',
  effective_from: '2026-01-01',
  effective_to: null,
  status: 'Active'
});

window.DB.data.warehouses.push({
  id: 'WH-STR-WORKSHOP',
  code: 'STR-WORKSHOP',
  name: 'Workshop Floor Sub-Store',
  warehouse_type: 'SUB_STORE',
  store_type: 'Sub Store',
  parent_store_id: 'WH-STR-MAIN',
  facility_ids: ['PLANT-01'],
  plant_id: 'PLANT-01',
  manager: 'Suresh Patil',
  contact_number: '9822099887',
  effective_from: '2026-01-01',
  status: 'Active'
});

assert.strictEqual(window.DB.getAll('warehouses').length, 2, '2 stores created');
console.log('✔ Store Creation verified');

// 4. Test Screen Mapping (BRD §7.2: 12 Screens)
console.log('Testing Screen Mapping (BRD §7.2)...');
const mainScreens = window.DB.getStoreScreenMapping('WH-STR-MAIN');
assert.strictEqual(mainScreens.REQUISITIONS, true, 'Main store default REQUISITIONS');
assert.strictEqual(mainScreens.PURCHASE_ORDERS, true, 'Main store default PURCHASE_ORDERS');
assert.strictEqual(mainScreens.GRN, true, 'Main store default GRN');
assert.strictEqual(mainScreens.STOCK_TRANSFER, true, 'Main store default STOCK_TRANSFER');

const subScreens = window.DB.getStoreScreenMapping('WH-STR-WORKSHOP');
assert.strictEqual(subScreens.REQUISITIONS, false, 'Sub store default REQUISITIONS false');
assert.strictEqual(subScreens.WORK_ORDERS, true, 'Sub store default WORK_ORDERS true');
assert.strictEqual(subScreens.STOCK_ISSUE, true, 'Sub store default STOCK_ISSUE true');
assert.strictEqual(subScreens.STOCK_RETURN, true, 'Sub store default STOCK_RETURN true');
assert.strictEqual(subScreens.STOCK_CONSUMPTION, true, 'Sub store default STOCK_CONSUMPTION true');

// Custom screen save
window.DB.saveStoreScreenMapping('WH-STR-WORKSHOP', {
  ...subScreens,
  REQUISITIONS: true
}, 'Test User');
assert.strictEqual(window.DB.isScreenMappedToStore('WH-STR-WORKSHOP', 'REQUISITIONS'), true, 'Updated screen mapping is active');
console.log('✔ Screen Mapping verified (12 Screens)');

// 5. Test Item Mapping (BRD §7.3 & §7.3.1 Union rule)
console.log('Testing Item Mapping (Option A, Option B & Union Rule)...');
// Option A: Map SCAT-BRAKE to Sub-Store
window.DB.saveStoreCategoryMappings('WH-STR-WORKSHOP', ['SCAT-BRAKE'], 'Admin');
// Option B: Individually map CO-001 (Cleaning Spray) to Sub-Store
window.DB.saveStoreItemMappings('WH-STR-WORKSHOP', ['ITEM-004'], 'Admin');

const effectiveItems = window.DB.getStoreEffectiveItems('WH-STR-WORKSHOP');
// Expecting SP-001 (Brake Pad), SP-002 (Brake Shoe) via Subcat, and CO-001 via Individual item
assert.strictEqual(effectiveItems.length, 3, 'Effective items union must be exactly 3 items');
const sp001 = effectiveItems.find(i => i.code === 'SP-001');
assert(sp001 && sp001.mapping_source === 'SUBCAT', 'SP-001 mapped via SUBCAT');
const co001 = effectiveItems.find(i => i.code === 'CO-001');
assert(co001 && co001.mapping_source === 'ITEM', 'CO-001 mapped via ITEM');
assert(!effectiveItems.some(i => i.code === 'SP-003'), 'SP-003 (Engine Part) must NOT be mapped');

assert.strictEqual(window.DB.isItemMappedToStore('WH-STR-WORKSHOP', 'ITEM-001'), true);
assert.strictEqual(window.DB.isItemMappedToStore('WH-STR-WORKSHOP', 'ITEM-003'), false);
console.log('✔ Item Mapping (Union rule) verified');

// 6. Test Store-Wise Reorder Levels (BRD §7.4 & STR-BR-20 to 27)
console.log('Testing Store-Wise Reorder Levels...');
window.DB.saveStoreReorderLevel({
  store_id: 'WH-STR-WORKSHOP',
  item_id: 'ITEM-001',
  item_code: 'SP-001',
  item_name: 'Front Brake Pad',
  min_stock_level: 5,
  reorder_level: 10,
  reorder_quantity: 20,
  max_stock_level: 50,
  lead_time_days: 2
}, 'Admin');

const rules = window.DB.getStoreReorderLevels('WH-STR-WORKSHOP');
assert.strictEqual(rules.length, 1, 'Reorder rule saved');
assert.strictEqual(rules[0].reorder_level, 10);

// Test Reorder Alert generation: currently on_hand is 0, which is <= 10 (reorder_level)
const alerts = window.DB.getStoreReorderAlerts('WH-STR-WORKSHOP');
assert.strictEqual(alerts.length, 1, 'Alert generated because available stock (0) <= reorder level (10)');
assert.strictEqual(alerts[0].suggested_qty, 20, 'Suggested replenishment quantity is 20');
assert.strictEqual(alerts[0].is_critical, true, 'Critical alert because stock (0) <= min level (5)');

// Test STR-BR-25 Validation: Min > Reorder must throw
assert.throws(() => {
  window.DB.saveStoreReorderLevel({
    store_id: 'WH-STR-WORKSHOP',
    item_id: 'ITEM-002',
    min_stock_level: 20,
    reorder_level: 10,
    max_stock_level: 30
  });
}, /STR-BR-25/);
console.log('✔ Store-Wise Reorder Levels and Alerts verified');

// 7. Test Audit Trail (BRD §17)
console.log('Testing Audit Trail...');
const auditLogs = window.DB.getStoreAuditLogs('WH-STR-WORKSHOP');
assert(auditLogs.length >= 3, 'Audit logs recorded for screen update, category update, and reorder level update');
console.log('✔ Audit Trail verified');

// 8. Test STR-BR-30: Cannot deactivate Main Store with active Sub Stores
console.log('Testing STR-BR-30 Main Store deactivation guard...');
let alertTriggered = false;
global.alert = (msg) => { alertTriggered = true; };
window.StoreInventoryModule.toggleStoreStatus('WH-STR-MAIN');
assert.strictEqual(alertTriggered, true, 'Alert triggered preventing deactivation of Main Store with active Sub Store');
assert.strictEqual(window.DB.getById('warehouses', 'WH-STR-MAIN').status, 'Active', 'Store remains Active');
console.log('✔ STR-BR-30 deactivation guard verified');

// 9. Test STR-BR-29: Cannot delete store with stock or transactions
console.log('Testing STR-BR-29 delete guard...');
window.DB.data.inventoryBalances = [
  { warehouse_id: 'WH-STR-WORKSHOP', item_id: 'ITEM-001', on_hand: 5, reserved: 0 }
];
alertTriggered = false;
window.StoreInventoryModule.deleteStore('WH-STR-WORKSHOP');
assert.strictEqual(alertTriggered, true, 'Alert triggered preventing deletion of store with stock');
assert(window.DB.getById('warehouses', 'WH-STR-WORKSHOP'), 'Store not deleted');
console.log('✔ STR-BR-29 delete guard verified');

// 10. Test UI Rendering
console.log('Testing Store Master UI rendering...');
let viewContainer = { innerHTML: '' };
global.document.getElementById = (id) => {
  if (id === 'view-container') return viewContainer;
  return null;
};
window.StoreInventoryModule.render(viewContainer);
assert(!viewContainer.innerHTML.includes('Total Stores'), 'Summary cards must be removed per user request');
assert(viewContainer.innerHTML.includes('Main Parts Store'), 'Main store rendered in table');
assert(viewContainer.innerHTML.includes('Workshop Floor Sub-Store'), 'Sub store rendered in table');
assert(viewContainer.innerHTML.includes('Main Store'), 'Main store badge rendered');
assert(viewContainer.innerHTML.includes('Sub Store'), 'Sub store badge rendered');
assert(viewContainer.innerHTML.includes('Configure'), 'Configure store action button present');

// 11. Test cannot deactivate store with stock
console.log('Testing store deactivation guard with active stock...');
window.DB.data.inventoryBalances = [
  { warehouse_id: 'WH-STR-WORKSHOP', item_id: 'ITEM-001', on_hand: 10, reserved: 0 }
];
let deactAlertTriggered = false;
global.alert = (msg) => { deactAlertTriggered = true; };
window.StoreInventoryModule.toggleStoreStatus('WH-STR-WORKSHOP');
assert.strictEqual(deactAlertTriggered, true, 'Alert triggered preventing deactivation of store with stock');
assert.strictEqual(window.DB.getById('warehouses', 'WH-STR-WORKSHOP').status, 'Active', 'Store remains Active because it has stock');
console.log('✔ Stock deactivation guard verified');

console.log('----------------------------------------------------');
console.log('🎉 ALL STORE MASTER BRD v1.0 TESTS PASSED WITH 100% SUCCESS!');
