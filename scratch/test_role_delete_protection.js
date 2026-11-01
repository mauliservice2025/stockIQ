const fs = require('fs');
const vm = require('vm');

const mockDataContent = fs.readFileSync('js/data/mock-data.js', 'utf8');
const dbContent = fs.readFileSync('js/data/db.js', 'utf8');
const stateContent = fs.readFileSync('js/state.js', 'utf8');
const userMgmtContent = fs.readFileSync('js/modules/user-management.js', 'utf8');

const toasts = [];
const audits = [];

const domDocument = {
  getElementById: (id) => {
    return {
      innerHTML: '',
      appendChild: () => {},
      classList: { add: () => {}, remove: () => {} },
      value: ''
    };
  },
  querySelectorAll: () => [],
  querySelector: () => null,
  createElement: (tag) => {
    return {
      className: '',
      innerHTML: '',
      parentElement: { remove: () => {} }
    };
  }
};

const sandbox = {
  window: {},
  document: domDocument,
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  },
  console: console,
  confirm: (msg) => true,
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
};
sandbox.window = sandbox;

vm.createContext(sandbox);
vm.runInContext(mockDataContent, sandbox);
vm.runInContext(dbContent, sandbox);
vm.runInContext(stateContent, sandbox);

// Hook toasts
sandbox.window.State.showToast = (msg, type) => {
  toasts.push({ msg, type });
  console.log(`[TOAST (${type})]: ${msg}`);
};

// DB is initialized automatically on instantiating DB in db.js

// Run UserManagementModule
vm.runInContext(userMgmtContent, sandbox);

const UMM = sandbox.window.UserManagementModule;

console.log('\n--- 1. Testing Role Assignment Check ---');
const roles = sandbox.window.DB.getAll('roles');
console.log('Roles found:', roles.map(r => `${r.id} (${r.name})`));

roles.forEach(r => {
  const isAssigned = UMM.isRoleAssigned(r);
  const assignedUsers = UMM.getAssignedUsersForRole(r);
  console.log(`Role ${r.id}: isAssigned=${isAssigned}, userCount=${assignedUsers.length}`);
});

console.log('\n--- 2. Testing Deletion of Assigned Role (e.g. ROLE-STORE-MGR) ---');
const storeMgrCountBefore = sandbox.window.DB.getAll('roles').length;
toasts.length = 0;
UMM.deleteRole('ROLE-STORE-MGR');
const storeMgrCountAfter = sandbox.window.DB.getAll('roles').length;

if (storeMgrCountBefore === storeMgrCountAfter) {
  console.log('PASS: ROLE-STORE-MGR was NOT deleted.');
} else {
  console.error('FAIL: ROLE-STORE-MGR was deleted!');
}

const expectedToast = 'This role is assigned to one or more users. Please deactivate the role instead.';
const foundToast = toasts.find(t => t.msg === expectedToast);
if (foundToast) {
  console.log(`PASS: Expected warning toast shown: "${foundToast.msg}"`);
} else {
  console.error('FAIL: Warning toast was NOT shown! Actual toasts:', toasts);
}

console.log('\n--- 3. Testing HTML Rendering of Role Master ---');
const html = UMM.renderRoleMaster();

if (html.includes('btn-disabled-blurred') && html.includes('filter: blur(0.8px) grayscale(50%)')) {
  console.log('PASS: Table HTML contains blurred/disabled delete button styling.');
} else {
  console.error('FAIL: Table HTML missing blurred/disabled button styling!');
}

if (html.includes('This role is assigned to one or more users. Please deactivate the role instead.')) {
  console.log('PASS: Table HTML contains the exact warning message in title/tooltip.');
} else {
  console.error('FAIL: Table HTML missing warning message in tooltip!');
}

if (html.includes('Deactivate') && html.includes('toggleRoleStatus')) {
  console.log('PASS: Table HTML contains Deactivate button and toggleRoleStatus action.');
} else {
  console.error('FAIL: Table HTML missing Deactivate button!');
}

console.log('\n--- 4. Testing Creation of Unassigned Role and Deletion ---');
const testRole = {
  id: 'ROLE-TEST-ORPHAN',
  code: 'TEST_ORPHAN',
  name: 'Orphan Test Role',
  description: 'A test role without users',
  is_system: false,
  status: 'ACTIVE',
  user_count: 0
};
sandbox.window.DB.insert('roles', testRole);

const orphanAssigned = UMM.isRoleAssigned(testRole);
console.log(`Orphan role isAssigned: ${orphanAssigned} (Expected: false)`);

const orphanCountBefore = sandbox.window.DB.getAll('roles').length;
toasts.length = 0;
UMM.deleteRole('ROLE-TEST-ORPHAN');
const orphanCountAfter = sandbox.window.DB.getAll('roles').length;

if (orphanCountAfter === orphanCountBefore - 1) {
  console.log('PASS: Unassigned role was successfully deleted.');
} else {
  console.error('FAIL: Unassigned role could not be deleted!');
}

console.log('\n--- 5. Testing Role Status Toggle (Deactivate / Activate) ---');
const testRole2 = {
  id: 'ROLE-TEST-TOGGLE',
  code: 'TEST_TOGGLE',
  name: 'Toggle Test Role',
  description: 'Role for toggle test',
  is_system: false,
  status: 'ACTIVE',
  user_count: 0
};
sandbox.window.DB.insert('roles', testRole2);

console.log('Initial status:', sandbox.window.DB.getById('roles', 'ROLE-TEST-TOGGLE').status);
UMM.toggleRoleStatus('ROLE-TEST-TOGGLE');
console.log('After deactivate:', sandbox.window.DB.getById('roles', 'ROLE-TEST-TOGGLE').status);
if (sandbox.window.DB.getById('roles', 'ROLE-TEST-TOGGLE').status === 'INACTIVE') {
  console.log('PASS: Role successfully deactivated.');
} else {
  console.error('FAIL: Role status not INACTIVE!');
}

UMM.toggleRoleStatus('ROLE-TEST-TOGGLE');
console.log('After activate:', sandbox.window.DB.getById('roles', 'ROLE-TEST-TOGGLE').status);
if (sandbox.window.DB.getById('roles', 'ROLE-TEST-TOGGLE').status === 'ACTIVE') {
  console.log('PASS: Role successfully re-activated.');
} else {
  console.error('FAIL: Role status not ACTIVE!');
}

// Clean up test role
sandbox.window.DB.delete('roles', 'ROLE-TEST-TOGGLE');

console.log('\n--- ALL ROLE MASTER DELETION PROTECTION TESTS COMPLETED ---');
