// Test verification for item removal / cancel button in Estimate and Billing
// and automatic restocking of inventory on-hand/available stock.

const fs = require('fs');
const assert = require('assert');

// Setup mock browser window & DB environment
const initialBalances = [
  { id: 'BAL-01', plant_id: 'PLANT-01', warehouse_id: 'WH-PUN-SPARE', item_id: 'PRT-002', on_hand: 10, available: 10, reserved: 0 },
  { id: 'BAL-02', plant_id: 'PLANT-01', warehouse_id: 'WH-PUN-SPARE', item_id: '2W-SPR-ENGINE-GASKET-KIT-006', on_hand: 5, available: 5, reserved: 0 }
];

const initialItems = [
  { id: 'PRT-002', code: 'PRT-002', name: 'Brake Shoe Rear', current_stock: 10, sale_price: 355 },
  { id: '2W-SPR-ENGINE-GASKET-KIT-006', code: '2W-SPR-ENGINE-GASKET-KIT-006', name: 'Engine Gasket Kit', current_stock: 5, sale_price: 150 },
  { id: 'LBR-001', code: 'LBR-001', name: 'General Service Labour', type: 'LABOUR', sale_price: 250 }
];

const mockJobCard = {
  id: 'JC/MSC1/2026/0015',
  job_card_no: 'JC/MSC1/2026/0015',
  vehicle_reg_no: 'MH20TH9827',
  customer_name: 'Parag Gulve',
  store_id: 'WH-PUN-SPARE',
  plant_id: 'PLANT-01',
  status: 'IN_PROGRESS',
  parts_required: [
    { item_id: 'PRT-002', item_code: 'PRT-002', item_name: 'Brake Shoe Rear', qty: 1, issued_qty: 1, unit_price: 355, status: 'ISSUED' },
    { item_id: '2W-SPR-ENGINE-GASKET-KIT-006', item_code: '2W-SPR-ENGINE-GASKET-KIT-006', item_name: 'Engine Gasket Kit', qty: 1, issued_qty: 0, reserved_qty: 1, unit_price: 150, status: 'RESERVED' }
  ]
};

const mockDraftBill = {
  id: 'DB/MSC1/2026/0012',
  draft_bill_no: 'DB/MSC1/2026/0012',
  job_card_id: 'JC/MSC1/2026/0015',
  job_card_no: 'JC/MSC1/2026/0015',
  customer_name: 'Parag Gulve',
  vehicle_reg_no: 'MH20TH9827',
  store_id: 'WH-PUN-SPARE',
  plant_id: 'PLANT-01',
  status: 'DRAFT',
  items: [
    { id: 'ITM-LBR', code: 'LBR-001', name: 'General Service Labour', type: 'LABOUR', qty: 2, rate: 250, amount: 500 },
    { id: 'ITM-PRT-002', code: 'PRT-002', name: 'Brake Shoe Rear', type: 'PART', qty: 1, rate: 355, amount: 355 },
    { id: 'ITM-GASKET', code: '2W-SPR-ENGINE-GASKET-KIT-006', name: 'Engine Gasket Kit', type: 'PART', qty: 1, rate: 150, amount: 150 }
  ]
};

const mockEstimate = {
  id: 'EST-001',
  estimate_no: 'EST/2026/001',
  job_card_id: 'JC/MSC1/2026/0015',
  status: 'DRAFT',
  store_id: 'WH-PUN-SPARE',
  items: [
    { id: 'EST-ITM-1', code: 'PRT-002', name: 'Brake Shoe Rear', type: 'PART', qty: 2, rate: 355, amount: 710 },
    { id: 'EST-ITM-2', code: 'LBR-001', name: 'General Service Labour', type: 'LABOUR', qty: 1, rate: 250, amount: 250 }
  ]
};

const dbStore = {
  inventoryBalances: JSON.parse(JSON.stringify(initialBalances)),
  items: JSON.parse(JSON.stringify(initialItems)),
  jobCards: [JSON.parse(JSON.stringify(mockJobCard))],
  draftBills: [JSON.parse(JSON.stringify(mockDraftBill))],
  billingEstimates: [JSON.parse(JSON.stringify(mockEstimate))],
  auditLogs: []
};

global.window = {
  State: {
    currentPlantId: 'PLANT-01',
    showToast: (msg, type) => { console.log(`   [TOAST (${type || 'info'})] ${msg}`); },
    showModal: () => {},
    closeModal: () => {}
  },
  DB: {
    getAll: (table) => dbStore[table] || [],
    getById: (table, id) => (dbStore[table] || []).find(x => x.id === id),
    upsert: (table, record) => {
      const list = dbStore[table] || [];
      const idx = list.findIndex(x => x.id === record.id);
      if (idx >= 0) list[idx] = record;
      else list.push(record);
    },
    saveData: () => {},
    emitChange: () => {},
    isPlantActive: () => true,
    getDefaultTax: () => ({ rate: 0 }),
    logAudit: (act, mod, ent, msg) => {
      dbStore.auditLogs.push({ act, mod, ent, msg });
      console.log(`   [AUDIT] ${act} on ${ent}: ${msg}`);
    }
  }
};

