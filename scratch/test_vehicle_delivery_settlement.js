const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const localStorageData = {};
const mockLocalStorage = {
  getItem: (k) => localStorageData[k] || null,
  setItem: (k, v) => { localStorageData[k] = String(v); },
  removeItem: (k) => { delete localStorageData[k]; },
  clear: () => { Object.keys(localStorageData).forEach(k => delete localStorageData[k]); }
};

const domElements = {};
const sandbox = {
  window: {
    location: { hash: '' }
  },
  localStorage: mockLocalStorage,
  document: {
    getElementById: (id) => domElements[id] || null,
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => ({ setAttribute: () => {}, appendChild: () => {}, click: () => {} }),
    body: { appendChild: () => {}, removeChild: () => {}, insertAdjacentHTML: () => {} }
  },
  alert: (msg) => console.log('[ALERT]:', msg),
  confirm: () => true,
  console,
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  Date
};
sandbox.window.localStorage = mockLocalStorage;
sandbox.window.window = sandbox.window;
sandbox.window.alert = (msg) => console.log('[ALERT]:', msg);
sandbox.window.confirm = () => true;
sandbox.window.State = {
  currentPlantId: 'PLANT-01',
  currentUser: { full_name: 'Santosh Shinde', name: 'Santosh Shinde', role: 'ADMIN' },
  showToast: (msg, type) => console.log(`[TOAST] (${type}): ${msg}`),
  showModal: (opts) => console.log(`[MODAL]: ${opts.title}`),
  closeModal: () => {}
};

vm.createContext(sandbox);

