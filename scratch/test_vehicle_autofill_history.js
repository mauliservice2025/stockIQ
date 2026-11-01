// Test Vehicle Auto-Fetch Customer Details and History Rendering
const fs = require('fs');
const path = require('path');

// Mock browser environment
const dom = {};
const elements = {};

function createMockElement(id, tagName = 'input') {
  return {
    id,
    tagName: tagName.toUpperCase(),
    value: '',
    style: {},
    dataset: {},
    innerHTML: '',
    innerText: '',
    placeholder: '',
    title: '',
    className: '',
    options: [],
    selectedOptions: [],
    focus() {},
    setAttribute(k, v) { this[k] = v; },
    getAttribute(k) { return this[k]; }
  };
}

global.document = {
  getElementById(id) {
    if (!elements[id]) {
      elements[id] = createMockElement(id);
    }
    return elements[id];
  }
};

global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; },
  clear() { this.store = {}; }
};

global.window = {
  DB: null,
  State: {
    currentPlantId: 'PLANT-01',
    currentUser: { name: 'Pravin Patil' },
    showToast() {},
    closeModal() {},
    hasPermission() { return true; }
  },
  BillingModule: null
};

// Load DB
const { DatabaseLayer } = require('../js/data/db.js');
window.DB = new DatabaseLayer();

// Initialize sample data
window.DB.data.customers = [
  {
    id: 'CUST-001',
    cin_number: 'CIN/MSC1/2026/000101',
    cin: 'CIN/MSC1/2026/000101',
    name: 'Vikram Joshi',
    mobile: '9876543210',
    alt_mobile: '9876500000',
    email: 'vikram.joshi@example.com',
    address: 'Flat 402, Green Acres, Baner',
    city: 'Pune',
    district: 'Pune',
    state: 'Maharashtra',
    pincode: '411045',
    customer_type: 'Retail Individual',
    gstin: '27AABCU9603R1ZM'
  }
];

window.DB.data.vehicles = [
  {
    id: 'VEH-PUN-001',
    vehicle_id: 'VEH-PUN-001',
    vehicle_reg_no: 'MH12AB1234',
    vehicle_reg_no_display: 'MH 12 AB 1234',
    reg_type: 'STANDARD',
    customer_name: 'Vikram Joshi',
    customer_mobile: '9876543210',
    model_id: 'MOD-01',
    model_name: 'Splendor Plus',
    chassis_no: 'MBLHA10EYH1234567',
    engine_no: 'HA10ENH7654321',
    color: 'Candy Blazing Red',
    mfg_year: 2023,
    insurance_company: 'ICICI Lombard',
    insurance_policy_no: 'POL-ICICI-998877',
    odometer_km: 14500,
    status: 'ACTIVE'
  }
];

window.DB.data.jobCards = [
  {
    id: 'JC-2026-001',
    job_card_no: 'JC/MSC1/2026/000001',
    cin_number: 'CIN/MSC1/2026/000101',
    vehicle_reg_no: 'MH12AB1234',
    vehicle_reg_no_display: 'MH 12 AB 1234',
    date: '2026-06-15',
    service_type: 'Periodic Maintenance Service',
    odometer_km: 10200,
    complaints: '10K Periodic Service, Engine oil change, Front brake noise',
    diagnosis: 'Brake pads worn, chain lubrication required',
    technician: 'Ramesh Pawar',
    status: 'COMPLETED',
    customer_name: 'Vikram Joshi',
    customer_mobile: '9876543210',
    customer_alt_mobile: '9876500000',
    customer_email: 'vikram.joshi@example.com',
    customer_address: 'Flat 402, Green Acres, Baner',
    customer_city: 'Pune',
    customer_district: 'Pune',
    customer_state: 'Maharashtra',
    customer_pincode: '411045',
    customer_type: 'Retail Individual',
    customer_gstin: '27AABCU9603R1ZM',
    parts_required: [{ item_name: 'Engine Oil 4T 10W-30', qty: 1 }, { item_name: 'Front Brake Pad Kit', qty: 1 }],
    labour_jobs: [{ name: 'Periodic Service Inspection' }, { name: 'Brake Cleaning & Overhaul' }]
  },
  {
    id: 'JC-2026-002',
    job_card_no: 'JC/MSC1/2026/000045',
    cin_number: 'CIN/MSC1/2026/000101',
    vehicle_reg_no: 'MH12AB1234',
    vehicle_reg_no_display: 'MH 12 AB 1234',
    date: '2026-09-20',
    service_type: 'General Service',
    odometer_km: 14500,
    complaints: 'Clutch slipping on hill climb, chain slack',
    diagnosis: 'Clutch friction plates worn out',
    technician: 'Suresh Patil',
    status: 'DELIVERED',
    customer_name: 'Vikram Joshi',
    customer_mobile: '9876543210',
    customer_alt_mobile: '9876500000',
    customer_email: 'vikram.joshi@example.com',
    customer_address: 'Flat 402, Green Acres, Baner',
    customer_city: 'Pune',
    customer_district: 'Pune',
    customer_state: 'Maharashtra',
    customer_pincode: '411045',
    customer_type: 'Retail Individual',
    customer_gstin: '27AABCU9603R1ZM',
    parts_required: [{ item_name: 'Clutch Plate Set', qty: 1 }],
    labour_jobs: [{ name: 'Clutch Overhaul Labour' }]
  }
];

