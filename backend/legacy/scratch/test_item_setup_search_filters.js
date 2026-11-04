const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

console.log('================================================================');
console.log('TESTING SEARCH & FILTERS IN ALL ITEM MASTER SETUP TABS');
console.log('================================================================\n');

// 1. Read necessary files
const mockDataContent = fs.readFileSync(path.join(__dirname, '../js/data/mock-data.js'), 'utf8');
const dbContent = fs.readFileSync(path.join(__dirname, '../js/data/db.js'), 'utf8');
const stateContent = fs.readFileSync(path.join(__dirname, '../js/state.js'), 'utf8');
const itemSetupContent = fs.readFileSync(path.join(__dirname, '../js/modules/item-setup-master.js'), 'utf8');
const storeInvContent = fs.readFileSync(path.join(__dirname, '../js/modules/store-inventory.js'), 'utf8');

// 2. Setup sandbox
const sandbox = {
  window: {},
  document: {
    getElementById: (id) => null,
    querySelector: (sel) => null,
    querySelectorAll: (sel) => [],
    addEventListener: () => {}
  },
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  confirm: () => true,
  localStorage: {
    getItem: () => null,
    setItem: () => {}
  }
};
sandbox.window = sandbox;

vm.createContext(sandbox);
vm.runInContext(mockDataContent, sandbox);
vm.runInContext(dbContent, sandbox);
vm.runInContext(stateContent, sandbox);
vm.runInContext(itemSetupContent, sandbox);
vm.runInContext(storeInvContent, sandbox);

const ItemSetup = sandbox.window.ItemSetupModule;
assert(ItemSetup, 'ItemSetupModule must exist');
ItemSetup.init();

// =============================================================================
// TEST 1: BRAND MASTER
// =============================================================================
console.log('Checking 1. Brand Master search and filters...');
let brandHtml = ItemSetup.renderBrandsTab();
assert(brandHtml.includes('id="brand-search-input"'), 'Brand search input must have ID brand-search-input');
assert(brandHtml.includes('All Countries'), 'Brand must have country filter');
assert(brandHtml.includes('All Status'), 'Brand must have status filter');
assert(brandHtml.includes('Bosch') && brandHtml.includes('Castrol'), 'Should render default brands');

// Search Bosch
ItemSetup.setBrandSearch('bosch');
brandHtml = ItemSetup.renderBrandsTab();
assert(brandHtml.includes('Bosch'), 'Filtered brands must include Bosch');
assert(!brandHtml.includes('Castrol'), 'Filtered brands must NOT include Castrol');

// Filter Country Germany
ItemSetup.setBrandSearch('');
ItemSetup.setBrandCountryFilter('Germany');
brandHtml = ItemSetup.renderBrandsTab();
assert(brandHtml.includes('Bosch'), 'Germany filter should include Bosch');
assert(!brandHtml.includes('Castrol'), 'Germany filter should NOT include Castrol (UK)');

// Empty state
ItemSetup.setBrandSearch('NONEXISTENT_BRAND_XYZ');
brandHtml = ItemSetup.renderBrandsTab();
assert(brandHtml.includes('No brands match the current filters'), 'Must show empty state message');
assert(brandHtml.includes('resetBrandFilters()'), 'Must have reset button');

// Reset
ItemSetup.resetBrandFilters();
brandHtml = ItemSetup.renderBrandsTab();
assert(brandHtml.includes('Castrol') && brandHtml.includes('Bosch'), 'Reset should restore all brands');
console.log('  -> Brand Master passed!\n');

// =============================================================================
// TEST 2: MANUFACTURER MASTER
// =============================================================================
console.log('Checking 2. Manufacturer Master search and filters...');
let mfgHtml = ItemSetup.renderManufacturersTab();
assert(mfgHtml.includes('id="mfg-search-input"'), 'Mfg search input must have ID mfg-search-input');
assert(mfgHtml.includes('All Classifications'), 'Mfg must have classification filter');
assert(mfgHtml.includes('All Status'), 'Mfg must have status filter');
assert(mfgHtml.includes('Lumax') || mfgHtml.includes('Endurance') || mfgHtml.includes('Bajaj'), 'Should render manufacturers');