vm.runInContext(fs.readFileSync('js/data/mock-data.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('js/data/db.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('js/modules/doc-series-master.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('js/modules/billing.js', 'utf8'), sandbox);

console.log('\n--- TEST SUITE: Vehicle Delivery after Bill Settlement ---');

// Test 1: Verify ensureVehicleDeliveryEntry creates READY_FOR_DELIVERY record
console.log('\n[Test 1] Testing ensureVehicleDeliveryEntry for settled bill...');
const testJc = {
  id: 'JC-DEL-TEST-001',
  job_card_no: 'JC/MSC1/2026/000099',
  branch_id: 'PLANT-01',
  customer_name: 'Amitabh Sharma',
  customer_mobile: '9822012345',
  customer_cin: 'CIN-000999',
  vehicle_reg_no: 'MH12PQ9999',
  vehicle_model: 'Activa 6G',
  status: 'BILLED',
  payment_status: 'PAID',
  invoice_no: 'INV/MSC1/2026/000088'
};
sandbox.window.DB.upsert('jobCards', testJc);

const testBill = {
  id: 'INV-TEST-001',
  invoice_no: 'INV/MSC1/2026/000088',
  job_card_id: testJc.id,
  job_card_no: testJc.job_card_no,
  customer_name: testJc.customer_name,
  customer_mobile: testJc.customer_mobile,
  vehicle_reg_no: testJc.vehicle_reg_no,
  vehicle_model: testJc.vehicle_model,
  branch_id: 'PLANT-01',
  net_payable: 1500,
  amount_paid: 1500,
  balance_due: 0,
  status: 'PAID'
};
sandbox.window.DB.upsert('finalBills', testBill);

const entry1 = sandbox.window.BillingModule.ensureVehicleDeliveryEntry(testBill, testJc, testBill.invoice_no);
assert(entry1 !== null, 'Entry should be created');
assert.strictEqual(entry1.status, 'READY_FOR_DELIVERY');
assert.strictEqual(entry1.customer_name, 'Amitabh Sharma');
assert.strictEqual(entry1.vehicle_reg_no, 'MH12PQ9999');
assert.strictEqual(entry1.invoice_no, 'INV/MSC1/2026/000088');
console.log('✅ Test 1 Passed: Delivery record created in READY_FOR_DELIVERY status!');

// Test 2: Verify duplicate prevention (patient showing multiple times)
console.log('\n[Test 2] Testing duplicate prevention for same patient/vehicle...');
const entry2 = sandbox.window.BillingModule.ensureVehicleDeliveryEntry(testBill, testJc, testBill.invoice_no);
const allDels = sandbox.window.DB.getAll('vehicleDeliveries').filter(d => d.job_card_id === testJc.id);
assert.strictEqual(allDels.length, 1, `Expected 1 entry, found ${allDels.length}`);
console.log(`✅ Test 2 Passed: No duplicate entries created! Exact count: ${allDels.length}`);

// Test 3: Verify renderDeliveryTab displays patient awaiting delivery
console.log('\n[Test 3] Testing renderDeliveryTab output contains patient and ready status...');
const tabHtml = sandbox.window.BillingModule.renderDeliveryTab();
assert(tabHtml.includes('Amitabh Sharma'), 'Delivery tab HTML should include customer name');
assert(tabHtml.includes('MH12PQ9999'), 'Delivery tab HTML should include vehicle reg');
assert(tabHtml.includes('INV/MSC1/2026/000088'), 'Delivery tab HTML should include invoice no');
assert(tabHtml.includes('READY FOR HANDOVER'), 'Delivery tab HTML should show READY FOR HANDOVER badge');
assert(tabHtml.includes('Issue Gate Pass'), 'Delivery tab HTML should show Issue Gate Pass button');
console.log('✅ Test 3 Passed: Patient properly appears on Vehicle Delivery screen with Issue Gate Pass action!');

// Test 4: Issue Gate Pass and verify transition to DELIVERED and Job Card CLOSED
console.log('\n[Test 4] Testing Gate Pass issuance...');
domElements['new-gp-no'] = { value: '' };
domElements['new-gp-date'] = { value: '2026-10-12T11:00' };
domElements['new-gp-jc'] = { value: testJc.id };
domElements['new-gp-inv'] = { value: testBill.invoice_no, trim: () => testBill.invoice_no };
domElements['new-gp-remarks'] = { value: 'Customer happy with service', trim: () => 'Customer happy with service' };
domElements['chk-parts'] = { checked: true };
domElements['chk-ack'] = { checked: true };

sandbox.window.BillingModule.saveGatePass();

const updatedDel = sandbox.window.DB.getAll('vehicleDeliveries').find(d => d.job_card_id === testJc.id);
assert.strictEqual(updatedDel.status, 'DELIVERED', `Status should be DELIVERED, got ${updatedDel.status}`);
assert(updatedDel.gate_pass_no && updatedDel.gate_pass_no.startsWith('GP/'), `Gate pass no should be sequential GP series, got ${updatedDel.gate_pass_no}`);
assert.strictEqual(updatedDel.invoice_no, 'INV/MSC1/2026/000088');

const updatedJc = sandbox.window.DB.getById('jobCards', testJc.id);
assert.strictEqual(updatedJc.status, 'CLOSED', `Job Card status should be CLOSED, got ${updatedJc.status}`);
assert.strictEqual(updatedJc.gate_pass_no, updatedDel.gate_pass_no);
console.log(`✅ Test 4 Passed: Gate pass issued (${updatedDel.gate_pass_no}), vehicle DELIVERED, Job Card CLOSED!`);

// Test 5: Verify automatic sync for settled bills that weren't in vehicleDeliveries
console.log('\n[Test 5] Testing syncEligibleDeliveries for un-synced settled bills...');
const testJc2 = {
  id: 'JC-DEL-TEST-002',
  job_card_no: 'JC/MSC1/2026/000100',
  branch_id: 'PLANT-01',
  customer_name: 'Pooja Kadam',
  customer_mobile: '9890011223',
  vehicle_reg_no: 'MH14XY5555',
  vehicle_model: 'Jupiter 125',
  status: 'BILLED',
  payment_status: 'PAID',
  invoice_no: 'INV/MSC1/2026/000089'
};
sandbox.window.DB.upsert('jobCards', testJc2);

const testBill2 = {
  id: 'INV-TEST-002',
  invoice_no: 'INV/MSC1/2026/000089',
  job_card_id: testJc2.id,
  job_card_no: testJc2.job_card_no,
  customer_name: testJc2.customer_name,
  customer_mobile: testJc2.customer_mobile,
  vehicle_reg_no: testJc2.vehicle_reg_no,
  branch_id: 'PLANT-01',
  net_payable: 2200,
  amount_paid: 2200,
  balance_due: 0,
  status: 'PAID'
};
sandbox.window.DB.upsert('finalBills', testBill2);

// Run sync
sandbox.window.BillingModule.syncEligibleDeliveries();

const syncedDel = sandbox.window.DB.getAll('vehicleDeliveries').find(d => d.job_card_id === testJc2.id);
assert(syncedDel !== undefined, 'Pooja Kadam should be synced into vehicleDeliveries');
assert.strictEqual(syncedDel.status, 'READY_FOR_DELIVERY');
assert.strictEqual(syncedDel.customer_name, 'Pooja Kadam');
console.log('✅ Test 5 Passed: syncEligibleDeliveries automatically populated patient Pooja Kadam!');

console.log('\n🎉 ALL 5 INTEGRATION TESTS PASSED SUCCESSFULLY!\n');
