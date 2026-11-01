const fs = require('fs');
const assert = require('assert');

console.log('================================================================');
console.log('TESTING TECHNICIANS FROM USER MASTER IN JOB CARD');
console.log('================================================================');

// 1. Setup mock environment
let lastModalConfig = null;
let lastToast = null;
const mockJobCards = [];

// Seed sample users in mock DB representing User Master
const mockUsers = [
  {
    id: 'USR-001',
    employee_id: 'EMP-9042',
    full_name: 'Pravin Patil',
    display_name: 'Pravin Patil',
    user_type: 'Admin',
    designation: 'Chief Technology Officer & System Admin',
    status: 'ACTIVE'
  },
  {
    id: 'USR-002',
    employee_id: 'EMP-9002',
    full_name: 'Rushikesh Dhiwar',
    display_name: 'Rushikesh Dhiwar',
    user_type: 'Employee',
    designation: 'Senior Warehouse & Store Manager',
    status: 'ACTIVE'
  },
  {
    id: 'USR-106',
    employee_id: 'EMP-9106',
    full_name: 'Sagar Sable',
    display_name: 'Sagar Sable',
    user_type: 'Employee',
    designation: 'Store Operations Executive',
    status: 'ACTIVE'
  },
  // User marked as Technician in User Master (matching user's screenshot: USR-108 / EMP-9108)
  {
    id: 'USR-108',
    employee_id: 'EMP-9108',
    full_name: 'Santosh Shinde',
    display_name: 'Santosh Shinde',
    user_type: 'Technician',
    designation: 'Senior Workshop Technician',
    status: 'ACTIVE'
  },
  // Another User marked as Technician in User Master
  {
    id: 'USR-109',
    employee_id: 'EMP-9109',
    full_name: 'Vikram Rathod',
    display_name: 'Vikram Rathod',
    user_type: 'Technician',
    designation: 'Electrical Specialist Technician',
    status: 'ACTIVE'
  },
  // Inactive technician (should be excluded)
  {
    id: 'USR-999',
    employee_id: 'EMP-9999',
    full_name: 'Ex-Technician Inactive',
    display_name: 'Ex-Technician Inactive',
    user_type: 'Technician',
    designation: 'Former Technician',
    status: 'INACTIVE'
  }
];

const mockVehicleModels = [
  { id: 'MOD-01', manufacturer_id: 'VM-01', name: 'Activa 6G', variant: 'Deluxe (BS6)', active: true }
];

const mockWarehouses = [
  { id: 'WH-PUN-MAIN', name: 'Main Store', warehouse_type: 'CENTRAL_HUB', active: true }
];

global.window = {
  DB: {
    getAll: (table) => {
      if (table === 'users') return mockUsers;
      if (table === 'jobCards') return mockJobCards;
      if (table === 'vehicleModels') return mockVehicleModels;
      if (table === 'vehicleManufacturers') return [{ id: 'VM-01', name: 'Honda' }];
      return [];
    },
    getById: (table, id) => {
      if (table === 'jobCards') return mockJobCards.find(j => j.id === id);
      if (table === 'users') return mockUsers.find(u => u.id === id);
      return null;
    },
    getActiveWarehouses: () => mockWarehouses,
    upsert: (table, obj) => {
      if (table === 'jobCards') mockJobCards.push(obj);
      if (table === 'users') mockUsers.push(obj);
    },
    emitChange: () => {},
    isPlantActive: () => true,
    isWarehouseActive: () => true
  },
  State: {
    showModal: (config) => { lastModalConfig = config; },
    closeModal: () => {},
    showToast: (msg, type) => { lastToast = { msg, type }; }
  }
};

eval(fs.readFileSync('js/modules/billing.js', 'utf8'));
eval(fs.readFileSync('js/modules/store-inventory.js', 'utf8'));

// TEST 1: Check that showNewJobCardModal renders technicians from User Master
console.log('\n--- TEST 1: Technician Dropdown in Billing Create Job Card ---');
window.BillingModule.showNewJobCardModal();
assert(lastModalConfig, 'showNewJobCardModal must display a modal');
const html1 = lastModalConfig.contentHtml;

assert(html1.includes('id="new-jc-tech"'), 'Modal must have select element #new-jc-tech');
assert(html1.includes('Santosh Shinde'), 'Santosh Shinde (user_type: Technician) must be in dropdown');
assert(html1.includes('Vikram Rathod'), 'Vikram Rathod (user_type: Technician) must be in dropdown');
assert(!html1.includes('Ex-Technician Inactive'), 'Inactive technician must NOT be in dropdown');
assert(!html1.includes('Rushikesh Dhiwar (Senior Warehouse'), 'Non-technician Employee must NOT be in technician dropdown');
assert(!html1.includes('Pravin Patil (Chief Technology'), 'Non-technician Admin must NOT be in technician dropdown');

