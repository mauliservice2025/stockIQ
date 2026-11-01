const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

console.log('================================================================');
console.log('VERIFYING VEHICLE ACTIVE JOB CARD LOCK UNTIL BILL FINALIZED');
console.log('================================================================\n');

const billingJs = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');

// 1. Verify code contains definitions
assert(billingJs.includes('isJobCardBillFinalized(jc)'), 'Must define isJobCardBillFinalized');
assert(billingJs.includes('getUnfinalizedJobCardForVehicle(cleanReg)'), 'Must define getUnfinalizedJobCardForVehicle');
assert(billingJs.includes('new-jc-active-lock-container'), 'Must have new-jc-active-lock-container');
assert(billingJs.includes('btn-create-jc-submit'), 'Must have btn-create-jc-submit');

console.log('✓ PASS: Static code contains method definitions and DOM ids');

// 2. Set up VM Sandbox
let toasts = [];
let alerts = [];
let dbData = {
  jobCards: [
    {
      id: 'JC-0005',
      job_card_no: 'JC/MSC1/2026/0005',
      vehicle_reg_no: 'MH14BH4335',
      customer_name: 'Seema Patel',
      customer_mobile: '7263037533',
      status: 'READY_FOR_BILLING',
      date: '2026-10-18'
    }
  ],
  finalBills: [],
  vehicles: [
    {
      id: 'VEH-001',
      vehicle_reg_no: 'MH14BH4335',
      customer_name: 'Seema Patel',
      customer_mobile: '7263037533'
    }
  ],
  customers: [],
  vehicleModels: [{ id: 'MOD-01', name: 'TVS Jupiter 125' }]
};

const makeNode = (extra = {}) => ({
  style: {},
  dataset: {},
  value: '',
  ...extra
});

const domNodes = {
  'new-jc-active-lock-container': makeNode({ style: { display: 'none' }, innerHTML: '' }),
  'new-jc-history-container': makeNode({ style: { display: 'none' }, innerHTML: '' }),
  'btn-create-jc-submit': makeNode({ disabled: false, title: '' }),
  'new-jc-reg-feedback': makeNode({ style: { display: 'none' }, innerHTML: '' }),
  'new-jc-no': makeNode({ value: 'JC/MSC1/2026/0008' }),
  'new-jc-date': makeNode({ value: '2026-10-18' }),
  'new-jc-customer': makeNode({ value: 'Seema Patel' }),
  'new-jc-mobile': makeNode({ value: '7263037533' }),
  'new-jc-alt-mobile': makeNode({ value: '' }),
  'new-jc-email': makeNode({ value: '' }),
  'new-jc-address': makeNode({ value: 'Pune' }),
  'new-jc-city': makeNode({ value: 'Pune' }),
  'new-jc-district': makeNode({ value: 'Pune' }),
  'new-jc-state': makeNode({ value: 'Maharashtra' }),
  'new-jc-pincode': makeNode({ value: '412101' }),
  'new-jc-customer-type': makeNode({ value: 'Walk-in Customer' }),
  'new-jc-gstin': makeNode({ value: '' }),
  'new-jc-reg': makeNode({ value: 'MH 14 BH 4335' }),
  'new-jc-model': makeNode({ tagName: 'SELECT', value: 'MOD-01', selectedOptions: [{ text: 'TVS Jupiter 125' }] }),
  'new-jc-km': makeNode({ value: '10000' }),
  'new-jc-fuel': makeNode({ value: '50%' }),
  'new-jc-mfg-year': makeNode({ value: '2023' }),
  'new-jc-chassis': makeNode({ value: '' }),
  'new-jc-engine': makeNode({ value: '' }),
  'new-jc-color': makeNode({ value: '' }),
  'new-jc-ins-co': makeNode({ value: '' }),
  'new-jc-ins-policy': makeNode({ value: '' }),
  'new-jc-service-type': makeNode({ value: 'General Service' }),
  'new-jc-tech': makeNode({ tagName: 'SELECT', value: 'Santosh Shinde', selectedOptions: [{ text: 'Santosh Shinde' }] }),
  'new-jc-delivery': makeNode({ value: '' }),
  'new-jc-complaints': makeNode({ value: 'Servicing' }),
  'new-jc-diagnosis': makeNode({ value: '' }),
  'new-jc-cin': makeNode({ value: 'CIN/MSC1/2026/000003' })
};

global.document = {
  getElementById: (id) => domNodes[id] || makeNode(),
  querySelector: () => null
};

global.window = {
  DB: {
    getAll: (table) => dbData[table] || [],
    getById: (table, id) => (dbData[table] || []).find(x => x.id === id),
    upsert: (table, doc) => {
      if (!dbData[table]) dbData[table] = [];
      const idx = dbData[table].findIndex(x => x.id === doc.id);
      if (idx >= 0) dbData[table][idx] = doc;
      else dbData[table].push(doc);
    },
    saveData: () => {},
    emitChange: () => {},
    logAudit: () => {},
    normalizeVehicleReg: (r) => String(r || '').replace(/\s+/g, '').toUpperCase(),
    detectVehicleRegType: () => 'STANDARD',
    formatVehicleRegDisplay: (r) => r,
    getRegistrationConfig: () => ({ customer_fields: [], vehicle_fields: [], business_rules: {} }),
    getActivePlants: () => [{ id: 'PLANT-01', code: 'MSC1', name: 'Mauli Service Center 1' }]
  },
  State: {
    showToast: (msg, type) => { toasts.push({ msg, type }); },
    closeModal: () => {},
    currentPlantId: 'PLANT-01'
  },
  alert: (msg) => { alerts.push(msg); }
};

