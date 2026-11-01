const fs = require('fs');
const assert = require('assert');

// Setup mock DOM & environment
let capturedModalHtml = '';
const window = {
  State: {
    showToast: (msg, type) => console.log(`[Toast ${type}]: ${msg}`),
    showModal: (options) => {
      capturedModalHtml = options.contentHtml || options.content;
    }
  }
};
const mockDataCode = fs.readFileSync('js/data/mock-data.js', 'utf8');
eval(mockDataCode + '; window.INITIAL_DATA = INITIAL_DATA;');

window.DB = {
  data: {
    users: [
      { id: 'USR-001', employee_id: 'EMP-9042', full_name: 'Pravin Patil', first_name: 'Pravin', last_name: 'Patil', user_type: 'Admin', designation: 'Chief Technology Officer & System Admin', department: 'Management Information Systems', email: 'pravinp@apexind.com', mobile_number: '9822011234', plant_id: 'PLANT-01', status: 'ACTIVE' },
      { id: 'USR-002', employee_id: 'EMP-9002', full_name: 'Rushikesh Dhiwar', first_name: 'Rushikesh', last_name: 'Dhiwar', user_type: 'Employee', designation: 'Senior Warehouse & Store Manager', department: 'Warehouse & Stores', email: 'r.sharma@apexind.com', mobile_number: '9833022345', plant_id: 'PLANT-01', status: 'ACTIVE' },
      { id: 'USR-003', employee_id: 'EMP-9003', full_name: 'Anita Desai', first_name: 'Anita', last_name: 'Desai', user_type: 'Employee', designation: 'Manager - Strategic Sourcing & PO', department: 'Procurement & Supply', email: 'a.desai@apexind.com', mobile_number: '9844033456', plant_id: 'PLANT-01', status: 'ACTIVE' },
      { id: 'USR-106', employee_id: 'EMP-9106', full_name: 'Sagar Sable', first_name: 'Sagar', last_name: 'Sable', user_type: 'Employee', designation: 'Store Operations Executive', department: 'Hydraulics Assembly Dept', email: 'sagar.sable@stockiq.com', mobile_number: '9820260106', plant_id: 'PLANT-01', status: 'ACTIVE' }
    ],
    employees: window.INITIAL_DATA.employees,
    roles: [{ id: 'ROLE-01', name: 'Super Admin' }],
    plants: [{ id: 'PLANT-01', name: 'Pune Central Plant', code: 'PUN-01' }],
    departments: [
      { id: 'DEPT-01', name: 'Management Information Systems', code: 'MIS' },
      { id: 'DEPT-02', name: 'Warehouse & Stores', code: 'WHS' }
    ]
  },
  getAll(collection) {
    return this.data[collection] || [];
  }
};

global.window = window;
global.document = {
  getElementById: (id) => null
};

// Load UserManagementModule
const userMgmtCode = fs.readFileSync('js/modules/user-management.js', 'utf8');
eval(userMgmtCode);

const UMM = window.UserManagementModule;

console.log('Testing UserManagementModule Register Modal generation...');

UMM.showCreateUserModal();

assert(capturedModalHtml, 'Modal content should be generated');

// 1. Verify Ribbon Title
assert(capturedModalHtml.includes('Link with User Master'), 'Ribbon title should say Link with User Master');
assert(!capturedModalHtml.includes('Link with Employee / Staff Master'), 'Old title should NOT be present');

// 2. Verify Select options contain User Master users
assert(capturedModalHtml.includes('-- Choose User from User Master to Auto-populate --'), 'Default option text should reference User Master');
assert(capturedModalHtml.includes('EMP-9042: Pravin Patil'), 'Should list Pravin Patil');
assert(capturedModalHtml.includes('EMP-9002: Rushikesh Dhiwar'), 'Should list Rushikesh Dhiwar');
assert(capturedModalHtml.includes('EMP-9003: Anita Desai'), 'Should list Anita Desai');
assert(capturedModalHtml.includes('EMP-9106: Sagar Sable'), 'Should list Sagar Sable');

// 3. Verify No hospital personnel in HTML
assert(!capturedModalHtml.includes('Dr. Amit Sharma'), 'Should not have Dr. Amit Sharma');
assert(!capturedModalHtml.includes('Dr. Sunita Rao'), 'Should not have Dr. Sunita Rao');
assert(!capturedModalHtml.includes('Rekha Nair'), 'Should not have Rekha Nair');
assert(!capturedModalHtml.includes('Doctor'), 'User type select should not have Doctor');
assert(!capturedModalHtml.includes('Nurse'), 'User type select should not have Nurse');

// 4. Verify onEmployeeSelect fills the form fields from users collection
const formFields = {};
global.document = {
  querySelectorAll: () => [],
  getElementById: (id) => {
    if (!formFields[id]) {
      formFields[id] = { value: '', options: [], style: {}, dataset: {}, focus: () => {}, setAttribute: () => {}, removeAttribute: () => {} };
    }
    return formFields[id];
  }
};

UMM.onEmployeeSelect('USR-106');

assert.strictEqual(formFields['new-user-empid'].value, 'EMP-9106', 'Employee ID should be EMP-9106');
assert.strictEqual(formFields['new-user-empname'].value, 'Sagar Sable', 'Employee Name should be Sagar Sable');
assert.strictEqual(formFields['new-user-firstname'].value, 'Sagar', 'First name should be Sagar');
assert.strictEqual(formFields['new-user-lastname'].value, 'Sable', 'Last name should be Sable');
assert.strictEqual(formFields['new-user-email'].value, 'sagar.sable@stockiq.com', 'Email should match');
assert.strictEqual(formFields['new-user-mobile'].value, '9820260106', 'Mobile should match');

console.log('✅ ALL TESTS PASSED: Auto-populate dropdown strictly shows User Master data and properly populates user fields!');
