const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('Testing item code and item name typing search...');

const goodsReceiptJs = fs.readFileSync(path.join(__dirname, '../js/modules/goods-receipt.js'), 'utf-8');

const domElements = {
  'grn-dir-wh-select': { value: 'WH-01' },
  'grn-po-wh-select': { value: 'WH-01' },
  'grn-item-search-input': { value: '' },
  'grn-item-search-clear': { style: { display: 'none' } },
  'grn-item-search-results': { innerHTML: '', style: { display: 'none' } },
  'direct-item-row-results-101': { innerHTML: '', style: { display: 'none' } },
  'direct-grn-items-tbody': { innerHTML: '' }
};

global.window = {
  State: {
    currentPlantId: 'ALL',
    currentUser: { id: 'USR-01', name: 'Tester', role: 'Store Manager' },
    showToast: () => {},
    showModal: () => {},
    closeModal: () => {}
  },
  DB: {
    getAll: (table) => {
      if (table === 'items') {
        return [
          { id: 'ITM-01', code: '2W-SPR-ENGINE-VALVE-SET-007', name: 'Engine Valve Set', status: 'Active', base_uom: 'SET', purchase_price: 650 },
          { id: 'ITM-02', code: '2W-SPR-PISTON-RING-SET-005', name: 'Piston Ring Set', status: 'Active', base_uom: 'SET', purchase_price: 420 },
          { id: 'ITM-03', code: '2W-BRK-PAD-01', name: 'Front Disc Brake Pad', status: 'Active', base_uom: 'NOS', purchase_price: 350 },
          { id: 'ITM-04', code: 'LUB-ENG-OIL-15W40', name: 'Premium 4T Plus Engine Oil', status: 'Active', base_uom: 'LTR', purchase_price: 280 }
        ];
      }
      if (table === 'inventoryBalances') {
        return [
          { warehouse_id: 'WH-01', item_id: 'ITM-01', available: 45, on_hand: 45 },
          { warehouse_id: 'WH-01', item_id: 'ITM-02', available: 18, on_hand: 18 },
          { warehouse_id: 'WH-01', item_id: 'ITM-03', available: 90, on_hand: 90 }
        ];
      }
      return [];
    },
    getById: (table, id) => {
      const all = window.DB.getAll(table);
      return all.find(r => r.id === id) || null;
    }
  }
};

global.document = {
  getElementById: (id) => domElements[id] || null,
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {}
};

eval(goodsReceiptJs);

window.GoodsReceiptModule.directGRNItems = [
  { id: 101, item_id: '', item_code: '', item_name: '', received_qty: 1, unit_cost: 0 }
];

// 1. Search in table row by item code "VALVE"
console.log('\n--- 1. Search in table row by item code (VALVE) ---');
window.GoodsReceiptModule.onDirectItemRowSearchInput(101, 'VALVE');
const rowHtml1 = domElements['direct-item-row-results-101'].innerHTML;
assert(domElements['direct-item-row-results-101'].style.display === 'block', 'Row search results must be displayed');
assert(rowHtml1.includes('2W-SPR-ENGINE-VALVE-SET-007'), 'Must match item code containing VALVE');
assert(rowHtml1.includes('Engine Valve Set'), 'Must display item name Engine Valve Set');
assert(rowHtml1.includes('Stock: 45 SET'), 'Must display stock of 45 SET');
console.log('✔ Successfully searched by item code in table row.');

// 2. Search in table row by item name "Piston"
console.log('\n--- 2. Search in table row by item name (Piston) ---');
window.GoodsReceiptModule.onDirectItemRowSearchInput(101, 'Piston');
const rowHtml2 = domElements['direct-item-row-results-101'].innerHTML;
assert(rowHtml2.includes('2W-SPR-PISTON-RING-SET-005'), 'Must match item code for Piston');
assert(rowHtml2.includes('Piston Ring Set'), 'Must match item name containing Piston');
assert(rowHtml2.includes('Stock: 18 SET'), 'Must display stock of 18 SET');
console.log('✔ Successfully searched by item name in table row.');

// 3. Select item from table row
console.log('\n--- 3. Select item from table row ---');
window.GoodsReceiptModule.selectDirectItemFromRow(101, 'ITM-02');
assert.strictEqual(window.GoodsReceiptModule.directGRNItems[0].item_id, 'ITM-02');
assert.strictEqual(window.GoodsReceiptModule.directGRNItems[0].item_code, '2W-SPR-PISTON-RING-SET-005');
assert.strictEqual(window.GoodsReceiptModule.directGRNItems[0].item_name, 'Piston Ring Set');
assert.strictEqual(domElements['direct-item-row-results-101'].style.display, 'none', 'Dropdown must close on selection');
console.log('✔ Successfully selected item in table row and populated data.');

// 4. Search in header Search & Add Item by item code "BRK-PAD"
console.log('\n--- 4. Search in header Search & Add Item by item code (BRK-PAD) ---');
window.GoodsReceiptModule.currentInwardTab = 'DIRECT';
window.GoodsReceiptModule.onItemSearchInput('BRK-PAD');
const headerHtml1 = domElements['grn-item-search-results'].innerHTML;
assert(domElements['grn-item-search-results'].style.display === 'block');
assert(headerHtml1.includes('2W-BRK-PAD-01'), 'Must match code 2W-BRK-PAD-01');
assert(headerHtml1.includes('Front Disc Brake Pad'), 'Must display Front Disc Brake Pad');
assert(headerHtml1.includes('Stock: 90 NOS'), 'Must display stock 90 NOS');
console.log('✔ Header search successfully finds item through item code.');

// 5. Search in header Search & Add Item by item name "Engine Oil"
console.log('\n--- 5. Search in header Search & Add Item by item name (Engine Oil) ---');
window.GoodsReceiptModule.onItemSearchInput('Engine Oil');
const headerHtml2 = domElements['grn-item-search-results'].innerHTML;
assert(headerHtml2.includes('LUB-ENG-OIL-15W40'), 'Must match code for Engine Oil');
assert(headerHtml2.includes('Premium 4T Plus Engine Oil'), 'Must match name containing Engine Oil');
console.log('✔ Header search successfully finds item through item name.');

console.log('\n=============================================');
console.log('ALL TYPE & SEARCH TESTS PASSED 100%!');
console.log('=============================================');
