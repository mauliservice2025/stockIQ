// Automated test to verify clicking 'View Customer Billing' from Estimate screen
// correctly selects and displays the matching patient/customer bill details on Billing screen.

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

function runTest() {
  console.log('Testing View Customer Bill from Estimate Screen...');

  const billingCode = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');

  let currentHash = '#/billing-estimates';
  const mockLocation = {
    get hash() { return currentHash; },
    set hash(val) { currentHash = val; }
  };

  const store = {
    customers: [
      { id: 'CUST-001', customer_name: 'Rahul Sharma', mobile: '9822011111', customer_cin: 'CIN/MSC/2026/000001' },
      { id: 'CUST-002', customer_name: 'Parag Gulve', mobile: '9887737737', customer_cin: 'CIN/MSC/2026/000011' }
    ],
    jobCards: [
      {
        id: 'JC-001',
        job_card_no: 'JC/MSC1/2026/0001',
        customer_name: 'Rahul Sharma',
        customer_cin: 'CIN/MSC/2026/000001',
        vehicle_reg_no: 'MH12AB1234',
        status: 'IN_SERVICE'
      },
      {
        id: 'JC-002',
        job_card_no: 'JC/MSC1/2026/0015',
        customer_name: 'Parag Gulve',
        customer_cin: 'CIN/MSC/2026/000011',
        vehicle_reg_no: 'MG20TH9827',
        vehicle_model: 'Honda Activa 6G',
        odometer_km: '9,877 km',
        status: 'READY_FOR_BILLING'
      }
    ],
    draftBills: [
      {
        id: 'DBILL-RAHUL-001',
        draft_bill_no: 'DB/MSC1/2026/0001',
        customer_name: 'Rahul Sharma',
        customer_cin: 'CIN/MSC/2026/000001',
        vehicle_reg_no: 'MH12AB1234',
        job_card_no: 'JC/MSC1/2026/0001',
        status: 'DRAFT',
        grand_total: 800
      },
      {
        id: 'DBILL-PARAG-002',
        draft_bill_no: 'DB/MSC1/2026/0012',
        customer_name: 'Parag Gulve',
        customer_cin: 'CIN/MSC/2026/000011',
        vehicle_reg_no: 'MG20TH9827',
        job_card_no: 'JC/MSC1/2026/0015',
        job_card_id: 'JC-002',
        estimate_id: 'EST-PARAG-001',
        estimate_no: 'EST/MSC1/2026/0010-R1',
        status: 'DRAFT',
        items: [
          { id: 'ITM-1', code: 'LBR-001', name: 'General Service Labour', type: 'LABOUR', qty: 2, rate: 250, amount: 500 },
          { id: 'ITM-2', code: 'PRT-002', name: 'Brake Shoe Rear', type: 'PART', qty: 1, rate: 355, amount: 355 },
          { id: 'ITM-3', code: '2W-SPR-ENGINE-GASKET-KIT-006', name: 'Engine Gasket Kit', type: 'PART', qty: 1, rate: 150, amount: 150 },
          { id: 'ITM-4', code: '2W-BRK-PAD-01', name: 'Front Disc Brake Pad', type: 'PART', qty: 1, rate: 150, amount: 150 }
        ],
        grand_total: 1155
      }
    ],
    finalBills: [],
    billingEstimates: [
      {
        id: 'EST-PARAG-001',
        estimate_no: 'EST/MSC1/2026/0010-R1',
        customer_name: 'Parag Gulve',
        customer_mobile: '9887737737',
        customer_cin: 'CIN/MSC/2026/000011',
        vehicle_reg_no: 'MG20TH9827',
        vehicle_model: 'Honda Activa 6G',
        odometer_km: '9,877 km',
        job_card_id: 'JC-002',
        job_card_no: 'JC/MSC1/2026/0015',
        status: 'CONVERTED',
        converted_to_type: 'DRAFT_BILL',
        converted_to_no: 'DB/MSC1/2026/0012',
        converted_to_id: 'DBILL-PARAG-002',
        items: [
          { id: 'ITM-1', code: 'LBR-001', name: 'General Service Labour', type: 'LABOUR', qty: 2, rate: 250, amount: 500 },
          { id: 'ITM-2', code: 'PRT-002', name: 'Brake Shoe Rear', type: 'PART', qty: 1, rate: 355, amount: 355 },
          { id: 'ITM-3', code: '2W-SPR-ENGINE-GASKET-KIT-006', name: 'Engine Gasket Kit', type: 'PART', qty: 1, rate: 150, amount: 150 },
          { id: 'ITM-4', code: '2W-BRK-PAD-01', name: 'Front Disc Brake Pad', type: 'PART', qty: 1, rate: 150, amount: 150 }
        ],
        estimated_total: 1155
      }
    ],
    vehicles: [
      { id: 'VEH-01', registration_no: 'MG20TH9827', model: 'Honda Activa 6G' }
    ],
    plants: [
      { id: 'PLANT-01', name: 'Mauli Service Center', gstin: '27AAAAA0000A1Z5' }
    ]
  };

  const mockDB = {
    data: store,
    getAll(coll) {
      return store[coll] || [];
    },
    getById(coll, id) {
      return (store[coll] || []).find(x => x.id === id || x.job_card_no === id || x.estimate_no === id);
    },
    upsert(coll, item) {
      if (!store[coll]) store[coll] = [];
      const idx = store[coll].findIndex(x => x.id === item.id);
      if (idx >= 0) {
        store[coll][idx] = { ...store[coll][idx], ...item };
      } else {
        store[coll].push(item);
      }
    },
    emitChange() {},
    saveData() {},
    getDefaultTax() {
      return { rate: 0, cgst_rate: 0, sgst_rate: 0, name: 'GST 0%' };
    }
  };

  const mockState = {
    currentPlantId: 'PLANT-01',
    getCurrentUser: () => ({ primary_role: 'ADMIN', branch_id: 'PLANT-01' }),
    showToast(msg, type) {
      console.log(`[Toast ${type}]: ${msg}`);
    },
    closeModal() {},
    showModal() {}
  };

  const mockDoc = {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => []
  };

  const win = {
    location: mockLocation,
    DB: mockDB,
    State: mockState,
    BillingModule: null
  };

  const context = vm.createContext({
    window: win,
    document: mockDoc,
    navigator: {},
    console,
    DB: mockDB,
    State: mockState,
    parseInt: parseInt,
    parseFloat: parseFloat,
    Date: Date,
    Math: Math,
    Number: Number,
    String: String,
    Array: Array,
    Object: Object,
    Set: Set,
    setTimeout: (fn) => fn()
  });

  vm.runInContext(billingCode, context);
  const BillingModule = win.BillingModule || context.BillingModule;
  BillingModule.refresh = function() {};

  console.log('--- TEST 1: activeBillingBillId previously pointing to another patient (Rahul Sharma) ---');
  BillingModule.activeBillingBillId = 'DBILL-RAHUL-001';
  assert.strictEqual(BillingModule.getActiveCustomerBillingBill().customer_name, 'Rahul Sharma');
  console.log('✓ Initial active bill is Rahul Sharma.');

  console.log('--- TEST 2: Clicking View Customer Billing from Parag Gulve Estimate screen ---');
  currentHash = '#/billing-estimates';
  BillingModule.activeEstimateId = 'EST-PARAG-001';
  BillingModule.activeTab = 'ESTIMATES';

  // Trigger viewBillFromEstimate for Parag Gulve
  BillingModule.viewBillFromEstimate('EST-PARAG-001');

  // Verify tab, route hash, and active bill
  assert.strictEqual(BillingModule.activeTab, 'CUSTOMER_BILLING', 'activeTab must be CUSTOMER_BILLING');
  assert.strictEqual(currentHash, '#/customer-billing', 'Hash must be #/customer-billing');
  assert.strictEqual(BillingModule.activeBillingBillId, 'DBILL-PARAG-002', 'activeBillingBillId must be DBILL-PARAG-002');

  const activeBill = BillingModule.getActiveCustomerBillingBill();
  assert.ok(activeBill, 'Active bill must exist');
  assert.strictEqual(activeBill.customer_name, 'Parag Gulve', 'Customer name must be Parag Gulve');
  assert.strictEqual(activeBill.customer_cin, 'CIN/MSC/2026/000011', 'CIN must match Parag Gulve');
  assert.strictEqual(activeBill.draft_bill_no, 'DB/MSC1/2026/0012', 'Draft bill no must match converted_to_no');
  assert.strictEqual(activeBill.job_card_no, 'JC/MSC1/2026/0015', 'Job Card must match');
  assert.strictEqual(activeBill.vehicle_reg_no, 'MG20TH9827', 'Vehicle reg must match');
  assert.strictEqual(activeBill.items.length, 4, 'Must have 4 items from estimate');
  assert.strictEqual(activeBill.grand_total, 1155, 'Grand total must be 1155');
  console.log('✓ Test 2 Passed: Exactly Parag Gulve bill is loaded on billing screen.');

  console.log('--- TEST 3: Calling viewBillFromEstimate with no arguments (uses active estimate) ---');
  BillingModule.activeBillingBillId = null;
  BillingModule.activeEstimateId = 'EST-PARAG-001';
  BillingModule.viewBillFromEstimate();
  assert.strictEqual(BillingModule.activeBillingBillId, 'DBILL-PARAG-002');
  assert.strictEqual(BillingModule.getActiveCustomerBillingBill().customer_name, 'Parag Gulve');
  console.log('✓ Test 3 Passed: Fallback to getActiveEstimate worked.');

  console.log('--- TEST 4: Estimate has converted_to_no but bill was not yet in draftBills ---');
  store.billingEstimates.push({
    id: 'EST-NEW-003',
    estimate_no: 'EST/MSC1/2026/0099',
    customer_name: 'Anita Deshmukh',
    customer_mobile: '9766000000',
    customer_cin: 'CIN/MSC/2026/000099',
    vehicle_reg_no: 'MH14XY9999',
    job_card_no: 'JC/MSC1/2026/0099',
    status: 'CONVERTED',
    converted_to_type: 'DRAFT_BILL',
    converted_to_no: 'DB/MSC1/2026/0099',
    items: [{ id: 'ITM-99', name: 'Oil Filter Replacement', type: 'PART', qty: 1, rate: 300, amount: 300 }]
  });

  BillingModule.viewBillFromEstimate('EST-NEW-003');
  const bill3 = BillingModule.getActiveCustomerBillingBill();
  assert.ok(bill3, 'Created draft bill must exist');
  assert.strictEqual(bill3.customer_name, 'Anita Deshmukh');
  assert.strictEqual(bill3.customer_cin, 'CIN/MSC/2026/000099');
  assert.strictEqual(bill3.draft_bill_no, 'DB/MSC1/2026/0099');
  console.log('✓ Test 4 Passed: Auto-created/synced bill and selected it for Anita Deshmukh.');

  console.log('--- TEST 5: Odometer Formatting & Job Card Odometer Sync ---');
  assert.strictEqual(BillingModule.formatOdometerDisplay('10,000 km'), '10,000 km');
  assert.strictEqual(BillingModule.formatOdometerDisplay(''), '0 km');
  assert.strictEqual(BillingModule.formatOdometerDisplay(undefined), '0 km');
  assert.strictEqual(BillingModule.formatOdometerDisplay(null), '0 km');
  assert.strictEqual(BillingModule.formatOdometerDisplay(0), '0 km');
  assert.strictEqual(BillingModule.formatOdometerDisplay('0'), '0 km');
  assert.strictEqual(BillingModule.formatOdometerDisplay('—'), '0 km');
  assert.strictEqual(BillingModule.formatOdometerDisplay('25430'), '25,430 km');

  // Verify getActiveEstimate syncs missing or default odometer with Job Card's odometer_km
  const estTest = {
    id: 'EST-ODO-TEST',
    estimate_no: 'EST/TEST/001',
    job_card_id: 'JC-002', // Parag Gulve's Job Card with odometer_km: 10000
    odometer_km: '—',
    items: []
  };
  BillingModule.syncEstimateOdometerFromJobCard(estTest);
  assert.strictEqual(estTest.odometer_km, '9,877 km', 'Odometer should sync from linked Job Card (9877 -> 9,877 km)');
  console.log('✓ Test 5 Passed: Odometer formatting and Job Card sync work as expected.');

  console.log('\n========================================');
  console.log('ALL TESTS PASSED SUCCESSFULLY!');
  console.log('========================================');
}

runTest();
