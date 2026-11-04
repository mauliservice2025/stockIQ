const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

console.log('================================================================');
console.log('VERIFYING BILLING SCREEN ADD BUTTON MASTER ITEM LIST REFLECTION');
console.log('================================================================\n');

const billingJs = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');

// Mock master items matching the user's screenshot
const mockMasterItems = [
  { id: 'ITM-001', code: '2W-SPR-ENGINE-VALVE-SET-007', name: 'Engine Valve Set', type: 'PART', rate: 150, stock: 3 },
  { id: 'ITM-002', code: '2W-SPR-ENGINE-GASKET-KIT-006', name: 'Engine Gasket Kit', type: 'PART', rate: 150, stock: 7 },
  { id: 'ITM-003', code: '2W-SPR-PISTON-RING-SET-005', name: 'Piston Ring Set', type: 'PART', rate: 150, stock: 0 },
  { id: 'ITM-004', code: '2W-SPR-CYLINDER-PISTON-KI-004', name: 'Cylinder Piston Kit', type: 'PART', rate: 150, stock: 0 },
  { id: 'ITM-005', code: '2W-SPR-SPARK-PLUG-003', name: 'Spark Plug', type: 'PART', rate: 150, stock: 0 },
  { id: 'ITM-006', code: '2W-SPR-AIR-FILTER-ELEMENT-002', name: 'Air Filter Element', type: 'PART', rate: 150, stock: 0 },
  { id: 'ITM-007', code: '2W-SPR-ENGINE-OIL-FILTER-001', name: 'Engine Oil Filter', type: 'PART', rate: 150, stock: 0 },
  { id: 'ITM-008', code: '2W-BRK-SHO-01', name: 'Rear Brake Shoe', type: 'PART', rate: 150, stock: 0 },
  { id: 'ITM-009', code: '2W-BRK-PAD-01', name: 'Front Disc Brake Pad', type: 'PART', rate: 150, stock: 4 },
  { id: 'ITM-010', code: 'ITM-2W-0001', name: 'Front Disc Brake Pad', type: 'PART', rate: 0, stock: 0 },
  { id: 'LBR-001', code: 'LBR-001', name: 'General Service Labour', type: 'LABOUR', rate: 500, stock: 0 },
  { id: 'CON-001', code: 'CON-001', name: 'Chain Lube Spray (150ml)', type: 'CONSUMABLE', rate: 180, stock: 10 }
];

let openedModal = null;
global.window = {
  DB: {
    getAll: (table) => {
      if (table === 'items') return mockMasterItems;
      if (table === 'jobCards') return [{ id: 'JC-01', vehicle_model: 'Activa 6G', vehicle_model_id: 'MOD-01' }];
      if (table === 'itemVehicleCompatibility') return [{ item_id: '2W-BRK-PAD-01', model_name: 'Activa 6G' }];
      return [];
    },
    saveData: () => {},
    emitChange: () => {},
    getById: () => null,
    upsert: () => {}
  },
  State: {
    showModal: (config) => { openedModal = config; },
    closeModal: () => {},
    showToast: (msg, type) => console.log(`[Toast ${type}]: ${msg}`)
  }
};

const domNodes = {
  'add-item-type': { value: 'PART' },
  'bill-modal-tab-part': { className: 'btn btn-sm btn-primary' },
  'bill-modal-tab-labour': { className: 'btn btn-sm btn-ghost' },
  'bill-modal-tab-consumable': { className: 'btn btn-sm btn-ghost' },
  'add-item-code': { value: 'PRT-001' },
  'add-item-name': { value: '' },
  'add-item-qty': { value: '1' },
  'add-item-rate': { value: '0' },
  'add-item-amount-display': { innerText: '₹0.00' },
  'bill-selected-stock': { textContent: '', style: {} },
  'bill-add-item-preset': { innerHTML: '', value: '' }
};

global.document = {
  getElementById: (id) => domNodes[id] || null
};

// Evaluate the Billing Module methods
const extractMethods = `
  getItemCode(it, idx) {
    if (it && it.code) return it.code;
    return 'PRT-001';
  },
  getActiveCustomerBillingBill() {
    if (!this._activeBill) {
      this._activeBill = {
        id: 'BILL-101',
        job_card_id: 'JC-01',
        vehicle_model: 'Activa 6G',
        items: [],
        subtotal: 0,
        net_payable: 0
      };
    }
    return this._activeBill;
  },
  fetchAllMasterItems() {
    return mockMasterItems;
  },
  ${billingJs.slice(billingJs.indexOf('showAddSingleScreenItemModal() {'), billingJs.indexOf('updateSingleScreenDiscount(val) {'))}
`;

