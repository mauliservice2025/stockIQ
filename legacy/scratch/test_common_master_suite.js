const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('=== TEST SUITE: COMMON MASTER (COUNTRY, STATE, DISTRICT, CITY, PIN CODE) ===\n');

// Mock DOM environment
const storage = {};
const mockLocalStorage = {
  getItem: (key) => storage[key] || null,
  setItem: (key, val) => { storage[key] = String(val); },
  removeItem: (key) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

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
    addEventListener: () => {},
    focus: () => {},
    click: () => {}
  };
}

const domElements = {};
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
  location: { hash: '#/common-master' },
  window: {},
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }),
  confirm: () => true,
  alert: () => {},
  Blob: function(parts, opts) { this.parts = parts; this.opts = opts; },
  URL: { createObjectURL: () => 'blob:dummy' }
};
sandbox.window = sandbox;

vm.createContext(sandbox);

// 1. Load mock-data.js
const { INITIAL_DATA } = require('../js/data/mock-data.js');
sandbox.INITIAL_DATA = INITIAL_DATA;
sandbox.window.INITIAL_DATA = INITIAL_DATA;

console.log('1. Checking INITIAL_DATA collections:');
console.log('   Countries count:', INITIAL_DATA.countries.length);
console.log('   States count:', INITIAL_DATA.states.length);
console.log('   Districts count:', INITIAL_DATA.districts.length);
console.log('   Cities count:', INITIAL_DATA.cities.length);
console.log('   Pincodes count:', INITIAL_DATA.pincodes.length);

if (!INITIAL_DATA.countries || INITIAL_DATA.countries.length < 5) throw new Error('Countries count too low');
if (!INITIAL_DATA.states || INITIAL_DATA.states.length < 8) throw new Error('States count too low');
if (!INITIAL_DATA.districts || INITIAL_DATA.districts.length < 8) throw new Error('Districts count too low');
if (!INITIAL_DATA.cities || INITIAL_DATA.cities.length < 8) throw new Error('Cities count too low');
if (!INITIAL_DATA.pincodes || INITIAL_DATA.pincodes.length < 8) throw new Error('Pincodes count too low');
console.log('   [PASS] All 5 collections loaded in INITIAL_DATA.\n');

// 2. Load db.js
const dbCode = fs.readFileSync(path.join(__dirname, '../js/data/db.js'), 'utf8');
vm.runInContext(dbCode, sandbox);
if (!sandbox.window.DB && sandbox.window.DatabaseLayer) {
    sandbox.window.DB = new sandbox.window.DatabaseLayer();
}

console.log('2. Checking DatabaseLayer helper methods:');
const countries = sandbox.window.DB.getCountries();
const statesForIndia = sandbox.window.DB.getStates('CTRY-01');
const distsForMh = sandbox.window.DB.getDistricts('ST-01');
const citiesForPune = sandbox.window.DB.getCities('DIST-01');
const pinsForChakan = sandbox.window.DB.getPincodes('CITY-03');

console.log('   Countries in DB:', countries.length);
console.log('   States in India:', statesForIndia.length);
console.log('   Districts in Maharashtra:', distsForMh.length);
console.log('   Cities in Pune District:', citiesForPune.length);
console.log('   Pincodes in Chakan:', pinsForChakan.length);

if (statesForIndia.length === 0) throw new Error('getStates failed');
if (distsForMh.length === 0) throw new Error('getDistricts failed');
if (citiesForPune.length === 0) throw new Error('getCities failed');
if (pinsForChakan.length === 0) throw new Error('getPincodes failed');

const locMaster = sandbox.window.DB.getLocationMaster();
console.log('   Dynamic Location Master states:', Object.keys(locMaster));
if (!locMaster['Maharashtra'] || !locMaster['Maharashtra']['Pune']) {
  throw new Error('getLocationMaster dynamic building failed');
}
console.log('   [PASS] DatabaseLayer helper methods and dynamic Location Master verified.\n');

// 3. Load State & Common Master Module
const stateCode = fs.readFileSync(path.join(__dirname, '../js/state.js'), 'utf8');
vm.runInContext(stateCode, sandbox);

const commonMasterCode = fs.readFileSync(path.join(__dirname, '../js/modules/common-master.js'), 'utf8');
vm.runInContext(commonMasterCode, sandbox);

// 4. Test rendering each tab
console.log('3. Testing CommonMasterModule tab renderings:');
const tabs = ['COUNTRIES', 'STATES', 'DISTRICTS', 'CITIES', 'PINCODES'];
const dummy = createMockElement('div');

tabs.forEach(tab => {
  sandbox.window.CommonMasterModule.activeTab = tab;
  sandbox.window.CommonMasterModule.render(dummy);
  if (!dummy.innerHTML || dummy.innerHTML.length < 200) {
    throw new Error(`Tab ${tab} failed to render!`);
  }
  console.log(`   [PASS] Tab ${tab} rendered successfully.`);
});
console.log('');

// 5. Test CRUD operations on Country Master
console.log('4. Testing Country Master operations:');
const newCountry = {
  id: 'CTRY-99',
  code: 'SGP',
  iso2: 'SG',
  name: 'Singapore',
  dial_code: '+65',
  currency_code: 'SGD',
  currency_symbol: 'S$',
  status: 'Active'
};
sandbox.window.DB.insert('countries', newCountry);
console.log('   Inserted Country SGP. DB count:', sandbox.window.DB.getAll('countries').length);

