const path = require('path');

// Mock browser globals
global.window = global;
global.window.location = { hash: '' };
global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; }
};

global.document = {
  getElementById: (id) => {
    return {
      innerHTML: '',
      setSelectionRange: () => {},
      focus: () => {}
    };
  },
  activeElement: null
};

// Load Mock Data & DB
require(path.join(__dirname, '../js/data/mock-data.js'));
require(path.join(__dirname, '../js/data/db.js'));

// Load State mock
window.State = {
  openModal: () => {},
  closeModal: () => {},
  showToast: () => {}
};

// Load CommonMasterModule
require(path.join(__dirname, '../js/modules/common-master.js'));

console.log('=== VERIFYING MAHARASHTRA DISTRICTS IN DISTRICT MASTER ===\n');

// 1. Verify DB contains 36 districts for Maharashtra (ST-01)
const allDistricts = window.DB.getAll('districts') || [];
const mhDistricts = allDistricts.filter(d => d.state_id === 'ST-01');
console.log(`Total districts in DB: ${allDistricts.length}`);
console.log(`Maharashtra (ST-01) districts in DB: ${mhDistricts.length}`);

if (mhDistricts.length !== 36) {
  console.error(`[FAIL] Expected 36 districts for Maharashtra, found ${mhDistricts.length}`);
  process.exit(1);
}
console.log('✓ Found exactly 36 Maharashtra districts in DB');

// 2. Expected 36 district names
const expectedDistricts = [
  'Pune', 'Mumbai Suburban', 'Thane', 'Nagpur', 'Nashik', 'Chhatrapati Sambhajinagar',
  'Mumbai City', 'Palghar', 'Raigad', 'Ratnagiri', 'Sindhudurg',
  'Satara', 'Sangli', 'Solapur', 'Kolhapur',
  'Ahilyanagar (Ahmednagar)', 'Dhule', 'Jalgaon', 'Nandurbar',
  'Jalna', 'Beed', 'Parbhani', 'Hingoli', 'Nanded', 'Latur', 'Dharashiv (Osmanabad)',
  'Amravati', 'Akola', 'Buldhana', 'Yavatmal', 'Washim',
  'Wardha', 'Bhandara', 'Gondia', 'Chandrapur', 'Gadchiroli'
];

expectedDistricts.forEach(name => {
  const found = mhDistricts.find(d => d.name.toLowerCase() === name.toLowerCase());
  if (!found) {
    console.error(`[FAIL] Missing district: ${name}`);
    process.exit(1);
  }
  if (!found.code || !found.headquarters || !found.division) {
    console.error(`[FAIL] District ${name} missing required attributes:`, found);
    process.exit(1);
  }
});
console.log('✓ All 36 expected district names & metadata validated');

// 3. Verify District Master Tab UI rendering & State Filter
const mod = window.CommonMasterModule;
mod.switchTab('DISTRICTS');
mod.setStateFilter('ST-01');
mod.setPageSize(10);
mod.currentPage = 1;

let html = mod.renderDistrictsTab();
if (!html.includes('Showing <strong style="color: var(--text-primary);">1</strong> to <strong style="color: var(--text-primary);">10</strong> of <strong style="color: var(--text-primary);">36</strong> entries')) {
  console.error('[FAIL] District tab pagination counter mismatch for Maharashtra filter');
  process.exit(1);
}
console.log('✓ District Master UI filters Maharashtra and displays "Showing 1 to 10 of 36 entries"');

// 4. Test page navigation
mod.goToPage(4);
html = mod.renderDistrictsTab();
if (!html.includes('Showing <strong style="color: var(--text-primary);">31</strong> to <strong style="color: var(--text-primary);">36</strong> of <strong style="color: var(--text-primary);">36</strong> entries')) {
  console.error('[FAIL] Page 4 bounds mismatch: ' + html);
  process.exit(1);
}
console.log('✓ District Master navigates to Page 4 ("Showing 31 to 36 of 36 entries")');

// 5. Test search filter within Maharashtra
mod.setSearch('Gadchiroli');
html = mod.renderDistrictsTab();
if (!html.includes('Gadchiroli') || !html.includes('GDC')) {
  console.error('[FAIL] Search for "Gadchiroli" failed');
  process.exit(1);
}
console.log('✓ District Master search works properly for Maharashtra districts');

// 6. Test localStorage migration scenario (simulate existing cache)
const simulatedOldCache = {
  districts: [
    { id: "DIST-01", country_id: "CTRY-01", state_id: "ST-01", code: "PUN", name: "Pune", headquarters: "Pune", division: "Pune Division", status: "Active" }
  ]
};
global.localStorage.setItem('APEX_ISCM_DATABASE_V2', JSON.stringify(simulatedOldCache));
const reloadedDB = new (require(path.join(__dirname, '../js/data/db.js')).DatabaseLayer)();
const reloadedMH = reloadedDB.getAll('districts').filter(d => d.state_id === 'ST-01');
if (reloadedMH.length !== 36) {
  console.error(`[FAIL] Migration failed on cached DB. Expected 36, got ${reloadedMH.length}`);
  process.exit(1);
}
console.log('✓ Migration verified: Cached local storage upgraded to all 36 Maharashtra districts');

console.log('\n========================================================');
console.log('🎉 ALL 36 MAHARASHTRA DISTRICTS VERIFIED SUCCESSFULLY!');
console.log('========================================================');
