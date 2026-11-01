// Scratch verification script for Facility Master integration with Billing and Invoicing
const fs = require('fs');
const path = require('path');

// Mock window and browser globals
const window = {
  State: { currentPlantId: 'PLANT-01' }
};
global.window = window;

// Mock localStorage
const mockStorage = {};
const localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, val) => { mockStorage[key] = String(val); },
  removeItem: (key) => { delete mockStorage[key]; }
};

// Load mock-data.js
const mockDataCode = fs.readFileSync(path.join(__dirname, '../js/data/mock-data.js'), 'utf8');
const vm = require('vm');
const context = { window, console, global, setTimeout, setInterval, clearInterval, clearTimeout, localStorage };
vm.createContext(context);
vm.runInContext(mockDataCode, context);
if (context.INITIAL_DATA) {
  window.INITIAL_DATA = context.INITIAL_DATA;
}

// Load db.js
const dbCode = fs.readFileSync(path.join(__dirname, '../js/data/db.js'), 'utf8');
vm.runInContext(dbCode, context);
window.DB = context.window.DB;

// Load billing.js
const billingCode = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');
vm.runInContext(billingCode, context);
window.BillingModule = context.window.BillingModule;

console.log('--- 1. Testing Default Facility Master fetch for PLANT-01 ---');
const plant1 = window.DB.getById('plants', 'PLANT-01');
console.log('Plant 1 in DB:', {
  id: plant1.id,
  code: plant1.code,
  branch_code: plant1.branch_code,
  name: plant1.name,
  address: plant1.address,
  city: plant1.city,
  state: plant1.state,
  pincode: plant1.pincode,
  mobile_number: plant1.mobile_number,
  gstin: plant1.gstin
});

const fac1 = window.BillingModule.getFacilityDetails({ branch_id: 'PLANT-01' });
console.log('BillingModule.getFacilityDetails for PLANT-01:');
console.log('  displayName:', fac1.displayName);
console.log('  address:    ', fac1.address);
console.log('  phone:      ', fac1.phone);
console.log('  gstin:      ', fac1.gstin);

if (fac1.address !== `${plant1.address}, ${plant1.city}, ${plant1.state} - ${plant1.pincode}`) {
  console.error('FAIL: fac1.address does not match facility master!');
  process.exit(1);
}
if (!fac1.phone.replace(/\D/g, '').includes(plant1.mobile_number.replace(/\D/g, ''))) {
  console.error('FAIL: fac1.phone does not match facility master mobile_number!');
  process.exit(1);
}

console.log('\n--- 2. Testing Dynamic Updates in Facility Master ---');
// User edits facility master address and phone:
window.DB.update('plants', 'PLANT-01', {
  name: 'Mauli Central Super Workshop',
  address: 'Shop No. 7 & 8, Diamond Plaza, Karve Road',
  city: 'Pune',
  state: 'Maharashtra',
  pincode: '411038',
  mobile_number: '9123456789',
  gstin: '27AABCT9999Z1Z1'
});

const updatedFac1 = window.BillingModule.getFacilityDetails({ branch_id: 'PLANT-01' });
console.log('After Facility Master Update:');
console.log('  displayName:', updatedFac1.displayName);
console.log('  address:    ', updatedFac1.address);
console.log('  phone:      ', updatedFac1.phone);
console.log('  gstin:      ', updatedFac1.gstin);

if (!updatedFac1.address.includes('Shop No. 7 & 8, Diamond Plaza, Karve Road, Pune, Maharashtra - 411038')) {
  console.error('FAIL: Updated address did not reflect from Facility Master!');
  process.exit(1);
}
if (!updatedFac1.phone.includes('91234 56789')) {
  console.error('FAIL: Updated phone did not reflect from Facility Master!');
  process.exit(1);
}
if (updatedFac1.gstin !== '27AABCT9999Z1Z1') {
  console.error('FAIL: Updated GSTIN did not reflect from Facility Master!');
  process.exit(1);
}

console.log('\n--- 3. Testing Invoice Resolution by invoice_no (e.g. INV/MSC1/2026/0005) ---');
const invFac = window.BillingModule.getFacilityDetails({ invoice_no: 'INV/MSC1/2026/0005' });
console.log('Resolved by invoice_no:');
console.log('  displayName:', invFac.displayName);
console.log('  address:    ', invFac.address);
console.log('  phone:      ', invFac.phone);
if (invFac.id !== 'PLANT-01') {
  console.error('FAIL: Invoice with MSC1 did not resolve to PLANT-01!');
  process.exit(1);
}

console.log('\n--- 4. Testing PLANT-02 (MSC2) ---');
const fac2 = window.BillingModule.getFacilityDetails({ branch_id: 'PLANT-02' });
const plant2 = window.DB.getById('plants', 'PLANT-02');
console.log('PLANT-02 resolved:');
console.log('  displayName:', fac2.displayName);
console.log('  address:    ', fac2.address);
console.log('  phone:      ', fac2.phone);
console.log('  gstin:      ', fac2.gstin);
if (!fac2.address.includes(plant2.address)) {
  console.error('FAIL: PLANT-02 address did not match plant2 in master!');
  process.exit(1);
}

console.log('\nALL FACILITY MASTER INTEGRATION TESTS PASSED SUCCESSFULLY! ✅');
