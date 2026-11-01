// Test script to verify 7 services and 7 consumables synchronization into estimates and bills
const fs = require('fs');
const path = require('path');

// Mock browser environment
global.window = global;
global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; },
  clear() { this.store = {}; }
};
global.document = {
  getElementById() { return null; },
  querySelectorAll() { return []; },
  querySelector() { return null; }
};
global.State = {
  showToast(msg, type) { console.log(`[TOAST ${type}] ${msg}`); },
  showModal() {},
  closeModal() {}
};

// Load db.js
const { DatabaseLayer } = require('../js/data/db.js');
window.DatabaseLayer = DatabaseLayer;
window.DB = new DatabaseLayer();

// Load service-master.js
const serviceMasterSource = fs.readFileSync(path.join(__dirname, '../js/modules/service-master.js'), 'utf8');
eval(serviceMasterSource);

// Load billing.js
const billingSource = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');
eval(billingSource);

console.log('Testing 7 Workshop Services & Consumables Bill Integration...\n');

// 1. Verify ServiceMasterModule seeds all 7 services
window.ServiceMasterModule.ensureSeedData();
const allServices = window.DB.getAll('services') || [];
console.log(`[TEST 1] Service master count: ${allServices.length}`);
console.assert(allServices.length >= 7, 'Expected at least 7 services');
const expectedServiceCodes = ['LBR-001', 'LBR-002', 'LBR-003', 'LBR-004', 'LBR-005', 'LBR-006', 'LBR-007'];
expectedServiceCodes.forEach(code => {
  const s = allServices.find(x => x.code === code);
  console.assert(!!s, `Missing service code ${code}`);
  console.log(`  Found ${code}: ${s ? s.name : 'MISSING'} (Rate: ₹${s ? s.rate : 0})`);
});

// 2. Verify fetchAllMasterItems contains 7 services and 7 consumables
const masterItems = window.BillingModule.fetchAllMasterItems();
const masterServices = masterItems.filter(i => i.type === 'LABOUR');
const masterConsumables = masterItems.filter(i => i.type === 'CONSUMABLE');
console.log(`\n[TEST 2] Master items: ${masterServices.length} labour services, ${masterConsumables.length} consumables`);
console.assert(masterServices.length >= 7, `Expected at least 7 services in master, got ${masterServices.length}`);
console.assert(masterConsumables.length >= 7, `Expected at least 7 consumables in master, got ${masterConsumables.length}`);

const expectedConsumableCodes = ['CON-001', 'CON-002', 'CON-003', 'CON-004', 'CON-005', 'CON-006', 'CON-007'];
expectedConsumableCodes.forEach(code => {
  const c = masterConsumables.find(x => x.code === code);
  console.assert(!!c, `Missing consumable code ${code}`);
  console.log(`  Found consumable ${code}: ${c ? c.name : 'MISSING'} (Rate: ₹${c ? c.rate : 0})`);
});

// 3. Test healEstimateOrBillItems repairing the corrupted 6-item state from user's screenshot
console.log('\n[TEST 3] Healing corrupted 6-item estimate from screenshot (LBR-002 named General Service Labour, qty 9)...');
const corruptedItems = [
  { id: '1', code: 'LBR-002', name: 'General Service Labour', type: 'LABOUR', qty: 9, rate: 100, amount: 900.00 },
  { id: '2', code: 'LBR-003', name: 'Brake Overhaul & Cleaning Labour', type: 'LABOUR', qty: 2, rate: 250, amount: 500.00 },
  { id: '3', code: 'LBR-004', name: 'Carburetor / Throttle Body Clean', type: 'LABOUR', qty: 2, rate: 350, amount: 700.00 },
  { id: '4', code: 'LBR-005', name: 'Electrical & Wiring Check', type: 'LABOUR', qty: 2, rate: 200, amount: 400.00 },
  { id: '5', code: 'LBR-006', name: 'Clutch & CVT Overhaul Labour', type: 'LABOUR', qty: 2, rate: 450, amount: 900.00 },
  { id: '6', code: 'LBR-007', name: 'Water Wash & Polishing', type: 'LABOUR', qty: 2, rate: 200, amount: 400.00 }
];

const healed = window.BillingModule.healEstimateOrBillItems(corruptedItems, 'Estimate');
console.assert(healed === true, 'Expected healEstimateOrBillItems to return true');
console.log(`  Items count after healing: ${corruptedItems.length} (Expected 7)`);
console.assert(corruptedItems.length === 7, `Expected 7 items, got ${corruptedItems.length}`);

corruptedItems.forEach((it, idx) => {
  console.log(`  #${idx + 1}: [${it.code}] ${it.name} | Qty: ${it.qty} | Rate: ₹${it.rate} | Amount: ₹${it.amount}`);
});

