const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('Testing GRN Item Search, Compact Layout, and Current Stock Display...');

const goodsReceiptJs = fs.readFileSync(path.join(__dirname, '../js/modules/goods-receipt.js'), 'utf-8');

// Mock DOM & environment
let toastMsg = null;
let toastType = null;

global.window = {
  State: {
    currentPlantId: 'ALL',
    currentUser: { id: 'USR-01', name: 'Tester', role: 'Store Manager' },
    showToast: (msg, type) => {
      toastMsg = msg;
      toastType = type;
    },
    showModal: () => {},
    closeModal: () => {}
  },
  DB: {
    getAll: (table) => {
      if (table === 'purchaseOrders') {
        return [
          {
            id: 'PO-001',
            plant_id: 'PL-01',
            po_number: 'PO-2026-001',
            supplier_id: 'SUP-01',
            status: 'APPROVED',
            items: [
              {
                item_id: 'ITEM-01',
                item_code: 'BRK-PAD-01',
                item_name: 'Ceramic Brake Pads',
                ordered_quantity: 100,
                received_quantity: 20,
                pending_quantity: 80,
                uom: 'SET',
                unit_price: 450
              }
            ]
          }
        ];
      }
      if (table === 'items') {
        return [
          { id: 'ITEM-01', code: 'BRK-PAD-01', name: 'Ceramic Brake Pads', base_uom: 'SET', purchase_price: 450, status: 'Active', category_name: 'Spares' },
          { id: 'ITEM-02', code: 'ENG-OIL-01', name: 'Engine Oil 15W40', base_uom: 'LTR', purchase_price: 320, status: 'Active', category_name: 'Consumables' },
          { id: 'ITEM-03', code: 'FLT-AIR-01', name: 'Air Filter Element', base_uom: 'NOS', purchase_price: 180, status: 'Active', category_name: 'Filters' },
          { id: 'ITEM-04', code: 'DISC-ROT-01', name: 'Front Brake Rotor Disc', base_uom: 'NOS', purchase_price: 1200, status: 'Inactive', category_name: 'Spares' }
        ];
      }
      if (table === 'warehouses') {
        return [
          { id: 'WH-01', name: 'Mauli Store 1', warehouse_type: 'MAIN_STORE', status: 'Active' },
          { id: 'WH-02', name: 'Pune Sub Store', warehouse_type: 'SUB_STORE', status: 'Active' }
        ];
      }
      if (table === 'inventoryBalances') {
        return [
          { id: 'BAL-1', warehouse_id: 'WH-01', item_id: 'ITEM-01', item_code: 'BRK-PAD-01', available: 50, on_hand: 50 },
          { id: 'BAL-2', warehouse_id: 'WH-01', item_id: 'ITEM-02', item_code: 'ENG-OIL-01', available: 120, on_hand: 120 },
          { id: 'BAL-3', warehouse_id: 'WH-02', item_id: 'ITEM-01', item_code: 'BRK-PAD-01', available: 15, on_hand: 15 }
        ];
      }
      if (table === 'suppliers') {
        return [
          { id: 'SUP-01', name: 'Endurance Technologies Ltd.', code: 'ENDUR', status: 'Active' }
        ];
      }
      return [];
    },
    getById: (table, id) => {
      const all = window.DB.getAll(table);
      return all.find(r => r.id === id) || null;
    },
    getActiveWarehouses: () => window.DB.getAll('warehouses'),
    isPlantActive: () => true
  }
};

const domElements = {
  'grn-po-wh-select': { value: 'WH-01' },
  'grn-dir-wh-select': { value: 'WH-01' },
  'grn-item-search-input': { value: '' },
  'grn-item-search-clear': { style: { display: 'none' } },
  'grn-item-search-results': { innerHTML: '', style: { display: 'none' } },
  'grn-po-items-tbody': { innerHTML: '' },
  'direct-grn-items-tbody': { innerHTML: '' }
};

global.document = {
  getElementById: (id) => domElements[id] || null,
  querySelector: (sel) => null,
  querySelectorAll: (sel) => [],
  addEventListener: () => {}
};

eval(goodsReceiptJs);

// 1. Verify Grid Columns and Search Input presence in HTML
console.log('\n--- 1. Testing Row 2 Compact Layout & Search Input ---');
const withPOHtml = window.GoodsReceiptModule.renderWithPOSection();
assert(withPOHtml.includes('grid-template-columns: 1fr 1fr 1fr 1fr 1.6fr;'), 'Header grid must have 5 columns with Search on the right');
assert(withPOHtml.includes('id="grn-item-search-input"'), 'Search input must exist in With PO modal');
assert(withPOHtml.includes('id="grn-item-search-results"'), 'Search results container must exist in With PO modal');
assert(withPOHtml.includes('Search & Add Item'), 'Label must be Search & Add Item');