// Search Endurance
ItemSetup.setMfgSearch('endurance');
mfgHtml = ItemSetup.renderManufacturersTab();
assert(mfgHtml.includes('Endurance'), 'Search endurance must return Endurance');

// Filter OEM
ItemSetup.setMfgSearch('');
ItemSetup.setMfgTypeFilter('OEM');
mfgHtml = ItemSetup.renderManufacturersTab();
assert(mfgHtml.includes('OEM (Two-Wheeler)'), 'Classification OEM should be selected');

// Empty state
ItemSetup.setMfgSearch('UNKNOWN_MFG_123');
mfgHtml = ItemSetup.renderManufacturersTab();
assert(mfgHtml.includes('No manufacturers match the current filters'), 'Must show empty state message');
assert(mfgHtml.includes('resetMfgFilters()'), 'Must have reset button');

// Reset
ItemSetup.resetMfgFilters();
mfgHtml = ItemSetup.renderManufacturersTab();
assert(mfgHtml.includes('Endurance'), 'Reset should restore all manufacturers');
console.log('  -> Manufacturer Master passed!\n');

// =============================================================================
// TEST 3: VEHICLE COMPATIBILITY MASTER
// =============================================================================
console.log('Checking 3. Vehicle Compatibility Master search and filters...');
let vehHtml = ItemSetup.renderVehicleCompatibilityTab();
assert(vehHtml.includes('id="vehicle-search-input"'), 'Vehicle search input must have ID vehicle-search-input');
assert(vehHtml.includes('All Fuel Types'), 'Vehicle must have fuel type filter');
assert(vehHtml.includes('All Status'), 'Vehicle must have status filter');
assert(vehHtml.includes('Activa') || vehHtml.includes('Splendor') || vehHtml.includes('Pulsar'), 'Should render vehicle models');

// Search Activa
ItemSetup.setVehicleSearch('activa');
vehHtml = ItemSetup.renderVehicleCompatibilityTab();
assert(vehHtml.includes('Activa'), 'Search activa must return Activa');
assert(!vehHtml.includes('Pulsar'), 'Search activa must NOT return Pulsar');

// Fuel filter EV
ItemSetup.setVehicleSearch('');
ItemSetup.setVehicleFuelFilter('EV');
vehHtml = ItemSetup.renderVehicleCompatibilityTab();
assert(vehHtml.includes('Electric (EV)'), 'EV filter must be active');

// Empty state
ItemSetup.setVehicleSearch('FLYING_CAR_999');
vehHtml = ItemSetup.renderVehicleCompatibilityTab();
assert(vehHtml.includes('No vehicle models match the current filters'), 'Must show empty state message');
assert(vehHtml.includes('resetVehicleFilters()'), 'Must have reset button');

// Reset
ItemSetup.resetVehicleFilters();
vehHtml = ItemSetup.renderVehicleCompatibilityTab();
assert(vehHtml.includes('Activa') && vehHtml.includes('Pulsar'), 'Reset should restore all models');
console.log('  -> Vehicle Compatibility Master passed!\n');

// =============================================================================
// TEST 4: UOM MASTER
// =============================================================================
console.log('Checking 4. UOM Master search and filters...');
let uomHtml = ItemSetup.renderUomTab();
assert(uomHtml.includes('id="uom-search-input"'), 'UOM search input must have ID uom-search-input');
assert(uomHtml.includes('All Categories'), 'UOM must have Category filter');
assert(uomHtml.includes('All Status'), 'UOM must have status filter');
assert(uomHtml.includes('NOS') || uomHtml.includes('LTR') || uomHtml.includes('KGS') || uomHtml.includes('SET'), 'Should render UOMs');

