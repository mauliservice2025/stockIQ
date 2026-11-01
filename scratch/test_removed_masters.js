const fs = require('fs');
const assert = require('assert');
const pg = require('../database/pg');

console.log('=== TEST: VERIFY REMOVAL OF WAREHOUSE ACCESS & DEPARTMENT ACCESS MASTERS ===\n');

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

async function runTests() {
  // 1. Verify index.html sidebar
  const indexHtml = fs.readFileSync('index.html', 'utf8');
  assert(!indexHtml.includes('#/warehouse-access'), 'index.html must not contain #/warehouse-access');
  assert(!indexHtml.includes('#/department-access'), 'index.html must not contain #/department-access');
  assert(!indexHtml.includes('Warehouse & Store Access'), 'index.html must not contain Warehouse & Store Access link');
  console.log('✓ TEST 1 PASSED: index.html sidebar navigation completely cleaned of access masters.');

  // 2. Verify js/app.js router and perm mapping
  const appJs = fs.readFileSync('js/app.js', 'utf8');
  assert(!appJs.includes("'#/warehouse-access'"), 'app.js must not contain #/warehouse-access route');
  assert(!appJs.includes("'#/department-access'"), 'app.js must not contain #/department-access route');
  assert(!appJs.includes("'WH_ACCESS'"), 'app.js must not contain WH_ACCESS');
  assert(!appJs.includes("'DEPT_ACCESS'"), 'app.js must not contain DEPT_ACCESS');
  console.log('✓ TEST 2 PASSED: js/app.js routes and permission mappings completely cleaned.');

  // 3. Verify mock-data.js INITIAL_DATA
  eval(fs.readFileSync('js/data/mock-data.js', 'utf8'));
  assert(typeof INITIAL_DATA.user_warehouse_access === 'undefined', 'INITIAL_DATA must not contain user_warehouse_access');
  assert(typeof INITIAL_DATA.user_department_access === 'undefined', 'INITIAL_DATA must not contain user_department_access');
  console.log('✓ TEST 3 PASSED: js/data/mock-data.js INITIAL_DATA access collections completely removed.');

  // 4. Load db.js, state.js, user-management.js
  window.INITIAL_DATA = INITIAL_DATA;
  eval(fs.readFileSync('js/data/db.js', 'utf8'));
  eval(fs.readFileSync('js/state.js', 'utf8'));
  eval(fs.readFileSync('js/app.js', 'utf8'));
  eval(fs.readFileSync('js/modules/user-management.js', 'utf8'));

  // 5. Verify user-management.js tabs and configuration
  assert(!window.UserManagementModule.tabConfig.some(t => t.key === 'WH_ACCESS'), 'tabConfig must not contain WH_ACCESS');
  assert(!window.UserManagementModule.tabConfig.some(t => t.key === 'DEPT_ACCESS'), 'tabConfig must not contain DEPT_ACCESS');
  assert(!window.UserManagementModule.hashToTabMap['#/warehouse-access'], 'hashToTabMap must not map #/warehouse-access');
  assert(!window.UserManagementModule.hashToTabMap['#/department-access'], 'hashToTabMap must not map #/department-access');
  assert(!window.UserManagementModule.tabToHashMap['WH_ACCESS'], 'tabToHashMap must not map WH_ACCESS');
  assert(!window.UserManagementModule.tabToHashMap['DEPT_ACCESS'], 'tabToHashMap must not map DEPT_ACCESS');
  assert(!window.UserManagementModule.subModulesCatalog.some(p => p.code === 'WH_ACCESS'), 'subModulesCatalog must not have WH_ACCESS');
  assert(!window.UserManagementModule.subModulesCatalog.some(p => p.code === 'DEPT_ACCESS'), 'subModulesCatalog must not have DEPT_ACCESS');
  assert(typeof window.UserManagementModule.renderWarehouseAccess === 'undefined', 'renderWarehouseAccess method must be removed');
  assert(typeof window.UserManagementModule.renderDepartmentAccess === 'undefined', 'renderDepartmentAccess method must be removed');
  console.log('✓ TEST 4 PASSED: user-management.js tabs, route maps, permission catalog, and master methods completely removed.');

  // 6. Verify UI render() tabs
  const container = document.getElementById('main-content');
  window.UserManagementModule.currentTab = 'USERS';
  window.UserManagementModule.render();
  const renderedHtml = container.innerHTML;
  assert(!renderedHtml.includes('Warehouse Access'), 'Rendered HTML must not contain "Warehouse Access" tab');
  assert(!renderedHtml.includes('Department Access'), 'Rendered HTML must not contain "Department Access" tab');
  assert(!renderedHtml.includes('tab-wh-access'), 'Rendered HTML must not have tab-wh-access element');
  assert(!renderedHtml.includes('tab-dept-access'), 'Rendered HTML must not have tab-dept-access element');
  console.log('✓ TEST 5 PASSED: User Management UI tab bar renders without Warehouse Access or Department Access tabs.');

  // 7. Verify PostgreSQL Database tables and permissions
  try {
    const tableRes = await pg.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('user_warehouse_access', 'user_department_access', 'user_store_access')
    `);
    assert(tableRes.rows.length === 0, `PostgreSQL tables must not exist, found: ${tableRes.rows.map(r => r.table_name).join(', ')}`);
    console.log('✓ TEST 6 PASSED: PostgreSQL tables user_warehouse_access, user_department_access, and user_store_access are dropped.');

    const permRes = await pg.query("SELECT * FROM permissions WHERE perm_code IN ('WH_ACCESS', 'DEPT_ACCESS')");
    assert(permRes.rows.length === 0, 'PostgreSQL permissions table must not contain WH_ACCESS or DEPT_ACCESS');
    console.log('✓ TEST 7 PASSED: PostgreSQL permissions cleaned.');
  } finally {
    await pg.pool.end();
  }

  console.log('\n🎉 ALL 7 REMOVAL VERIFICATION TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
