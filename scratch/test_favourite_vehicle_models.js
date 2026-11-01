// ============================================================================
// Verification Script: Favourite Vehicle Models Feature
// Validates Functional Requirements 1 - 6
// ============================================================================

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// 1. Mock LocalStorage
const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { for (const k in storage) delete storage[k]; }
};

// 2. Mock DOM & Window
global.window = global;
const elements = {};
global.document = {
  getElementById: (id) => {
    if (!elements[id]) {
      elements[id] = {
        id,
        value: '',
        innerHTML: '',
        style: {},
        dataset: {},
        classList: {
          add: () => {},
          remove: () => {},
          contains: () => false,
          toggle: () => false
        },
        querySelectorAll: () => [],
        focus: () => {},
        blur: () => {}
      };
    }
    return elements[id];
  },
  createElement: (tag) => ({
    tagName: tag,
    style: {},
    appendChild: () => {},
    remove: () => {},
    innerHTML: ''
  }),
  addEventListener: () => {}
};

// 3. Load DB & State
const { DatabaseLayer } = require('../js/data/db.js');
window.DatabaseLayer = DatabaseLayer;
window.DB = new DatabaseLayer();

let toastMessages = [];
const stateSource = fs.readFileSync(path.join(__dirname, '../js/state.js'), 'utf8');
eval(stateSource);
window.State.showToast = (msg, type) => {
  toastMessages.push({ msg, type });
};

// Mock active user (Pravin Patil - Admin)
window.DB.data.users = [
  { id: 'USR-001', username: 'p.patil', name: 'Pravin Patil', status: 'ACTIVE', user_type: 'Admin', primary_role: 'ROLE-ADMIN' },
  { id: 'USR-002', username: 's.shinde', name: 'Santosh Shinde', status: 'ACTIVE', user_type: 'Technician', primary_role: 'ROLE-TECHNICIAN' },
  { id: 'USR-999', username: 'inactive.user', name: 'Inactive User', status: 'INACTIVE', user_type: 'Staff' }
];
window.State.currentUserId = 'USR-001';

// 4. Load Pagination Helper (dummy mock for item-setup-master)
window.PaginationHelper = {
  reset: () => {},
  paginate: (items) => ({ items, totalRecords: items.length, currentPage: 1, pageSize: 10 }),
  render: () => '<div class="pagination"></div>'
};

// 5. Load Item Setup Master module
const itemSetupSource = fs.readFileSync(path.join(__dirname, '../js/modules/item-setup-master.js'), 'utf8');
eval(itemSetupSource);

// 6. Load Billing Module
const billingSource = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');
eval(billingSource);

// 7. Load Store Inventory Module
const storeInvSource = fs.readFileSync(path.join(__dirname, '../js/modules/store-inventory.js'), 'utf8');
eval(storeInvSource);

console.log('------------------------------------------------------------');
console.log('RUNNING FAVOURITE VEHICLE MODELS FEATURE TEST SUITE');
console.log('------------------------------------------------------------');

// Initialize seed data
window.ItemSetupModule.init();
const vehicles = window.DB.getAll('vehicleModels') || [];
console.log(`[Setup] Loaded ${vehicles.length} vehicle models into database.`);
assert(vehicles.length >= 7, 'Expected standard vehicle models to be seeded');

const testModel1 = vehicles[0]; // e.g. Yezdi Scrambler
const testModel2 = vehicles[1]; // e.g. Yezdi Roadster
const testModel3 = vehicles[2]; // e.g. Yezdi Adventure
console.log(`[Setup] Test models: "${testModel1.name}", "${testModel2.name}", "${testModel3.name}"`);

// --------------------------------------------------------------------------
// TEST 1: Requirement 1 - Display ⭐ Favourite icon against each vehicle model in Vehicle Model List
// --------------------------------------------------------------------------
console.log('\n--- TEST 1: Requirement 1 - Display ⭐ Favourite icon in Vehicle Model List ---');
const tableHtml = window.ItemSetupModule.renderVehicleCompatibilityTab();
assert(tableHtml.includes('<th style="width: 44px; text-align: center;" title="Favourite">⭐</th>'), 'Table header must have ⭐ Favourite column');
assert(tableHtml.includes('fav-model-star-btn'), 'Table rows must render favourite star toggle button');
assert(tableHtml.includes('Mark as favourite'), 'Unmarked rows must have "Mark as favourite" title');
console.log('✓ TEST 1 PASSED: ⭐ Favourite icon and column rendered in Vehicle Model List.');

// --------------------------------------------------------------------------
// TEST 2: Requirement 2 - Allow users to mark or unmark a vehicle model as favourite
// --------------------------------------------------------------------------
console.log('\n--- TEST 2: Requirement 2 - Mark and unmark vehicle model as favourite ---');
toastMessages = [];