// Load billing.js
const billingCode = fs.readFileSync('js/modules/billing.js', 'utf8');
eval(billingCode);

console.log('=== TEST 1: Remove item from Draft Bill and verify stock increment ===');
window.BillingModule.activeBillingBillId = mockDraftBill.id;
const billBefore = window.BillingModule.getActiveCustomerBillingBill();
assert.strictEqual(billBefore.items.length, 3, 'Bill should initially have 3 items');

const balBefore = dbStore.inventoryBalances.find(b => b.item_id === 'PRT-002');
console.log(`Initial stock of PRT-002: on_hand=${balBefore.on_hand}, available=${balBefore.available}`);
assert.strictEqual(balBefore.on_hand, 10);

// Remove item 2 (Brake Shoe Rear)
console.log('Action: Clicking cancel button (removeSingleScreenItem) on PRT-002...');
window.BillingModule.removeSingleScreenItem('ITM-PRT-002', 1);

const billAfter = window.BillingModule.getActiveCustomerBillingBill();
assert.strictEqual(billAfter.items.length, 2, 'Bill should now have 2 items');
assert(!billAfter.items.some(i => i.code === 'PRT-002'), 'PRT-002 should no longer be in bill items');

const balAfter = dbStore.inventoryBalances.find(b => b.item_id === 'PRT-002');
console.log(`Updated stock of PRT-002: on_hand=${balAfter.on_hand}, available=${balAfter.available}`);
assert.strictEqual(balAfter.on_hand, 11, 'Stock on_hand should have increased by 1 from 10 to 11');
assert.strictEqual(balAfter.available, 11, 'Stock available should have increased by 1 from 10 to 11');

// Verify that Job Card was updated and not re-syncing removed item
const jcUpdated = dbStore.jobCards[0];
const jcPart = jcUpdated.parts_required.find(p => p.item_code === 'PRT-002');
assert.strictEqual(jcPart.status, 'RETURNED', 'Job Card part status should be marked RETURNED');
assert.strictEqual(jcPart.returned_qty, 1, 'Job Card part returned_qty should be 1');

// Test that calling refresh / getActiveCustomerBillingBill does NOT re-inject PRT-002
console.log('Testing subsequent sync...');
window.BillingModule.syncBillWithJobCardParts(billAfter);
assert(!billAfter.items.some(i => i.code === 'PRT-002'), 'PRT-002 must NOT be resurrected by syncBillWithJobCardParts');
console.log('✔ Test 1 Passed: Cancel item in billing successfully removes item, restocks inventory, and prevents re-sync.');

console.log('\n=== TEST 2: Remove item from Estimate and verify stock increment ===');
window.BillingModule.activeEstimateId = mockEstimate.id;
const estBefore = window.BillingModule.getActiveEstimate();
const initialEstLength = estBefore.items.length;
console.log('Estimate initial items count:', initialEstLength);
assert(initialEstLength >= 2, 'Estimate should initially have items');

console.log(`Action: Removing 2x PRT-002 from Estimate (current stock on_hand=${balAfter.on_hand})...`);
window.BillingModule.removeEstimateItem('EST-ITM-1', 0);

const estAfter = window.BillingModule.getActiveEstimate();
assert.strictEqual(estAfter.items.length, initialEstLength - 1, 'Estimate items count should decrease by 1');
assert(!estAfter.items.some(i => i.id === 'EST-ITM-1'), 'EST-ITM-1 should no longer be in estimate');

const balAfterEst = dbStore.inventoryBalances.find(b => b.item_id === 'PRT-002');
console.log(`Stock after Estimate removal: on_hand=${balAfterEst.on_hand}, available=${balAfterEst.available}`);
assert.strictEqual(balAfterEst.on_hand, 13, 'Stock on_hand should have increased by 2 (from 11 to 13)');
console.log('✔ Test 2 Passed: Cancel item in estimate successfully restocked inventory.');

console.log('\n=== TEST 3: Labour items do not affect stock ===');
const labourBalBefore = dbStore.inventoryBalances.map(b => b.on_hand).reduce((a, b) => a + b, 0);
window.BillingModule.removeSingleScreenItem('ITM-LBR', 0);
const labourBalAfter = dbStore.inventoryBalances.map(b => b.on_hand).reduce((a, b) => a + b, 0);
assert.strictEqual(labourBalBefore, labourBalAfter, 'Total inventory on hand should not change when labour is removed');
console.log('✔ Test 3 Passed: Removing labour service cleanly removes line without touching physical stock.');

console.log('\nALL TESTS PASSED SUCCESSFULLY! 🎯');
