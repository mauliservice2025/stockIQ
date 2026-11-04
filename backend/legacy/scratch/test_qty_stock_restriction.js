const fs = require('fs');
const path = require('path');

// Setup mock browser globals
global.window = global;
global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; },
  clear() { this._data = {}; }
};

let toasts = [];
global.State = {
  showToast(msg, type) {
    toasts.push({ msg, type });
    console.log(`[TOAST (${type})]: ${msg}`);
  },
  showModal(opts) {
    this._currentModal = opts;
  },
  closeModal() {
    this._currentModal = null;
  }
};

// Load db.js
const { DatabaseLayer } = require('../js/data/db.js');
window.DB = new DatabaseLayer();

// Load billing.js
const billingCode = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');
eval(billingCode);

// Load store-inventory.js
const storeCode = fs.readFileSync(path.join(__dirname, '../js/modules/store-inventory.js'), 'utf8');
eval(storeCode);

async function runTests() {
  console.log('=== TEST SUITE: QUANTITY STOCK RESTRICTION ===\n');

  // Seed sample item with 5 stock in Pune warehouse
  const testItem = {
    id: 'ITEM-TEST-001',
    code: 'PART-TEST-01',
    name: 'Brake Disc Rotor',
    type: 'PART',
    sale_price: 500,
    current_stock: 5,
    stock: 5,
    stock_uom: 'NOS'
  };

  const zeroStockItem = {
    id: 'ITEM-TEST-ZERO',
    code: 'PART-ZERO-01',
    name: 'Engine Valve Guide',
    type: 'PART',
    sale_price: 300,
    current_stock: 0,
    stock: 0,
    stock_uom: 'NOS'
  };

  window.DB.upsert('items', testItem);
  window.DB.upsert('items', zeroStockItem);

  const bal1 = {
    id: 'BAL-1',
    item_id: testItem.id,
    warehouse_id: 'STORE-PUN-01',
    available: 5,
    on_hand: 5
  };
  const bal2 = {
    id: 'BAL-2',
    item_id: zeroStockItem.id,
    warehouse_id: 'STORE-PUN-01',
    available: 0,
    on_hand: 0
  };
  window.DB.upsert('inventoryBalances', bal1);
  window.DB.upsert('inventoryBalances', bal2);

  // 1. Check getAvailableItemStock
  console.log('--- TEST 1: Checking getAvailableItemStock ---');
  const stock1 = window.BillingModule.getAvailableItemStock('PART-TEST-01', 'STORE-PUN-01');
  if (stock1 !== 5) throw new Error(`Expected 5 available stock, got ${stock1}`);
  console.log('✓ PASS: Available stock correctly returned as 5 for PART-TEST-01');

  const stockZero = window.BillingModule.getAvailableItemStock('PART-ZERO-01', 'STORE-PUN-01');
  if (stockZero !== 0) throw new Error(`Expected 0 available stock, got ${stockZero}`);
  console.log('✓ PASS: Available stock correctly returned as 0 for PART-ZERO-01');

  // 2. Test Estimate Item Quantity Increase with stock restriction
  console.log('\n--- TEST 2: updateEstimateItemQty Stock Restriction ---');
  const testEstimate = {
    id: 'EST-TEST-001',
    estimate_no: 'EST-2026-0001',
    store_id: 'STORE-PUN-01',
    plant_id: 'PLANT-PUN-01',
    status: 'DRAFT',
    items: [
      {
        id: 'EST-ITM-1',
        item_id: testItem.id,
        code: testItem.code,
        name: testItem.name,
        type: 'PART',
        qty: 2,
        rate: 500,
        amount: 1000
      }
    ]
  };
  window.DB.upsert('billingEstimates', testEstimate);
  window.BillingModule.activeEstimateId = testEstimate.id;

  // Try to increase qty to 10 (exceeding available 5)
  toasts = [];
  window.BillingModule.updateEstimateItemQty('EST-ITM-1', 10);
  const updatedEst = window.BillingModule.getActiveEstimate();
  const updatedItem = updatedEst.items.find(i => i.id === 'EST-ITM-1');

  if (updatedItem.qty > 7) {
    throw new Error(`Quantity should be capped at oldQty(2) + stock(5) = 7, but was ${updatedItem.qty}`);
  }
  console.log(`✓ PASS: Quantity capped at ${updatedItem.qty} (restricted by available stock)`);
  if (!toasts.some(t => t.msg.includes('restricted'))) {
    throw new Error('Warning toast was not triggered for exceeding stock');
  }
  console.log('✓ PASS: Warning toast shown to user indicating quantity was restricted');

  // Try to increase further when available stock is now 0 (deducted 5)
  toasts = [];
  window.BillingModule.updateEstimateItemQty('EST-ITM-1', 15);
  const reUpdatedEst = window.BillingModule.getActiveEstimate();
  const reUpdatedItem = reUpdatedEst.items.find(i => i.id === 'EST-ITM-1');
  if (reUpdatedItem.qty !== 7) {
    throw new Error(`Quantity increased when stock was 0! Current qty: ${reUpdatedItem.qty}`);
  }
  if (!toasts.some(t => t.type === 'danger' && t.msg.includes('Available stock is 0'))) {
    throw new Error('Danger toast was not shown when attempting to increase with 0 stock');
  }
  console.log('✓ PASS: Attempt to increase with 0 stock blocked with danger toast');

  // 3. Test Zero Stock Item Addition in Estimate
  console.log('\n--- TEST 3: Block adding item when available stock is 0 ---');
  global.document = {
    getElementById(id) {
      if (id === 'est-add-item-name') return { value: zeroStockItem.name };
      if (id === 'est-add-item-type') return { value: 'PART' };
      if (id === 'est-add-item-code') return { value: zeroStockItem.code };
      if (id === 'est-add-item-qty') return { value: '2' };
      if (id === 'est-add-item-rate') return { value: '300' };
      return null;
    }
  };
  toasts = [];
  const countBefore = updatedEst.items.length;
  window.BillingModule.handleAddEstimateItemSubmit();
  if (updatedEst.items.length !== countBefore) {
    throw new Error('Zero stock item was added to estimate items!');
  }
  if (!toasts.some(t => t.type === 'danger' && t.msg.includes('Available stock is 0'))) {
    throw new Error('Danger toast not shown when adding item with 0 stock');
  }
  console.log('✓ PASS: Adding zero stock item blocked with danger toast');

  // 4. Test StoreInventoryModule.submitAddPartToJobCard stock check
  console.log('\n--- TEST 4: Job Card Part Addition stock check ---');
  const testJC = {
    id: 'JC-TEST-001',
    job_card_no: 'JC-2026-0001',
    store_id: 'STORE-PUN-01',
    parts_required: []
  };
  window.DB.upsert('jobCards', testJC);
  global.document.getElementById = (id) => {
    if (id === 'add-jc-part-id') return { value: zeroStockItem.id };
    if (id === 'add-jc-part-qty') return { value: '1' };
    return null;
  };
  toasts = [];
  window.StoreInventoryModule.submitAddPartToJobCard('JC-TEST-001');
  if (testJC.parts_required.length !== 0) {
    throw new Error('Part with 0 stock was added to Job Card!');
  }
  if (!toasts.some(t => t.type === 'danger' && t.msg.includes('Available stock is 0'))) {
    throw new Error('Stock check failed to block Job Card part addition');
  }
  console.log('✓ PASS: Job Card part addition blocked when available stock is 0');

  console.log('\n🎉 ALL QUANTITY & STOCK RESTRICTION TESTS PASSED (100%)!');
}

runTests().catch(err => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
