const fs = require('fs');
const assert = require('assert');

console.log('=== TEST SUITE: USER MASTER STORE DROPDOWN & STORE ACCESS ENFORCEMENT ===\n');

// Mock browser environment
global.window = global;
global.window.location = { hash: '#/users' };
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
  setAttribute() {},
  removeAttribute() {},
  getAttribute() { return null; },
  remove() {}
});

global.document = {
  documentElement: makeElem(),
  body: makeElem(),
  getElementById: (id) => {
    const el = makeElem();
    el.id = id;
    return el;
  },
  querySelector: () => makeElem(),
  querySelectorAll: () => [],
  addEventListener: () => {}
};

// Load application dependencies
eval(fs.readFileSync('js/data/mock-data.js', 'utf8'));
window.INITIAL_DATA = INITIAL_DATA;
eval(fs.readFileSync('js/data/db.js', 'utf8'));
eval(fs.readFileSync('js/state.js', 'utf8'));
eval(fs.readFileSync('js/app.js', 'utf8'));
eval(fs.readFileSync('js/modules/user-management.js', 'utf8'));

// Ensure DB has stores in test harness
if (!window.DB.data.warehouses || window.DB.data.warehouses.length === 0) {
  window.DB.data.warehouses = [
    { id: 'WH-PUN-MAIN', code: 'STR-MSC1-MAIN', name: 'Main Store - Ravet', plant_id: 'PLANT-01', facility_id: 'PLANT-01', status: 'Active', is_active: true },
    { id: 'WH-MSC2-MAIN', code: 'STR-MSC2-MAIN', name: 'Main Store - Kiwale', plant_id: 'PLANT-02', facility_id: 'PLANT-02', status: 'Active', is_active: true }
  ];
}

