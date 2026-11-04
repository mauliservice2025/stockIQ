const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Mock browser globals
global.window = global;
global.window.location = { hash: '#/transfers' };
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.window.dispatchEvent = () => {};
global.CustomEvent = class { constructor(type, init) { this.type = type; this.detail = init?.detail; } };
global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };

const domElements = {};
const createMockEl = (id = '') => {
  if (domElements[id]) return domElements[id];
  const el = {
    id,
    innerHTML: '',
    value: '',
    style: {},
    attributes: {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
    getAttribute(name) { return this.attributes[name] !== undefined ? this.attributes[name] : (this[name] || ''); },
    setAttribute(name, val) { this.attributes[name] = String(val); this[name] = val; },
    removeAttribute(name) { delete this.attributes[name]; },
    remove() {},
    focus() {},
    querySelectorAll() { return []; }
  };
  domElements[id] = el;
  return el;
};

global.document = {
  documentElement: createMockEl('html'),
  getElementById: (id) => domElements[id] || createMockEl(id),
  querySelectorAll: () => [],
  addEventListener: () => {}
};

global.State = {
  currentPlantId: 'ALL',
  getCurrentUser: () => ({ name: 'Admin', username: 'admin', email: 'admin@stockiq.com', primary_role: 'ADMIN' }),
  hasPermission: () => true,
  subscribe: () => {},
  showModal: (config) => { global._lastModal = config; },
  showToast: (msg, type) => { global._lastToast = { msg, type }; }
};

const mockPlants = [{ id: 'PLANT-01', name: 'Pune Plant', code: 'PUN' }, { id: 'PLANT-02', name: 'Chennai Plant', code: 'CHE' }];
const mockWarehouses = [{ id: 'WH-01', name: 'Main Store', plant_id: 'PLANT-01' }, { id: 'WH-02', name: 'Finished Goods', plant_id: 'PLANT-02' }];
const mockItems = [
  { id: 'ITM-007', code: '2W-SPR-ENGINE-VALVE-SET-007', name: 'Engine Valve Set', stock: 15, base_uom: 'SET' },
  { id: 'ITM-008', code: '2W-SPR-SPARK-PLUG-008', name: 'Spark Plug', stock: 0, base_uom: 'NOS' }
];

const mockBalances = [
  { id: 'BAL-01', warehouse_id: 'WH-01', item_id: 'ITM-007', available: 15, on_hand: 15 }
];

global.DB = {
  getAll: (table) => {
    if (table === 'stockTransfers') return [];
    if (table === 'plants') return mockPlants;
    if (table === 'warehouses') return mockWarehouses;
    if (table === 'items') return mockItems;
    if (table === 'inventoryBalances') return mockBalances;
    return [];
  },
  getActivePlants: () => mockPlants,
  getActiveWarehouses: () => mockWarehouses,
  isPlantActive: () => true,
  getById: (table, id) => {
    if (table === 'plants') return mockPlants.find(p => p.id === id);
    if (table === 'warehouses') return mockWarehouses.find(w => w.id === id);
    if (table === 'items') return mockItems.find(i => i.id === id);
    return null;
  },
  getItemsForFacility: () => mockItems,
  insert: (table, record) => { global._inserted = record; },
  logAudit: () => {},
  subscribe: () => {},
  deductItemStock: () => { global._deducted = true; }
};

// Load app.js
const appCode = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
eval(appCode);

window.State.showToast = (msg, type) => { global._lastToast = { msg, type }; };
window.State.showModal = (config) => { global._lastModal = config; };
window.State.closeModal = () => {};

// Load transfers.js
const trfCode = fs.readFileSync(path.join(__dirname, '../js/modules/transfers.js'), 'utf8');
eval(trfCode);

console.log('=== TEST SUITE: STOCK TRANSFER QUANTITY LIMITS & ZERO DEFAULT ===\n');

// 1. Test modal initialization
window.TransfersModule.showCreateModal();
const modalHtml = global._lastModal.contentHtml;

assert(modalHtml.includes('id="new-trf-qty" class="form-control" value="0"'), 'Default transfer qty input must have value="0"');
assert(modalHtml.includes('Store Stock'), 'Table must have Store Stock column');
console.log('✓ 1. Default transfer quantity is 0 and Store Stock column exists in table.');

// Set up DOM elements for interaction
domElements['new-trf-s-plant'] = { value: 'PLANT-01' };
domElements['new-trf-s-wh'] = { value: 'WH-01' };
domElements['new-trf-d-plant'] = { value: 'PLANT-02' };
domElements['new-trf-d-wh'] = { value: 'WH-02' };
domElements['new-trf-qty'] = createMockEl('new-trf-qty');
domElements['new-trf-batch'] = { value: 'LOT-STL-2026-A' };
domElements['new-trf-reason'] = { value: 'Inter-store transfer test' };
domElements['trf-selected-item-bar'] = createMockEl('trf-selected-item-bar');
domElements['trf-selected-item-text'] = createMockEl('trf-selected-item-text');
domElements['trf-selected-item-stock'] = createMockEl('trf-selected-item-stock');
domElements['trf-item-search-query'] = createMockEl('trf-item-search-query');
domElements['trf-items-tbody'] = createMockEl('trf-items-tbody');

// 2. Select item with stock = 15
window.TransfersModule.selectItemFromSearch('ITM-007');
const availStock = window.TransfersModule.getAvailableStockForItem(mockItems[0], 'WH-01');
assert.strictEqual(availStock, 15, 'Available stock must be 15');
assert.strictEqual(domElements['new-trf-qty'].value, '0', 'Selecting item must leave input at default 0');
assert.strictEqual(domElements['new-trf-qty'].getAttribute('max'), '15', 'Input max attribute must be capped to available stock 15');
console.log('✓ 2. Available stock accurately calculated (15 SET) and max capped to 15 with 0 default.');

// 3. Test real-time input change with infinite qty (e.g. user enters 500)
domElements['new-trf-qty'].value = 500;
window.TransfersModule.onTransferQtyInputChange(domElements['new-trf-qty']);
assert(global._lastToast && global._lastToast.msg.includes('cannot exceed available stock'), `Warning toast displayed when user enters excessive qty: ${JSON.stringify(global._lastToast)}`);
console.log('✓ 3. Real-time typing prevents infinite quantity and clamps input to available stock.');

// 4. Test adding with quantity = 0 (Must be blocked)
domElements['new-trf-qty'].value = 0;
window.TransfersModule.addItemToTransferList();
assert(global._lastToast.msg.includes('Transfer quantity must be greater than 0'), 'Cannot add 0 quantity to transfer');
assert.strictEqual(window.TransfersModule._transferItems.length, 0, 'No item added with 0 qty');
console.log('✓ 4. Adding 0 quantity is strictly blocked.');

// 5. Test adding with infinite quantity > stock (e.g. 50 units when stock is 15)
domElements['new-trf-qty'].value = 50;
window.TransfersModule.addItemToTransferList();
assert(global._lastToast.msg.includes('Cannot transfer 50 SET'), 'Exceeding available stock is blocked');
assert.strictEqual(window.TransfersModule._transferItems.length, 0, 'No item added when exceeding stock');
console.log('✓ 5. Adding quantity exceeding stock (50 > 15) is strictly blocked.');

// 6. Test adding valid quantity (10 units out of 15)
domElements['new-trf-qty'].value = 10;
window.TransfersModule.addItemToTransferList();
assert.strictEqual(window.TransfersModule._transferItems.length, 1, '1 item successfully added');
assert.strictEqual(window.TransfersModule._transferItems[0].requested, 10, 'Requested qty is 10');
assert.strictEqual(domElements['new-trf-qty'].value, '0', 'After adding, input resets back to default 0');
console.log('✓ 6. Adding valid quantity (10 SET) succeeds, and input resets back to 0.');

// 7. Test remaining available stock for next add of same item (15 - 10 = 5 remaining)
window.TransfersModule.selectItemFromSearch('ITM-007');
const remainingStock = window.TransfersModule.getRemainingAvailableStockForItem(mockItems[0], 'WH-01');
assert.strictEqual(remainingStock, 5, 'Remaining available stock must be 5');
assert.strictEqual(domElements['new-trf-qty'].getAttribute('max'), '5', 'Max attribute updated to remaining stock (5)');
console.log('✓ 7. System dynamically tracks remaining available stock (5 remaining after 10 added).');

// 8. Test adding out-of-stock item (ITM-008 has 0 stock)
window.TransfersModule.selectItemFromSearch('ITM-008');
domElements['new-trf-qty'].value = 2;
window.TransfersModule.addItemToTransferList();
assert(global._lastToast.msg.includes('0 stock available'), 'Adding item with 0 stock is blocked');
console.log('✓ 8. Adding item with 0 available stock is blocked.');

// 9. Verify table rendering displays Store Stock
const tableHtml = window.TransfersModule.renderTransferItemsTableHtml();
assert(tableHtml.includes('15'), 'Table row must display store stock (15)');
assert(tableHtml.includes('10'), 'Table row must display transfer qty (10)');
console.log('✓ 9. Staging table displays Store Stock alongside Transfer Qty.');

// 10. Verify dispatch validation
const fakeEvent = { preventDefault: () => {} };
window.TransfersModule.submitNewTransfer(fakeEvent);
assert(global._inserted, 'Transfer record inserted successfully');
assert.strictEqual(global._inserted.items[0].requested, 10, 'Dispatched items contain valid requested quantity');
console.log('✓ 10. Dispatch validation verified and transfer posted successfully.');

console.log('\n================================================================');
console.log('🎉 ALL STOCK QUANTITY & ZERO DEFAULT TESTS PASSED (100%)!');
console.log('================================================================\n');