// Load billing.js
const billingCode = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');
eval(billingCode);

console.log('Testing Vehicle Lookup and Auto-Fill...');

// Setup model dropdown options in mock element
const modelEl = document.getElementById('new-jc-model');
modelEl.options = [
  { value: 'MOD-01', dataset: { model: 'Splendor Plus', name: 'Hero Splendor Plus' }, text: 'Hero Splendor Plus' },
  { value: 'MOD-02', dataset: { model: 'Activa 6G', name: 'Honda Activa 6G' }, text: 'Honda Activa 6G' }
];

// 1. Test auto-fetch when vehicle registration is entered
window.BillingModule.lookupAndAutoFillVehicleDetails('MH 12 AB 1234');

// Assert Customer fields populated
console.log('Customer Name:', document.getElementById('new-jc-customer').value);
console.log('Customer Mobile:', document.getElementById('new-jc-mobile').value);
console.log('Customer CIN:', document.getElementById('new-jc-cin').value);
console.log('Customer City:', document.getElementById('new-jc-city').value);
console.log('Customer PIN:', document.getElementById('new-jc-pincode').value);
console.log('Customer GSTIN:', document.getElementById('new-jc-gstin').value);

if (document.getElementById('new-jc-customer').value !== 'Vikram Joshi') {
  throw new Error('Customer Name was not auto-fetched!');
}
if (document.getElementById('new-jc-mobile').value !== '9876543210') {
  throw new Error('Customer Mobile was not auto-fetched!');
}
if (document.getElementById('new-jc-cin').value !== 'CIN/MSC1/2026/000101') {
  throw new Error('Customer CIN was not auto-fetched!');
}
if (document.getElementById('new-jc-pincode').value !== '411045') {
  throw new Error('Customer PIN was not auto-fetched!');
}

// Assert Vehicle fields populated
console.log('Vehicle Model:', document.getElementById('new-jc-model').value);
console.log('Chassis No:', document.getElementById('new-jc-chassis').value);
console.log('Engine No:', document.getElementById('new-jc-engine').value);
console.log('Color:', document.getElementById('new-jc-color').value);
console.log('Insurance Co:', document.getElementById('new-jc-ins-co').value);
console.log('Odometer Placeholder:', document.getElementById('new-jc-km').placeholder);

if (document.getElementById('new-jc-model').value !== 'MOD-01') {
  throw new Error('Vehicle Model was not auto-selected!');
}
if (document.getElementById('new-jc-chassis').value !== 'MBLHA10EYH1234567') {
  throw new Error('Chassis No was not auto-fetched!');
}
if (!document.getElementById('new-jc-km').placeholder.includes('14,500')) {
  throw new Error('Previous Odometer was not displayed in placeholder!');
}

// Assert History container rendered
const histContainer = document.getElementById('new-jc-history-container');
console.log('History container display:', histContainer.style.display);
if (histContainer.style.display !== 'block') {
  throw new Error('History container is not displayed!');
}
if (!histContainer.innerHTML.includes('JC/MSC1/2026/000045') || !histContainer.innerHTML.includes('JC/MSC1/2026/000001')) {
  throw new Error('Previous job cards were not rendered in history table!');
}
if (!histContainer.innerHTML.includes('Returning Vehicle (2 Visits)')) {
  throw new Error('Returning Vehicle visit count badge missing!');
}

console.log('✓ All 2 past visits successfully rendered in previous history panel!');

// 2. Test First-Time Visit Vehicle
window.BillingModule.lookupAndAutoFillVehicleDetails('MH 14 ZZ 9999');
console.log('First-Time Vehicle History HTML:', histContainer.innerHTML);
if (!histContainer.innerHTML.includes('First-Time Visit')) {
  throw new Error('First-Time Visit badge was not rendered for unknown vehicle!');
}

console.log('✓ First-time visit banner successfully verified!');

// 3. Test Empty Registration clears container
window.BillingModule.lookupAndAutoFillVehicleDetails('');
if (histContainer.style.display !== 'none' || histContainer.innerHTML !== '') {
  throw new Error('History container was not hidden for empty registration!');
}

console.log('✓ Empty registration clears history container!');
console.log('\nALL VEHICLE AUTO-FETCH AND HISTORY TESTS PASSED SUCCESSFULLY! 🎉');
