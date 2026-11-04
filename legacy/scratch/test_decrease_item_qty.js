// Automated test for decreasing item quantity in Billing & Estimates
const fs = require('fs');
const path = require('path');

// Mock browser environment
global.window = global;
global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] !== undefined ? this._store[k] : null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; },
  clear() { this._store = {}; }
};
global.document = {
  activeElement: null,
  getElementById: (id) => {
    if (!global._elements) global._elements = {};
    if (!global._elements[id]) {
      global._elements[id] = { textContent: '', value: '', title: '', style: { setProperty: () => {} }, classList: { add: () => {}, remove: () => {} } };
    }
    return global._elements[id];
  },
  querySelector: () => ({ style: { setProperty: () => {} }, classList: { add: () => {}, remove: () => {} } }),
  querySelectorAll: () => [],
  addEventListener: () => {}
};
global.State = {
  currentPlantId: 'PLANT-01',
  hasPermission: () => true,
  showToast: (msg, type) => { /* console.log(`[TOAST-${type}] ${msg}`); */ },
  closeModal: () => {}
};

// Load DB
const dbCode = fs.readFileSync(path.join(__dirname, '../js/data/db.js'), 'utf8');
eval(dbCode);

// Load Billing Module
const billingCode = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');
eval(billingCode);

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Test failed: ${message}`);
  }
  passedTests++;
  console.log(`✅ PASS: ${message}`);
}

async function runTests() {
  console.log('--- Starting Decrease Item Quantity Tests ---');

  // Initialize DB data collections
  if (!window.DB.data) window.DB.data = {};
  if (!window.DB.data.jobCards) window.DB.data.jobCards = [];
  if (!window.DB.data.billingEstimates) window.DB.data.billingEstimates = [];
  if (!window.DB.data.draftBills) window.DB.data.draftBills = [];
  if (!window.DB.data.finalBills) window.DB.data.finalBills = [];
  if (!window.DB.data.inventoryBalances) window.DB.data.inventoryBalances = [];
  if (!window.DB.data.items) window.DB.data.items = [];

  // Setup test Job Card JC/MSC1/2026/0031
  const testJc = {
    id: 'JC-TEST-0031',
    job_card_no: 'JC/MSC1/2026/0031',
    vehicle_reg_no: 'MH12AB1234',
    customer_name: 'Test Customer',
    store_id: 'WH-PUN-SPARE',
    plant_id: 'PLANT-01',
    status: 'IN_PROGRESS',
    parts_required: [
      {
        item_id: '2W-SPR-ENGINE-GASKET-KIT-006',
        item_code: '2W-SPR-ENGINE-GASKET-KIT-006',
        item_name: 'Engine Gasket Kit',
        qty: 4,
        required_qty: 4,
        unit_price: 150,
        amount: 600,
        status: 'PENDING',
        stock_deducted: true
      },
      {
        item_id: '2W-SPR-ENGINE-VALVE-SET-007',
        item_code: '2W-SPR-ENGINE-VALVE-SET-007',
        item_name: 'Engine Valve Set',
        qty: 12,
        required_qty: 12,
        unit_price: 150,
        amount: 1800,
        status: 'PENDING',
        stock_deducted: true
      }
    ]
  };

  // Setup test Estimate
  const testEst = {
    id: 'EST-TEST-0031',
    estimate_no: 'EST/MSC1/2026/0031',
    job_card_id: testJc.id,
    job_card_no: testJc.job_card_no,
    vehicle_reg_no: testJc.vehicle_reg_no,
    store_id: 'WH-PUN-SPARE',
    plant_id: 'PLANT-01',
    status: 'DRAFT',
    items: [
      {
        id: 'EST-ITM-1',
        item_id: '2W-SPR-ENGINE-GASKET-KIT-006',
        code: '2W-SPR-ENGINE-GASKET-KIT-006',
        name: 'Engine Gasket Kit',
        type: 'PART',
        qty: 4,
        rate: 150,
        amount: 600,
        from_job_card: true,
        stock_deducted: true
      },
      {
        id: 'EST-ITM-2',
        item_id: '2W-SPR-ENGINE-VALVE-SET-007',
        code: '2W-SPR-ENGINE-VALVE-SET-007',
        name: 'Engine Valve Set',
        type: 'PART',
        qty: 12,
        rate: 150,
        amount: 1800,
        from_job_card: true,
        stock_deducted: true
      }
    ],
    removed_item_keys: []
  };

  window.DB.upsert('jobCards', testJc);
  window.DB.upsert('billingEstimates', testEst);
  window.DB.saveData();

  window.BillingModule.activeEstimateId = testEst.id;
  window.BillingModule.activeEstimate = testEst;

  // TEST 1: Decrease quantity of Gasket Kit from 4 to 1
  console.log('\nTest 1: Decreasing Gasket Kit quantity from 4 to 1');
  const initialStockBal = window.DB.getAll('inventoryBalances').find(b => b.item_id === '2W-SPR-ENGINE-GASKET-KIT-006');
  const initialStock = initialStockBal ? Number(initialStockBal.available) : 0;

  window.BillingModule.updateEstimateItemQty('EST-ITM-1', 1);

  const updatedEst1 = window.BillingModule.getActiveEstimate();
  const gasketItem1 = updatedEst1.items.find(i => i.id === 'EST-ITM-1');
  assert(gasketItem1.qty === 1, `Estimate Gasket Kit qty is 1 (actual: ${gasketItem1.qty})`);
  assert(gasketItem1.amount === 150, `Estimate Gasket Kit amount is 150 (actual: ${gasketItem1.amount})`);

  // Verify linked Job Card part was updated
  const updatedJc1 = window.DB.getById('jobCards', testJc.id);
  const jcGasketPart = updatedJc1.parts_required.find(p => p.item_id === '2W-SPR-ENGINE-GASKET-KIT-006');
  assert(jcGasketPart.qty === 1, `Job Card Gasket Kit qty is synced to 1 (actual: ${jcGasketPart.qty})`);
  assert(jcGasketPart.required_qty === 1, `Job Card Gasket Kit required_qty is synced to 1`);

  // Verify stock was restocked by 3
  const afterStockBal = window.DB.getAll('inventoryBalances').find(b => b.item_id === '2W-SPR-ENGINE-GASKET-KIT-006');
  const afterStock = afterStockBal ? Number(afterStockBal.available) : 0;
  assert(afterStock === initialStock + 3, `Inventory stock restocked by 3 (before: ${initialStock}, after: ${afterStock})`);

  // TEST 2: Refresh & syncEstimateWithJobCardParts must NOT reset qty back to 4!
  console.log('\nTest 2: Ensure refresh() does not ratchet quantity back up to 4');
  window.BillingModule.refresh();
  const refreshedEst = window.BillingModule.getActiveEstimate();
  const gasketRefreshed = refreshedEst.items.find(i => i.id === 'EST-ITM-1');
  assert(gasketRefreshed.qty === 1, `Gasket Kit qty remained 1 after refresh (did not snap back to 4!)`);
  assert(gasketRefreshed.amount === 150, `Gasket Kit amount remained 150`);

  // TEST 3: Decrease Engine Valve Set from 12 to 2
  console.log('\nTest 3: Decreasing Engine Valve Set quantity from 12 to 2');
  window.BillingModule.updateEstimateItemQty('EST-ITM-2', 2);
  const valveItem = window.BillingModule.getActiveEstimate().items.find(i => i.id === 'EST-ITM-2');
  assert(valveItem.qty === 2, `Estimate Valve Set qty is 2 (actual: ${valveItem.qty})`);
  assert(valveItem.amount === 300, `Estimate Valve Set amount is 300 (actual: ${valveItem.amount})`);

  const updatedJc2 = window.DB.getById('jobCards', testJc.id);
  const jcValvePart = updatedJc2.parts_required.find(p => p.item_id === '2W-SPR-ENGINE-VALVE-SET-007');
  assert(jcValvePart.qty === 2, `Job Card Valve Set qty is synced to 2 (actual: ${jcValvePart.qty})`);

  // Refresh and verify persistence
  window.BillingModule.refresh();
  const valveRefreshed = window.BillingModule.getActiveEstimate().items.find(i => i.id === 'EST-ITM-2');
  assert(valveRefreshed.qty === 2, `Valve Set qty remained 2 after refresh`);

  // TEST 4: Delete an item from estimate (✕ button)
  console.log('\nTest 4: Removing an item from estimate (✕ button)');
  window.BillingModule.removeEstimateItem('EST-ITM-1');
  const estAfterDelete = window.BillingModule.getActiveEstimate();
  const itemGone = !estAfterDelete.items.some(i => i.id === 'EST-ITM-1');
  assert(itemGone, `Gasket Kit removed from estimate items`);
  assert(estAfterDelete.removed_item_keys.includes('2W-SPR-ENGINE-GASKET-KIT-006'), `Gasket Kit recorded in removed_item_keys`);

  // Refresh and verify it is NOT resurrected!
  window.BillingModule.refresh();
  const estAfterRefresh = window.BillingModule.getActiveEstimate();
  const stillGone = !estAfterRefresh.items.some(i => i.id === 'EST-ITM-1' || i.code === '2W-SPR-ENGINE-GASKET-KIT-006');
  assert(stillGone, `Gasket Kit was NOT resurrected after refresh()`);

  // TEST 5: Customer Billing / Draft Bills quantity decrease
  console.log('\nTest 5: Customer Billing / Draft Bill quantity decrease');
  const testDraft = {
    id: 'DRAFT-TEST-0031',
    draft_bill_no: 'DB/MSC1/2026/0031',
    job_card_id: testJc.id,
    job_card_no: testJc.job_card_no,
    status: 'DRAFT',
    items: [
      {
        id: 'DB-ITM-1',
        item_id: '2W-SPR-ENGINE-VALVE-SET-007',
        code: '2W-SPR-ENGINE-VALVE-SET-007',
        name: 'Engine Valve Set',
        type: 'PART',
        qty: 10,
        rate: 150,
        amount: 1500
      }
    ]
  };
  window.DB.upsert('draftBills', testDraft);
  window.DB.saveData();

  window.BillingModule.activeCustomerBillingBillId = testDraft.id;
  window.BillingModule.activeCustomerBillingBill = testDraft;

  window.BillingModule.updateSingleScreenItemQty('DB-ITM-1', 3);
  const updatedBill = window.BillingModule.getActiveCustomerBillingBill();
  const billItem = updatedBill.items.find(i => i.id === 'DB-ITM-1');
  assert(billItem.qty === 3, `Draft Bill item qty decreased to 3 (actual: ${billItem.qty})`);

  window.BillingModule.refresh();
  const billRefreshed = window.BillingModule.getActiveCustomerBillingBill();
  const billItemRefreshed = billRefreshed.items.find(i => i.id === 'DB-ITM-1');
  assert(billItemRefreshed.qty === 3, `Draft Bill item qty remained 3 after refresh() (did not snap back!)`);

  console.log(`\n========================================`);
  console.log(`All ${passedTests}/${totalTests} tests passed successfully!`);
  console.log(`========================================\n`);
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