sandbox.window.CommonMasterModule.activeTab = 'COUNTRIES';
sandbox.window.CommonMasterModule.render(dummy);
if (!dummy.innerHTML.includes('Singapore') || !dummy.innerHTML.includes('SGP')) {
  throw new Error('Singapore not rendered in countries table!');
}

sandbox.window.CommonMasterModule.toggleCountryStatus('CTRY-99');
const toggled = sandbox.window.DB.getById('countries', 'CTRY-99');
if (toggled.status !== 'Inactive') throw new Error('toggleCountryStatus failed');
console.log('   [PASS] Country status toggle works.');

sandbox.window.CommonMasterModule.deleteCountry('CTRY-99');
if (sandbox.window.DB.getById('countries', 'CTRY-99')) throw new Error('deleteCountry failed');
console.log('   [PASS] Country deletion works.\n');

// 6. Test State Master CRUD
console.log('5. Testing State Master operations:');
const newState = {
  id: 'ST-99',
  country_id: 'CTRY-01',
  code: 'GA',
  tin: '30',
  name: 'Goa',
  type: 'State',
  capital: 'Panaji',
  status: 'Active'
};
sandbox.window.DB.insert('states', newState);
sandbox.window.CommonMasterModule.activeTab = 'STATES';
sandbox.window.CommonMasterModule.render(dummy);
if (!dummy.innerHTML.includes('Goa')) throw new Error('Goa not rendered in states table');
console.log('   [PASS] State insert & render verified.');

sandbox.window.CommonMasterModule.deleteState('ST-99');
if (sandbox.window.DB.getById('states', 'ST-99')) throw new Error('deleteState failed');
console.log('   [PASS] State deletion works.\n');

// 7. Test District Master CRUD
console.log('6. Testing District Master operations:');
const newDist = {
  id: 'DIST-99',
  country_id: 'CTRY-01',
  state_id: 'ST-01',
  code: 'KOL',
  name: 'Kolhapur',
  headquarters: 'Kolhapur',
  status: 'Active'
};
sandbox.window.DB.insert('districts', newDist);
sandbox.window.CommonMasterModule.activeTab = 'DISTRICTS';
sandbox.window.CommonMasterModule.render(dummy);
if (!dummy.innerHTML.includes('Kolhapur')) throw new Error('Kolhapur not rendered');
console.log('   [PASS] District insert & render verified.');

sandbox.window.CommonMasterModule.deleteDistrict('DIST-99');
if (sandbox.window.DB.getById('districts', 'DIST-99')) throw new Error('deleteDistrict failed');
console.log('   [PASS] District deletion works.\n');

// 8. Test City Master CRUD
console.log('7. Testing City Master operations:');
const newCity = {
  id: 'CITY-99',
  country_id: 'CTRY-01',
  state_id: 'ST-01',
  district_id: 'DIST-01',
  code: 'BARAMATI',
  name: 'Baramati',
  tier: 'Tier 2',
  is_industrial_hub: true,
  status: 'Active'
};
sandbox.window.DB.insert('cities', newCity);
sandbox.window.CommonMasterModule.activeTab = 'CITIES';
sandbox.window.CommonMasterModule.render(dummy);
if (!dummy.innerHTML.includes('Baramati')) throw new Error('Baramati not rendered');
console.log('   [PASS] City insert & render verified.');

sandbox.window.CommonMasterModule.deleteCity('CITY-99');
if (sandbox.window.DB.getById('cities', 'CITY-99')) throw new Error('deleteCity failed');
console.log('   [PASS] City deletion works.\n');

// 9. Test Pin Code Master CRUD
console.log('8. Testing Pin Code Master operations:');
const newPin = {
  id: 'PIN-99',
  pincode: '413102',
  area_name: 'Baramati MIDC',
  country_id: 'CTRY-01',
  state_id: 'ST-01',
  district_id: 'DIST-01',
  city_id: 'CITY-01',
  delivery_status: 'Delivery',
  status: 'Active'
};
sandbox.window.DB.insert('pincodes', newPin);
sandbox.window.CommonMasterModule.activeTab = 'PINCODES';
sandbox.window.CommonMasterModule.render(dummy);
if (!dummy.innerHTML.includes('413102')) throw new Error('413102 not rendered');
console.log('   [PASS] Pin Code insert & render verified.');

sandbox.window.CommonMasterModule.deletePincode('PIN-99');
if (sandbox.window.DB.getById('pincodes', 'PIN-99')) throw new Error('deletePincode failed');
console.log('   [PASS] Pin Code deletion works.\n');

// 10. Test CSV Export functions
console.log('9. Testing CSV Export functions:');
sandbox.window.CommonMasterModule.exportCountriesCsv();
sandbox.window.CommonMasterModule.exportStatesCsv();
sandbox.window.CommonMasterModule.exportDistrictsCsv();
sandbox.window.CommonMasterModule.exportCitiesCsv();
sandbox.window.CommonMasterModule.exportPincodesCsv();
console.log('   [PASS] All 5 export CSV functions executed cleanly without error.\n');

console.log('>>> ALL 10 COMMON MASTER TEST SUITES PASSED SUCCESSFULLY! <<<\n');
