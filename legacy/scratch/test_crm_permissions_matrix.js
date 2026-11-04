const fs = require('fs');
const assert = require('assert');
const pg = require('../database/pg');

console.log('=== TEST: VERIFY CUSTOMER RELATIONSHIP (CRM) IN ROLES, PERMISSIONS & PERMISSION MATRIX ===\n');

// Mock browser environment
global.window = global;
global.window.location = { hash: '#/role-permissions' };
global.window.addEventListener = () => {};
global.window.dispatchEvent = () => {};
global.confirm = () => true;
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
  dataset: {},
  classList: { add() {}, remove() {}, contains() { return false; }, toggle() {} },
  style: {
    setProperty(prop, val) { this[prop] = val; }
  },
  querySelectorAll: () => [],
  querySelector: () => null,
  appendChild: () => {},
  setAttribute() {},
  removeAttribute() {},
  getAttribute() { return null; },
  remove() {}
});

global.document = {
  documentElement: makeElem(),
  body: makeElem(),
  createElement: () => makeElem(),
  getElementById: (id) => {
    const el = makeElem();
    el.id = id;
    return el;
  },
  querySelector: () => makeElem(),
  querySelectorAll: () => [],
  addEventListener: () => {}
};

async function runTests() {
  // Load dependencies
  eval(fs.readFileSync('js/data/mock-data.js', 'utf8'));
  window.INITIAL_DATA = INITIAL_DATA;
  eval(fs.readFileSync('js/data/db.js', 'utf8'));
  eval(fs.readFileSync('js/state.js', 'utf8'));
  eval(fs.readFileSync('js/app.js', 'utf8'));
  eval(fs.readFileSync('js/modules/user-management.js', 'utf8'));

  // TEST 1: Verify subModulesCatalog contains CRM module and submodules
  const crmCatalog = window.UserManagementModule.subModulesCatalog.filter(sm => sm.category === 'Customer Relationship (CRM)');
  assert(crmCatalog.length >= 6, `subModulesCatalog must have at least 6 CRM submodules, found: ${crmCatalog.length}`);
  
  const expectedCodes = [
    'CUSTOMER_REMINDERS',
    'REMINDER_DASHBOARD',
    'REMINDER_CONFIG',
    'REMINDER_PROCESS',
    'REMINDER_HISTORY',
    'REMINDER_REPORTS',
    'REMINDER_TEMPLATES'
  ];
  expectedCodes.forEach(code => {
    assert(crmCatalog.some(sm => sm.code === code), `subModulesCatalog missing code: ${code}`);
  });
  console.log(`✓ TEST 1 PASSED: subModulesCatalog includes all ${crmCatalog.length} CRM submodules (${crmCatalog.map(s => s.name).join(', ')}).`);

  // TEST 2: Verify Permission Master catalog renders CRM category and items
  window.UserManagementModule.permViewMode = 'CATALOG';
  window.UserManagementModule.permCategoryFilter = 'ALL';
  const catalogHtml = window.UserManagementModule.renderPermissionCatalogMaster();
  assert(catalogHtml.includes('Customer Relationship (CRM)'), 'Permission Master must include "Customer Relationship (CRM)" category');
  assert(catalogHtml.includes('REMINDER_DASHBOARD'), 'Permission Master must include REMINDER_DASHBOARD');
  assert(catalogHtml.includes('Service Reminder Dashboard'), 'Permission Master must include Service Reminder Dashboard');
  assert(catalogHtml.includes('Message Template Master'), 'Permission Master must include Message Template Master');
  console.log('✓ TEST 2 PASSED: Permission Master correctly renders Customer Relationship (CRM) category and submodules.');

  // TEST 3: Verify Permission Matrix renders CRM category pill and rows
  window.UserManagementModule.selectedRoleId = 'ROLE-001'; // Super Admin
  window.UserManagementModule.permCategoryFilter = 'ALL';
  const matrixHtml = window.UserManagementModule.renderRolePermissionMatrix();

  // Verify category pill
  assert(matrixHtml.includes('Customer Relationship (CRM)'), 'Permission Matrix must display Customer Relationship (CRM) category pill');
  assert(matrixHtml.includes('✓ Grant Customer Relationship (CRM)'), 'Permission Matrix must display category grant button for CRM');
  assert(matrixHtml.includes('✕ Clear Customer Relationship (CRM)'), 'Permission Matrix must display category clear button for CRM');

  // Verify submodules in table rows
  assert(matrixHtml.includes('REMINDER_DASHBOARD'), 'Matrix table must contain REMINDER_DASHBOARD row');
  assert(matrixHtml.includes('REMINDER_CONFIG'), 'Matrix table must contain REMINDER_CONFIG row');
  assert(matrixHtml.includes('REMINDER_PROCESS'), 'Matrix table must contain REMINDER_PROCESS row');
  assert(matrixHtml.includes('REMINDER_HISTORY'), 'Matrix table must contain REMINDER_HISTORY row');
  assert(matrixHtml.includes('REMINDER_REPORTS'), 'Matrix table must contain REMINDER_REPORTS row');
  assert(matrixHtml.includes('REMINDER_TEMPLATES'), 'Matrix table must contain REMINDER_TEMPLATES row');
  console.log('✓ TEST 3 PASSED: Permission Matrix renders Customer Relationship (CRM) pill, category header, and all submodule rows.');

  // TEST 4: Filtering Permission Matrix by "Customer Relationship (CRM)"
  window.UserManagementModule.permCategoryFilter = 'Customer Relationship (CRM)';
  const filteredMatrixHtml = window.UserManagementModule.renderRolePermissionMatrix();
  assert(filteredMatrixHtml.includes('REMINDER_DASHBOARD'), 'Filtered matrix must contain REMINDER_DASHBOARD');
  assert(!filteredMatrixHtml.includes('STORE_TX_JOB_CARD_ISSUE'), 'Filtered matrix must NOT contain Billing & Job Card items');
  console.log('✓ TEST 4 PASSED: Category pill filter isolates Customer Relationship (CRM) submodules.');
  window.UserManagementModule.permCategoryFilter = 'ALL';

  // TEST 5: Grant / Revoke rights on CRM submodules via Permission Matrix
  const roleId = 'ROLE-STORE-MGR';
  window.UserManagementModule.toggleCategoryRights(roleId, 'Customer Relationship (CRM)', true);
  const grantedEntry = window.UserManagementModule.getSubModulePermEntry(roleId, 'REMINDER_DASHBOARD');
  assert(grantedEntry.view === true && grantedEntry.add === true, 'Grant category rights must enable CRM rights');
  
  window.UserManagementModule.toggleCategoryRights(roleId, 'Customer Relationship (CRM)', false);
  const clearedEntry = window.UserManagementModule.getSubModulePermEntry(roleId, 'REMINDER_DASHBOARD');
  assert(clearedEntry.view === false && clearedEntry.edit === false, 'Clear category rights must disable CRM rights');
  console.log('✓ TEST 5 PASSED: Toggle and batch grant/revoke work for Customer Relationship (CRM) submodules.');

  // TEST 6: Verify Database mock-data permissions
  const mockPerms = window.DB.getAll('permissions') || [];
  assert(mockPerms.some(p => p.code === 'REMINDER_DASHBOARD'), 'DB permissions must have REMINDER_DASHBOARD');
  assert(mockPerms.some(p => p.code === 'REMINDER_TEMPLATES'), 'DB permissions must have REMINDER_TEMPLATES');
  console.log('✓ TEST 6 PASSED: Database mock data contains CRM permissions.');

  // TEST 7: Verify PostgreSQL permissions table
  try {
    const pgPerms = await pg.query("SELECT * FROM permissions WHERE perm_code IN ('REMINDER_DASHBOARD', 'REMINDER_CONFIG', 'REMINDER_PROCESS', 'REMINDER_HISTORY', 'REMINDER_REPORTS', 'REMINDER_TEMPLATES')");
    assert(pgPerms.rows.length === 6, `PostgreSQL must have all 6 CRM permissions, found ${pgPerms.rows.length}`);
    console.log('✓ TEST 7 PASSED: PostgreSQL database permissions table contains all CRM permissions.');
  } finally {
    await pg.pool.end();
  }

  console.log('\n🎉 ALL 7 TESTS PASSED SUCCESSFULLY! CRM MODULE & SUB-MODULES ARE FULLY INTEGRATED!');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
