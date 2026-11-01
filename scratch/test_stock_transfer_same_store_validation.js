const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('--- Testing Stock Transfer Same Store / Same Facility Restriction ---');

// Read transfers.js
const code = fs.readFileSync(path.join(__dirname, '../js/modules/transfers.js'), 'utf8');

// Mock DOM elements and State
let toasts = [];
let capturedModal = null;

const mockPlants = [
  { id: 'PLANT-01', name: 'Mauli Service Center - I', status: 'Active' },
  { id: 'PLANT-02', name: 'Pune Central Facility', status: 'Active' }
];

let mockWarehouses = [
  { id: 'WH-01', plant_id: 'PLANT-01', name: 'Mauli Store 1', status: 'Active' },
  { id: 'WH-02', plant_id: 'PLANT-01', name: 'Mauli Store 2', status: 'Active' },
  { id: 'WH-PUN-01', plant_id: 'PLANT-02', name: 'Central Warehouse', status: 'Active' }
];

let insertedTransfers = [];

const createMockElement = (id, tag = 'div', value = '') => {
  const el = {
    id,
    tagName: tag.toUpperCase(),
    value,
    style: {},
    innerHTML: '',
    children: [],
    disabled: false,
    title: '',
    customValidity: '',
    setCustomValidity: function(val) { this.customValidity = val; },
    focus: function() {},
    setAttribute: function() {},
    getAttribute: function() { return ''; }
  };
  return el;
};

const domStore = {};

const sandbox = {
  console: console,
  document: {
    getElementById: (id) => domStore[id] || null,
    querySelector: (sel) => {
      if (sel.includes('button[form="create-trf-form"]')) return domStore['submit-btn'];
      return null;
    },
    createElement: (tag) => createMockElement('', tag),
    body: { appendChild: () => {} },
    addEventListener: () => {},
    removeEventListener: () => {}
  },
  window: {},
  setTimeout: setTimeout,
  clearTimeout: clearTimeout
};

sandbox.window = sandbox;
sandbox.window.State = {
  showModal: (config) => { capturedModal = config; },
  closeModal: () => {},
  showToast: (msg, type) => { toasts.push({ msg, type }); }
};

sandbox.window.DB = {
  getActivePlants: () => mockPlants,
  getActiveWarehouses: () => mockWarehouses,
  getItemsForFacility: () => [
    { id: 'ITEM-01', code: 'SP-001', name: 'Brake Pad', stock: 50, base_uom: 'NOS' }
  ],
  getAll: (table) => {
    if (table === 'stockTransfers') return insertedTransfers;
    if (table === 'items') return [{ id: 'ITEM-01', code: 'SP-001', name: 'Brake Pad', stock: 50, base_uom: 'NOS' }];
    if (table === 'inventoryBalances') return [{ item_id: 'ITEM-01', warehouse_id: 'WH-01', available: 50 }];
    return [];
  },
  getById: (table, id) => {
    if (table === 'stockTransfers') return insertedTransfers.find(t => t.id === id);
    if (table === 'items') return { id: 'ITEM-01', code: 'SP-001', name: 'Brake Pad', stock: 50, base_uom: 'NOS' };
    return null;
  },
  isPlantActive: () => true,
  insert: (table, rec) => {
    if (table === 'stockTransfers') insertedTransfers.push(rec);
  },
  update: () => {},
  logAudit: () => {}
};

// Run transfers.js inside vm
vm.createContext(sandbox);
vm.runInContext(code, sandbox);

const TransfersModule = sandbox.window.TransfersModule;
if (!TransfersModule) {
  console.error('FAIL: TransfersModule not loaded');
  process.exit(1);
}
console.log('✓ TransfersModule loaded successfully.');

// TEST 1: Single plant with single store -> destination cannot select same store
const origPlants = mockPlants;
sandbox.window.DB.getActivePlants = () => [{ id: 'PLANT-01', name: 'Mauli Service Center - I', status: 'Active' }];
mockWarehouses = [
  { id: 'WH-01', plant_id: 'PLANT-01', name: 'Mauli Store 1', status: 'Active' }
];
TransfersModule.showCreateModal();
console.log('Captured modal title:', capturedModal.title);
if (!capturedModal.contentHtml.includes('No other store in this facility')) {
  console.error('FAIL: Modal should indicate no other store available in same facility');
  process.exit(1);
}
if (!capturedModal.contentHtml.includes('Cannot transfer between same store in same facility')) {
  console.error('FAIL: Modal should include same store warning element');
  process.exit(1);
}
console.log('✓ Test 1 Passed: Modal prevents same store selection when only 1 store exists in facility.');

sandbox.window.DB.getActivePlants = () => origPlants;

// TEST 2: Two stores in same facility -> destination store filters out source store
mockWarehouses = [
  { id: 'WH-01', plant_id: 'PLANT-01', name: 'Mauli Store 1', status: 'Active' },
  { id: 'WH-02', plant_id: 'PLANT-01', name: 'Mauli Store 2', status: 'Active' },
  { id: 'WH-PUN-01', plant_id: 'PLANT-02', name: 'Central Warehouse', status: 'Active' }
];

