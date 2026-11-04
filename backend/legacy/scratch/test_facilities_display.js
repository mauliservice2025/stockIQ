const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('=== TEST SUITE: FACILITY MASTER MAULI SERVICE CENTER DISPLAY ===\n');

// 1. Check mock-data.js INITIAL_DATA
const { INITIAL_DATA } = require('../js/data/mock-data.js');
console.log('1. Checking mock-data.js INITIAL_DATA:');
console.log('   Plants count:', INITIAL_DATA.plants ? INITIAL_DATA.plants.length : 0);
console.log('   Organizations count:', INITIAL_DATA.organizations ? INITIAL_DATA.organizations.length : 0);

if (!INITIAL_DATA.plants || INITIAL_DATA.plants.length < 2) {
  throw new Error('FAILED: INITIAL_DATA.plants must contain at least 2 facilities!');
}
if (!INITIAL_DATA.organizations || INITIAL_DATA.organizations.length < 1) {
  throw new Error('FAILED: INITIAL_DATA.organizations must contain Mauli Service Center Pvt. Ltd.!');
}
console.log('   [PASS] mock-data.js has valid plants and organizations.\n');

// 2. Set up sandbox DOM & LocalStorage
const storage = {};
// Pre-populate with empty plants to simulate existing user whose localStorage was cleared
storage['APEX_ISCM_DATABASE_V2'] = JSON.stringify({
  _orgs_cleared_v2: true,
  _branches_cleared_v4: true,
  organizations: [],
  plants: []
});

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
    classList: { contains: () => false, add: () => {}, remove: () => {} },
    value: '',
    innerHTML: '',
    style: {},
    appendChild: () => {},
    removeChild: () => {},
    querySelectorAll: () => [],
    querySelector: () => null,
    setAttribute: () => {},
    getAttribute: () => null,
    addEventListener: () => {}
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
  localStorage: mockLocalStorage,
  window: {},
  document: mockDocument,
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }),
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  INITIAL_DATA: INITIAL_DATA
};
sandbox.window = sandbox;
sandbox.window.localStorage = mockLocalStorage;
sandbox.window.document = mockDocument;

// Load db.js in sandbox
const dbCode = fs.readFileSync(path.join(__dirname, '../js/data/db.js'), 'utf8');
vm.runInNewContext(dbCode, sandbox);
if (!sandbox.window.DB) {
  sandbox.window.DB = new sandbox.DatabaseLayer();
}

console.log('2. Testing DatabaseLayer loading with cleared storage:');
const plants = sandbox.window.DB.getAll('plants');
const orgs = sandbox.window.DB.getAll('organizations');
console.log('   Loaded plants count:', plants.length);
console.log('   Loaded orgs count:', orgs.length);

if (plants.length < 2) {
  throw new Error(`FAILED: Expected at least 2 plants, got ${plants.length}`);
}
if (orgs.length < 1) {
  throw new Error(`FAILED: Expected at least 1 organization, got ${orgs.length}`);
}

const p1 = plants.find(p => p.id === 'PLANT-01');
const p2 = plants.find(p => p.id === 'PLANT-02');
console.log('   Plant 1:', p1.name, '| Code:', p1.code, '| Org ID:', p1.organization_id);
console.log('   Plant 2:', p2.name, '| Code:', p2.code, '| Org ID:', p2.organization_id);

if (!p1 || !p2) {
  throw new Error('FAILED: PLANT-01 and PLANT-02 not found!');
}
if (p1.organization_id !== 'ORG-001' || p2.organization_id !== 'ORG-001') {
  throw new Error(`FAILED: Facilities must be linked to ORG-001! (p1: ${p1.organization_id}, p2: ${p2.organization_id})`);
}
console.log('   [PASS] Facilities are properly linked to Mauli Service Center Pvt. Ltd.\n');

// 3. Test OrgLocationModule rendering
sandbox.window.State = {
  hasPermission: () => true,
  closeModal: () => {},
  showToast: () => {}
};

const orgLocationCode = fs.readFileSync(path.join(__dirname, '../js/modules/org-location.js'), 'utf8');
vm.runInNewContext(orgLocationCode, sandbox);

console.log('3. Testing OrgLocationModule.renderBranchesTab():');
const html = sandbox.window.OrgLocationModule.renderBranchesTab();

if (html.includes('No Branches Found')) {
  throw new Error('FAILED: Facility Master shows "No Branches Found"!');
}
if (!html.includes('Mauli Service Center 1')) {
  throw new Error('FAILED: HTML does not contain "Mauli Service Center 1"');
}
if (!html.includes('Mauli Service Center 2')) {
  throw new Error('FAILED: HTML does not contain "Mauli Service Center 2"');
}
if (!html.includes('Mauli Service Center Pvt. Ltd.')) {
  throw new Error('FAILED: HTML does not contain parent organization "Mauli Service Center Pvt. Ltd."');
}
console.log('   [PASS] Both facilities and parent organization render in table!\n');

// 4. Test Filtering
console.log('4. Testing Filters:');
// Search by "Wakad"
sandbox.window.OrgLocationModule.searchTerm = 'Wakad';
const wakadHtml = sandbox.window.OrgLocationModule.renderBranchesTab();
if (!wakadHtml.includes('Mauli Service Center 2') || wakadHtml.includes('Mauli Service Center 1')) {
  throw new Error('FAILED: Search for "Wakad" should match only Mauli Service Center 2!');
}
console.log('   [PASS] Search by "Wakad" filtered correctly.');

// Filter by Org "ORG-001"
sandbox.window.OrgLocationModule.searchTerm = '';
sandbox.window.OrgLocationModule.parentFilter = 'ORG-001';
const orgFilteredHtml = sandbox.window.OrgLocationModule.renderBranchesTab();
if (!orgFilteredHtml.includes('Mauli Service Center 1') || !orgFilteredHtml.includes('Mauli Service Center 2')) {
  throw new Error('FAILED: Filter by ORG-001 should show both facilities!');
}
console.log('   [PASS] Filter by parent organization "ORG-001" shows both facilities.');

console.log('\n ALL FACILITY MASTER TESTS PASSED SUCCESSFULLY!');
