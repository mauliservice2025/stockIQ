/**
 * Comprehensive Automated Verification Suite for Store Master & Inventory Management Module
 * Validates BRD Version 1.0 specifications, workflows, data integrity, and UI constraints.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('RUNNING STORE & INVENTORY MANAGEMENT MODULE VERIFICATION SUITE');
console.log('================================================================');

// 1. Mock browser environment
const localStorageStore = {};
global.localStorage = {
  getItem: (key) => localStorageStore[key] || null,
  setItem: (key, val) => { localStorageStore[key] = String(val); },
  removeItem: (key) => { delete localStorageStore[key]; },
  clear: () => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); }
};

global.window = global;
global.document = {
  getElementById: (id) => ({
    id,
    style: {},
    classList: {
      toggle: () => {},
      add: () => {},
      remove: () => {},
      contains: () => false
    },
    addEventListener: () => {},
    querySelectorAll: () => []
  }),
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {}
};

// 2. Load Core Data & Storage Layers
const { INITIAL_DATA } = require('../js/data/mock-data.js');
global.INITIAL_DATA = INITIAL_DATA;

eval(fs.readFileSync('js/data/db.js', 'utf8'));
const db = window.DB;

eval(fs.readFileSync('js/modules/store-inventory.js', 'utf8'));

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
    failed++;
  }
}

// -------------------------------------------------------------
// TEST 1: STORE MASTER & STORE TYPES HIERARCHY
// -------------------------------------------------------------
test('Store Master contains Two-Wheeler stores with Main Store and Sub Store hierarchy', () => {
  const stores = db.getAll('warehouses');
  assert(stores.length >= 9, 'Should have at least 9 stores');

  const mainStore = stores.find(s => s.id === 'WH-PUN-MAIN');
  assert(mainStore, 'Main Store WH-PUN-MAIN must exist');
  assert.strictEqual(mainStore.parent_store_id, null, 'Main Store must not have a parent store (BR-003)');
  assert.strictEqual(mainStore.status, 'Active', 'Main Store must be Active');

  const subStores = stores.filter(s => s.parent_store_id === 'WH-PUN-MAIN');
  assert(subStores.length >= 6, 'Main Store must have multiple Sub Stores (Spare Parts, Lubricant, Battery, Tyre, etc.)');

  const sparePartsSub = stores.find(s => s.id === 'WH-PUN-SPARE');
  assert(sparePartsSub, 'Spare Parts Sub Store must exist');
  assert.strictEqual(sparePartsSub.parent_store_id, 'WH-PUN-MAIN', 'Sub store must link to parent store');

  const warrantyStore = stores.find(s => s.id === 'WH-PUN-WARR');
  assert(warrantyStore, 'Warranty Store must exist');

  const scrapStore = stores.find(s => s.id === 'WH-PUN-SCRAP');
  assert(scrapStore, 'Scrap Store must exist');

  const storeTypes = db.getAll('storeTypes');
  assert(storeTypes.length === 10, 'Must have 10 standard store types configured (BRD §6.2)');
});

// -------------------------------------------------------------
// TEST 2: STORE TRANSACTION CONFIGURATION RETRIEVAL & SAVING
// -------------------------------------------------------------
test('Store Transaction Configuration Matrix saving and retrieval', () => {
  const configs = db.getAll('storeTransactionConfigs');
  assert(configs.length >= 4, 'Must have transaction configs seeded');

  const mainConfig = configs.find(c => c.store_id === 'WH-PUN-MAIN');
  assert(mainConfig, 'Main Store config must exist');
  assert.strictEqual(mainConfig.purchase_order, true, 'Main Store should allow Purchase Orders');
  assert.strictEqual(mainConfig.grn_receipt, true, 'Main Store should allow GRN');

  const spareConfig = configs.find(c => c.store_id === 'WH-PUN-SPARE');
  assert(spareConfig, 'Spare Parts Sub Store config must exist');
  assert.strictEqual(spareConfig.job_card_issue, true, 'Sub Store should allow Job Card parts issue');
  assert.strictEqual(spareConfig.job_card_return, true, 'Sub Store should allow Job Card parts return');

  // Test dynamic saving of matrix
  db.saveStoreTransactionConfig('WH-PUN-SPARE', { counter_sale: true, walk_in_sale: true });
  const updatedSpare = db.getAll('storeTransactionConfigs').find(c => c.store_id === 'WH-PUN-SPARE');
  assert.strictEqual(updatedSpare.counter_sale, true, 'Saved config must persist');
});

// -------------------------------------------------------------
// TEST 3: CATEGORY & ITEM TO STORE MAPPING (BRD §6.5 & §6.7)
// -------------------------------------------------------------
test('Item Categories, Subcategories & individual Items mapped to stores', () => {
  const categories = db.getAll('itemCategories');
  assert(categories.length >= 15, 'Must have at least 15 Two-Wheeler item categories (BRD §6.6)');

  const spareStoreCategories = db.getStoreMappedCategories('WH-PUN-SPARE');
  assert(spareStoreCategories.length >= 6, 'Spare store must map to Engine, Brake, Electrical, etc.');
  assert(spareStoreCategories.includes('CAT-ENG'), 'Spare store must include Engine Parts');

  const tyreStoreCategories = db.getStoreMappedCategories('WH-PUN-TYRE');
  assert(tyreStoreCategories.includes('CAT-TYRE'), 'Tyre store must map to Tyres & Tubes');

  // Item mapping
  const mappedItems = db.getAll('storeItemMappings');
  assert(mappedItems.length >= 6, 'Must have individual item-to-store mappings');
  const brakePadMapping = mappedItems.find(m => m.item_id === 'ITEM-BP-001' && m.store_id === 'WH-PUN-SPARE');
  assert(brakePadMapping, 'Front Brake Pad must be mapped to Spare Parts Sub Store');
  assert.strictEqual(brakePadMapping.status, 'ACTIVE');
});

// -------------------------------------------------------------
// TEST 4: VEHICLE MODEL COMPATIBILITY MATRIX (BRD §6.9)
// -------------------------------------------------------------
test('Vehicle model compatibility mapping (Manufacturer, Model, Variant, Year Range)', () => {
  const models = db.getAll('vehicleModels');
  assert(models.length >= 8, 'Must have seeded 2-Wheeler models (Activa, Pulsar, Splendor, etc.)');

  const compatList = db.getAll('vehicleItemCompatibilities');
  assert(compatList.length >= 12, 'Must have compatibility records');

  // Query parts compatible with Honda Activa 6G
  const activaCompat = db.getCompatibleItemsForVehicle('VM-HON-ACT6G');
  assert(activaCompat.length >= 2, 'Activa 6G must have compatible parts');
  assert(activaCompat.some(c => c.item_id === 'ITEM-BP-001'), 'Brake Pad must be compatible with Activa 6G');

  // Query vehicles compatible with NGK Spark Plug (ITEM-SP-001)
  const plugVehicles = db.getCompatibleVehiclesForItem('ITEM-SP-001');
  assert(plugVehicles.length >= 3, 'Universal spark plug must map to multiple models (Activa, Splendor, Jupiter)');
});

// -------------------------------------------------------------
// TEST 5: WORKSHOP JOB CARD INTEGRATION (BRD §6.14 & §6.15)
// -------------------------------------------------------------
test('Job Card parts reservation, issue to technician, and return of unused parts', () => {
  const jcId = 'JC-2026-001';
  const jc = db.getById('jobCards', jcId);
  assert(jc, 'Job Card JC-2026-001 must exist');

  const initialBalance = db.getStoreBalance('WH-PUN-SPARE', 'ITEM-BP-001');
  const initialReserved = initialBalance.reserved || 0;
  const initialOnHand = initialBalance.on_hand;

  // 1. Reserve 2 Brake Pads for Job Card
  db.reservePartsForJobCard(jcId, 'WH-PUN-SPARE', 'ITEM-BP-001', 2);
  const afterReserve = db.getStoreBalance('WH-PUN-SPARE', 'ITEM-BP-001');
  assert.strictEqual(afterReserve.reserved, initialReserved + 2, 'Reserved quantity must increase by 2');
  assert.strictEqual(afterReserve.available, afterReserve.on_hand - afterReserve.reserved, 'Available = On Hand - Reserved (BR-017)');

  // 2. Issue 2 Brake Pads to Technician referenced to Job Card
  const issueResult = db.issuePartsToJobCard({
    job_card_id: jcId,
    job_card_no: jc.job_card_no,
    store_id: 'WH-PUN-SPARE',
    item_id: 'ITEM-BP-001',
    qty: 2,
    technician_id: 'EMP-001',
    technician_name: 'Rajesh Sharma'
  });
  assert(issueResult.success, 'Parts issue to job card must succeed');

  const afterIssue = db.getStoreBalance('WH-PUN-SPARE', 'ITEM-BP-001');
  assert.strictEqual(afterIssue.on_hand, initialOnHand - 2, 'On Hand stock must decrease upon issue');
  assert.strictEqual(afterIssue.reserved, initialReserved, 'Reserved stock must clear upon issue');

  // 3. Technician returns 1 unused Brake Pad
  const returnResult = db.returnPartsFromJobCard({
    job_card_id: jcId,
    job_card_no: jc.job_card_no,
    store_id: 'WH-PUN-SPARE',
    item_id: 'ITEM-BP-001',
    qty: 1,
    technician_id: 'EMP-001',
    technician_name: 'Rajesh Sharma',
    return_reason: 'Parts not required / Job Card scope reduced'
  });
  assert(returnResult.success, 'Parts return must succeed');

  const afterReturn = db.getStoreBalance('WH-PUN-SPARE', 'ITEM-BP-001');
  assert.strictEqual(afterReturn.on_hand, initialOnHand - 1, 'On hand stock must automatically increase by 1 upon return (BRD §6.15)');
});

// -------------------------------------------------------------
// TEST 6: MULTI-TIER STOCK TRANSFERS (BRD §6.18)
// -------------------------------------------------------------
test('Stock Transfer workflow: Draft -> Dispatched (In-Transit) -> Received', () => {
  const fromStoreId = 'WH-PUN-MAIN';
  const toStoreId = 'WH-PUN-SPARE';
  const itemId = 'ITEM-CP-001';

  const sourceBefore = db.getStoreBalance(fromStoreId, itemId);
  const destBefore = db.getStoreBalance(toStoreId, itemId);

  // 1. Create and Dispatch transfer of 5 Clutch Plates
  const xfer = db.createStockTransfer({
    transfer_type: 'MAIN_TO_SUB',
    from_store_id: fromStoreId,
    to_store_id: toStoreId,
    items: [{ item_id: itemId, item_code: 'CP-BAJ-001', item_name: 'Clutch Plate Kit', qty: 5, uom: 'SET', rate: 450 }]
  });
  assert(xfer && xfer.id, 'Transfer order created');

  db.dispatchStockTransfer(xfer.id, 'MH-12-AB-1234');
  const xferDispatched = db.getById('stockTransfers', xfer.id);
  assert.strictEqual(xferDispatched.status, 'IN_TRANSIT', 'Status must be IN_TRANSIT');

  const sourceAfterDispatch = db.getStoreBalance(fromStoreId, itemId);
  assert.strictEqual(sourceAfterDispatch.on_hand, sourceBefore.on_hand - 5, 'Source store stock deducted on dispatch');

  // 2. Receive transfer at Sub Store
  db.receiveStockTransfer(xfer.id, [{ item_id: itemId, received_qty: 5, accepted_qty: 5, rejected_qty: 0, bin_id: 'BIN-SPARE-001' }]);
  const xferReceived = db.getById('stockTransfers', xfer.id);
  assert.strictEqual(xferReceived.status, 'RECEIVED', 'Status must be RECEIVED');

  const destAfterReceive = db.getStoreBalance(toStoreId, itemId);
  assert.strictEqual(destAfterReceive.on_hand, destBefore.on_hand + 5, 'Destination store stock increased upon receipt');
});

// -------------------------------------------------------------
// TEST 7: PHYSICAL STOCK COUNT & VARIANCE RECONCILIATION
// -------------------------------------------------------------
test('Physical Stock Count: Freeze snapshot, enter counted qty, compute variance & post adjustment', () => {
  const storeId = 'WH-PUN-SPARE';
  const countCycle = db.createPhysicalStockCount({
    store_id: storeId,
    item_category: 'Brake Parts',
    assigned_auditor: 'Auditor Sunil Deshmukh'
  });
  assert(countCycle && countCycle.id, 'Stock count cycle created');
  assert(countCycle.items.length > 0, 'Items frozen into cycle');

  const testItem = countCycle.items[0];
  const systemQty = testItem.system_qty;
  const countedQty = systemQty - 1; // 1 missing unit variance

  // Post count verification
  const updatedCycle = db.submitPhysicalCount(countCycle.id, [{
    item_id: testItem.item_id,
    counted_qty: countedQty,
    remarks: 'One unit damaged/lost in service bay'
  }]);

  const verifiedItem = updatedCycle.items.find(i => i.item_id === testItem.item_id);
  assert.strictEqual(verifiedItem.variance_qty, -1, 'Variance must be -1');
  assert.strictEqual(updatedCycle.status, 'RECONCILED', 'Cycle reconciled');
});

// -------------------------------------------------------------
// TEST 8: WARRANTY & SCRAP MANAGEMENT
// -------------------------------------------------------------
test('Warranty defective replacement tracking and Scrap disposal authorization', () => {
  const claims = db.getAll('warrantyClaims');
  assert(claims.length >= 2, 'Must have warranty claims');
  assert(claims.some(c => c.status === 'APPROVED'), 'Must have approved warranty claim');

  const scraps = db.getAll('scrapDisposals');
  assert(scraps.length >= 2, 'Must have scrap disposals');
  assert(scraps.some(s => s.status === 'DISPOSED'), 'Must have disposed scrap record');
  assert(scraps.some(s => s.gate_pass_no), 'Scrap record must have gate pass reference');
});

// -------------------------------------------------------------
// TEST 9: INVENTORY RULES POLICY ENFORCEMENT
// -------------------------------------------------------------
test('Configurable Inventory Rules (Negative stock, Bin mandatory, Backdated restriction)', () => {
  const rules = db.getAll('inventoryRules');
  assert.strictEqual(rules.allow_negative_stock, false, 'Negative stock must be disabled by default (Rule BR-010)');
  assert.strictEqual(rules.bin_mandatory_enabled, true, 'Bin location must be mandatory (Rule BR-018)');
  assert.strictEqual(rules.scrap_approval_required, true, 'Scrap approval must be required (Rule BR-011)');

  // Test updating rules
  db.saveInventoryRules({ high_value_approval_threshold: 7500 });
  assert.strictEqual(db.getAll('inventoryRules').high_value_approval_threshold, 7500, 'Updated rule must persist');
});

// -------------------------------------------------------------
// TEST 10: UI MODULE RENDERING (ALL 9 TABS WITHOUT TRANSACTION_MATRIX)
// -------------------------------------------------------------
test('StoreInventoryModule renders all 9 tabs cleanly with zero numbers', () => {
  global.window.State = {
    showModal: () => {},
    closeModal: () => {},
    showToast: () => {}
  };

  eval(fs.readFileSync('js/modules/store-inventory.js', 'utf8'));
  const mod = window.StoreInventoryModule;
  assert(mod, 'StoreInventoryModule must exist on window');

  const tabs = [
    'STORE_MASTER',
    'CATEGORY_MAPPING',
    'VEHICLE_COMPATIBILITY',
    'JOB_CARD_WORKFLOW',
    'STOCK_TRANSFERS',
    'PHYSICAL_COUNT',
    'WARRANTY_SCRAP',
    'INVENTORY_RULES',
    'STOCK_LEDGER'
  ];

  tabs.forEach(tab => {
    mod.activeTab = tab;
    const dummyDiv = { innerHTML: '' };
    mod.render(dummyDiv);
    assert(dummyDiv.innerHTML.length > 100, `Tab ${tab} must render rich HTML content`);
  });
});

console.log('================================================================');
console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('ALL TESTS PASSED SUCCESSFULLY!');
}
