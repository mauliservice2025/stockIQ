const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Setup mock DOM elements for modal inputs
const domElements = {};

function createMockElement(id, tagName = 'input', initialValue = '') {
  domElements[id] = {
    id,
    tagName: tagName.toUpperCase(),
    value: initialValue,
    placeholder: '',
    title: '',
    style: {},
    dataset: {},
    options: tagName === 'select' ? [
      { value: '', text: '-- Select --' },
      { value: 'VM-01', text: 'Activa 6G', dataset: { name: 'Activa 6G', model: 'Activa 6G' } },
      { value: 'VM-02', text: 'Pulsar 150', dataset: { name: 'Pulsar 150', model: 'Pulsar 150' } },
      { value: 'Sanket Borole', text: 'Sanket Borole (Mechanic)' }
    ] : [],
    innerHTML: '',
    innerText: '',
    disabled: false
  };
  return domElements[id];
}

// Populate elements
createMockElement('new-jc-reg', 'input');
createMockElement('new-jc-reg-feedback', 'div');
createMockElement('new-jc-model', 'select');
createMockElement('new-jc-km', 'input');
createMockElement('new-jc-fuel', 'select', '50%');
createMockElement('new-jc-mfg-year', 'input');
createMockElement('new-jc-chassis', 'input');
createMockElement('new-jc-engine', 'input');
createMockElement('new-jc-color', 'input');
createMockElement('new-jc-ins-co', 'input');
createMockElement('new-jc-ins-policy', 'input');
createMockElement('new-jc-active-lock-container', 'div');
createMockElement('new-jc-history-container', 'div');

createMockElement('new-jc-no', 'input', 'JC/MSC1/2026/0029');
createMockElement('new-jc-date', 'input', '2026-10-24');
createMockElement('new-jc-cin', 'input');
createMockElement('new-jc-cin-badge', 'span');
createMockElement('new-jc-customer', 'input');
createMockElement('new-jc-mobile', 'input');
createMockElement('new-jc-alt-mobile', 'input');
createMockElement('new-jc-customer-type', 'select', 'Walk-in Customer');
createMockElement('new-jc-address', 'input');
createMockElement('new-jc-city', 'input', 'Haveli');
createMockElement('new-jc-district', 'input', 'Pune');
createMockElement('new-jc-state', 'input', 'Maharashtra');
createMockElement('new-jc-pincode', 'input', '412101');
createMockElement('new-jc-pin-feedback', 'div');
createMockElement('new-jc-email', 'input');
createMockElement('new-jc-gstin', 'input');
createMockElement('new-jc-customer-feedback', 'div');

createMockElement('new-jc-service-type', 'select', 'General Service');
createMockElement('new-jc-tech', 'select', 'Sanket Borole');
createMockElement('new-jc-delivery', 'input');
createMockElement('new-jc-complaints', 'textarea', 'Servicing');
createMockElement('new-jc-diagnosis', 'textarea');
createMockElement('btn-create-jc-submit', 'button');

global.window = global;
global.document = {
  getElementById: (id) => domElements[id] || null
};
global.alert = (msg) => console.log('Alert:', msg);

// Mock DB with vehicles and job cards
const mockVehicles = [
  {
    vehicle_reg_no: 'MH 12 SC 3737',
    vehicle_reg_no_display: 'MH 12 SC 3737',
    vehicle_model_id: 'VM-01',
    customer_name: 'Kiran Rane',
    customer_mobile: '9876545678',
    chassis_no: 'ME4MD123456789012',
    engine_no: 'ENG-3737-12',
    color: 'Matte Black',
    mfg_year: 2022,
    insurance_company: 'ICICI Lombard',
    insurance_policy_no: 'POL-3737'
  },
  {
    vehicle_reg_no: 'MH 14 DE 5678',
    vehicle_reg_no_display: 'MH 14 DE 5678',
    vehicle_model_id: 'VM-02',
    customer_name: 'Rahul Sharma',
    customer_mobile: '9123456780',
    chassis_no: 'ME4MD999999999999',
    engine_no: 'ENG-5678-99',
    color: 'Red',
    mfg_year: 2023,
    insurance_company: 'Bajaj Allianz',
    insurance_policy_no: 'POL-5678'
  }
];

