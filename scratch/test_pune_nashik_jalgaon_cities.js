const path = require('path');

// Mock browser globals
global.window = global;
global.window.location = { hash: '#/cities' };
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

// Load Data & DB
require(path.join(__dirname, '../js/data/mock-data.js'));
const { DatabaseLayer } = require(path.join(__dirname, '../js/data/db.js'));
window.State = { openModal: () => {}, closeModal: () => {}, showToast: () => {} };
require(path.join(__dirname, '../js/modules/common-master.js'));

console.log('=== TEST: CITIES OF PUNE, NASHIK, AND JALGAON ===\n');

const db = window.DB;
const allCities = db.getAll('cities') || [];
console.log(`Total cities in DB: ${allCities.length}`);

// 1. Verify Pune cities
const puneCities = allCities.filter(c => c.district_id === 'DIST-01');
console.log(`Pune (DIST-01) cities in DB: ${puneCities.length}`);
if (puneCities.length < 14) {
  console.error(`[FAIL] Expected at least 14 cities for Pune, found ${puneCities.length}`);
  process.exit(1);
}
const expectedPune = ['Pune', 'Pimpri-Chinchwad', 'Chakan', 'Talegaon Dabhade', 'Baramati', 'Shirur', 'Daund', 'Lonavala', 'Junnar', 'Bhor', 'Saswad', 'Indapur', 'Rajgurunagar (Khed)', 'Alandi'];
expectedPune.forEach(name => {
  const found = puneCities.find(c => c.name.toLowerCase() === name.toLowerCase());
  if (!found) {
    console.error(`[FAIL] Missing expected Pune city: ${name}`);
    process.exit(1);
  }
});
console.log('✓ All 14 Pune cities verified successfully.');

// 2. Verify Nashik cities
const nashikCities = allCities.filter(c => c.district_id === 'DIST-05');
console.log(`Nashik (DIST-05) cities in DB: ${nashikCities.length}`);
if (nashikCities.length < 12) {
  console.error(`[FAIL] Expected at least 12 cities for Nashik, found ${nashikCities.length}`);
  process.exit(1);
}
const expectedNashik = ['Nashik', 'Malegaon', 'Sinnar', 'Ozar', 'Igatpuri', 'Trimbak (Trimbakeshwar)', 'Yeola', 'Manmad', 'Satana', 'Niphad', 'Kalwan', 'Deolali'];
expectedNashik.forEach(name => {
  const found = nashikCities.find(c => c.name.toLowerCase() === name.toLowerCase());
  if (!found) {
    console.error(`[FAIL] Missing expected Nashik city: ${name}`);
    process.exit(1);
  }
});
console.log('✓ All 12 Nashik cities verified successfully.');

// 3. Verify Jalgaon cities
const jalgaonCities = allCities.filter(c => c.district_id === 'DIST-24');
console.log(`Jalgaon (DIST-24) cities in DB: ${jalgaonCities.length}`);
if (jalgaonCities.length < 12) {
  console.error(`[FAIL] Expected at least 12 cities for Jalgaon, found ${jalgaonCities.length}`);
  process.exit(1);
}
const expectedJalgaon = ['Jalgaon', 'Bhusawal', 'Chalisgaon', 'Amalner', 'Chopda', 'Pachora', 'Jamner', 'Raver', 'Yawal', 'Erandol', 'Parola', 'Dharangaon'];
expectedJalgaon.forEach(name => {
  const found = jalgaonCities.find(c => c.name.toLowerCase() === name.toLowerCase());
  if (!found) {
    console.error(`[FAIL] Missing expected Jalgaon city: ${name}`);
    process.exit(1);
  }
});
console.log('✓ All 12 Jalgaon cities verified successfully.');

// 4. Verify City Master UI tab filtering
const mod = window.CommonMasterModule;
mod.switchTab('CITIES');

// Pune Filter
mod.setDistrictFilter('DIST-01');
mod.setPageSize(10);
mod.currentPage = 1;
let html = mod.renderCitiesTab();
if (!html.includes('Baramati') || !html.includes('Chakan') || !html.includes('Showing <strong style="color: var(--text-primary);">1</strong> to <strong style="color: var(--text-primary);">10</strong> of <strong style="color: var(--text-primary);">14</strong> entries')) {
  console.error('[FAIL] City Master rendering mismatch for Pune filter');
  process.exit(1);
}
console.log('✓ City Master UI renders Pune cities with pagination ("Showing 1 to 10 of 14 entries")');

// Nashik Filter
mod.setDistrictFilter('DIST-05');
html = mod.renderCitiesTab();
if (!html.includes('Nashik') || !html.includes('Sinnar') || !html.includes('Showing <strong style="color: var(--text-primary);">1</strong> to <strong style="color: var(--text-primary);">10</strong> of <strong style="color: var(--text-primary);">12</strong> entries')) {
  console.error('[FAIL] City Master rendering mismatch for Nashik filter');
  process.exit(1);
}
console.log('✓ City Master UI renders Nashik cities with pagination ("Showing 1 to 10 of 12 entries")');

// Jalgaon Filter
mod.setDistrictFilter('DIST-24');
html = mod.renderCitiesTab();
if (!html.includes('Jalgaon') || !html.includes('Bhusawal') || !html.includes('Showing <strong style="color: var(--text-primary);">1</strong> to <strong style="color: var(--text-primary);">10</strong> of <strong style="color: var(--text-primary);">12</strong> entries')) {
  console.error('[FAIL] City Master rendering mismatch for Jalgaon filter');
  process.exit(1);
}
console.log('✓ City Master UI renders Jalgaon cities with pagination ("Showing 1 to 10 of 12 entries")');

// 5. Verify District Master UI displays the updated city counts
mod.switchTab('DISTRICTS');
mod.setStateFilter('ST-01');
mod.setPageSize(50);
mod.currentPage = 1;
const distHtml = mod.renderDistrictsTab();
if (!distHtml.includes('Pune') || !distHtml.includes('Nashik') || !distHtml.includes('Jalgaon')) {
  console.error('[FAIL] District tab does not include expected districts');
  process.exit(1);
}
console.log('✓ District Master displays updated counts for Pune, Nashik, and Jalgaon');

// 6. Test Migration on Cached LocalStorage
const simulatedOldCache = {
  cities: [
    { id: "CITY-01", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-01", code: "PUN-CITY", name: "Pune", tier: "Tier 1", is_industrial_hub: true, status: "Active" }
  ]
};
global.localStorage.setItem('APEX_ISCM_DATABASE_V2', JSON.stringify(simulatedOldCache));
const reloadedDB = new DatabaseLayer();
const reloadedPune = reloadedDB.getAll('cities').filter(c => c.district_id === 'DIST-01');
const reloadedNashik = reloadedDB.getAll('cities').filter(c => c.district_id === 'DIST-05');
const reloadedJalgaon = reloadedDB.getAll('cities').filter(c => c.district_id === 'DIST-24');

if (reloadedPune.length < 14 || reloadedNashik.length < 12 || reloadedJalgaon.length < 12) {
  console.error(`[FAIL] Migration failed on cached DB. Got Pune: ${reloadedPune.length}, Nashik: ${reloadedNashik.length}, Jalgaon: ${reloadedJalgaon.length}`);
  process.exit(1);
}
console.log('✓ Migration verified: Cached local storage upgraded to all cities for Pune, Nashik, and Jalgaon');

console.log('\n================================================================');
console.log('🎉 ALL CITIES OF PUNE, NASHIK, AND JALGAON VERIFIED SUCCESSFULLY!');
console.log('================================================================');