console.log('✓ PASS: Only active users marked as Technician in User Master appear in Job Card technician dropdown');

// TEST 2: Dynamically add a new user marked as Technician (as in the screenshot)
console.log('\n--- TEST 2: Dynamically Register New Technician in User Master ---');
const newTechnician = {
  id: 'USR-115',
  employee_id: 'EMP-9115',
  full_name: 'Rajesh Sharma',
  display_name: 'Rajesh Sharma',
  user_type: 'Technician',
  designation: 'Brake & Chassis Specialist',
  status: 'ACTIVE'
};
mockUsers.push(newTechnician);

// Re-open Create Job Card Modal
window.BillingModule.showNewJobCardModal();
const html2 = lastModalConfig.contentHtml;
assert(html2.includes('Rajesh Sharma'), 'Newly added user with user_type: Technician must immediately appear in dropdown');
assert(html2.includes('Brake & Chassis Specialist'), 'Newly added technician designation must appear');
console.log('✓ PASS: Newly registered technician from User Master immediately visible in Job Card: Rajesh Sharma');

// TEST 3: Saving Job Card with the newly registered technician
console.log('\n--- TEST 3: Saving Job Card with Technician ---');
global.document = {
  getElementById: (id) => {
    const mockElements = {
      'new-jc-no': { value: 'JC-PUN-26-099' },
      'new-jc-date': { value: '2026-10-08' },
      'new-jc-customer': { value: 'Amit Verma' },
      'new-jc-mobile': { value: '9811223344' },
      'new-jc-reg': { value: 'MH-14-CC-3322' },
      'new-jc-model': {
        tagName: 'SELECT',
        value: 'MOD-01',
        selectedOptions: [{ value: 'MOD-01', getAttribute: () => 'Activa 6G', text: 'Activa 6G' }]
      },
      'new-jc-km': { value: '8500' },
      'new-jc-fuel': { value: '75%' },
      'new-jc-service-type': { value: 'Paid Service' },
      'new-jc-tech': {
        tagName: 'SELECT',
        value: 'Rajesh Sharma',
        selectedOptions: [{
          value: 'Rajesh Sharma',
          getAttribute: (attr) => attr === 'data-id' ? 'USR-115' : 'Rajesh Sharma',
          text: 'Rajesh Sharma (Brake & Chassis Specialist)'
        }]
      },
      'new-jc-delivery': { value: '2026-10-09T18:00' },
      'new-jc-complaints': { value: 'Brake squeal' },
      'new-jc-diagnosis': { value: 'Rear brake shoes replacement' }
    };
    return mockElements[id] || { value: '' };
  }
};

window.BillingModule.saveNewJobCard();

const savedJc = mockJobCards.find(j => j.job_card_no === 'JC-PUN-26-099');
assert(savedJc, 'Job Card must be saved');
assert.strictEqual(savedJc.technician_name, 'Rajesh Sharma', 'Technician name must be saved as Rajesh Sharma');
assert.strictEqual(savedJc.technician_id, 'USR-115', 'Technician id must be saved as USR-115');
console.log('✓ PASS: Job Card correctly persisted with technician_name: ' + savedJc.technician_name + ' & technician_id: ' + savedJc.technician_id);

// TEST 4: View Job Card displays Assigned Technician
console.log('\n--- TEST 4: View Job Card Details Modal ---');
window.BillingModule.viewJobCard(savedJc.id);
assert(lastModalConfig, 'viewJobCard must display modal');
assert(lastModalConfig.contentHtml.includes('Rajesh Sharma'), 'viewJobCard modal must display assigned technician name');
assert(lastModalConfig.contentHtml.includes('Assigned Technician'), 'viewJobCard modal must have Assigned Technician label');
console.log('✓ PASS: viewJobCard modal cleanly displays Assigned Technician: Rajesh Sharma');

// TEST 5: StoreInventoryModule Create Job Card Modal
console.log('\n--- TEST 5: Store Inventory Module Create Job Card Modal ---');
window.StoreInventoryModule.showCreateJobCardModal();
assert(lastModalConfig, 'showCreateJobCardModal must display modal');
const htmlStore = lastModalConfig.contentHtml;
assert(htmlStore.includes('id="jc-tech-id"'), 'Store Inventory modal must have #jc-tech-id');
assert(htmlStore.includes('Rajesh Sharma'), 'Rajesh Sharma must be in Store Inventory modal technician dropdown');
console.log('✓ PASS: StoreInventoryModule also correctly fetches technicians from User Master');

console.log('\n================================================================');
console.log('🎉 ALL TECHNICIAN USER MASTER TESTS PASSED (100%)!');
console.log('================================================================\n');
