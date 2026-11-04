const assert = require('assert');
const fs = require('fs');

console.log('--- Testing General Service Labour Default Qty 1 & Rate 399 ---');

// Mock window environment
global.window = {
  State: {
    currentUser: { name: 'Pravin Patil' },
    currentPlantId: 'PLANT-01',
    showToast: () => {},
    closeModal: () => {},
    showModal: () => {}
  },
  renderInventoryLogisticsTabs: () => ''
};

const DB = {
  data: {
    jobCards: [],
    estimates: [],
    billingEstimates: [],
    items: [],
    plants: [{ id: 'PLANT-01', code: 'MSC1', name: 'Mauli Service Center' }],
    inventoryBalances: [],
    docSeriesMasters: []
  },
  getAll(col) { return this.data[col] || []; },
  getById(col, id) { return (this.data[col] || []).find(x => x.id === id); },
  upsert(col, item) {
    if (!this.data[col]) this.data[col] = [];
    const idx = this.data[col].findIndex(x => x.id === item.id);
    if (idx >= 0) this.data[col][idx] = item;
    else this.data[col].push(item);
  },
  emitChange() {},
  saveData() {},
  getDefaultTax() { return { rate: 0, cgst_rate: 0, sgst_rate: 0, name: 'GST 0%' }; },
  getOrCreateVehicle() { return { id: 'VEH-01', vehicle_id: 'VEH-01' }; }
};
global.window.DB = DB;

// Load BillingModule
const billingCode = fs.readFileSync('d:/Projects/ISCM/js/modules/billing.js', 'utf8');
eval(billingCode);
const Billing = global.window.BillingModule;

// Test 1: fetchAllMasterItems preset check
const masters = Billing.fetchAllMasterItems();
const lbrGen = masters.find(m => m.code === 'LBR-001' || m.name === 'General Service Labour');
assert(lbrGen, 'LBR-001 must exist in master presets');
assert.strictEqual(lbrGen.rate, 399, 'Master preset rate must be 399');
assert.strictEqual(lbrGen.workshop_sale_price, 399, 'Master preset workshop_sale_price must be 399');
console.log('✓ Test 1 Passed: Master preset rate is ₹399');

// Test 2: Estimate created from Job Card
const jc = {
  id: 'JC-TEST-001',
  job_card_no: 'JC/MSC1/2026/0031',
  customer_name: 'Wakhare',
  service_type: 'General Service',
  status: 'ESTIMATE_PENDING',
  parts_required: [],
  labour_tasks: [
    { desc: 'General Service Labour', hours: 1, rate: 399, amount: 399 }
  ]
};
DB.upsert('jobCards', jc);

Billing.actionEstimateFromJobCard(jc.id);
const est = Billing.getActiveEstimate();
assert(est, 'Estimate must be created');
const labourItm = est.items.find(i => i.name.includes('General Service'));
assert(labourItm, 'Estimate must have General Service Labour');
assert.strictEqual(labourItm.qty, 1, 'Quantity must be 1');
assert.strictEqual(labourItm.rate, 399, 'Rate must be 399');
assert.strictEqual(labourItm.amount, 399, 'Amount must be 399');
console.log('✓ Test 2 Passed: Estimate created with Qty 1 and Rate ₹399');

// Test 3: Auto-migration of legacy draft estimate (qty 2, rate 250)
const legacyEst = {
  id: 'EST-LEGACY-01',
  estimate_no: 'EST-001',
  status: 'DRAFT',
  items: [
    { id: 'ITM-PART', code: '2W-SPR-01', name: 'Engine Gasket Kit', type: 'PART', qty: 3, rate: 150, amount: 450 },
    { id: 'ITM-LBR', code: 'LBR-002', name: 'General Service Labour', type: 'LABOUR', qty: 2, rate: 250, amount: 500 }
  ],
  subtotal: 950,
  tax_rate: 0,
  tax_amount: 0,
  estimated_total: 950
};
DB.upsert('billingEstimates', legacyEst);
DB.upsert('estimates', legacyEst);
Billing.activeEstimateId = legacyEst.id;

// Trigger screen render
Billing.renderEstimatesTab();
const migratedEst = DB.getById('estimates', legacyEst.id);
const migratedLbr = migratedEst.items.find(i => i.name.includes('General Service'));
assert.strictEqual(migratedLbr.qty, 1, 'Legacy draft labour qty must be updated to 1');
assert.strictEqual(migratedLbr.rate, 399, 'Legacy draft labour rate must be updated to 399');
assert.strictEqual(migratedLbr.amount, 399, 'Legacy draft labour amount must be updated to 399');
assert.strictEqual(migratedEst.subtotal, 849, 'Subtotal must be updated to 849 (450 + 399)');
console.log('✓ Test 3 Passed: Legacy draft estimate auto-migrated to Qty 1 and Rate ₹399');

console.log('\nALL TESTS PASSED SUCCESSFULLY!');