const sandbox = {
  window: global.window,
  document: global.document,
  console: console,
  alert: global.window.alert,
  Number: Number,
  Math: Math,
  parseInt: parseInt,
  parseFloat: parseFloat,
  isNaN: isNaN,
  Array: Array,
  Date: Date,
  JSON: JSON
};

vm.createContext(sandbox);

const script = new vm.Script(`
  globalThis.BillingModule = {
    jobCardFacilityId: 'PLANT-01',
    toTitleCase: (s) => s,
    validateIndianVehicleNumber: () => ({ valid: true }),
    formatIndianVehicleNumber: (s) => s,
    generateJobCardNumber: () => 'JC/MSC1/2026/0008',
    refresh: () => {},
    ${billingJs.slice(billingJs.indexOf('isJobCardBillFinalized(jc) {'), billingJs.indexOf('saveNewJobCard() {'))}
    ${billingJs.slice(billingJs.indexOf('saveNewJobCard() {'), billingJs.indexOf('updateCustomerInformationOnly() {'))}
  };
`);

script.runInContext(sandbox);

// -------------------------------------------------------------
// SCENARIO 1: Vehicle MH 14 BH 4335 has an unfinalized Job Card (JC-0005)
// -------------------------------------------------------------
console.log('--- Test 1: Active Job Card with Unfinalized Bill ---');
const jc5 = dbData.jobCards[0];
assert.strictEqual(sandbox.BillingModule.isJobCardBillFinalized(jc5), false, 'JC-0005 status READY_FOR_BILLING must not be finalized');

const unfinalized = sandbox.BillingModule.getUnfinalizedJobCardForVehicle('MH 14 BH 4335');
assert(unfinalized !== null, 'Must detect unfinalized job card');
assert.strictEqual(unfinalized.job_card_no, 'JC/MSC1/2026/0005');

// Test auto-fill UI feedback
sandbox.BillingModule.lookupAndAutoFillVehicleDetails('MH 14 BH 4335');
assert.strictEqual(domNodes['new-jc-active-lock-container'].style.display, 'block', 'Lock banner must be shown');
assert(domNodes['new-jc-active-lock-container'].innerHTML.includes('Cannot Create Job Card — Bill Not Final'), 'Banner must explain why');
assert.strictEqual(domNodes['btn-create-jc-submit'].disabled, true, 'Submit button must be disabled');

// Attempt to submit
const initialJcCount = dbData.jobCards.length;
sandbox.BillingModule.saveNewJobCard();
assert.strictEqual(dbData.jobCards.length, initialJcCount, 'Job Card creation must be blocked');
assert(alerts.some(a => a.includes('Active Job Card Pending Final Bill')), 'Must show alert explaining unfinalized job card');

console.log('✓ PASS: System successfully blocked creating another Job Card when bill is not final');
console.log('✓ PASS: UI displays prominent lock alert and disables Create Job Card button');

// -------------------------------------------------------------
// SCENARIO 2: Bill is finalized for JC-0005
// -------------------------------------------------------------
console.log('\n--- Test 2: Bill is Finalized ---');
// Finalize bill for JC-0005: status becomes BILLED and finalBills record exists
jc5.status = 'BILLED';
jc5.invoice_no = 'INV/MSC1/2026/000001';
dbData.finalBills.push({
  id: 'INV-1',
  invoice_no: 'INV/MSC1/2026/000001',
  job_card_id: 'JC-0005',
  job_card_no: 'JC/MSC1/2026/0005',
  status: 'PAID'
});

assert.strictEqual(sandbox.BillingModule.isJobCardBillFinalized(jc5), true, 'JC-0005 must now be finalized');
const unfinalizedAfterBilling = sandbox.BillingModule.getUnfinalizedJobCardForVehicle('MH 14 BH 4335');
assert.strictEqual(unfinalizedAfterBilling, null, 'No unfinalized job card should exist');

// Test auto-fill UI updates
sandbox.BillingModule.lookupAndAutoFillVehicleDetails('MH 14 BH 4335');
assert.strictEqual(domNodes['new-jc-active-lock-container'].style.display, 'none', 'Lock banner must be hidden when bill is final');
assert.strictEqual(domNodes['btn-create-jc-submit'].disabled, false, 'Submit button must be enabled');

// Attempt to submit new Job Card
alerts = [];
sandbox.BillingModule.saveNewJobCard();
assert.strictEqual(dbData.jobCards.length, initialJcCount + 1, 'New Job Card must be created');
const createdJc = dbData.jobCards[dbData.jobCards.length - 1];
assert.strictEqual(createdJc.vehicle_reg_no, 'MH14BH4335');
assert.strictEqual(createdJc.job_card_no, 'JC/MSC1/2026/0008');

console.log('✓ PASS: When bill is finalized, system permits creating new Job Card');
console.log('✓ PASS: New Job Card JC/MSC1/2026/0008 created successfully for vehicle MH 14 BH 4335');

// -------------------------------------------------------------
// SCENARIO 3: First-time vehicle visit
// -------------------------------------------------------------
console.log('\n--- Test 3: First-Time Vehicle Visit ---');
const newReg = 'MH12CD5678';
assert.strictEqual(sandbox.BillingModule.getUnfinalizedJobCardForVehicle(newReg), null);
sandbox.BillingModule.lookupAndAutoFillVehicleDetails(newReg);
assert.strictEqual(domNodes['new-jc-active-lock-container'].style.display, 'none');
assert.strictEqual(domNodes['btn-create-jc-submit'].disabled, false);

console.log('✓ PASS: First-time vehicles are allowed to create Job Cards with no locks');

console.log('\n================================================================');
console.log('🎉 ALL VEHICLE ACTIVE JOB CARD LOCK TESTS PASSED (100%)!');
console.log('================================================================\n');
