const path = require('path');

// Mock browser globals
global.window = global;
global.window.location = { hash: '#/address-master' };
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
require(path.join(__dirname, '../js/data/db.js'));
window.State = { openModal: () => {}, closeModal: () => {}, showToast: () => {} };
require(path.join(__dirname, '../js/modules/common-master.js'));

const mod = window.CommonMasterModule;
const tabs = ['COUNTRIES', 'STATES', 'DISTRICTS', 'CITIES', 'PINCODES'];

console.log('=== VERIFYING ADDRESS MASTER TOP TOOLBAR & CLEAN TABLE CARD LAYOUT ===\n');

tabs.forEach(tab => {
  mod.switchTab(tab);
  const container = { innerHTML: '' };
  mod.render(container);
  
  if (!container.innerHTML.includes('id="common-master-tab-toolbar"')) {
    throw new Error(`Missing #common-master-tab-toolbar in ${tab}`);
  }
  if (!container.innerHTML.includes('common-master-search-input')) {
    throw new Error(`Missing search input in ${tab} toolbar`);
  }
  if (!container.innerHTML.includes('Export CSV')) {
    throw new Error(`Missing Export CSV button in ${tab} toolbar`);
  }
  if (container.innerHTML.includes('class="card-header"')) {
    throw new Error(`Unexpected duplicate card-header found in ${tab} table card`);
  }
  if (!container.innerHTML.includes('class="content-card"')) {
    throw new Error(`Missing content-card in ${tab}`);
  }
  if (!container.innerHTML.includes('class="table-responsive"')) {
    throw new Error(`Missing table-responsive in ${tab}`);
  }
  if (!container.innerHTML.includes('user-pagination-bar')) {
    throw new Error(`Missing user-pagination-bar in ${tab}`);
  }
  console.log(`✓ Tab ${tab}: Toolbar moved to top row; duplicate card-header removed; table & pagination intact.`);
});

console.log('\n================================================================');
console.log('🎉 ALL 5 ADDRESS MASTER TABS VERIFIED WITH TOP TOOLBAR LAYOUT!');
console.log('================================================================');
