const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

console.log('================================================================');
console.log('TESTING MERGED ITEM CATEGORY & SUB-CATEGORY MASTER');
console.log('================================================================\n');

// 1. Read necessary files
const mockDataContent = fs.readFileSync(path.join(__dirname, '../js/data/mock-data.js'), 'utf8');
const dbContent = fs.readFileSync(path.join(__dirname, '../js/data/db.js'), 'utf8');
const stateContent = fs.readFileSync(path.join(__dirname, '../js/state.js'), 'utf8');
const itemSetupContent = fs.readFileSync(path.join(__dirname, '../js/modules/item-setup-master.js'), 'utf8');
const storeInvContent = fs.readFileSync(path.join(__dirname, '../js/modules/store-inventory.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');

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
// DB is automatically initialized on load
vm.runInContext(itemSetupContent, sandbox);
vm.runInContext(storeInvContent, sandbox);

const ItemSetup = sandbox.window.ItemSetupModule;
const StoreInv = sandbox.window.StoreInventoryModule;

assert(ItemSetup, 'ItemSetupModule must exist');
ItemSetup.init();

// --- TEST 1: Default Grouped / Hierarchical View Rendering ---
console.log('Testing Test 1: Default Hierarchical / Grouped View...');
ItemSetup.categoryViewMode = 'GROUPED';
ItemSetup.categoryFilter = 'ALL';
ItemSetup.categorySearchTerm = '';
const groupedHtml = ItemSetup.renderCategoriesTab();

assert(groupedHtml.includes('Item Category &amp; Sub-Category Master') || groupedHtml.includes('Item Category & Sub-Category Master'), 'Must render unified master title');
assert(groupedHtml.includes('Categories') && groupedHtml.includes('Sub-Categories'), 'Must render category and subcategory counters');
assert(groupedHtml.includes('🌳 Hierarchical View'), 'Must have Hierarchical View toggle button');
assert(groupedHtml.includes('📦 Main Categories'), 'Must have Main Categories toggle button');
assert(groupedHtml.includes('📑 Sub-Categories'), 'Must have Sub-Categories toggle button');
assert(groupedHtml.includes('+ Add Category'), 'Must have Add Category button');
assert(groupedHtml.includes('+ Add Sub-Category'), 'Must have Add Sub-Category button');

// Verify standard 7 main categories are present
const mainCats = ['Spare Parts', 'Consumables', 'Accessories', 'Lubricants', 'Batteries', 'Tyres', 'Tools'];
mainCats.forEach(cat => {
  assert(groupedHtml.includes(cat), `Grouped view must include category: ${cat}`);
});

// Verify nested subcategories are rendered with connector symbols
assert(groupedHtml.includes('Engine Parts'), 'Grouped view must render nested subcategory Engine Parts');
assert(groupedHtml.includes('Brake Parts'), 'Grouped view must render nested subcategory Brake Parts');
assert(groupedHtml.includes('↳'), 'Grouped view must include nested subcategory tree branch indicator ↳');

// Verify simple symbol action buttons are used (not long text names)
assert(groupedHtml.includes('✏️'), 'Must use ✏️ symbol for edit');
assert(groupedHtml.includes('🗑️'), 'Must use 🗑️ symbol for delete');
assert(groupedHtml.includes('➕'), 'Must use ➕ symbol for add subcategory under parent');
console.log('✓ PASS: Test 1 - Hierarchical view renders categories, nested subcategories, and compact symbols.\n');

// --- TEST 2: Main Categories View Mode ---
console.log('Testing Test 2: Main Categories Only View Mode...');
ItemSetup.setCategoryViewMode('CATEGORIES');
const catsOnlyHtml = ItemSetup.renderCategoriesTab();
assert(catsOnlyHtml.includes('Category Code') && catsOnlyHtml.includes('Default Item Type'), 'Must display main category table headers');
assert(catsOnlyHtml.includes('SPARE') && catsOnlyHtml.includes('Spare Parts'), 'Must display SPARE');
assert(catsOnlyHtml.includes('LUB') && catsOnlyHtml.includes('Lubricants'), 'Must display LUB');
console.log('✓ PASS: Test 2 - Main Categories view mode renders cleanly.\n');

// --- TEST 3: Sub-Categories View Mode & renderSubcategoriesTab compatibility ---
console.log('Testing Test 3: Sub-Categories View Mode...');
ItemSetup.setCategoryViewMode('SUBCATS');
const subcatsOnlyHtml = ItemSetup.renderCategoriesTab();
assert(subcatsOnlyHtml.includes('Sub-Category Code') && subcatsOnlyHtml.includes('Parent Main Category'), 'Must display subcategory table headers');
assert(subcatsOnlyHtml.includes('ENG-PRT') && subcatsOnlyHtml.includes('Engine Parts'), 'Must display Engine Parts');
assert(subcatsOnlyHtml.includes('LUB-EOIL') && subcatsOnlyHtml.includes('Engine Oil'), 'Must display Engine Oil');

const compatSubcatHtml = ItemSetup.renderSubcategoriesTab();
assert(compatSubcatHtml.includes('Sub-Category Code'), 'renderSubcategoriesTab must render subcategory table cleanly');
console.log('✓ PASS: Test 3 - Sub-Categories view mode and renderSubcategoriesTab compatibility pass.\n');

// --- TEST 4: Search & Filtering ---
console.log('Testing Test 4: Search & Filter functionality...');
ItemSetup.setCategoryViewMode('GROUPED');
ItemSetup.setCategorySearch('Engine');
const searchHtml = ItemSetup.renderCategoriesTab();
assert(searchHtml.includes('Engine Parts'), 'Search for "Engine" must find Engine Parts');
assert(searchHtml.includes('Engine Oil'), 'Search for "Engine" must find Engine Oil');

ItemSetup.setCategorySearch('');
ItemSetup.setCategoryFilter('CAT-BAT');
const filterHtml = ItemSetup.renderCategoriesTab();
assert(filterHtml.includes('Batteries'), 'Filter for CAT-BAT must include Batteries');
assert(filterHtml.includes('Battery – 2W'), 'Filter for CAT-BAT must include 2W Battery');
assert(!filterHtml.includes('title="Add Sub-Category under Tyres"'), 'Filter for CAT-BAT must NOT include Tyres in table');
console.log('✓ PASS: Test 4 - Live search and Category dropdown filtering work accurately.\n');

// --- TEST 5: Modal Workflows ---
console.log('Testing Test 5: Modal workflows (Add/Edit Category & Subcategory)...');
let modalPayload = null;
sandbox.window.State.showModal = (p) => { modalPayload = p; };

// Add Category modal
ItemSetup.showAddCategoryModal();
assert(modalPayload && modalPayload.title === 'Add Main Category', 'Add Category modal title must match');
assert(modalPayload.contentHtml.includes('id="cat-code"') && modalPayload.contentHtml.includes('id="cat-name"'), 'Add Category must have code and name fields');

// Edit Category modal
ItemSetup.showEditCategoryModal('CAT-SPARE');
assert(modalPayload && modalPayload.title.includes('Spare Parts'), 'Edit Category modal must show Category name');
assert(modalPayload.contentHtml.includes('value="SPARE"'), 'Edit Category modal must prefill category code');

// Add Subcategory modal (with parent preselected)
ItemSetup.showAddSubcategoryModal('CAT-LUB');
assert(modalPayload && modalPayload.title === 'Add Sub-Category', 'Add Subcategory modal title must match');
assert(modalPayload.contentHtml.includes('value="CAT-LUB" selected'), 'Add Subcategory must preselect parent category');

// Edit Subcategory modal
ItemSetup.showEditSubcategoryModal('SUB-ENG');
assert(modalPayload && modalPayload.title.includes('Engine Parts'), 'Edit Subcategory modal must show Subcategory name');
assert(modalPayload.contentHtml.includes('value="ENG-PRT"'), 'Edit Subcategory modal must prefill subcategory code');
console.log('✓ PASS: Test 5 - Add and Edit modals for both Category and Subcategory verified.\n');

// --- TEST 6: StoreInventoryModule tabConfig & ActiveTab ---
console.log('Testing Test 6: StoreInventoryModule tabConfig & navigation...');
const catTab = StoreInv.tabConfig.find(t => t.key === 'ITEM_CATEGORIES');
assert(catTab, 'ITEM_CATEGORIES tab must exist in StoreInv.tabConfig');
assert(catTab.label.includes('Category & Sub-Category'), `Tab label must reflect unified master, got: ${catTab.label}`);

StoreInv.activeTab = 'ITEM_CATEGORIES';
const subViewHtml1 = StoreInv.renderActiveSubView();
assert(subViewHtml1.includes('Item Category &amp; Sub-Category Master') || subViewHtml1.includes('Item Category & Sub-Category Master'), 'ITEM_CATEGORIES subview must render unified master');

StoreInv.activeTab = 'ITEM_SUBCATEGORIES';
const subViewHtml2 = StoreInv.renderActiveSubView();
assert(subViewHtml2.includes('Item Category &amp; Sub-Category Master') || subViewHtml2.includes('Item Category & Sub-Category Master'), 'ITEM_SUBCATEGORIES subview must also route to unified master');
console.log('✓ PASS: Test 6 - StoreInventoryModule tab integration and alias support verified.\n');

// --- TEST 7: Sidebar and App routing ---
console.log('Testing Test 7: Sidebar HTML & App.js routing...');
assert(indexHtml.includes('id="nav-item-item-categories"'), 'Sidebar must have nav-item-item-categories');
assert(indexHtml.includes('Item Category &amp; Sub-Category Master') || indexHtml.includes('Item Category & Sub-Category Master'), 'Sidebar must show Item Category & Sub-Category Master');
assert(appJs.includes("'#/item-categories': { module: window.StoreInventoryModule, title: 'Item Category & Sub-Category Master'"), 'app.js route #/item-categories must have unified title');
assert(appJs.includes("'#/item-subcategories': { module: window.StoreInventoryModule, title: 'Item Category & Sub-Category Master'"), 'app.js route #/item-subcategories must have unified title');
console.log('✓ PASS: Test 7 - Sidebar links and route registrations verified.\n');

console.log('================================================================');
console.log('🎉 ALL MERGED CATEGORY & SUB-CATEGORY TESTS PASSED (100%)!');
console.log('================================================================');