console.assert(corruptedItems[0].code === 'LBR-001', 'First item must be LBR-001');
console.assert(corruptedItems[0].name === 'General Service Labour', 'First item must be General Service Labour');
console.assert(corruptedItems[0].rate === 399, 'LBR-001 rate must be 399');
console.assert(corruptedItems[1].code === 'LBR-002', 'Second item must be LBR-002');
console.assert(corruptedItems[1].name === 'Engine Oil & Filter Replacement Labour', 'Second item must be Engine Oil & Filter Replacement Labour');
console.assert(corruptedItems[1].qty === 1, 'LBR-002 qty must be reset from 9 to 1');
console.assert(corruptedItems[1].rate === 100, 'LBR-002 rate must be 100');

// 4. Test syncing estimate with Job Card does not remove consumables
console.log('\n[TEST 4] Testing syncEstimateWithJobCardParts preserves consumables...');
const mockJobCard = {
  id: 'JC-001',
  job_card_no: 'JC/MSC1/2026/0032',
  parts_required: [
    { item_id: 'PRT-001', item_code: 'PRT-001', item_name: 'Brake Shoe', qty: 1, required_qty: 1, unit_price: 250, status: 'PENDING' }
  ]
};
const mockEstimate = {
  id: 'EST-001',
  estimate_no: 'EST/MSC1/2026/0001',
  job_card_id: 'JC-001',
  job_card_no: 'JC/MSC1/2026/0032',
  items: [
    ...corruptedItems,
    { id: 'CON-1', code: 'CON-001', name: 'Chain Lube Spray (150ml)', type: 'CONSUMABLE', qty: 1, rate: 180, amount: 180 },
    { id: 'CON-2', code: 'CON-002', name: 'Chain Cleaner Spray (150ml)', type: 'CONSUMABLE', qty: 1, rate: 160, amount: 160 },
    { id: 'CON-3', code: 'CON-003', name: 'Brake Fluid DOT 4 (100ml)', type: 'CONSUMABLE', qty: 1, rate: 120, amount: 120 },
    { id: 'CON-4', code: 'CON-004', name: 'Rust Off WD-40 (100ml)', type: 'CONSUMABLE', qty: 1, rate: 140, amount: 140 },
    { id: 'CON-5', code: 'CON-005', name: 'Coolant Top-up (250ml)', type: 'CONSUMABLE', qty: 1, rate: 110, amount: 110 },
    { id: 'CON-6', code: 'CON-006', name: 'Distilled Battery Water (1L)', type: 'CONSUMABLE', qty: 1, rate: 50, amount: 50 },
    { id: 'CON-7', code: 'CON-007', name: 'Carburetor & Choke Cleaner (200ml)', type: 'CONSUMABLE', qty: 1, rate: 190, amount: 190 }
  ]
};

window.BillingModule.syncEstimateWithJobCardParts(mockEstimate, mockJobCard);
const consumablesAfterSync = mockEstimate.items.filter(i => i.type === 'CONSUMABLE');
console.log(`  Consumables remaining after sync: ${consumablesAfterSync.length} (Expected 7)`);
console.assert(consumablesAfterSync.length === 7, `Expected all 7 consumables preserved, got ${consumablesAfterSync.length}`);

// 5. Test createOrUpdateBillFromEstimate creates bill with all 7 services and 7 consumables
console.log('\n[TEST 5] Testing createOrUpdateBillFromEstimate carries all services and consumables into bill...');
window.DB.upsert('billingEstimates', mockEstimate);
window.DB.upsert('jobCards', mockJobCard);

const draftBill = window.BillingModule.createOrUpdateBillFromEstimate(mockEstimate);
console.log(`  Draft bill created: ${draftBill.bill_no || draftBill.draft_bill_no || draftBill.id}`);
console.log(`  Total items in draft bill: ${draftBill.items.length}`);

const billServices = draftBill.items.filter(i => i.type === 'LABOUR');
const billConsumables = draftBill.items.filter(i => i.type === 'CONSUMABLE');
console.log(`  Bill services count: ${billServices.length} (Expected 7)`);
console.log(`  Bill consumables count: ${billConsumables.length} (Expected 7)`);

console.assert(billServices.length === 7, `Expected 7 services in bill, got ${billServices.length}`);
console.assert(billConsumables.length === 7, `Expected 7 consumables in bill, got ${billConsumables.length}`);

billServices.forEach((s, idx) => {
  console.log(`  Service #${idx + 1}: [${s.code}] ${s.name} | Rate: ₹${s.rate} | SAC: ${s.hsn_sac}`);
  console.assert(s.code === expectedServiceCodes[idx], `Expected ${expectedServiceCodes[idx]}, got ${s.code}`);
  console.assert(s.hsn_sac === '998729', `Expected SAC 998729, got ${s.hsn_sac}`);
});

billConsumables.forEach((c, idx) => {
  console.log(`  Consumable #${idx + 1}: [${c.code}] ${c.name} | Rate: ₹${c.rate} | SAC/HSN: ${c.hsn_sac}`);
  console.assert(c.code === expectedConsumableCodes[idx], `Expected ${expectedConsumableCodes[idx]}, got ${c.code}`);
});

console.log('\nALL 5 TESTS PASSED SUCCESSFULLY! 7 Services and 7 Consumables correctly mapped in Estimates and Bills.\n');
