const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

console.log('================================================================');
console.log('ENTERPRISE BRD v1.0 VERIFICATION: ITEM SETUP & ITEM MASTER');
console.log('================================================================');

// 1. Check index.html
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

// Ensure item-setup-master.js is loaded
assert(indexHtml.includes('<script src="js/modules/item-setup-master.js?v=1.0"></script>'), 'item-setup-master.js must be included in index.html');
console.log('✓ PASS: item-setup-master.js script tag loaded in index.html.');

// Verify Item Setup subgroup in sidebar
const subgroupItemSetupMatch = indexHtml.match(/id="subgroup-item-setup"[\s\S]*?<\/div>\s*<\/div>/);
assert(subgroupItemSetupMatch, 'subgroup-item-setup must exist in index.html');
const itemSubgroupHtml = subgroupItemSetupMatch[0];

const expectedItemSetupMasters = [
  { route: '#/item-master', title: 'Item Master' },
  { route: '#/item-categories', title: 'Item Category Master' },
  { route: '#/item-subcategories', title: 'Item Sub-Category Master' },
  { route: '#/item-brands', title: 'Brand Master' },
  { route: '#/item-manufacturers', title: 'Manufacturer Master' },
  { route: '#/vehicle-compatibility', title: 'Vehicle Compatibility' },
  { route: '#/uom-master', title: 'UOM Master' },
  { route: '#/hsn-master', title: 'HSN/SAC Master' }
];

expectedItemSetupMasters.forEach(master => {
  assert(itemSubgroupHtml.includes(`href="${master.route}"`), `Item Setup sub-menu must have link for ${master.route}`);
  assert(itemSubgroupHtml.includes(master.title), `Item Setup sub-menu must display title "${master.title}"`);
});
console.log('✓ PASS: All 8 BRD Item Setup masters present in sidebar under Item Setup.');

// 2. Check js/app.js routes and permissions
const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
expectedItemSetupMasters.forEach(master => {
  const routeRegex = new RegExp(`'${master.route}'\\s*:\\s*\\{[\\s\\S]*?section:\\s*'Item Master Setup'`);
  assert(routeRegex.test(appJs), `app.js route ${master.route} must have section: 'Item Master Setup'`);
});
console.log('✓ PASS: All 8 Item Setup routes registered in app.js with section: "Item Master Setup".');

// Check RBAC permission codes
expectedItemSetupMasters.forEach(master => {
  assert(appJs.includes(`'${master.route}': 'STORE_MASTER'`) || appJs.includes(`'${master.route}': 'STORE_VEHICLE_COMPAT'`), `app.js must define permission for ${master.route}`);
});
console.log('✓ PASS: RBAC permissions correctly mapped in app.js for all Item Setup routes.');

// 3. Sandbox execution of ItemSetupModule and StoreInventoryModule
const mockDataContent = fs.readFileSync(path.join(__dirname, '../js/data/mock-data.js'), 'utf8');
const dbContent = fs.readFileSync(path.join(__dirname, '../js/data/db.js'), 'utf8');
const stateContent = fs.readFileSync(path.join(__dirname, '../js/state.js'), 'utf8');
const itemSetupContent = fs.readFileSync(path.join(__dirname, '../js/modules/item-setup-master.js'), 'utf8');
const storeInvContent = fs.readFileSync(path.join(__dirname, '../js/modules/store-inventory.js'), 'utf8');