const mockJobCards = [
  {
    id: 'JC-0017',
    job_card_no: 'JC/MSC1/2026/0017',
    vehicle_reg_no: 'MH 12 SC 3737',
    vehicle_reg_no_display: 'MH 12 SC 3737',
    customer_name: 'Kiran Rane',
    customer_mobile: '9876545678',
    customer_city: 'Haveli',
    customer_district: 'Pune',
    customer_state: 'Maharashtra',
    customer_pincode: '412101',
    cin_number: 'CIN/MSC/2026/000013',
    status: 'READY_FOR_BILLING',
    date: '2026-10-21',
    odometer_km: 14200
  },
  {
    id: 'JC-0010',
    job_card_no: 'JC/MSC1/2026/0010',
    vehicle_reg_no: 'MH 14 DE 5678',
    vehicle_reg_no_display: 'MH 14 DE 5678',
    customer_name: 'Rahul Sharma',
    customer_mobile: '9123456780',
    customer_city: 'Chinchwad',
    customer_district: 'Pune',
    customer_state: 'Maharashtra',
    customer_pincode: '411019',
    cin_number: 'CIN/MSC/2026/000008',
    status: 'CLOSED',
    invoice_no: 'INV-001',
    date: '2026-09-15',
    odometer_km: 8500
  }
];

window.DB = {
  data: {
    users: [{ id: 'USR-107', full_name: 'Sanket Borole', user_type: 'Technician' }],
    jobCards: mockJobCards,
    vehicles: mockVehicles,
    customers: [
      { name: 'Kiran Rane', mobile: '9876545678', cin_number: 'CIN/MSC/2026/000013', city: 'Haveli', district: 'Pune', state: 'Maharashtra', pincode: '412101' },
      { name: 'Rahul Sharma', mobile: '9123456780', cin_number: 'CIN/MSC/2026/000008', city: 'Chinchwad', district: 'Pune', state: 'Maharashtra', pincode: '411019' }
    ],
    finalBills: []
  },
  getAll: (coll) => window.DB.data[coll] || [],
  getById: (coll, id) => (window.DB.data[coll] || []).find(x => x.id === id),
  getActivePlants: () => [{ id: 'PLANT-01', name: 'Mauli Service Center - I' }],
  normalizeVehicleReg: (reg) => String(reg || '').replace(/\s+/g, '').toUpperCase(),
  formatVehicleRegDisplay: (reg) => reg,
  getRegistrationConfig: () => ({ customer_fields: [], vehicle_fields: [] })
};

window.State = {
  showModal: (opts) => {},
  closeModal: () => {},
  showToast: (msg) => console.log('Toast:', msg)
};

// Load billing.js
const billingCode = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');
eval(billingCode);

console.log('=== TEST: Vehicle Number Search & Automatic Field Clearing ===\n');

// 1. Initial State: Open modal
window.BillingModule.showNewJobCardModal('PLANT-01');

// 2. Search Vehicle: User types "MH 12 SC 3737"
console.log('Step 1: Searching vehicle "MH 12 SC 3737"...');
window.BillingModule.lookupAndAutoFillVehicleDetails('MH 12 SC 3737');

assert.strictEqual(domElements['new-jc-customer'].value, 'Kiran Rane', 'Customer Name must be Kiran Rane');
assert.strictEqual(domElements['new-jc-mobile'].value, '9876545678', 'Customer Mobile must be 9876545678');
assert.strictEqual(domElements['new-jc-cin'].value, 'CIN/MSC/2026/000013', 'Customer CIN must be loaded');
assert.strictEqual(domElements['new-jc-model'].value, 'VM-01', 'Vehicle Model must be Activa 6G (VM-01)');
assert.strictEqual(domElements['new-jc-active-lock-container'].style.display, 'block', 'Active lock banner must display for unfinalized JC');
assert.strictEqual(domElements['btn-create-jc-submit'].disabled, true, 'Submit button must be locked for active JC');
console.log('✓ Correct vehicle details, customer info, and lock alert loaded on screen.');

// 3. User removes a digit from the number: "MH 12 SC 373"
console.log('\nStep 2: User removes a digit -> "MH 12 SC 373"...');
window.BillingModule.lookupAndAutoFillVehicleDetails('MH 12 SC 373');