domStore['new-trf-s-plant'] = createMockElement('new-trf-s-plant', 'select', 'PLANT-01');
domStore['new-trf-d-plant'] = createMockElement('new-trf-d-plant', 'select', 'PLANT-01');
domStore['new-trf-s-wh'] = createMockElement('new-trf-s-wh', 'select', 'WH-01');
domStore['new-trf-d-wh'] = createMockElement('new-trf-d-wh', 'select', 'WH-02');
domStore['trf-same-store-warning'] = createMockElement('trf-same-store-warning', 'div');
domStore['submit-btn'] = createMockElement('submit-btn', 'button');

TransfersModule.syncDestStoreOptions();
console.log('To Store options (same facility):', domStore['new-trf-d-wh'].innerHTML);
if (domStore['new-trf-d-wh'].innerHTML.includes('WH-01')) {
  console.error('FAIL: Source store WH-01 should NOT be an option in destination store for same facility');
  process.exit(1);
}
if (!domStore['new-trf-d-wh'].innerHTML.includes('WH-02')) {
  console.error('FAIL: Other store WH-02 should be available in destination store');
  process.exit(1);
}
console.log('✓ Test 2 Passed: Destination store filters out source store within the same facility.');

// TEST 3: Different facilities -> destination can select any store in destination facility
domStore['new-trf-s-plant'].value = 'PLANT-01';
domStore['new-trf-d-plant'].value = 'PLANT-02';
domStore['new-trf-s-wh'].value = 'WH-01';
TransfersModule.syncDestStoreOptions();
console.log('To Store options (different facility):', domStore['new-trf-d-wh'].innerHTML);
if (!domStore['new-trf-d-wh'].innerHTML.includes('WH-PUN-01')) {
  console.error('FAIL: Central Warehouse should be available when transferring across facilities');
  process.exit(1);
}
console.log('✓ Test 3 Passed: Cross-facility transfers allow selection of destination facility stores.');

// TEST 4: validateTransferEndpoints() checks
// Case 4A: Same facility, same store -> INVALID
domStore['new-trf-s-plant'].value = 'PLANT-01';
domStore['new-trf-d-plant'].value = 'PLANT-01';
domStore['new-trf-s-wh'].value = 'WH-01';
domStore['new-trf-d-wh'].value = 'WH-01';
const valid4A = TransfersModule.validateTransferEndpoints();
console.log('Validation (Same plant, same store):', valid4A);
if (valid4A !== false) {
  console.error('FAIL: Transfer between same store in same facility must be invalid');
  process.exit(1);
}
if (domStore['submit-btn'].disabled !== true) {
  console.error('FAIL: Submit button should be disabled for same store in same facility');
  process.exit(1);
}
console.log('✓ Test 4A Passed: Same plant, same store is rejected and disables submit.');

// Case 4B: Same facility, different store -> VALID
domStore['new-trf-s-plant'].value = 'PLANT-01';
domStore['new-trf-d-plant'].value = 'PLANT-01';
domStore['new-trf-s-wh'].value = 'WH-01';
domStore['new-trf-d-wh'].value = 'WH-02';
const valid4B = TransfersModule.validateTransferEndpoints();
console.log('Validation (Same plant, different store):', valid4B);
if (valid4B !== true) {
  console.error('FAIL: Transfer between different stores in same facility must be valid');
  process.exit(1);
}
if (domStore['submit-btn'].disabled !== false) {
  console.error('FAIL: Submit button should be enabled');
  process.exit(1);
}
console.log('✓ Test 4B Passed: Same plant, different store is permitted.');

// Case 4C: Different facility, same store ID or different store ID -> VALID
domStore['new-trf-s-plant'].value = 'PLANT-01';
domStore['new-trf-d-plant'].value = 'PLANT-02';
domStore['new-trf-s-wh'].value = 'WH-01';
domStore['new-trf-d-wh'].value = 'WH-PUN-01';
const valid4C = TransfersModule.validateTransferEndpoints();
console.log('Validation (Different plant):', valid4C);
if (valid4C !== true) {
  console.error('FAIL: Transfer between different facilities must be valid');
  process.exit(1);
}
console.log('✓ Test 4C Passed: Different plant transfer is permitted.');

// TEST 5: submitNewTransfer validation blocks same store in same facility
toasts = [];
domStore['new-trf-s-plant'].value = 'PLANT-01';
domStore['new-trf-d-plant'].value = 'PLANT-01';
domStore['new-trf-s-wh'].value = 'WH-01';
domStore['new-trf-d-wh'].value = 'WH-01';
domStore['new-trf-transporter'] = createMockElement('new-trf-transporter', 'input', 'Fleet 1');
domStore['new-trf-vehicle'] = createMockElement('new-trf-vehicle', 'input', 'MH-12-1234');
domStore['new-trf-reason'] = createMockElement('new-trf-reason', 'input', 'Test remark');
TransfersModule._transferItems = [{ item_id: 'ITEM-01', code: 'SP-001', name: 'Brake Pad', requested: 5, uom: 'NOS' }];

TransfersModule.submitNewTransfer({ preventDefault: () => {} });

const errorToast = toasts.find(t => t.type === 'error' && t.msg.includes('same store in the same facility'));
if (!errorToast) {
  console.error('FAIL: submitNewTransfer did not show error toast for same store transfer:', toasts);
  process.exit(1);
}
console.log('✓ Test 5 Passed: submitNewTransfer strictly blocks same store/facility transfer with toast error:', errorToast.msg);

console.log('--- ALL TESTS PASSED SUCCESSFULLY ---');
