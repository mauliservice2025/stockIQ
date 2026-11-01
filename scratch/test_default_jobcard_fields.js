// Test script to verify Create New Job Card modal default fields
const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Mock DOM & window
global.window = global;
global.document = {
  getElementById: (id) => null
};

const users = [
  {
    id: "USR-107",
    employee_name: "Sanket Borole",
    full_name: "Sanket Borole",
    user_type: "Technician",
    designation: "Mechanic",
    status: "ACTIVE"
  },
  {
    id: "USR-108",
    employee_name: "Santosh Shinde",
    full_name: "Santosh Shinde",
    user_type: "Technician",
    designation: "Senior Workshop Technician",
    status: "ACTIVE"
  }
];

window.DB = {
  data: {
    users: users,
    jobCards: [],
    vehicleModels: [{ id: 'VM-01', name: 'Activa 6G', active: true }],
    vehicleManufacturers: [{ id: 'MFG-01', name: 'Honda' }],
    pincodes: [],
    cities: [],
    districts: [],
    states: []
  },
  getAll: (coll) => window.DB.data[coll] || [],
  getById: () => null,
  getActivePlants: () => [{ id: 'PLANT-01', name: 'Mauli Service Center - I' }],
  getRegistrationConfig: () => ({ customer_fields: [], vehicle_fields: [] })
};
global.alert = (msg) => console.log('Alert:', msg);

let capturedModal = null;
window.State = {
  showModal: (opts) => { capturedModal = opts; },
  closeModal: () => {},
  showToast: (msg) => console.log('Toast:', msg)
};

// Load billing.js
const billingCode = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');
eval(billingCode);

console.log('Testing Create New Job Card modal default fields...');

window.BillingModule.showNewJobCardModal('PLANT-01');
assert(capturedModal, 'Modal should be triggered');
const html = capturedModal.contentHtml;

// 1. Customer Type: Walk-in Customer selected
assert(
  html.includes('<option value="Walk-in Customer" selected>Walk-in Customer</option>'),
  'Customer Type must default to Walk-in Customer selected'
);
console.log('✓ Customer Type defaults to "Walk-in Customer"');

// 2. PIN Code: 412101, City: Haveli, District: Pune, State: Maharashtra, Auto-fetched feedback
assert(
  html.includes('id="new-jc-pincode" class="form-control cell-mono form-control-sm" value="412101"'),
  'PIN code must default to 412101'
);
assert(
  html.includes('id="new-jc-city" class="form-control form-control-sm" value="Haveli"'),
  'City must default to Haveli'
);
assert(
  html.includes('id="new-jc-district" class="form-control form-control-sm" value="Pune"'),
  'District must default to Pune'
);
assert(
  html.includes('id="new-jc-state" class="form-control form-control-sm" value="Maharashtra"'),
  'State must default to Maharashtra'
);
assert(
  html.includes('id="new-jc-pin-feedback"') && html.includes('✓ Auto-fetched: <b>Haveli, Pune, Maharashtra</b>'),
  'PIN feedback must display auto-fetched Haveli, Pune, Maharashtra'
);
console.log('✓ PIN Code defaults to 412101 with Haveli, Pune, Maharashtra auto-fetched');

// 3. Service Type: General Service selected
assert(
  html.includes('<option value="General Service" selected>General Service</option>'),
  'Service Type must default to General Service selected'
);
console.log('✓ Service Type defaults to "General Service"');

// 4. Technician Assigned: Sanket Borole (Mechanic) selected
assert(
  html.includes('value="Sanket Borole"') && html.includes('selected>Sanket Borole (Mechanic)</option>'),
  'Technician Assigned must default to Sanket Borole (Mechanic) selected'
);
console.log('✓ Technician Assigned defaults to "Sanket Borole (Mechanic)"');

// 5. Customer Complaints & Instructions: Servicing
assert(
  html.includes('id="new-jc-complaints"') && html.includes('>Servicing</textarea>'),
  'Customer Complaints must default to Servicing'
);
console.log('✓ Customer Complaints & Instructions defaults to "Servicing"');

// Test PIN code lookup for 412101 returns Haveli, Pune, Maharashtra
const pinDetails = window.BillingModule.lookupPincodeLocal('412101');
assert(pinDetails, '412101 should be found in local database');
assert.strictEqual(pinDetails.city, 'Haveli');
assert.strictEqual(pinDetails.district, 'Pune');
assert.strictEqual(pinDetails.state, 'Maharashtra');
console.log('✓ PIN Code 412101 resolves locally to Haveli, Pune, Maharashtra');

console.log('\nALL DEFAULT FIELD TESTS PASSED SUCCESSFULLY! 🎯');
