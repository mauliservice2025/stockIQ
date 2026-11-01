const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Mock DOM & environment
global.window = global;
global.document = {
  getElementById: (id) => null
};
global.alert = (msg) => console.log('Alert:', msg);

const users = [
  { id: "USR-107", employee_name: "Sanket Borole", full_name: "Sanket Borole", user_type: "Technician", designation: "Mechanic", status: "ACTIVE" }
];

window.DB = {
  data: {
    users: users,
    jobCards: [],
    vehicleModels: [{ id: 'VM-01', name: 'Activa 6G', active: true }],
    vehicleManufacturers: [{ id: 'MFG-01', name: 'Honda' }]
  },
  getAll: (coll) => window.DB.data[coll] || [],
  getById: () => null,
  getActivePlants: () => [
    { id: 'PLANT-01', name: 'Mauli Service Center - I', code: 'MSC-1' },
    { id: 'PLANT-02', name: 'Mauli Service Center - II', code: 'MSC-2' }
  ],
  getRegistrationConfig: () => ({ customer_fields: [], vehicle_fields: [] })
};

let capturedModal = null;
window.State = {
  showModal: (opts) => { capturedModal = opts; },
  closeModal: () => {},
  showToast: (msg) => console.log('Toast:', msg)
};

// Load billing.js
const billingCode = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');
eval(billingCode);

console.log('Testing User Job Card UI Fixes...');

window.BillingModule.showNewJobCardModal('PLANT-01');

assert(capturedModal, 'Modal should be triggered');

// 1. Verify Workshop Facility is moved to upper side (modal title)
console.log('\n--- 1. Workshop Facility in Title (Upper Side) ---');
assert(capturedModal.title.includes('Workshop Facility:'), 'Modal title must contain Workshop Facility label');
assert(capturedModal.title.includes('id="new-jc-facility-select"'), 'Modal title must contain facility select dropdown');
assert(!capturedModal.contentHtml.includes('<!-- Facility / Branch Switcher -->'), 'Facility switcher div must be removed from modal content body');
console.log('✓ Workshop Facility successfully moved to upper side (header bar).');

// 2. Verify keyword "Doc Series" is removed
console.log('\n--- 2. Keyword "Doc Series" Removal ---');
assert(!capturedModal.contentHtml.includes('Doc Series'), 'Modal content must NOT contain keyword "Doc Series"');
assert(capturedModal.contentHtml.includes('placeholder="Auto-generated"'), 'CIN input placeholder must be Auto-generated instead of Auto (Doc Series)');
assert(capturedModal.contentHtml.includes('id="new-jc-cin-badge"'), 'Kept element id new-jc-cin-badge for JS references without keyword');
console.log('✓ Keyword "Doc Series" completely removed from modal UI.');

// 3. Verify shortened complaints placeholder
console.log('\n--- 3. Shortened Customer Complaints Placeholder ---');
assert(!capturedModal.contentHtml.includes('check rear brake squeal'), 'Old long placeholder must not exist');
assert(capturedModal.contentHtml.includes('placeholder="e.g. Oil change, brake squeal, chain lube"'), 'Shortened placeholder must be used');
console.log('✓ Customer Complaints placeholder shortened successfully.');

// 4. Verify compact spacing and removal of dead space
console.log('\n--- 4. Compact Spacing & Removed Space ---');
assert.strictEqual(capturedModal.compactHeader, true, 'compactHeader must be true');
assert.strictEqual(capturedModal.bodyPadding, '6px 14px 2px 14px', 'bodyPadding must be compact');
assert.strictEqual(capturedModal.footerPadding, '6px 14px', 'footerPadding must be compact');
console.log('✓ Modal spacing compacted and dead space eliminated.');

console.log('\n🎉 ALL 4 USER FIXES VERIFIED AND PASSING SUCCESSFULLY!\n');