const ctx = vm.createContext({
  window: global.window,
  document: global.document,
  console: console,
  Number: Number,
  Math: Math,
  String: String,
  parseInt: parseInt,
  parseFloat: parseFloat,
  isNaN: isNaN,
  Array: Array,
  Date: Date,
  mockMasterItems: mockMasterItems,
  domNodes: domNodes
});

const script = new vm.Script(`
  const BillingModule = {
    recalculateBillTotals(bill) {
      bill.subtotal = bill.items.reduce((s, it) => s + (it.qty * it.rate), 0);
      bill.net_payable = bill.subtotal;
    },
    refresh() {},
    ${extractMethods}
  };

  // TEST 1: Open Billing modal
  BillingModule.showAddSingleScreenItemModal();
`);

script.runInContext(ctx);

assert(openedModal, 'Billing Add Item modal must open');
const html = openedModal.contentHtml;

// 1. Verify that "Popular Spare Parts" is gone and Master items are shown
assert(!html.includes('Popular Spare Parts'), 'Hardcoded Popular Spare Parts must not exist');
assert(html.includes('All Workshop Parts'), 'All Workshop Parts optgroup must be present');
assert(html.includes('⭐ Compatible Parts for Activa 6G'), 'Compatible parts optgroup must be present for vehicle');

// 2. Verify items from screenshot are present with code, stock and rate
assert(html.includes('2W-SPR-ENGINE-VALVE-SET-007 - [Stock: 3] Engine Valve Set (₹150)'), 'Valve Set item must be present with Stock 3');
assert(html.includes('2W-SPR-ENGINE-GASKET-KIT-006 - [Stock: 7] Engine Gasket Kit (₹150)'), 'Gasket Kit item must be present with Stock 7');
assert(html.includes('2W-BRK-PAD-01 - [Stock: 4] Front Disc Brake Pad (₹150)'), 'Brake Pad item must be present');
console.log('✓ TEST 1 PASS: Billing screen Add button reflects identical Master item list with [Stock] & Rates!');

// 3. Test tab switching to Labour Service
const testScript2 = new vm.Script(`
  BillingModule.setAddBillItemType('LABOUR');
`);
testScript2.runInContext(ctx);
assert(domNodes['bill-add-item-preset'].innerHTML.includes('Standard Labour Services'), 'Labour optgroup rendered');
assert(domNodes['bill-add-item-preset'].innerHTML.includes('LBR-001 - General Service Labour (₹500)'), 'Labour item rendered');
console.log('✓ TEST 2 PASS: Switching to Labour tab displays Standard Labour Services in dropdown');

// 4. Test tab switching to Consumable
const testScript3 = new vm.Script(`
  BillingModule.setAddBillItemType('CONSUMABLE');
`);
testScript3.runInContext(ctx);
assert(domNodes['bill-add-item-preset'].innerHTML.includes('Consumables & Lubricants'), 'Consumables optgroup rendered');
assert(domNodes['bill-add-item-preset'].innerHTML.includes('CON-001 - [Stock: 10] Chain Lube Spray (150ml) (₹180)'), 'Consumable item rendered');
console.log('✓ TEST 3 PASS: Switching to Consumable tab displays Consumables & Lubricants in dropdown');

// 5. Test selecting a preset item
const testScript4 = new vm.Script(`
  BillingModule.onBillItemPresetChange('2W-SPR-ENGINE-VALVE-SET-007|Engine Valve Set|PART|150');
`);
testScript4.runInContext(ctx);
assert.strictEqual(domNodes['add-item-code'].value, '2W-SPR-ENGINE-VALVE-SET-007', 'Item code set');
assert.strictEqual(domNodes['add-item-name'].value, 'Engine Valve Set', 'Item name set');
assert.strictEqual(domNodes['add-item-rate'].value, '150', 'Item rate set');
assert.strictEqual(domNodes['add-item-amount-display'].innerText, '₹150.00', 'Amount display calculated');
assert.strictEqual(domNodes['bill-selected-stock'].textContent, '[Stock: 3]', 'Stock indicator updated');
console.log('✓ TEST 4 PASS: Selecting preset accurately fills Item Code, Description, Rate, Stock tag & Total!');

console.log('\n================================================================');
console.log('🎉 ALL BILLING MASTER ITEM LIST TESTS PASSED (100%)!');
console.log('================================================================\n');