assert.strictEqual(domElements['new-jc-customer'].value, '', 'Customer Name must be cleared');
assert.strictEqual(domElements['new-jc-mobile'].value, '', 'Customer Mobile must be cleared');
assert.strictEqual(domElements['new-jc-cin'].value, '', 'Customer CIN must be cleared');
assert.strictEqual(domElements['new-jc-cin-badge'].style.display, 'none', 'CIN badge must be hidden');
assert.strictEqual(domElements['new-jc-model'].value, '', 'Vehicle Model must be cleared');
assert.strictEqual(domElements['new-jc-chassis'].value, '', 'Chassis must be cleared');
assert.strictEqual(domElements['new-jc-engine'].value, '', 'Engine must be cleared');
assert.strictEqual(domElements['new-jc-complaints'].value, 'Servicing', 'Complaints must reset to default Servicing');
assert.strictEqual(domElements['new-jc-service-type'].value, 'General Service', 'Service Type must reset to default General Service');
assert.strictEqual(domElements['new-jc-active-lock-container'].style.display, 'none', 'Lock container must be cleared/hidden');
assert.strictEqual(domElements['btn-create-jc-submit'].disabled, false, 'Submit button must be unlocked');
console.log('✓ Section 2 (Customer Information) and Section 3 (Service Scope) successfully cleared!');
console.log('✓ Section 1 vehicle details and lock banner successfully cleared!');

// 4. User types back "7" to complete "MH 12 SC 3737"
console.log('\nStep 3: User re-enters "MH 12 SC 3737"...');
window.BillingModule.lookupAndAutoFillVehicleDetails('MH 12 SC 3737');

assert.strictEqual(domElements['new-jc-customer'].value, 'Kiran Rane', 'Customer Name must re-populate Kiran Rane');
assert.strictEqual(domElements['new-jc-mobile'].value, '9876545678', 'Customer Mobile must re-populate 9876545678');
assert.strictEqual(domElements['new-jc-model'].value, 'VM-01', 'Vehicle Model must re-populate VM-01');
console.log('✓ Information re-populated accurately upon typing full number.');

// 5. User changes to a DIFFERENT vehicle: "MH 14 DE 5678"
console.log('\nStep 4: User changes vehicle plate to "MH 14 DE 5678"...');
window.BillingModule.lookupAndAutoFillVehicleDetails('MH 14 DE 5678');

assert.strictEqual(domElements['new-jc-customer'].value, 'Rahul Sharma', 'Customer Name must update to Rahul Sharma');
assert.strictEqual(domElements['new-jc-mobile'].value, '9123456780', 'Customer Mobile must update to 9123456780');
assert.strictEqual(domElements['new-jc-cin'].value, 'CIN/MSC/2026/000008', 'Customer CIN must update to Rahul Sharma CIN');
assert.strictEqual(domElements['new-jc-model'].value, 'VM-02', 'Vehicle Model must update to Pulsar 150 (VM-02)');
assert.strictEqual(domElements['new-jc-city'].value, 'Chinchwad', 'City must update to Chinchwad');
assert.strictEqual(domElements['new-jc-pincode'].value, '411019', 'Pincode must update to 411019');
assert.strictEqual(domElements['new-jc-active-lock-container'].style.display, 'none', 'Lock container must not be displayed for settled vehicle');
assert.strictEqual(domElements['btn-create-jc-submit'].disabled, false, 'Submit button must be active');
console.log('✓ New vehicle info (Rahul Sharma, Pulsar 150) cleanly loaded replacing previous vehicle.');

// 6. User clears input completely: ""
console.log('\nStep 5: User clears registration field completely -> ""...');
window.BillingModule.lookupAndAutoFillVehicleDetails('');

assert.strictEqual(domElements['new-jc-customer'].value, '', 'Customer Name must be empty');
assert.strictEqual(domElements['new-jc-mobile'].value, '', 'Customer Mobile must be empty');
assert.strictEqual(domElements['new-jc-cin'].value, '', 'Customer CIN must be empty');
assert.strictEqual(domElements['new-jc-model'].value, '', 'Vehicle Model must be empty');
console.log('✓ Completely cleared state verified.');

console.log('\n🎉 ALL VEHICLE CHANGE & AUTOMATIC FIELD CLEARING TESTS PASSED (5/5)!\n');
