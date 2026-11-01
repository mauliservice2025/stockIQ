const fs = require('fs');
const path = require('path');

// Mock browser globals
global.window = global;
global.window.location = { hash: '#/common-master' };
global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; }
};

global.document = {
  getElementById: (id) => ({
    innerHTML: '',
    style: {},
    focus: () => {}
  }),
  activeElement: null
};

// 1. Check index.html
console.log('=== VERIFYING COMMON MASTER NAVIGATION IN INDEX.HTML ===\n');
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

if (!indexHtml.includes('id="nav-item-common-master"') || !indexHtml.includes('href="#/common-master"')) {
  console.error('[FAIL] Missing #nav-item-common-master in index.html');
  process.exit(1);
}
console.log('✓ Found #nav-item-common-master linking to #/common-master under Masters in index.html');

if (!indexHtml.includes('js/modules/common-lookup-master.js')) {
  console.error('[FAIL] Missing common-lookup-master.js script tag in index.html');
  process.exit(1);
}
console.log('✓ Found script tag for common-lookup-master.js in index.html');

// Load Data & DB
require(path.join(__dirname, '../js/data/mock-data.js'));
const { DatabaseLayer } = require(path.join(__dirname, '../js/data/db.js'));
window.State = { openModal: () => {}, closeModal: () => {}, showToast: () => {} };
require(path.join(__dirname, '../js/modules/common-lookup-master.js'));

const db = window.DB;
const mod = window.CommonLookupMasterModule;

console.log('\n=== VERIFYING 10 MASTER TYPES IN COMMON MASTER DATA ===\n');

const expectedTypes = [
  { key: 'TITLE', name: 'Title' },
  { key: 'GENDER', name: 'Gender' },
  { key: 'REFERRAL_SOURCE', name: 'Referral Source' },
  { key: 'DISCOUNT_REASON', name: 'Discount Reason' },
  { key: 'CONCESSION_REASON', name: 'Concession Reason' },
  { key: 'CANCELLATION_REASON', name: 'Cancellation Reason' },
  { key: 'RELATIONSHIP', name: 'Relationship' },
  { key: 'MARITAL_STATUS', name: 'Marital Status' },
  { key: 'WRITE_OFF_REASON', name: 'Write-off Reason' },
  { key: 'TRANSFER_REASON', name: 'Transfer Reason' }
];

const allEntries = db.getAll('common_masters') || [];
console.log(`Total Common Master entries in DB: ${allEntries.length}`);
if (allEntries.length < 50) {
  console.error(`[FAIL] Expected at least 50 seed entries, got ${allEntries.length}`);
  process.exit(1);
}

expectedTypes.forEach((t, i) => {
  const items = allEntries.filter(e => e.type === t.key);
  if (items.length === 0) {
    console.error(`[FAIL] No entries found for type ${t.name} (${t.key})`);
    process.exit(1);
  }
  console.log(`✓ Type ${i + 1}) ${t.name} [${t.key}]: ${items.length} entries`);
});

console.log('\n=== VERIFYING COMMON MASTER UI RENDERING & TYPE DROPDOWN ===\n');

const container = { innerHTML: '' };
mod.render(container);

// Verify Type dropdown exists in UI
if (!container.innerHTML.includes('id="common-lookup-type-select"')) {
  console.error('[FAIL] Missing Type dropdown in Common Master UI');
  process.exit(1);
}
console.log('✓ Found Type dropdown (#common-lookup-type-select) in UI');

// Verify all 10 types are options in the Type dropdown
expectedTypes.forEach((t) => {
  if (!container.innerHTML.includes(`value="${t.key}"`)) {
    console.error(`[FAIL] Type dropdown missing option for ${t.name} (${t.key})`);
    process.exit(1);
  }
  if (!container.innerHTML.includes(`>${t.name}<`)) {
    console.error(`[FAIL] Type dropdown missing label text for ${t.name}`);
    process.exit(1);
  }
});
console.log('✓ All 10 master types listed in Type dropdown');

// Verify quick pills exist for all 10 types
expectedTypes.forEach((t) => {
  if (!container.innerHTML.includes(`<span>${t.name}</span>`)) {
    console.error(`[FAIL] Quick navigation pill missing for ${t.name}`);
    process.exit(1);
  }
});
console.log('✓ Quick pill navigation buttons exist for all 10 master types');

// Test filtering by each of the 10 types
expectedTypes.forEach(t => {
  mod.setTypeFilter(t.key);
  const filtered = mod.getFilteredEntries();
  if (filtered.length === 0 || !filtered.every(e => e.type === t.key)) {
    console.error(`[FAIL] Filter by type ${t.key} failed`);
    process.exit(1);
  }
});
console.log('✓ Filtering by each individual master type works properly');

// Test live search
mod.setTypeFilter('ALL');
mod.setSearch('promotional');
const searchResults = mod.getFilteredEntries();
if (searchResults.length === 0 || !searchResults.some(e => e.name.toLowerCase().includes('promotional'))) {
  console.error('[FAIL] Live search for "promotional" failed');
  process.exit(1);
}
console.log('✓ Live search filtering works properly');

// Test CRUD Operations
console.log('\n=== TESTING CRUD OPERATIONS IN COMMON MASTER ===\n');

// 1. Insert new entry
const testEntry = {
  id: 'CM-TEST-999',
  type: 'DISCOUNT_REASON',
  type_label: 'Discount Reason',
  code: 'DISC-TEST',
  name: 'Test Special Discount',
  description: 'Automated test discount reason',
  sort_order: 99,
  status: 'Active'
};
db.insert('common_masters', testEntry);
let fetched = db.getById('common_masters', 'CM-TEST-999');
if (!fetched || fetched.name !== 'Test Special Discount') {
  console.error('[FAIL] Insert common master entry failed');
  process.exit(1);
}
console.log('✓ Insert new master entry verified');

// 2. Status Toggle
mod.toggleStatus('CM-TEST-999');
fetched = db.getById('common_masters', 'CM-TEST-999');
if (fetched.status !== 'Inactive') {
  console.error('[FAIL] Status toggle failed, expected Inactive');
  process.exit(1);
}
console.log('✓ Status toggle verified (Active -> Inactive)');

// 3. Update entry
db.update('common_masters', 'CM-TEST-999', { name: 'Updated Special Discount' });
fetched = db.getById('common_masters', 'CM-TEST-999');
if (fetched.name !== 'Updated Special Discount') {
  console.error('[FAIL] Update entry failed');
  process.exit(1);
}
console.log('✓ Update master entry verified');

// 4. Delete entry
db.delete('common_masters', 'CM-TEST-999');
fetched = db.getById('common_masters', 'CM-TEST-999');
if (fetched) {
  console.error('[FAIL] Delete entry failed');
  process.exit(1);
}
console.log('✓ Delete master entry verified');

// 5. Test localStorage migration
const simulatedOldCache = {
  common_masters: []
};
global.localStorage.setItem('APEX_ISCM_DATABASE_V2', JSON.stringify(simulatedOldCache));
const reloadedDB = new DatabaseLayer();
const reloadedEntries = reloadedDB.getAll('common_masters');
if (reloadedEntries.length < 50) {
  console.error(`[FAIL] Migration failed on cached DB. Expected >= 50, got ${reloadedEntries.length}`);
  process.exit(1);
}
console.log('✓ Migration verified: Cached local storage upgraded with all 10 lookup master categories');

console.log('\n================================================================');
console.log('🎉 COMMON MASTER WITH 10 LOOKUP MASTERS VERIFIED SUCCESSFULLY!');
console.log('================================================================\n');
