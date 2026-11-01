const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('=== TEST SUITE: REMOVE ALL ORGANISATIONS FROM ORGANISATION MASTER ===\n');

// Set up DOM mock environment
const storage = {};
const mockLocalStorage = {
  getItem: (key) => storage[key] || null,
  setItem: (key, val) => { storage[key] = String(val); },
  removeItem: (key) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

const domElements = {};
function createMockElement(tag, id = '') {
  return {
    tagName: tag.toUpperCase(),
    id: id,
    classList: {
      contains: () => false,
      add: () => {},
      remove: () => {}
    },
    value: '',
    innerHTML: '',
    style: {},
    appendChild: () => {},
    querySelectorAll: () => [],
    querySelector: () => null,
    setAttribute: () => {},
    getAttribute: () => null,
    addEventListener: () => {},
    focus: () => {}
  };
}

const mockDocument = {
  getElementById: (id) => {
    if (!domElements[id]) domElements[id] = createMockElement('div', id);
    return domElements[id];
  },
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: (tag) => createMockElement(tag),
  body: createMockElement('body', 'body'),
  addEventListener: () => {}
};

const sandbox = {
  console: console,
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  setInterval: () => {},
  clearInterval: () => {},
  localStorage: mockLocalStorage,
  document: mockDocument,
  window: {},
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }),
  location: { hash: '#/organizations' },
  confirm: () => true,
  alert: () => {},
  INDIAN_LOCATION_MASTER: { Maharashtra: { Pune: ['Pune', 'Chakan', 'Wakad'] } }
};
sandbox.window = sandbox;

vm.createContext(sandbox);

// 1. Load mock-data.js
const { INITIAL_DATA } = require('../js/data/mock-data.js');
sandbox.INITIAL_DATA = INITIAL_DATA;
sandbox.window.INITIAL_DATA = INITIAL_DATA;

console.log('1. Checking mock-data.js INITIAL_DATA:');
console.log('   INITIAL_DATA.organizations length:', sandbox.INITIAL_DATA.organizations.length);
if (sandbox.INITIAL_DATA.organizations.length !== 0) {
  throw new Error('FAILED: INITIAL_DATA.organizations must be empty!');
}
console.log('   [PASS] INITIAL_DATA.organizations is an empty array.\n');

// 2. Load db.js
const dbCode = fs.readFileSync(path.join(__dirname, '../js/data/db.js'), 'utf8');
vm.runInContext(dbCode, sandbox);
sandbox.DatabaseLayer = sandbox.window.DB.constructor;

console.log('2. Checking DatabaseLayer fresh initialization:');
const orgs = sandbox.window.DB.getAll('organizations');
console.log('   DB.getAll("organizations") count:', orgs.length);
if (orgs.length !== 0) {
  throw new Error('FAILED: DB.getAll("organizations") should be empty on initial load!');
}
console.log('   [PASS] DB initialized with 0 organizations.\n');

// 3. Test migration when localStorage contains old seed organizations
console.log('3. Testing migration/purge of legacy localStorage seed organizations:');
const legacyDbData = {
  organizations: [
    { id: 'ORG-001', code: 'PATIL-AUTO', name: 'Patil Auto', status: 'Active' },
    { id: 'ORG-002', code: 'APEX-2W', name: 'Apex 2W', status: 'Active' }
  ],
  plants: [
    { id: 'PLANT-01', name: 'Pune Plant', organization_id: 'ORG-001', is_active: true }
  ]
};
mockLocalStorage.setItem('APEX_ISCM_DATABASE_V2', JSON.stringify(legacyDbData));

// Create fresh DatabaseLayer to trigger loadData()
const migratedDb = new sandbox.DatabaseLayer();
console.log('   Migrated DB organizations count:', migratedDb.getAll('organizations').length);
if (migratedDb.getAll('organizations').length !== 0) {
  throw new Error('FAILED: Migration did not clear legacy organizations!');
}
const migratedPlant = migratedDb.getById('plants', 'PLANT-01');
if (migratedPlant && migratedPlant.organization_id !== '') {
  throw new Error('FAILED: Migration should detach organization_id from plant!');
}
console.log('   [PASS] Legacy seed organizations successfully purged from localStorage.\n');

