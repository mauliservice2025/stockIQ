const fs = require('fs');
const assert = require('assert');

// 1. Verify user-management.js includes the Edit button and functions
const userMgmtCode = fs.readFileSync('js/modules/user-management.js', 'utf8');

assert(userMgmtCode.includes('window.UserManagementModule.showEditRoleModal'), 'showEditRoleModal call must exist in HTML');
assert(userMgmtCode.includes('showEditRoleModal(roleId)'), 'showEditRoleModal method must exist');
assert(userMgmtCode.includes('submitEditRole(roleId)'), 'submitEditRole method must exist');
console.log('✓ PASS: Role Edit button and methods exist in user-management.js');

// 2. Mock environment to test functionality
const storage = {};
const mockLocalStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); }
};

const domStore = {};
function createEl(tag) {
  return {
    value: '',
    innerText: '',
    innerHTML: '',
    style: {},
    classList: { add: () => {}, remove: () => {} },
    getAttribute: () => null,
    setAttribute: () => {},
    addEventListener: () => {}
  };
}

global.window = global;
global.localStorage = mockLocalStorage;
global.document = {
  getElementById: (id) => {
    if (!domStore[id]) domStore[id] = createEl('div');
    return domStore[id];
  },
  querySelector: () => null,
  querySelectorAll: () => []
};

// Load db and mock data
require('../js/data/mock-data.js');
const { DatabaseLayer } = require('../js/data/db.js');
window.DB = new DatabaseLayer();

let modalTitle = '';
let modalOpen = false;
window.State = {
  showModal: (opts) => {
    modalTitle = opts.title;
    modalOpen = true;
  },
  closeModal: () => {
    modalOpen = false;
  },
  showToast: (msg, type) => {
    console.log(`[Toast ${type}]: ${msg}`);
  }
};

require('../js/modules/user-management.js');

// Test 0: showEditRoleModal for System Administrator must be blocked
window.UserManagementModule.showEditRoleModal('ROLE-ADMIN');
assert(!modalOpen, 'Modal should NOT be open for System Administrator');
console.log('✓ PASS: showEditRoleModal for System Administrator is safely blocked');

// Test 1: showEditRoleModal for editable role
const testRole = window.DB.getAll('roles').find(r => r.id !== 'ROLE-ADMIN');
console.log('Testing with role:', testRole.id, testRole.name);

window.UserManagementModule.showEditRoleModal(testRole.id);
assert(modalOpen, 'Modal should be open');
assert(modalTitle.includes('Edit Role'), 'Modal title should mention Edit Role');
console.log('✓ PASS: showEditRoleModal opens modal successfully with title:', modalTitle);

// Test 2: submitEditRole
document.getElementById('edit-role-code').value = 'STORE_MGR';
document.getElementById('edit-role-name').value = 'Updated Role Name';
document.getElementById('edit-role-desc').value = 'Updated operational responsibilities.';
document.getElementById('edit-role-status').value = 'ACTIVE';

window.UserManagementModule.submitEditRole(testRole.id);

const updatedRole = window.DB.getById('roles', testRole.id);
assert.strictEqual(updatedRole.name, 'Updated Role Name');
assert.strictEqual(updatedRole.description, 'Updated operational responsibilities.');
console.log('✓ PASS: submitEditRole successfully updated role in DB');

console.log('\nAll role edit verification tests passed successfully!');
