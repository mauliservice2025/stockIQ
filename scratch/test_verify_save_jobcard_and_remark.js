const fs = require('fs');
const assert = require('assert');

console.log('--- 1. Testing Removal of Mandatory Remark ---');
const billingCode = fs.readFileSync('d:/Projects/ISCM/js/modules/billing.js', 'utf8');

assert(!billingCode.includes('Fields with'), 'Mandatory remark "Fields with * are mandatory" must be removed');
assert(!billingCode.includes('are mandatory'), 'Mandatory remark must be removed');
console.log('✔ Mandatory remark successfully removed from modal header.');

console.log('\n--- 2. End-to-End Simulation: Clicking "Create Job Card" Button with User Data ---');

// Mock browser globals
const elements = {
  'new-jc-facility-select': { value: 'PLANT-01' },
  'new-jc-no': { value: 'JC-PUN-26-009' },
  'new-jc-date': { value: '2026-10-09' },
  'new-jc-cin': { value: 'CIN-MSC1-000128', trim() { return this.value; }, style: {} },
  'new-jc-customer': { value: 'Test Jan' },
  'new-jc-mobile': { value: '9876567895' },
  'new-jc-alt-mobile': { value: '' },
  'new-jc-email': { value: '' },
  'new-jc-address': { value: '' },
  'new-jc-city': { value: 'Haveli' },
  'new-jc-district': { value: 'Pune' },
  'new-jc-state': { value: 'Maharashtra' },
  'new-jc-pincode': { value: '412101' },
  'new-jc-customer-type': { value: 'Retail Individual' },
  'new-jc-gstin': { value: '' },
  'new-jc-reg': { value: 'MH 12 SC 3737', focus() {} },
  'new-jc-model': {
    tagName: 'SELECT',
    value: 'MOD-ACTIVA-125',
    selectedOptions: [{
      value: 'MOD-ACTIVA-125',
      getAttribute(attr) {
        if (attr === 'data-name') return 'Honda Activa 125 (Disc SmartXonnect)';
        if (attr === 'data-variant') return 'Disc SmartXonnect';
        return null;
      },
      text: 'Honda Activa 125 (Disc SmartXonnect)'
    }]
  },
  'new-jc-km': { value: '7654' },
  'new-jc-fuel': { value: '50% (Half Tank)' },
  'new-jc-mfg-year': { value: '2024' },
  'new-jc-chassis': { value: '' },
  'new-jc-engine': { value: '' },
  'new-jc-color': { value: '' },
  'new-jc-ins-co': { value: '' },
  'new-jc-ins-policy': { value: '' },
  'new-jc-service-type': { value: 'General Service' },
  'new-jc-tech': {
    tagName: 'SELECT',
    value: 'nitin patel',
    selectedOptions: [{
      value: 'nitin patel',
      getAttribute(attr) { if (attr === 'data-id') return 'USR-108'; return null; }
    }]
  },
  'new-jc-delivery': { value: '' },
  'new-jc-complaints': { value: 'service' },
  'new-jc-diagnosis': { value: '' }
};

// Set values getter
for (const key of Object.keys(elements)) {
  const el = elements[key];
  if (typeof el.value === 'string') {
    el.trim = function() { return this.value.trim(); };
  }
}

global.document = {
  getElementById(id) {
    return elements[id] || null;
  }
};

const store = {
  jobCards: [],
  customers: [],
  vehicles: [],
  vehicleModels: [
    { id: 'MOD-ACTIVA-125', name: 'Honda Activa 125 (Disc SmartXonnect)', variant: 'Disc SmartXonnect' }
  ],
  users: [
    { id: 'USR-108', full_name: 'nitin patel', role: 'TECHNICIAN' }
  ],
  registration_configs: [
    {
      facility_id: 'PLANT-01',
      customer_fields: [
        { field_key: 'customer_name', applicable: true, mandatory: true, label: 'Customer Name' },
        { field_key: 'mobile_number', applicable: true, mandatory: true, label: 'Mobile Number' }
      ],
      vehicle_fields: [
        { field_key: 'vehicle_reg_no', applicable: true, mandatory: true, label: 'Vehicle Registration' },
        { field_key: 'vehicle_model', applicable: true, mandatory: true, label: 'Vehicle Model' }
      ],
      business_rules: { allow_unregistered_vehicles: true }
    }
  ]
};

let modalClosed = false;
let toastShown = null;

global.window = {
  DB: {
    getAll(table) { return store[table] || []; },
    getById(table, id) { return (store[table] || []).find(i => i.id === id); },
    upsert(table, item) {
      if (!store[table]) store[table] = [];
      const idx = store[table].findIndex(i => i.id === item.id);
      if (idx >= 0) store[table][idx] = item;
      else store[table].push(item);
      return item;
    },
    emitChange() {},
    normalizeVehicleReg(val) { return (val || '').toUpperCase().replace(/[\s-]/g, ''); },
    formatVehicleRegDisplay(normalized) { return normalized; },
    detectVehicleRegType() { return 'STANDARD'; },
    getRegistrationConfig() { return store.registration_configs[0]; },
    checkDuplicateActiveVehicle() { return { isDuplicate: false }; },
    getOrCreateVehicle(data) {
      const v = { id: 'VEH-001', ...data };
      store.vehicles.push(v);
      return v;
    }
  },
  RegistrationConfigModule: {
    getFacilities() {
      return [{ id: 'PLANT-01', name: 'Mauli Service Center 1', organization_id: 'ORG-01' }];
    }
  },
  DocSeriesMasterModule: {
    generateNextNumber(type, branch) {
      return { docNumber: 'CIN-MSC1-000128' };
    }
  },
  State: {
    currentPlantId: 'PLANT-01',
    currentUser: { name: 'Pravin Patil' },
    closeModal() { modalClosed = true; },
    showToast(msg, type) { toastShown = { msg, type }; }
  }
};

global.alert = (msg) => { console.log('ALERT called:', msg); };
global.confirm = (msg) => true;

// Load module
eval(billingCode);

// Execute saveNewJobCard
console.log('Simulating click on "Create Job Card" button...');
assert(typeof window.BillingModule.saveNewJobCard === 'function', 'saveNewJobCard must be a function');

window.BillingModule.saveNewJobCard();

// Assert results
assert.strictEqual(modalClosed, true, 'Modal must be closed on successful save');
assert(toastShown, 'Success toast must be triggered');
assert.strictEqual(store.jobCards.length, 1, 'Job card must be created in store');

const createdJc = store.jobCards[0];
console.log('✔ Successfully saved Job Card:', createdJc.job_card_no);
console.log('✔ Stored Customer Name:', createdJc.customer_name);
console.log('✔ Stored Mobile:', createdJc.customer_mobile);
console.log('✔ Stored Vehicle Reg:', createdJc.vehicle_reg_no);
console.log('✔ Stored Customer CIN:', createdJc.cin_number);
console.log('✔ Stored Technician:', createdJc.technician_name);
console.log('✔ Modal closed:', modalClosed);
console.log('✔ Toast message:', toastShown.msg);

assert.strictEqual(createdJc.job_card_no, 'JC-PUN-26-009');
assert.strictEqual(createdJc.customer_name, 'Test Jan');
assert.strictEqual(createdJc.customer_mobile, '9876567895');
assert.strictEqual(createdJc.vehicle_reg_no, 'MH12SC3737');
assert.strictEqual(createdJc.cin_number, 'CIN-MSC1-000128');

console.log('\n🎉 ALL TESTS PASSED! "Create Job Card" button is fully functional and remark is removed!');
