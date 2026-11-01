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

const mod = window.CommonMasterModule;
console.log('Testing Address Master Pagination...');

// 1. Country Master Tab
mod.switchTab('COUNTRIES');
let html = mod.renderCountriesTab();
if (!html.includes('user-pagination-bar')) throw new Error('Missing pagination in Country Master');
if (!html.includes('Showing <strong')) throw new Error('Missing entry counter in Country Master');
console.log('✔ Country Master has pagination controls');

// 2. State Master Tab
mod.switchTab('STATES');
const allStates = window.DB.getAll('states') || [];
console.log(`Total states in DB: ${allStates.length}`);
mod.pageSize = 10;
mod.currentPage = 1;
html = mod.renderStatesTab();
if (!html.includes(`of <strong style="color: var(--text-primary);">${allStates.length}</strong> entries`)) {
  throw new Error('State master total entries mismatch');
}
if (!html.includes('Showing <strong style="color: var(--text-primary);">1</strong> to <strong style="color: var(--text-primary);">10</strong>')) {
  throw new Error('State master page 1 bounds mismatch');
}
// Go to page 2
mod.goToPage(2);
html = mod.renderStatesTab();
if (!html.includes('Showing <strong style="color: var(--text-primary);">11</strong> to <strong style="color: var(--text-primary);">20</strong>')) {
  throw new Error('State master page 2 bounds mismatch: ' + html.substring(html.indexOf('Showing'), html.indexOf('Showing') + 120));
}
// Change page size to 25
mod.setPageSize(25);
if (mod.currentPage !== 1) throw new Error('setPageSize did not reset currentPage to 1');
html = mod.renderStatesTab();
if (!html.includes('Showing <strong style="color: var(--text-primary);">1</strong> to <strong style="color: var(--text-primary);">25</strong>')) {
  throw new Error('State master 25 entries bounds mismatch');
}
console.log('✔ State Master pagination navigation and page size work correctly');

// 3. District Master Tab
mod.switchTab('DISTRICTS');
html = mod.renderDistrictsTab();
if (!html.includes('user-pagination-bar')) throw new Error('Missing pagination in District Master');
console.log('✔ District Master has pagination controls');

// 4. City Master Tab
mod.switchTab('CITIES');
html = mod.renderCitiesTab();
if (!html.includes('user-pagination-bar')) throw new Error('Missing pagination in City Master');
console.log('✔ City Master has pagination controls');

// 5. Pin Code Master Tab
mod.switchTab('PINCODES');
html = mod.renderPincodesTab();
if (!html.includes('user-pagination-bar')) throw new Error('Missing pagination in Pin Code Master');
console.log('✔ Pin Code Master has pagination controls');

// 6. Test resets on search & filter
mod.currentPage = 3;
mod.setSearch('delhi');
if (mod.currentPage !== 1) throw new Error('setSearch did not reset currentPage to 1');
if (mod.searchTerm !== 'delhi') throw new Error('searchTerm not set');

mod.currentPage = 2;
mod.setStatusFilter('Active');
if (mod.currentPage !== 1) throw new Error('setStatusFilter did not reset currentPage to 1');

mod.currentPage = 4;
mod.setCountryFilter('CTRY-01');
if (mod.currentPage !== 1) throw new Error('setCountryFilter did not reset currentPage to 1');

mod.currentPage = 5;
mod.setStateFilter('ST-01');
if (mod.currentPage !== 1) throw new Error('setStateFilter did not reset currentPage to 1');

mod.currentPage = 3;
mod.setDistrictFilter('DIST-01');
if (mod.currentPage !== 1) throw new Error('setDistrictFilter did not reset currentPage to 1');

mod.currentPage = 2;
mod.setCityFilter('CITY-01');
if (mod.currentPage !== 1) throw new Error('setCityFilter did not reset currentPage to 1');

mod.currentPage = 3;
mod.switchTab('COUNTRIES');
if (mod.currentPage !== 1) throw new Error('switchTab did not reset currentPage to 1');

console.log('✔ All pagination reset triggers work as expected');
console.log('\nALL 5 MASTERS PAGINATION TESTS PASSED SUCCESSFULLY! 🎉');