// 4. Load State and Modules
sandbox.window.DB = migratedDb;
const stateCode = fs.readFileSync(path.join(__dirname, '../js/state.js'), 'utf8');
vm.runInContext(stateCode, sandbox);

const orgModCode = fs.readFileSync(path.join(__dirname, '../js/modules/organizations.js'), 'utf8');
vm.runInContext(orgModCode, sandbox);

const orgLocCode = fs.readFileSync(path.join(__dirname, '../js/modules/org-location.js'), 'utf8');
vm.runInContext(orgLocCode, sandbox);

// 5. Test OrganizationModule UI rendering with 0 organizations
console.log('4. Testing OrganizationModule.render() with 0 organizations:');
const dummyContainer = createMockElement('div');
sandbox.window.OrganizationModule.render(dummyContainer);
if (!dummyContainer.innerHTML.includes('No Organizations Found')) {
  throw new Error('FAILED: OrganizationModule did not render "No Organizations Found" state!');
}
console.log('   [PASS] OrganizationModule renders "No Organizations Found" correctly.\n');

// 6. Test OrgLocationModule rendering with 0 organizations
console.log('5. Testing OrgLocationModule organizations and branches tabs:');
sandbox.window.OrgLocationModule.activeTab = 'ORGANIZATIONS';
const orgTabHtml = sandbox.window.OrgLocationModule.renderOrganizationsTab();
if (!orgTabHtml.includes('No Organizations Found')) {
  throw new Error('FAILED: OrgLocationModule organizations tab did not show "No Organizations Found"!');
}
console.log('   [PASS] OrgLocationModule organizations tab shows empty state.');

sandbox.window.OrgLocationModule.activeTab = 'BRANCHES';
const branchesTabHtml = sandbox.window.OrgLocationModule.renderBranchesTab();
if (branchesTabHtml.includes('ORG-001')) {
  throw new Error('FAILED: Branches tab should not hardcode ORG-001 when unassigned!');
}
console.log('   [PASS] OrgLocationModule branches tab handles unassigned organizations cleanly.\n');

// 7. Test Add Organization & Delete Organization flow
console.log('6. Testing Add, Delete and Clear All flow:');
const newOrg = {
  id: 'ORG-101',
  code: 'NEW-TEST',
  name: 'New Test Org',
  status: 'Active'
};
sandbox.window.DB.insert('organizations', newOrg);
console.log('   Inserted 1 organization. DB count:', sandbox.window.DB.getAll('organizations').length);

sandbox.window.OrganizationModule.render(dummyContainer);
if (!dummyContainer.innerHTML.includes('NEW-TEST')) {
  throw new Error('FAILED: Inserted organization not visible in table!');
}
if (!dummyContainer.innerHTML.includes('Remove All')) {
  throw new Error('FAILED: "Remove All" button should be visible when organizations exist!');
}
console.log('   [PASS] New organization rendered with "Remove All" and action buttons.');

// Test deleteOrganization
sandbox.window.OrganizationModule.deleteOrganization('ORG-101');
console.log('   Deleted ORG-101. DB count:', sandbox.window.DB.getAll('organizations').length);
if (sandbox.window.DB.getAll('organizations').length !== 0) {
  throw new Error('FAILED: deleteOrganization failed to remove organization!');
}
console.log('   [PASS] deleteOrganization successfully removed the organization.');

// Insert multiple and test clearAllOrganizations
sandbox.window.DB.insert('organizations', { id: 'ORG-102', code: 'TEST-2', name: 'Test 2', status: 'Active' });
sandbox.window.DB.insert('organizations', { id: 'ORG-103', code: 'TEST-3', name: 'Test 3', status: 'Active' });
console.log('   Inserted 2 organizations. DB count:', sandbox.window.DB.getAll('organizations').length);

sandbox.window.OrganizationModule.clearAllOrganizations();
console.log('   Called clearAllOrganizations(). DB count:', sandbox.window.DB.getAll('organizations').length);
if (sandbox.window.DB.getAll('organizations').length !== 0) {
  throw new Error('FAILED: clearAllOrganizations did not remove all organizations!');
}
console.log('   [PASS] clearAllOrganizations successfully emptied the master.\n');

console.log('>>> ALL 7 TEST CASES PASSED SUCCESSFULLY! <<<\n');