async function runTests() {
  // TEST 1: Verify Store Master has stores
  const storeMasterList = window.DB.getAll('warehouses') || [];
  assert(storeMasterList.length > 0, 'Store Master must have warehouses/stores configured');
  console.log(`✓ TEST 1 PASSED: Found ${storeMasterList.length} stores in Store Master (${storeMasterList.map(s => s.name).join(', ')}).`);

  // TEST 2: Verify renderStoreSelector generates dropdown with all stores from Store Master
  const storeSelectorHtml = window.UserManagementModule.renderStoreSelector('test-user', ['WH-PUN-MAIN'], storeMasterList);
  assert(storeSelectorHtml.includes('test-user-store-dropdown'), 'Store selector must contain dropdown menu');
  assert(storeSelectorHtml.includes('Stores (Store Master)'), 'Store selector must label Stores (Store Master)');
  assert(storeSelectorHtml.includes('All Stores (Store Master)'), 'Store selector must have All Stores option');
  storeMasterList.forEach(s => {
    assert(storeSelectorHtml.includes(s.name), `Store selector must include store: ${s.name}`);
    assert(storeSelectorHtml.includes(s.code || s.id), `Store selector must include store code: ${s.code || s.id}`);
  });
  console.log('✓ TEST 2 PASSED: Store selector dropdown correctly renders all stores from Store Master.');

  // TEST 3: Verify Edit User modal for Sanket Borole (USR-111) contains the Store option under 2FA
  const user111 = window.DB.getById('users', 'USR-111');
  assert(user111, 'User USR-111 must exist');
  
  let modalConfig = null;
  const originalShowModal = window.State.showModal;
  window.State.showModal = (cfg) => { modalConfig = cfg; };

  window.UserManagementModule.showEditUserModal('USR-111');
  assert(modalConfig, 'Edit User modal must be shown');
  assert(modalConfig.contentHtml.includes('Assigned Store(s)'), 'Edit User modal must have "Assigned Store(s)" field');
  assert(modalConfig.contentHtml.includes('edit-user-store-dropdown'), 'Edit User modal must have edit-user-store-dropdown');
  assert(modalConfig.contentHtml.includes('edit-user-2fa'), 'Edit User modal must have 2FA checkbox');

  // Verify placement: Assigned Store(s) is right after 2FA
  const idx2fa = modalConfig.contentHtml.indexOf('edit-user-2fa');
  const idxStores = modalConfig.contentHtml.indexOf('Assigned Store(s)');
  assert(idxStores > idx2fa, 'Assigned Store(s) must appear after 2FA in Column 3 (matching marked red box)');
  console.log('✓ TEST 3 PASSED: Edit User modal renders Store dropdown directly under 2FA in Column 3.');

  // TEST 4: Verify Create User modal also contains the Store option
  modalConfig = null;
  window.UserManagementModule.showCreateUserModal();
  assert(modalConfig, 'Create User modal must be shown');
  assert(modalConfig.contentHtml.includes('Assigned Store(s)'), 'Create User modal must have "Assigned Store(s)" field');
  assert(modalConfig.contentHtml.includes('new-user-store-dropdown'), 'Create User modal must have new-user-store-dropdown');
  console.log('✓ TEST 4 PASSED: Register / Create User modal renders Store dropdown option.');

  window.State.showModal = originalShowModal;

  // TEST 5: Verify Store Scoping Enforcement:
  // When a user has access to a list of stores, canAccessWarehouse / canAccessStore allows only those stores!
  const testScopedUser = {
    id: 'USR-TEST-STORE',
    username: 'STOREUSER1',
    status: 'ACTIVE',
    plant_id: 'PLANT-01',
    assigned_stores: ['WH-PUN-MAIN'],
    warehouse_id: 'WH-PUN-MAIN'
  };

  assert(window.State.canAccessWarehouse('WH-PUN-MAIN', testScopedUser) === true, 'User must have access to assigned store WH-PUN-MAIN');
  assert(window.State.canAccessWarehouse('WH-MSC2-MAIN', testScopedUser) === false, 'User must NOT have access to unassigned store WH-MSC2-MAIN');
  assert(window.State.canAccessStore('WH-PUN-MAIN', testScopedUser) === true, 'canAccessStore alias must return true for WH-PUN-MAIN');
  assert(window.State.canAccessStore('WH-MSC2-MAIN', testScopedUser) === false, 'canAccessStore alias must return false for WH-MSC2-MAIN');
  console.log('✓ TEST 5 PASSED: canAccessWarehouse / canAccessStore allows only granted stores.');

  // TEST 6: Multi-store access verification:
  const multiStoreUser = {
    id: 'USR-MULTI-STORE',
    username: 'MULTISTORE1',
    status: 'ACTIVE',
    plant_id: 'PLANT-01',
    assigned_stores: ['WH-PUN-MAIN', 'WH-MSC2-MAIN'],
    warehouse_id: 'WH-PUN-MAIN'
  };
  assert(window.State.canAccessWarehouse('WH-PUN-MAIN', multiStoreUser) === true, 'Multi-store user must access WH-PUN-MAIN');
  assert(window.State.canAccessWarehouse('WH-MSC2-MAIN', multiStoreUser) === true, 'Multi-store user must access WH-MSC2-MAIN');
  assert(window.State.canAccessWarehouse('WH-NON-EXISTENT', multiStoreUser) === false, 'Multi-store user must NOT access unassigned store');
  console.log('✓ TEST 6 PASSED: Multi-store access works for all stores in the assigned list.');

  // TEST 7: DB.getActiveWarehouses respects store access scoping
  const scopedActiveWarehouses = window.DB.getActiveWarehouses(undefined, testScopedUser);
  assert(scopedActiveWarehouses.some(w => w.id === 'WH-PUN-MAIN'), 'Scoped active warehouses must include WH-PUN-MAIN');
  assert(!scopedActiveWarehouses.some(w => w.id === 'WH-MSC2-MAIN'), 'Scoped active warehouses must NOT include WH-MSC2-MAIN');
  console.log('✓ TEST 7 PASSED: DB.getActiveWarehouses returns only stores user is permitted to work from.');

  // TEST 8: Verify user_warehouse_access is retired
  assert(typeof window.DB.data.user_warehouse_access === 'undefined' || (window.DB.getAll('user_warehouse_access') || []).length === 0, 'user_warehouse_access table must be retired');
  console.log('✓ TEST 8 PASSED: user_warehouse_access table successfully retired; scoping is self-contained on user account.');

  // TEST 9: User Master table displays store info
  const userMasterHtml = window.UserManagementModule.renderUserMaster();
  assert(userMasterHtml.includes('🏬'), 'User Master table must display store icon');
  console.log('✓ TEST 9 PASSED: User Master table renders store scoping details.');

  console.log('\n🎉 ALL 9 TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