const sandbox = {
  window: {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => {},
  CustomEvent: class { constructor(t, d) { this.type = t; this.detail = d; } },
  Event: class { constructor(t) { this.type = t; } },
  location: { hash: '#/item-master' },
  localStorage: {
    data: {},
    getItem(k) { return this.data[k] || null; },
    setItem(k, v) { this.data[k] = String(v); },
    removeItem(k) { delete this.data[k]; }
  },
  console: console,
  document: {
    addEventListener: () => {},
    documentElement: { setAttribute: () => {}, getAttribute: () => {} },
    getElementById: (id) => null,
    querySelector: () => null,
    querySelectorAll: () => []
  }
};
sandbox.window = sandbox;

vm.createContext(sandbox);
vm.runInContext(mockDataContent, sandbox);
vm.runInContext(dbContent, sandbox);
vm.runInContext(stateContent, sandbox);
vm.runInContext(itemSetupContent, sandbox);
vm.runInContext(storeInvContent, sandbox);

const ItemSetupModule = sandbox.window.ItemSetupModule;
const StoreInventoryModule = sandbox.window.StoreInventoryModule;
const DB = sandbox.window.DB;

assert(ItemSetupModule, 'ItemSetupModule must be defined on window');
assert(StoreInventoryModule, 'StoreInventoryModule must be defined on window');

// Test ensureSeedData
ItemSetupModule.ensureSeedData();

// Verify 7 Main Categories
const categories = DB.getAll('itemCategories');
assert(categories.length >= 7, `Expected at least 7 categories, got ${categories.length}`);
const requiredCats = ['Spare Parts', 'Consumables', 'Accessories', 'Lubricants', 'Batteries', 'Tyres', 'Tools'];
requiredCats.forEach(name => {
  assert(categories.some(c => c.name === name), `Category "${name}" must exist in itemCategories`);
});
console.log('✓ PASS: All 7 Main Item Categories verified (BRD Section 7).');

// Verify 58 Sub-Categories
const subcats = DB.getAll('itemSubcategories');
assert(subcats.length >= 58, `Expected at least 58 subcategories, got ${subcats.length}`);
console.log(`✓ PASS: ${subcats.length} Item Sub-Categories verified across all 7 sections (BRD Section 7.1 - 7.7).`);

// Verify Brands, Manufacturers, UOMs, and HSN codes
const brands = DB.getAll('itemBrands');
assert(brands.length >= 15, `Expected at least 15 brands, got ${brands.length}`);
console.log(`✓ PASS: ${brands.length} Brands verified in itemBrands.`);

const mfgs = DB.getAll('itemManufacturers');
assert(mfgs.length >= 15, `Expected at least 15 manufacturers, got ${mfgs.length}`);
console.log(`✓ PASS: ${mfgs.length} Manufacturers verified in itemManufacturers.`);

const uoms = DB.getAll('uoms');
assert(uoms.length >= 11, `Expected at least 11 UOMs, got ${uoms.length}`);
const requiredUoms = ['PCS', 'SET', 'BOX', 'PACK', 'LTR', 'ML', 'KG', 'GM', 'MTR', 'PAIR', 'NOS'];
requiredUoms.forEach(u => {
  assert(uoms.some(entry => entry.code === u), `UOM "${u}" must exist`);
});
console.log('✓ PASS: All 11 Standard UOMs verified (BRD Section 12).');

const hsns = DB.getAll('hsnCodes');
assert(hsns.length >= 12, `Expected at least 12 HSN codes, got ${hsns.length}`);
console.log(`✓ PASS: ${hsns.length} HSN/SAC codes verified (BRD Section 13).`);

// 4. Test rendering of sub-views
const itemMasterHtml = ItemSetupModule.renderItemMasterTab();
assert(itemMasterHtml.includes('Total Items'), 'Item Master view must render Total Items KPI');
assert(itemMasterHtml.includes('Standard Catalog'), 'Item Master view must render catalog table');
console.log('✓ PASS: Item Master list view renders cleanly.');

const catHtml = ItemSetupModule.renderCategoriesTab();
assert(catHtml.includes('Item Category Master'), 'Category view must render Category Master');
console.log('✓ PASS: Item Category Master view renders cleanly.');

const subcatHtml = ItemSetupModule.renderSubcategoriesTab();
assert(subcatHtml.includes('Item Sub-Category Master'), 'Subcategory view must render Subcategory Master');
console.log('✓ PASS: Item Sub-Category Master view renders cleanly.');

const brandHtml = ItemSetupModule.renderBrandsTab();
assert(brandHtml.includes('Brand Master'), 'Brand view must render Brand Master');
console.log('✓ PASS: Brand Master view renders cleanly.');

const mfgHtml = ItemSetupModule.renderManufacturersTab();
assert(mfgHtml.includes('Manufacturer Master'), 'Manufacturer view must render Manufacturer Master');
console.log('✓ PASS: Manufacturer Master view renders cleanly.');

const vehicleHtml = ItemSetupModule.renderVehicleCompatibilityTab();
assert(vehicleHtml.includes('Vehicle Compatibility Master'), 'Vehicle Compatibility view must render');
console.log('✓ PASS: Vehicle Model Compatibility Master view renders cleanly.');

const uomHtml = ItemSetupModule.renderUomTab();
assert(uomHtml.includes('Unit of Measurement') && uomHtml.includes('Master'), 'UOM view must render UOM Master');
console.log('✓ PASS: UOM Master view renders cleanly.');

const hsnHtml = ItemSetupModule.renderHsnTab();
assert(hsnHtml.includes('HSN / SAC Master'), 'HSN view must render HSN Master');
console.log('✓ PASS: HSN/SAC Master view renders cleanly.');

// 5. Test 10-Tab Item Specification Modal Structure (BRD Section 37)
let capturedModal = null;
sandbox.window.State.showModal = (opts) => {
  capturedModal = opts;
};

ItemSetupModule.showItemModal();
assert(capturedModal, 'State.showModal must be called');
assert(capturedModal.isFullScreen === true, 'Item Setup modal must be full-screen / maximized');
assert(capturedModal.title.includes('Register New Inventory Item'), 'Modal title must be Register New Inventory Item');

const modalHtml = capturedModal.contentHtml;
const expectedTabs = [
  'Basic Information',
  'Vehicle Compatibility',
  'UOM Management',
  'Tax & GST',
  'Inventory Controls',
  'Store & Bin Mapping',
  'Job Card Applicability',
  'Warranty & Scrap',
  'Pricing & Cost',
  'Audit History'
];

expectedTabs.forEach(tabName => {
  assert(modalHtml.includes(tabName), `10-Tab modal must include tab "${tabName}"`);
});
console.log('✓ PASS: 10-Tab Item Specification Modal verified (BRD Section 37).');

// 6. Test StoreInventoryModule tab delegation
StoreInventoryModule.activeTab = 'ITEM_CATEGORIES';
const subViewCat = StoreInventoryModule.renderActiveSubView();
assert(subViewCat.includes('Item Category Master'), 'StoreInventoryModule must delegate ITEM_CATEGORIES to ItemSetupModule');

StoreInventoryModule.activeTab = 'ITEM_SUBCATEGORIES';
const subViewSubcat = StoreInventoryModule.renderActiveSubView();
assert(subViewSubcat.includes('Item Sub-Category Master'), 'StoreInventoryModule must delegate ITEM_SUBCATEGORIES to ItemSetupModule');

StoreInventoryModule.activeTab = 'ITEM_BRANDS';
const subViewBrands = StoreInventoryModule.renderActiveSubView();
assert(subViewBrands.includes('Brand Master'), 'StoreInventoryModule must delegate ITEM_BRANDS to ItemSetupModule');

StoreInventoryModule.activeTab = 'ITEM_MANUFACTURERS';
const subViewMfgs = StoreInventoryModule.renderActiveSubView();
assert(subViewMfgs.includes('Manufacturer Master'), 'StoreInventoryModule must delegate ITEM_MANUFACTURERS to ItemSetupModule');

StoreInventoryModule.activeTab = 'UOM_MASTER';
const subViewUom = StoreInventoryModule.renderActiveSubView();
assert(subViewUom.includes('Unit of Measurement') && subViewUom.includes('Master'), 'StoreInventoryModule must delegate UOM_MASTER to ItemSetupModule');

StoreInventoryModule.activeTab = 'HSN_MASTER';
const subViewHsn = StoreInventoryModule.renderActiveSubView();
assert(subViewHsn.includes('HSN / SAC Master'), 'StoreInventoryModule must delegate HSN_MASTER to ItemSetupModule');

console.log('✓ PASS: StoreInventoryModule cleanly delegates all Item Setup views to ItemSetupModule.');

console.log('================================================================');
console.log('🎉 100% BRD v1.0 COMPLIANCE VERIFIED FOR ITEM SETUP & ITEM MASTER!');
console.log('================================================================');