const directHtml = window.GoodsReceiptModule.renderDirectGRNSection();
assert(directHtml.includes('grid-template-columns: 1fr 1fr 1fr 1fr 1.6fr;'), 'Header grid must have 5 columns in Direct GRN modal');
assert(directHtml.includes('id="grn-item-search-input"'), 'Search input must exist in Direct GRN modal');
console.log('✔ Row 2 layout compacted to left and Search & Add Item placed on right in both modes.');

// 2. Test getItemStock calculations
console.log('\n--- 2. Testing Current Stock Calculation ---');
const stockWh1Item1 = window.GoodsReceiptModule.getItemStock('ITEM-01', 'WH-01');
assert.strictEqual(stockWh1Item1, 50, 'Stock of ITEM-01 in WH-01 must be 50');

const stockWh2Item1 = window.GoodsReceiptModule.getItemStock('ITEM-01', 'WH-02');
assert.strictEqual(stockWh2Item1, 15, 'Stock of ITEM-01 in WH-02 must be 15');

const stockWh1Item2 = window.GoodsReceiptModule.getItemStock('ITEM-02', 'WH-01');
assert.strictEqual(stockWh1Item2, 120, 'Stock of ITEM-02 in WH-01 must be 120');

const stockWh1Item3 = window.GoodsReceiptModule.getItemStock('ITEM-03', 'WH-01');
assert.strictEqual(stockWh1Item3, 0, 'Stock of ITEM-03 in WH-01 must be 0 (no balance record)');
console.log('✔ getItemStock accurately pulls live stock per item and store.');

// 3. Test onItemSearchInput renders Item Code, Description & Current Stock
console.log('\n--- 3. Testing Search Results Display ---');
window.GoodsReceiptModule.currentInwardTab = 'WITH_PO';
window.GoodsReceiptModule.onItemSearchInput('oil');

assert(withPOHtml.includes('placeholder="-- Select Item --"'), 'Must have -- Select Item -- placeholder');
assert(withPOHtml.includes('id="grn-item-search-arrow"'), 'Must have dropdown chevron arrow');

const searchResultsHtml = domElements['grn-item-search-results'].innerHTML;
assert(domElements['grn-item-search-results'].style.display === 'block', 'Search results must be visible');
assert(searchResultsHtml.includes('-- Select Item --'), 'Must show -- Select Item -- option at top');
assert(searchResultsHtml.includes('ENG-OIL-01'), 'Must display item code: ENG-OIL-01');
assert(searchResultsHtml.includes('Engine Oil 15W40'), 'Must display item name: Engine Oil 15W40');
assert(searchResultsHtml.includes('Stock: 120 LTR'), 'Must display Stock: 120 LTR stock for WH-01');
console.log('✔ Search results properly display -- Select Item --, Item Code, Name, and Stock.');

// 4. Test onSelectItemFromSearch in With PO mode
console.log('\n--- 4. Testing Item Selection in With PO Mode ---');
window.GoodsReceiptModule.activePOId = 'PO-001';
window.GoodsReceiptModule.poGRNExtraItems = [];
window.GoodsReceiptModule.onSelectItemFromSearch('ITEM-02');

assert.strictEqual(window.GoodsReceiptModule.poGRNExtraItems.length, 1, 'Extra items should have 1 item');
assert.strictEqual(window.GoodsReceiptModule.poGRNExtraItems[0].item_code, 'ENG-OIL-01');
assert(domElements['grn-po-items-tbody'].innerHTML.includes('ENG-OIL-01'), 'Tbody must now contain the added item');
assert(domElements['grn-po-items-tbody'].innerHTML.includes('+ Added Item'), 'Must have badge marking added item');

// 5. Test removePOExtraItem
console.log('\n--- 5. Testing Extra Item Removal ---');
const extraId = window.GoodsReceiptModule.poGRNExtraItems[0].id;
window.GoodsReceiptModule.removePOExtraItem(extraId);
assert.strictEqual(window.GoodsReceiptModule.poGRNExtraItems.length, 0, 'Extra items should be empty after removal');
console.log('✔ Added item removal works cleanly.');

// 6. Test onSelectItemFromSearch in Direct GRN Mode
console.log('\n--- 6. Testing Item Selection in Direct GRN Mode ---');
window.GoodsReceiptModule.currentInwardTab = 'DIRECT';
window.GoodsReceiptModule.directGRNItems = [];
window.GoodsReceiptModule.onSelectItemFromSearch('ITEM-03');

assert.strictEqual(window.GoodsReceiptModule.directGRNItems.length, 1, 'Direct GRN items should have 1 item');
assert.strictEqual(window.GoodsReceiptModule.directGRNItems[0].item_code, 'FLT-AIR-01');
assert(domElements['direct-grn-items-tbody'].innerHTML.includes('FLT-AIR-01'), 'Direct tbody must display FLT-AIR-01');
console.log('✔ Direct GRN item addition via search functions properly.');

console.log('\n=============================================');
console.log('ALL ITEM SEARCH TESTS PASSED 100%!');
console.log('=============================================');