// Mark testModel1 as favourite
window.ItemSetupModule.toggleVehicleFavourite(testModel1.id);
assert(window.DB.isVehicleModelFavourite('USR-001', testModel1.id) === true, 'Model 1 must be favourite in DB');
assert(window.State.isVehicleModelFavourite(testModel1.id) === true, 'Model 1 must be favourite in State');
assert(toastMessages.some(t => t.msg.includes('marked as favourite vehicle model')), 'Must show success toast upon favouriting');

// Mark testModel3 as favourite
window.ItemSetupModule.toggleVehicleFavourite(testModel3.id);
assert(window.State.isVehicleModelFavourite(testModel3.id) === true, 'Model 3 must be favourite');

const userFavs = window.State.getUserFavouriteVehicleModelIds();
console.log('[Test 2] Current user favourites:', userFavs);
assert(userFavs.includes(testModel1.id), 'Favourites must include model 1');
assert(userFavs.includes(testModel3.id), 'Favourites must include model 3');
assert(!userFavs.includes(testModel2.id), 'Favourites must not include model 2');

// Verify star updates in re-rendered table HTML
const tableHtmlWithFavs = window.ItemSetupModule.renderVehicleCompatibilityTab();
assert(tableHtmlWithFavs.includes('⭐ FAVOURITE</span>'), 'Marked model must show ⭐ FAVOURITE badge');
assert(tableHtmlWithFavs.includes('Remove from favourites'), 'Marked row must have "Remove from favourites" action');

// Unmark testModel3
toastMessages = [];
window.ItemSetupModule.toggleVehicleFavourite(testModel3.id);
assert(window.State.isVehicleModelFavourite(testModel3.id) === false, 'Model 3 must be unfavourited');
assert(toastMessages.some(t => t.msg.includes('Removed')), 'Must show info toast upon un-favouriting');
console.log('✓ TEST 2 PASSED: Mark and unmark operations work smoothly with live feedback.');

// --------------------------------------------------------------------------
// TEST 3: Requirement 3 - Provide Favourite Vehicles filter to display only marked models
// --------------------------------------------------------------------------
console.log('\n--- TEST 3: Requirement 3 - Favourite Vehicles filter ---');
// Verify filter dropdown & quick toggle button are rendered
assert(tableHtmlWithFavs.includes('⭐ Favourite Vehicles'), 'Filter dropdown must have Favourite Vehicles option');
assert(tableHtmlWithFavs.includes('window.ItemSetupModule.toggleVehicleFavFilter()'), 'Must provide 1-click Favourite toggle button');

// Activate favourite filter
window.ItemSetupModule.setVehicleFavFilter('FAV');
assert(window.ItemSetupModule.vehicleFavFilter === 'FAV', 'Fav filter should be active');

const favFilteredHtml = window.ItemSetupModule.renderVehicleCompatibilityTab();
// Should only show testModel1
assert(favFilteredHtml.includes(testModel1.name), `Filtered list must show favourite model "${testModel1.name}"`);
assert(!favFilteredHtml.includes(testModel2.name), `Filtered list must NOT show non-favourite model "${testModel2.name}"`);

// Toggle filter back to ALL
window.ItemSetupModule.toggleVehicleFavFilter();
assert(window.ItemSetupModule.vehicleFavFilter === 'ALL', 'Filter should toggle back to ALL');
const allHtml = window.ItemSetupModule.renderVehicleCompatibilityTab();
assert(allHtml.includes(testModel1.name) && allHtml.includes(testModel2.name), 'All models shown when filter is ALL');
console.log('✓ TEST 3 PASSED: Favourite Vehicles filter isolates marked models with precision.');

// --------------------------------------------------------------------------
// TEST 4: Requirement 4 - Display favourite models at the TOP of selection list in Job Card / Registration
// --------------------------------------------------------------------------
console.log('\n--- TEST 4: Requirement 4 - Display favourite models at the top in Job Card intake ---');
// Mark testModel3 as favourite again so we have testModel1 and testModel3 as favourites
window.State.toggleVehicleModelFavourite(testModel3.id);

// Simulate Job Card vehicle model search dropdown rendering
const dropdownContainer = document.getElementById('new-jc-model-dropdown');
window.BillingModule.renderVehicleModelSearchResults('');

const dropdownHtml = dropdownContainer.innerHTML;
assert(dropdownHtml.includes('⭐ FAVOURITE VEHICLES (QUICK ACCESS)'), 'Must render Favourite Vehicles quick access header');
assert(dropdownHtml.includes('OTHER VEHICLE MODELS'), 'Must render Other Vehicle Models section header');

// Find the index positions of testModel1 (fav), testModel3 (fav), and testModel2 (non-fav)
const idx1 = dropdownHtml.indexOf(testModel1.name);
const idx3 = dropdownHtml.indexOf(testModel3.name);
const idx2 = dropdownHtml.indexOf(testModel2.name);

console.log(`[Test 4] Positions in Job Card dropdown: Fav1 (${testModel1.name}) at ${idx1}, Fav3 (${testModel3.name}) at ${idx3}, Non-Fav (${testModel2.name}) at ${idx2}`);
assert(idx1 !== -1 && idx3 !== -1 && idx2 !== -1, 'All models should be present in dropdown');
assert(idx1 < idx2, 'Favourite model 1 must appear BEFORE non-favourite model 2');
assert(idx3 < idx2, 'Favourite model 3 must appear BEFORE non-favourite model 2');

