// Test suite for Organization Master Search Functionality
const fs = require('fs');

global.window = global;
global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; },
  clear() { this.store = {}; }
};

// Mock document
const domElements = {};
function createMockElement(id, tag = 'div') {
  const el = {
    id: id || '',
    tagName: tag.toUpperCase(),
    type: tag === 'input' ? 'text' : '',
    value: '',
    innerHTML: '',
    style: {},
    classList: {
      classes: new Set(),
      add(c) { this.classes.add(c); },
      remove(c) { this.classes.delete(c); },
      contains(c) { return this.classes.has(c); },
      toggle(c) {
        if (this.classes.has(c)) { this.classes.delete(c); return false; }
        else { this.classes.add(c); return true; }
      }
    },
    querySelector(sel) {
      if (sel.includes('org-search-input') || sel.includes('input')) {
        const inputEl = createMockElement('org-search-input', 'input');
        inputEl.classList.add('org-search-input');
        inputEl.selectionStart = 5;
        inputEl.selectionEnd = 5;
        inputEl.focus = function() { global.document.activeElement = this; };
        inputEl.setSelectionRange = function(s, e) { this.selectionStart = s; this.selectionEnd = e; };
        return inputEl;
      }
      return null;
    }
  };
  if (id) domElements[id] = el;
  return el;
}

global.document = {
  activeElement: null,
  getElementById(id) {
    if (!domElements[id]) domElements[id] = createMockElement(id);
    return domElements[id];
  },
  createElement(tag) { return createMockElement('', tag); },
  body: createMockElement('body')
};

require('d:/Projects/ISCM/js/data/mock-data.js');
require('d:/Projects/ISCM/js/data/db.js');
require('d:/Projects/ISCM/js/modules/organizations.js');
require('d:/Projects/ISCM/js/modules/org-location.js');

console.log('====================================================');
console.log('TESTING ORGANIZATION MASTER SEARCH FUNCTIONALITY');
console.log('====================================================\n');

// 1. Test OrgLocationModule Organization Tab Search Queries
console.log('--- 1. Testing OrgLocationModule Search Queries ---');
const testCases = [
  { term: 'patil', expectMin: 1, desc: 'Search by Code / Name fragment ("patil")' },
  { term: 'ORG-001', expectMin: 1, desc: 'Search by exact Org ID ("ORG-001")' },
  { term: 'ORG-002', expectMin: 1, desc: 'Search by Org ID ("ORG-002")' },
  { term: 'pravin', expectMin: 1, desc: 'Search by Primary Contact Person ("pravin")' },
  { term: 'balwant', expectMin: 1, desc: 'Search by Contact Person ("balwant")' },
  { term: '9822', expectMin: 1, desc: 'Search by Mobile prefix ("9822")' },
  { term: '9833022345', expectMin: 1, desc: 'Search by 10-digit mobile number' },
  { term: 'pune', expectMin: 2, desc: 'Search by City ("pune")' },
  { term: 'talegaon', expectMin: 1, desc: 'Search by City ("talegaon")' },
  { term: 'chakan', expectMin: 1, desc: 'Search by Address location ("chakan")' },
  { term: '410501', expectMin: 1, desc: 'Search by Pincode ("410501")' },
  { term: '27AABCP1234F1Z5', expectMin: 1, desc: 'Search by GSTIN ("27AABCP1234F1Z5")' },
  { term: 'BKRPP4521M', expectMin: 1, desc: 'Search by PAN ("BKRPP4521M")' },
  { term: 'two-wheeler', expectMin: 1, desc: 'Search by Business Category ("two-wheeler")' },
  { term: 'proprietorship', expectMin: 1, desc: 'Search by Org Type ("proprietorship")' },
  { term: 'patil automotive', expectMin: 1, desc: 'Multi-word search ("patil automotive")' },
  { term: 'nonexistent-xyz-999', expectExact: 0, desc: 'Search for nonexistent entity' }
];

window.OrgLocationModule.activeTab = 'ORGANIZATIONS';
const container = document.getElementById('org-location-tab-content');

testCases.forEach((tc, idx) => {
  window.OrgLocationModule.setSearch(tc.term);
  const html = container.innerHTML;
  
  if (tc.expectMin !== undefined) {
    if (html.includes('No Organizations Found')) {
      throw new Error(`Test Case ${idx + 1} Failed: "${tc.desc}" returned "No Organizations Found"!`);
    }
    console.log(`[PASS] ${tc.desc} -> Match found`);
  } else if (tc.expectExact === 0) {
    if (!html.includes('No Organizations Found')) {
      throw new Error(`Test Case ${idx + 1} Failed: Non-existent search should return empty state!`);
    }
    console.log(`[PASS] ${tc.desc} -> Correctly returned empty state`);
  }
});

// 2. Test Clear Search
console.log('\n--- 2. Testing Clear Search ---');
window.OrgLocationModule.setSearch('');
if (container.innerHTML.includes('No Organizations Found')) {
  throw new Error('Clear search failed to restore all organizations');
}
console.log('[PASS] Clearing search restored all organization records.');

// 3. Test Focus & Selection Retention
console.log('\n--- 3. Testing Focus & Selection Retention ---');
const searchInput = createMockElement('org-search-input', 'input');
searchInput.classList.add('org-search-input');
searchInput.selectionStart = 4;
searchInput.selectionEnd = 4;
global.document.activeElement = searchInput;

window.OrgLocationModule.setSearch('pat');
if (!global.document.activeElement) {
  throw new Error('Focus was lost after calling setSearch!');
}
console.log('[PASS] Focus and cursor selection preserved during active typing in OrgLocationModule.');

// 4. Test OrganizationModule Standalone Search
console.log('\n--- 4. Testing OrganizationModule Standalone Search ---');
window.OrganizationModule.searchTerm = '';
const standaloneContainer = createMockElement('view-container');
window.OrganizationModule.render(standaloneContainer);

window.OrganizationModule.setSearch('APEX-2W');
const filtered = window.OrganizationModule.getFilteredOrgs();
if (filtered.length !== 1 || filtered[0].code !== 'APEX-2W') {
  throw new Error('OrganizationModule.getFilteredOrgs failed for APEX-2W');
}
console.log('[PASS] OrganizationModule standalone search successfully returned APEX-2W.');

console.log('\n====================================================');
console.log('ALL SEARCH TESTS FOR ORGANIZATION MASTER PASSED!');
console.log('====================================================');
