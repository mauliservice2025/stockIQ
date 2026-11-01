const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Mock browser environment
global.window = {
  State: {
    showToast: () => {},
    showModal: () => {},
    closeModal: () => {}
  },
  DB: {
    data: {
      roles: [],
      users: []
    },
    getAll(col) { return this.data[col] || []; },
    getById(col, id) { return (this.data[col] || []).find(x => x.id === id); }
  }
};

global.document = {
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => []
};

// Load user-management.js
const code = fs.readFileSync(path.join(__dirname, '..', 'js', 'modules', 'user-management.js'), 'utf8');
eval(code);

const um = window.UserManagementModule;
assert(um, 'UserManagementModule must be defined');

console.log('--- TEST 1: Check Permission Catalog Master HTML rendering ---');
const html = um.renderPermissionCatalogMaster();

// Check removal of Permissions Catalog badge in header
assert(!html.includes('>Permissions Catalog</span>'), 'Permissions Catalog badge next to title must be removed');
console.log('✓ PASS: Permissions Catalog badge removed from header title');

// Check removal of status/description strip
assert(!html.includes('Master catalog of enterprise functional components'), 'Description banner must be removed');
assert(!html.includes('Active System Permissions'), 'Active System Permissions label must be removed');
assert(!html.includes('Core Rights & Extended Actions'), 'Core Rights & Extended Actions label must be removed');
console.log('✓ PASS: Role Summary & Status Strip (and its labels) completely removed');

// Check search box position inside card-header
assert(html.includes('id="perm-master-search-input"'), 'Search input must exist');
const cardHeaderIdx = html.indexOf('class="card-header"');
const searchInputIdx = html.indexOf('id="perm-master-search-input"');
const catalogBtnIdx = html.indexOf('📋 Permission Catalog');
const catPillsIdx = html.indexOf('class="perm-cat-pills"');

assert(cardHeaderIdx < searchInputIdx, 'Search input must be inside card-header');
assert(searchInputIdx < catalogBtnIdx, 'Search input must be placed before Permission Catalog button');
assert(catalogBtnIdx < catPillsIdx, 'Category pills must be after header buttons');
console.log('✓ PASS: Search box moved to upper side inside card-header');

// Check no double magnifying glass in placeholder
assert(!html.includes('placeholder="🔍'), 'Search placeholder must not start with search emoji');
console.log('✓ PASS: No duplicate search icon in placeholder');

// Check table column widths
assert(html.includes('width: 210px;'), 'Permission / Functional Component column width should be 210px');
assert(html.includes('width: 130px;'), 'Permission Code and Module Category should be 130px');
assert(html.includes('width: 175px;'), 'Supported Core Rights column width should be 175px');
assert(html.includes('width: 75px;'), 'Target Route column width should be 75px');
assert(html.includes('width: 110px;'), 'Actions column width should be 110px');
assert(!html.includes('min-width: 290px;'), 'Excessive min-width: 290px should be removed');
console.log('✓ PASS: Table column widths tightened to eliminate excessive whitespace');

console.log('\nALL PERMISSION MASTER VERIFICATION CHECKS PASSED (100%)!');