// Test searching also ranks favourites higher
window.BillingModule.renderVehicleModelSearchResults('Yezdi');
const searchDropdownHtml = dropdownContainer.innerHTML;
const sIdx1 = searchDropdownHtml.indexOf(testModel1.name);
const sIdx2 = searchDropdownHtml.indexOf(testModel2.name);
assert(sIdx1 < sIdx2, 'Under search query, favourite model must still rank ahead of non-favourite model');

console.log('✓ TEST 4 PASSED: Favourite models are displayed at the top of the selection list in Job Card intake.');

// --------------------------------------------------------------------------
// TEST 5: Requirement 5 - Save favourite preferences across refresh and re-login
// --------------------------------------------------------------------------
console.log('\n--- TEST 5: Requirement 5 - Persistence across refresh and login ---');
// Verify saved in localStorage under user-specific key
const rawStored = localStorage.getItem('STOCKIQ_FAV_VEHICLES_USR-001');
assert(rawStored, 'Preferences must be stored in localStorage');
const parsedStored = JSON.parse(rawStored);
assert(parsedStored.includes(testModel1.id) && parsedStored.includes(testModel3.id), 'Stored JSON must contain favourite IDs');

// Simulate page refresh by creating a brand new DatabaseLayer instance
const freshDB = new DatabaseLayer();
const reloadedFavs = freshDB.getUserFavouriteVehicleModelIds('USR-001');
assert(reloadedFavs.includes(testModel1.id) && reloadedFavs.includes(testModel3.id), 'New DB instance must restore favourites from persistent storage');

// Simulate login as a different user (USR-002: Technician / Mechanic)
window.State.currentUser = {
  id: 'USR-002',
  username: 's.shinde',
  name: 'Santosh Shinde',
  status: 'ACTIVE',
  user_type: 'Technician'
};
window.State.currentUserId = 'USR-002';

// USR-002 should have empty favourites initially
assert(window.State.getUserFavouriteVehicleModelIds().length === 0, 'New user USR-002 should have 0 favourites initially');

// USR-002 marks testModel2 as their favourite
window.State.toggleVehicleModelFavourite(testModel2.id);
assert(window.State.isVehicleModelFavourite(testModel2.id) === true, 'USR-002 favourite is Model 2');
assert(window.State.isVehicleModelFavourite(testModel1.id) === false, 'USR-002 does not inherit USR-001 favourites');

// Switch back to USR-001 (re-login as Pravin Patil)
window.State.currentUser = {
  id: 'USR-001',
  username: 'p.patil',
  name: 'Pravin Patil',
  status: 'ACTIVE',
  user_type: 'Admin'
};
window.State.currentUserId = 'USR-001';
const restoredPravinFavs = window.State.getUserFavouriteVehicleModelIds();
assert(restoredPravinFavs.includes(testModel1.id), 'USR-001 favourites restored upon logging back in');
assert(!restoredPravinFavs.includes(testModel2.id), 'USR-001 does not see USR-002 favourites');

console.log('✓ TEST 5 PASSED: Favourite preferences persist per user across refresh and authentication sessions.');

// --------------------------------------------------------------------------
// TEST 6: Requirement 6 - Role-based permissions and Master Data Immobility
// --------------------------------------------------------------------------
console.log('\n--- TEST 6: Requirement 6 - Role-based permissions & vehicle master data integrity ---');
// 6a. Ensure actual vehicle master data is NEVER modified
const masterVehicle = window.DB.getById('vehicleModels', testModel1.id);
console.log('[Test 6] Master vehicle record in DB:', masterVehicle);
assert(masterVehicle.is_favourite === undefined, 'Master vehicle record must NOT have is_favourite property!');
assert(masterVehicle.favourite === undefined, 'Master vehicle record must NOT be polluted with favourite flags');
assert(masterVehicle.name === testModel1.name && masterVehicle.code === testModel1.code, 'Master vehicle properties must remain intact');

// 6b. Role-based permissions: Inactive / locked users are rejected
window.State.currentUser = {
  id: 'USR-999',
  username: 'inactive.user',
  status: 'INACTIVE'
};
window.State.currentUserId = 'USR-999';

toastMessages = [];
const unauthorizedResult = window.State.toggleVehicleModelFavourite(testModel1.id);
assert(unauthorizedResult.success === false, 'Inactive user must be blocked from toggling favourites');
assert(toastMessages.some(t => t.msg.includes('Please log in with an active account')), 'Warning toast displayed for unauthorized user');

console.log('✓ TEST 6 PASSED: Master vehicle data is 100% untampered and inactive accounts are blocked.');

console.log('\n============================================================');
console.log('🎉 ALL 6 FUNCTIONAL REQUIREMENTS PASSED WITH ZERO ERRORS!');
console.log('============================================================\n');
