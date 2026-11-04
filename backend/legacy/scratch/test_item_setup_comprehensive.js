const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

console.log('================================================================');
console.log('RUNNING COMPREHENSIVE INTERACTIVE TEST FOR ITEM SETUP');
console.log('================================================================');

const sandbox = {
  window: {},
  HTMLElement: class {},
  dispatchEvent: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  CustomEvent: class {},
  Event: class {},
  confirm: (msg) => true,
  alert: (msg) => {},
  setTimeout: (cb) => { if (typeof cb === 'function') cb(); return 1; },
  clearTimeout: () => {},
  location: { hash: '#/store-inventory' },
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
    getElementById: (id) => {
      const elementMock = { 
        value: '', 
        innerHTML: '', 
        style: {}, 
        classList: { remove: () => {}, add: () => {}, contains: () => false, toggle: () => {} },
        focus: () => {},
        setAttribute: () => {},
        getAttribute: () => null,
        dataset: {},
        addEventListener: () => {},
        removeEventListener: () => {},
        remove: () => {},
        appendChild: () => {},
        querySelector: () => null,
        querySelectorAll: () => []
      };
      if (id === 'view-container') return elementMock;
      if (id === 'store-inventory-subview-container') return elementMock;
      if (id === 'modal-overlay') return elementMock;
      if (id === 'modal-body') return elementMock;
      if (id === 'item-setup-modal-tabs') return elementMock;
      if (id === 'item-setup-tab-content') return elementMock;
      if (id === 'sidebar') return elementMock;
      if (id === 'item-setup-modal-form') return { 
        ...elementMock,
        checkValidity: () => true,
        reportValidity: () => true
      };
      // Input fields inside forms
      const inputs = {
        'item-form-code': { ...elementMock, value: 'TEST-PART-001' },
        'item-form-name': { ...elementMock, value: 'High Performance Disc Brake Pad' },
        'item-form-type': { ...elementMock, value: 'Spare Part' },
        'item-form-cat': { ...elementMock, value: 'CAT-SPARE' },
        'item-form-subcat': { ...elementMock, value: 'SUB-BRK' },
        'item-form-brand': { ...elementMock, value: 'BOSCH' },
        'item-form-mfg': { ...elementMock, value: 'BOSCH-IN' },
        'item-form-oem-pn': { ...elementMock, value: 'OEM-BRK-9901' },
        'item-form-status': { ...elementMock, value: 'Active' },
        'cat-code': { ...elementMock, value: 'NEW-CAT' },
        'cat-name': { ...elementMock, value: 'New Test Category' },
        'cat-type': { ...elementMock, value: 'Spare Part' },
        'cat-status': { ...elementMock, value: 'Active' },
        'subcat-parent': { ...elementMock, value: 'CAT-SPARE' },
        'subcat-code': { ...elementMock, value: 'NEW-SUBCAT' },
        'subcat-name': { ...elementMock, value: 'New Test Subcat' },
        'sub-cat': { ...elementMock, value: 'CAT-SPARE' },
        'sub-code': { ...elementMock, value: 'NEW-SUBCAT' },
        'sub-name': { ...elementMock, value: 'New Test Subcat' },
        'sub-status': { ...elementMock, value: 'Active' },
        'brand-code': { ...elementMock, value: 'NEW-BRD' },
        'brand-name': { ...elementMock, value: 'New Brand Name' },
        'brand-country': { ...elementMock, value: 'India' },
        'brand-spec': { ...elementMock, value: 'Specialization' },
        'brd-code': { ...elementMock, value: 'NEW-BRD' },
        'brd-name': { ...elementMock, value: 'New Brand Name' },
        'brd-country': { ...elementMock, value: 'India' },
        'brd-spec': { ...elementMock, value: 'Specialization' },
        'brd-status': { ...elementMock, value: 'Active' },
        'mfg-code': { ...elementMock, value: 'NEW-MFG' },
        'mfg-name': { ...elementMock, value: 'New Mfg Name' },
        'mfg-type': { ...elementMock, value: 'Tier-1' },
        'mfg-country': { ...elementMock, value: 'India' },
        'mfg-status': { ...elementMock, value: 'Active' },
        'uom-code': { ...elementMock, value: 'NEW-UOM' },
        'uom-name': { ...elementMock, value: 'Test Units' },
        'uom-type': { ...elementMock, value: 'Count' },
        'uom-base': { ...elementMock, value: 'NOS' },
        'uom-conv': { ...elementMock, value: '1' },
        'uom-factor': { ...elementMock, value: '1' },
        'uom-status': { ...elementMock, value: 'Active' },
        'hsn-code': { ...elementMock, value: '99998888' },
        'hsn-code-input': { ...elementMock, value: '99998888' },
        'hsn-desc': { ...elementMock, value: 'Test HSN description' },
        'hsn-desc-input': { ...elementMock, value: 'Test HSN description' },
        'hsn-gst': { ...elementMock, value: '18' },
        'hsn-gst-input': { ...elementMock, value: '18' },
        'hsn-status': { ...elementMock, value: 'Active' },
        'veh-code': { ...elementMock, value: 'NEW-VEH' },
        'veh-name': { ...elementMock, value: 'Honda Shine 125' },
        'veh-variant': { ...elementMock, value: 'Disc' },
        'veh-cc': { ...elementMock, value: '125' },
        'veh-fuel': { ...elementMock, value: 'Petrol' },
        'veh-yfrom': { ...elementMock, value: '2020' },
        'veh-yto': { ...elementMock, value: '2026' },
        'vm-make': { ...elementMock, value: 'Honda' },
        'vm-model': { ...elementMock, value: 'Shine 125' },
        'vm-type': { ...elementMock, value: 'Motorcycle' },
        'vm-cc': { ...elementMock, value: '125' },
        'vm-fuel': { ...elementMock, value: 'Petrol' },
        'vm-year-start': { ...elementMock, value: '2020' },
        'vm-year-end': { ...elementMock, value: '2026' },
        'vm-status': { ...elementMock, value: 'Active' }
      };
      return inputs[id] || elementMock;
    },
    createElement: (tag) => ({
      tagName: (tag || 'div').toUpperCase(),
      className: '',
      style: {},
      classList: { add: () => {}, remove: () => {} },
      appendChild: () => {},
      remove: () => {}
    }),
    querySelector: (sel) => null,
    querySelectorAll: (sel) => []
  }
};
sandbox.window = sandbox;

vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('js/data/mock-data.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('js/data/db.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('js/state.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('js/modules/item-setup-master.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('js/modules/org-location.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('js/modules/store-inventory.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('js/app.js', 'utf8'), sandbox);

// 1. Initialize Module
sandbox.window.ItemSetupModule.init();

// Verify Seeding
const cats = sandbox.window.DB.getAll('itemCategories');
assert.strictEqual(cats.length >= 7, true, 'At least 7 categories must be seeded');
console.log('✓ Seeding verified: ' + cats.length + ' item categories found.');

const subcats = sandbox.window.DB.getAll('itemSubcategories');
assert.strictEqual(subcats.length >= 58, true, 'At least 58 subcategories must be seeded');
console.log('✓ Seeding verified: ' + subcats.length + ' item subcategories found.');

const brands = sandbox.window.DB.getAll('itemBrands');
assert.strictEqual(brands.length >= 15, true, 'At least 15 brands must be seeded');
console.log('✓ Seeding verified: ' + brands.length + ' brands found.');

const mfgs = sandbox.window.DB.getAll('itemManufacturers');
assert.strictEqual(mfgs.length >= 15, true, 'At least 15 manufacturers must be seeded');
console.log('✓ Seeding verified: ' + mfgs.length + ' manufacturers found.');

const uoms = sandbox.window.DB.getAll('uoms');
assert.strictEqual(uoms.length >= 11, true, 'At least 11 UOMs must be seeded');
console.log('✓ Seeding verified: ' + uoms.length + ' UOMs found.');

const hsn = sandbox.window.DB.getAll('hsnCodes');
assert.strictEqual(hsn.length >= 12, true, 'At least 12 HSN codes must be seeded');
console.log('✓ Seeding verified: ' + hsn.length + ' HSN codes found.');

// 2. Test StoreInventoryModule Sub-Module Toggle
console.log('\nTesting Sub-Module Toggle:');
sandbox.window.StoreInventoryModule.switchSubModule('ITEM_SETUP');
assert.strictEqual(sandbox.window.StoreInventoryModule.activeTab, 'ITEM_MASTER');
console.log('✓ switchSubModule("ITEM_SETUP") set activeTab to ITEM_MASTER.');

// 3. Test Each Tab Render
const itemTabs = [
  'ITEM_MASTER',
  'ITEM_CATEGORIES',
  'ITEM_SUBCATEGORIES',
  'ITEM_BRANDS',
  'ITEM_MANUFACTURERS',
  'VEHICLE_COMPATIBILITY',
  'UOM_MASTER',
  'HSN_MASTER'
];

itemTabs.forEach(tabKey => {
  sandbox.window.StoreInventoryModule.switchTab(tabKey);
  const html = sandbox.window.StoreInventoryModule.renderActiveSubView();
  assert.strictEqual(typeof html, 'string');
  assert.strictEqual(html.length > 50, true);
  console.log(`✓ Tab ${tabKey} rendered cleanly (${html.length} chars).`);
});

// 4. Test 10-Tab Item Specification Modal
console.log('\nTesting 10-Tab Item Specification Modal:');
sandbox.window.ItemSetupModule.showItemModal(null, 'BASIC');
assert.strictEqual(sandbox.window.ItemSetupModule.modalActiveTab, 'BASIC');
assert.strictEqual(Boolean(sandbox.window.ItemSetupModule.editingItemDraft), true);
console.log('✓ showItemModal() initialized editing draft.');

const modalTabs = [
  'BASIC',
  'FITMENT',
  'UOM',
  'TAX',
  'INVENTORY',
  'STORE_BIN',
  'JOB_CARD',
  'WARRANTY',
  'PRICING',
  'AUDIT'
];

modalTabs.forEach(tabKey => {
  sandbox.window.ItemSetupModule.switchModalTab(tabKey);
  assert.strictEqual(sandbox.window.ItemSetupModule.modalActiveTab, tabKey);
  console.log(`✓ Modal Tab [${tabKey}] switched successfully.`);
});

// 5. Test Saving Item Draft
console.log('\nTesting Save Item:');
sandbox.window.ItemSetupModule.captureFormFields();
const initialItemCount = sandbox.window.DB.getAll('items').length;
sandbox.window.ItemSetupModule.saveItem();
const postItemCount = sandbox.window.DB.getAll('items').length;
assert.strictEqual(postItemCount, initialItemCount + 1, 'Item should be saved into DB');
console.log('✓ saveItem() successfully added item to items collection (Total: ' + postItemCount + ').');

// 6. Test Category CRUD
console.log('\nTesting Category CRUD:');
const initialCatCount = sandbox.window.DB.getAll('itemCategories').length;
sandbox.window.ItemSetupModule.saveCategory(null);
const postCatCount = sandbox.window.DB.getAll('itemCategories').length;
assert.strictEqual(postCatCount, initialCatCount + 1);
console.log('✓ Category added successfully (Total: ' + postCatCount + ').');

const addedCat = sandbox.window.DB.getAll('itemCategories').find(c => c.code === 'NEW-CAT');
assert.strictEqual(Boolean(addedCat), true);
sandbox.window.ItemSetupModule.deleteCategory(addedCat.id);
const finalCatCount = sandbox.window.DB.getAll('itemCategories').length;
assert.strictEqual(finalCatCount, initialCatCount);
console.log('✓ Category deleted successfully.');

// 7. Test Subcategory CRUD
console.log('\nTesting Subcategory CRUD:');
const initialSubCount = sandbox.window.DB.getAll('itemSubcategories').length;
sandbox.window.ItemSetupModule.saveSubcategory(null);
const postSubCount = sandbox.window.DB.getAll('itemSubcategories').length;
assert.strictEqual(postSubCount, initialSubCount + 1);
console.log('✓ Subcategory added successfully.');

const addedSub = sandbox.window.DB.getAll('itemSubcategories').find(s => s.code === 'NEW-SUBCAT');
sandbox.window.ItemSetupModule.deleteSubcategory(addedSub.id);
assert.strictEqual(sandbox.window.DB.getAll('itemSubcategories').length, initialSubCount);
console.log('✓ Subcategory deleted successfully.');

// 8. Test Brand CRUD
console.log('\nTesting Brand CRUD:');
const initialBrdCount = sandbox.window.DB.getAll('itemBrands').length;
sandbox.window.ItemSetupModule.saveBrand(null);
assert.strictEqual(sandbox.window.DB.getAll('itemBrands').length, initialBrdCount + 1);
console.log('✓ Brand added successfully.');

const addedBrd = sandbox.window.DB.getAll('itemBrands').find(b => b.code === 'NEW-BRD');
sandbox.window.ItemSetupModule.deleteBrand(addedBrd.id);
assert.strictEqual(sandbox.window.DB.getAll('itemBrands').length, initialBrdCount);
console.log('✓ Brand deleted successfully.');

// 9. Test Manufacturer CRUD
console.log('\nTesting Manufacturer CRUD:');
const initialMfgCount = sandbox.window.DB.getAll('itemManufacturers').length;
sandbox.window.ItemSetupModule.saveManufacturer(null);
assert.strictEqual(sandbox.window.DB.getAll('itemManufacturers').length, initialMfgCount + 1);
console.log('✓ Manufacturer added successfully.');

const addedMfg = sandbox.window.DB.getAll('itemManufacturers').find(m => m.code === 'NEW-MFG');
sandbox.window.ItemSetupModule.deleteManufacturer(addedMfg.id);
assert.strictEqual(sandbox.window.DB.getAll('itemManufacturers').length, initialMfgCount);
console.log('✓ Manufacturer deleted successfully.');

// 10. Test UOM CRUD
console.log('\nTesting UOM CRUD:');
const initialUomCount = sandbox.window.DB.getAll('uoms').length;
sandbox.window.ItemSetupModule.saveUom(null);
assert.strictEqual(sandbox.window.DB.getAll('uoms').length, initialUomCount + 1);
console.log('✓ UOM added successfully.');

const addedUom = sandbox.window.DB.getAll('uoms').find(u => u.code === 'NEW-UOM');
sandbox.window.ItemSetupModule.deleteUom(addedUom.id);
assert.strictEqual(sandbox.window.DB.getAll('uoms').length, initialUomCount);
console.log('✓ UOM deleted successfully.');

// 11. Test HSN CRUD
console.log('\nTesting HSN CRUD:');
const initialHsnCount = sandbox.window.DB.getAll('hsnCodes').length;
sandbox.window.ItemSetupModule.saveHsn(null);
assert.strictEqual(sandbox.window.DB.getAll('hsnCodes').length, initialHsnCount + 1);
console.log('✓ HSN added successfully.');

const addedHsn = sandbox.window.DB.getAll('hsnCodes').find(h => h.code === '99998888');
sandbox.window.ItemSetupModule.deleteHsn(addedHsn.id);
assert.strictEqual(sandbox.window.DB.getAll('hsnCodes').length, initialHsnCount);
console.log('✓ HSN deleted successfully.');

// 12. Test Filtering & Search
console.log('\nTesting Filters & Search:');
sandbox.window.ItemSetupModule.setSearch('brake');
assert.strictEqual(sandbox.window.ItemSetupModule.searchTerm, 'brake');
sandbox.window.ItemSetupModule.setCategoryFilter('CAT-SPARE');
assert.strictEqual(sandbox.window.ItemSetupModule.categoryFilter, 'CAT-SPARE');
sandbox.window.ItemSetupModule.setBrandFilter('BOSCH');
assert.strictEqual(sandbox.window.ItemSetupModule.brandFilter, 'BOSCH');
sandbox.window.ItemSetupModule.resetFilters();
assert.strictEqual(sandbox.window.ItemSetupModule.searchTerm, '');
assert.strictEqual(sandbox.window.ItemSetupModule.categoryFilter, 'ALL');
assert.strictEqual(sandbox.window.ItemSetupModule.brandFilter, 'ALL');
console.log('✓ Search & filters set and reset correctly.');

console.log('\n================================================================');
console.log('🎉 ALL COMPREHENSIVE TESTS PASSED WITH 100% SUCCESS!');
console.log('================================================================');
