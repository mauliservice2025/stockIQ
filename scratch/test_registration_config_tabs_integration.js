/**
 * Integration Test: Registration Configuration Screen Tabs and Layout
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

console.log('================================================================');
console.log('TESTING REGISTRATION CONFIGURATION TABS & MODULE INTEGRATION');
console.log('================================================================\n');

// 1. Create Browser DOM Environment
const mockDataContent = fs.readFileSync(path.join(__dirname, '../js/data/mock-data.js'), 'utf8');
const dbContent = fs.readFileSync(path.join(__dirname, '../js/data/db.js'), 'utf8');
const stateContent = fs.readFileSync(path.join(__dirname, '../js/state.js'), 'utf8');
const regConfigContent = fs.readFileSync(path.join(__dirname, '../js/modules/registration-config.js'), 'utf8');
const orgLocationContent = fs.readFileSync(path.join(__dirname, '../js/modules/org-location.js'), 'utf8');
const appContent = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');

const containerDiv = {
  id: 'view-container',
  innerHTML: '',
  children: []
};

const domElements = {
  'view-container': containerDiv,
  'page-top-bar': { style: { display: '', setProperty: () => {}, removeProperty: () => {} }, classList: { add: () => {}, remove: () => {} } },
  'org-location-tab-content': { innerHTML: '' }
};

const sandbox = {
  console: console,
  window: {},
  document: {
    getElementById: (id) => domElements[id] || null,
    querySelector: (sel) => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    dispatchEvent: () => {}
  },
  location: { hash: '#/registration-config' },
  localStorage: {
    getItem: () => null,
    setItem: () => {}
  }
};
sandbox.window = sandbox;
sandbox.window.location = sandbox.location;
sandbox.window.document = sandbox.document;

vm.createContext(sandbox);
vm.runInContext(mockDataContent, sandbox);
vm.runInContext(dbContent, sandbox);
vm.runInContext(stateContent, sandbox);
vm.runInContext(regConfigContent, sandbox);
vm.runInContext(orgLocationContent, sandbox);

// 2. Check tabConfig contains 7 masters
console.log('Test 1: Verifying OrgLocationModule tabConfig list...');
const orgModule = sandbox.window.OrgLocationModule;
assert(orgModule, 'OrgLocationModule must exist');
assert.strictEqual(orgModule.tabConfig.length, 7, 'Must have exactly 7 master tabs in Organization & Facility Setup');
const tabLabels = orgModule.tabConfig.map(t => t.label);
console.log('  Found tabs:', tabLabels);
assert(tabLabels.includes('Organization Master'), 'Must have Organization Master');
assert(tabLabels.includes('Facility Master'), 'Must have Facility Master');
assert(tabLabels.includes('Document Print Configuration Master'), 'Must have Document Print Configuration Master');
assert(tabLabels.includes('Financial Calendar Master'), 'Must have Financial Calendar Master');
assert(tabLabels.includes('Document Number Series Master'), 'Must have Document Number Series Master');
assert(tabLabels.includes('Holiday Master'), 'Must have Holiday Master');
assert(tabLabels.includes('Registration Configuration'), 'Must have Registration Configuration');
console.log('  -> PASS: All 7 master tabs present in tabConfig');

// 3. Render Registration Configuration via OrgLocationModule
console.log('\nTest 2: Rendering OrgLocationModule on #/registration-config route...');
sandbox.window.location.hash = '#/registration-config';
orgModule.render(containerDiv);

const renderedHtml = containerDiv.innerHTML;
assert(renderedHtml.includes('class="tabs-header"'), 'Rendered output must include tabs-header');
assert(renderedHtml.includes('Organization Master'), 'Rendered tabs must include Organization Master');
assert(renderedHtml.includes('Facility Master'), 'Rendered tabs must include Facility Master');
assert(renderedHtml.includes('Document Print Configuration Master'), 'Rendered tabs must include Document Print Configuration Master');
assert(renderedHtml.includes('Financial Calendar Master'), 'Rendered tabs must include Financial Calendar Master');
assert(renderedHtml.includes('Document Number Series Master'), 'Rendered tabs must include Document Number Series Master');
assert(renderedHtml.includes('Holiday Master'), 'Rendered tabs must include Holiday Master');
assert(renderedHtml.includes('Registration Configuration'), 'Rendered tabs must include Registration Configuration');
assert(renderedHtml.includes('tab-btn active'), 'Active tab button must be highlighted');
assert(renderedHtml.includes('registration-config-card'), 'Rendered content must include registration-config-card');
console.log('  -> PASS: All 7 tabs rendered in header with Registration Configuration active');

// 4. Test RegistrationConfigModule.render delegating to OrgLocationModule
console.log('\nTest 3: Direct RegistrationConfigModule.render() delegation...');
const regModule = sandbox.window.RegistrationConfigModule;
const separateContainer = { id: 'test-view-container', innerHTML: '' };
regModule.render(separateContainer);
assert(separateContainer.innerHTML.includes('class="tabs-header"'), 'Direct render must delegate and include tabs-header');
assert(separateContainer.innerHTML.includes('Registration Configuration'), 'Direct render must include Registration Configuration');
assert(separateContainer.innerHTML.includes('registration-config-card'), 'Direct render must include registration-config-card');
console.log('  -> PASS: Direct call to RegistrationConfigModule.render() correctly renders the 7-tab header suite');

// 5. Test tab switching
console.log('\nTest 4: Verifying tab switching to other masters...');
orgModule.switchTab('DOC_SERIES');
assert.strictEqual(sandbox.window.location.hash, '#/doc-series', 'Switching tab to DOC_SERIES must route to #/doc-series');
orgModule.switchTab('REGISTRATION_CONFIG');
assert.strictEqual(sandbox.window.location.hash, '#/registration-config', 'Switching tab to REGISTRATION_CONFIG must route to #/registration-config');
console.log('  -> PASS: Tab switching smoothly updates route and maintains master navigation');

console.log('\n================================================================');
console.log('🎉 ALL INTEGRATION TESTS PASSED!');
console.log('================================================================\n');