// Search Litre
ItemSetup.setUomSearch('litre');
uomHtml = ItemSetup.renderUomTab();
assert(uomHtml.includes('LTR') || uomHtml.includes('Litre'), 'Search litre must return Litre / LTR');
assert(!uomHtml.includes('KGS'), 'Search litre must NOT return KGS');

// Filter Category Volume
ItemSetup.setUomSearch('');
ItemSetup.setUomTypeFilter('Volume');
uomHtml = ItemSetup.renderUomTab();
assert(uomHtml.includes('LTR') || uomHtml.includes('Litre') || uomHtml.includes('ML'), 'Volume filter should return volume units');
assert(!uomHtml.includes('MTR') && !uomHtml.includes('Meter'), 'Volume filter should NOT return Length units');

// Empty state
ItemSetup.setUomSearch('MICRO_LIGHTYEAR_404');
uomHtml = ItemSetup.renderUomTab();
assert(uomHtml.includes('No units match the current filters'), 'Must show empty state message');
assert(uomHtml.includes('resetUomFilters()'), 'Must have reset button');

// Reset
ItemSetup.resetUomFilters();
uomHtml = ItemSetup.renderUomTab();
assert(uomHtml.includes('NOS') && uomHtml.includes('LTR'), 'Reset should restore all UOMs');
console.log('  -> UOM Master passed!\n');

// =============================================================================
// TEST 5: HSN/SAC MASTER
// =============================================================================
console.log('Checking 5. HSN/SAC Master search and filters...');
let hsnHtml = ItemSetup.renderHsnTab();
assert(hsnHtml.includes('id="hsn-search-input"'), 'HSN search input must have ID hsn-search-input');
assert(hsnHtml.includes('All GST Slabs'), 'HSN must have GST Slab filter');
assert(hsnHtml.includes('All Status'), 'HSN must have status filter');
assert(hsnHtml.includes('8714') || hsnHtml.includes('2710'), 'Should render HSN codes');

// Search 8714
ItemSetup.setHsnSearch('8714');
hsnHtml = ItemSetup.renderHsnTab();
assert(hsnHtml.includes('8714'), 'Search 8714 must return 8714');
assert(!hsnHtml.includes('2710'), 'Search 8714 must NOT return 2710');

// Filter 28% GST
ItemSetup.setHsnSearch('');
ItemSetup.setHsnGstFilter('28');
hsnHtml = ItemSetup.renderHsnTab();
assert(hsnHtml.includes('28%'), 'GST filter should show 28% entries');

// Empty state
ItemSetup.setHsnSearch('NONEXISTENT_TAX_CODE_000');
hsnHtml = ItemSetup.renderHsnTab();
assert(hsnHtml.includes('No HSN codes match the current filters'), 'Must show empty state message');
assert(hsnHtml.includes('resetHsnFilters()'), 'Must have reset button');

// Reset
ItemSetup.resetHsnFilters();
hsnHtml = ItemSetup.renderHsnTab();
assert(hsnHtml.includes('8714') && hsnHtml.includes('2710'), 'Reset should restore all HSN codes');
console.log('  -> HSN/SAC Master passed!\n');

// =============================================================================
// TEST 6: UI BUTTONS AND SYMBOL CONSISTENCY
// =============================================================================
console.log('Checking 6. Action button symbols across all tabs...');
[brandHtml, mfgHtml, vehHtml, uomHtml, hsnHtml].forEach(html => {
  assert(html.includes('✏️'), 'Must use ✏️ symbol for Edit action');
  assert(html.includes('🗑️'), 'Must use 🗑️ symbol for Delete action');
  assert(html.includes('+ Add'), 'Must have + Add primary button');
});
console.log('  -> Action button symbols verified!\n');

console.log('================================================================');
console.log('ALL TESTS PASSED SUCCESSFULLY! (6/6)');
console.log('================================================================');
