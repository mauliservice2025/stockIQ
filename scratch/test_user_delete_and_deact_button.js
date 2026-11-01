const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TEST: USER MASTER SHORT DEACT BUTTON & CASCADE DELETE ===\n');

// Mock browser environment
global.window = global;
global.window.location = { hash: '#/users' };
global.window.addEventListener = () => {};
global.window.dispatchEvent = () => {};
global.confirm = () => true; // Auto-confirm prompts in tests
global.CustomEvent = class {};
global.localStorage = {
  _s: {},
  getItem(k) { return this._s[k] || null; },
  setItem(k, v) { this._s[k] = String(v); },
  removeItem(k) { delete this._s[k]; }
};

const makeElem = () => ({
  innerHTML: '',
  value: '',
  textContent: '',
  innerText: '',
  classList: { add() {}, remove() {}, contains() { return false; }, toggle() {} },
  style: {
    setProperty(prop, val) { this[prop] = val; }
  },
  querySelectorAll: () => [],
  querySelector: () => null,
  setAttribute() {},
  removeAttribute() {},
  getAttribute() { return null; },
  remove() {}
});

global.document = {
  documentElement: makeElem(),
  body: makeElem(),
  getElementById: () => makeElem(),
  querySelector: () => makeElem(),
  querySelectorAll: () => [],
  addEventListener: () => {}
};

eval(fs.readFileSync('js/data/mock-data.js', 'utf8'));
window.INITIAL_DATA = INITIAL_DATA;
eval(fs.readFileSync('js/data/db.js', 'utf8'));
eval(fs.readFileSync('js/state.js', 'utf8'));
eval(fs.readFileSync('js/app.js', 'utf8'));
eval(fs.readFileSync('js/modules/user-management.js', 'utf8'));

// TEST 1: Check HTML output of User Master table for short Deact button and Delete button
const userMasterHtml = window.UserManagementModule.renderUserMaster();

assert(userMasterHtml.includes('>Deact</button>'), 'User Master HTML must render short "Deact" button');
assert(userMasterHtml.includes('title="Deactivate User Account"'), 'Deact button must have tooltip title');
console.log('✓ TEST 1 PASSED: User Master table displays short "Deact" button instead of long "Deactivate".');

assert(userMasterHtml.includes('onclick="window.UserManagementModule.deleteUser('), 'User Master HTML must render delete button');
assert(userMasterHtml.includes('title="Delete User Account"'), 'Delete button must have "Delete User Account" title');
console.log('✓ TEST 2 PASSED: User Master table renders dedicated Delete button.');

// TEST 3: Root owner USR-001 cannot be deleted
let toastMsg = '';
window.State.showToast = (msg, type) => { toastMsg = msg; };
window.UserManagementModule.deleteUser('USR-001');
assert(toastMsg.includes('USR-001 cannot be deleted'), 'Root owner account USR-001 must be protected from deletion');
console.log('✓ TEST 3 PASSED: Root system administrator USR-001 is protected from deletion.');

// TEST 4: Delete a normal user and verify cascade deletion across all related screens
// Add mock warehouse access and employee records for USR-107 (Kshitij Wadhokar)
window.DB.data.user_warehouse_access = window.DB.data.user_warehouse_access || [];
window.DB.data.user_warehouse_access.push({ id: 'UWA-999', user_id: 'USR-107', warehouse_id: 'WH-01' });

const beforeUserCount = window.DB.getAll('users').length;
const userToDelete = window.DB.getById('users', 'USR-107');
assert(userToDelete, 'USR-107 must exist before deletion');

// Verify USR-107 is in User-Role Mapping before delete
const roleMappingBeforeHtml = window.UserManagementModule.renderUserRoleMapping();
assert(roleMappingBeforeHtml.includes('Kshitij Wadhokar') || roleMappingBeforeHtml.includes('KSHITIJW'), 'USR-107 must be in User-Role mapping before delete');

async function runTest() {
  // Perform delete
  await window.UserManagementModule.deleteUser('USR-107');

  // Verify deleted from users
  const afterUsers = window.DB.getAll('users');
  assert.strictEqual(afterUsers.length, beforeUserCount - 1, 'Total users count must decrease by 1');
  assert(!window.DB.getById('users', 'USR-107'), 'USR-107 must be completely removed from users collection');
  console.log('✓ TEST 4 PASSED: User USR-107 removed from users table.');

  // Verify deleted from User-Role Mapping
  const roleMappingAfterHtml = window.UserManagementModule.renderUserRoleMapping();
  assert(!roleMappingAfterHtml.includes('Kshitij Wadhokar') && !roleMappingAfterHtml.includes('KSHITIJW'), 'USR-107 must be completely absent from User-Role Mapping');
  console.log('✓ TEST 5 PASSED: User USR-107 is absent from User-Role Mapping screen.');

  // Verify cascade delete from employees
  const remainingEmp = (window.DB.data.employees || []).filter(e => e.user_id === 'USR-107');
  assert.strictEqual(remainingEmp.length, 0, 'User employee records must be cascade deleted');
  console.log('✓ TEST 6 PASSED: User employee records cascade deleted.');

  // Verify audit log recorded
  const auditLogs = window.DB.getAll('auditLogs');
  const deleteAudit = auditLogs.find(a => a.action === 'USER_DELETED' && a.record_id === 'USR-107');
  assert(deleteAudit, 'USER_DELETED audit log must be recorded');
  console.log('✓ TEST 7 PASSED: Security audit log USER_DELETED recorded.');

  // Verify User Master re-renders without USR-107
  const reRenderedHtml = window.UserManagementModule.renderUserMaster();
  assert(!reRenderedHtml.includes('KSHITIJW'), 'User Master table must no longer contain deleted user');
  console.log('✓ TEST 8 PASSED: User Master UI table rendered without deleted user.');

  console.log('\n🎉 ALL 8 TESTS PASSED SUCCESSFULLY!');
}

runTest();
