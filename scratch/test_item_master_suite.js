// Comprehensive Verification Test Suite for Item Master & Store Asterisk Requirements
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

console.log('=== STARTING ITEM MASTER & STORE MASTER AUDIT SUITE ===\n');

// -------------------------------------------------------------
// STEP 1: Verify Static Code & Modal HTML Requirements
// -------------------------------------------------------------
console.log('--- 1. Testing Store Master Modal Asterisks & Optional Fields ---');
const storeModuleCode = fs.readFileSync(path.join(__dirname, '../js/modules/store-inventory.js'), 'utf8');

// Store Add Modal checks
const storeAddMatch = storeModuleCode.match(/showAddStoreModal\(\)\s*\{[\s\S]*?const contentHtml = `([\s\S]*?)`;\s*window\.State\.showModal/);
assert(storeAddMatch, 'showAddStoreModal must have contentHtml');
const storeAddHtml = storeAddMatch[1];

assert(storeAddHtml.includes('Store Code <span style="color: var(--color-danger)">*</span>'), 'Store Code must have red asterisk');
assert(storeAddHtml.includes('Store Name <span style="color: var(--color-danger)">*</span>'), 'Store Name must have red asterisk');
assert(storeAddHtml.includes('Store Type <span style="color: var(--color-danger)">*</span>'), 'Store Type must have red asterisk');
assert(storeAddHtml.includes('Branch <span style="color: var(--color-danger)">*</span>'), 'Branch must have red asterisk');
assert(storeAddHtml.includes('Effective From <span style="color: var(--color-danger)">*</span>'), 'Effective From must have red asterisk');

// Parent Store & Store Manager must NOT have asterisks and must NOT be required
assert(!storeAddHtml.includes('Parent Store *') && !storeAddHtml.includes('Parent Store <span'), 'Parent Store must NOT have asterisk');
assert(!storeAddHtml.includes('Store Manager *') && !storeAddHtml.includes('Store Manager <span'), 'Store Manager must NOT have asterisk');
assert(storeAddHtml.includes('id="new-store-manager" class="form-control" placeholder="Manager name" />'), 'Store Manager must not have required attribute');
console.log('✓ Store Master Add Modal: Red asterisks & optional fields verified.');

// Store Edit Modal checks
const storeEditMatch = storeModuleCode.match(/showEditStoreModal\(storeId\)\s*\{[\s\S]*?const contentHtml = `([\s\S]*?)`;\s*window\.State\.showModal/);
assert(storeEditMatch, 'showEditStoreModal must have contentHtml');
const storeEditHtml = storeEditMatch[1];
assert(storeEditHtml.includes('Store Name <span style="color: var(--color-danger)">*</span>'), 'Store Name in Edit Modal must have red asterisk');
assert(!storeEditHtml.includes('Store Manager *') && !storeEditHtml.includes('Store Manager <span'), 'Store Manager in Edit Modal must NOT have asterisk');
console.log('✓ Store Master Edit Modal: Verified.');

// -------------------------------------------------------------
// STEP 2: Verify Item Master Modal Asterisks & Optional Fields
// -------------------------------------------------------------
console.log('\n--- 2. Testing Item Master Modal Asterisks & Form Schema ---');
const itemAddMatch = storeModuleCode.match(/showAddItemModal\(\)\s*\{[\s\S]*?const contentHtml = `([\s\S]*?)`;\s*window\.State\.showModal/);
assert(itemAddMatch, 'showAddItemModal must have contentHtml');
const itemAddHtml = itemAddMatch[1];

assert(itemAddHtml.includes('Item Code <span style="color: var(--color-danger)">*</span>'), 'Item Code must have red asterisk');
assert(itemAddHtml.includes('Item Name <span style="color: var(--color-danger)">*</span>'), 'Item Name must have red asterisk');
assert(itemAddHtml.includes('Item Type <span style="color: var(--color-danger)">*</span>'), 'Item Type must have red asterisk');
assert(itemAddHtml.includes('Category <span style="color: var(--color-danger)">*</span>'), 'Category must have red asterisk');
assert(itemAddHtml.includes('Stock UOM <span style="color: var(--color-danger)">*</span>'), 'Stock UOM must have red asterisk');
assert(itemAddHtml.includes('MRP (₹) <span style="color: var(--color-danger)">*</span>'), 'MRP must have red asterisk');
assert(itemAddHtml.includes('Workshop Sale Price (₹) <span style="color: var(--color-danger)">*</span>'), 'Workshop Sale Price must have red asterisk');

// Optional fields must NOT have asterisks
assert(!itemAddHtml.includes('Short Display Name *') && !itemAddHtml.includes('Short Display Name <span'), 'Short Name must NOT have asterisk');
assert(!itemAddHtml.includes('Brand *') && !itemAddHtml.includes('Brand <span'), 'Brand must NOT have asterisk');
assert(!itemAddHtml.includes('Manufacturer *') && !itemAddHtml.includes('Manufacturer <span'), 'Manufacturer must NOT have asterisk');
assert(!itemAddHtml.includes('Manufacturer Part # *') && !itemAddHtml.includes('Manufacturer Part # <span'), 'Manufacturer Part # must NOT have asterisk');
assert(!itemAddHtml.includes('OEM Part # *') && !itemAddHtml.includes('OEM Part # <span'), 'OEM Part # must NOT have asterisk');
assert(!itemAddHtml.includes('Purchase UOM *') && !itemAddHtml.includes('Purchase UOM <span'), 'Purchase UOM must NOT have asterisk');
assert(!itemAddHtml.includes('Last Purchase Price *') && !itemAddHtml.includes('Last Purchase Price <span'), 'Last Purchase Price must NOT have asterisk');
console.log('✓ Item Master Modal: Mandatory red asterisks & optional fields verified.');

// -------------------------------------------------------------
// STEP 3: Setup VM Sandbox & Initialize Full Application
// -------------------------------------------------------------
console.log('\n--- 3. Testing Dynamic Runtime Execution & Business Rules ---');

const mockDataContent = fs.readFileSync(path.join(__dirname, '../js/data/mock-data.js'), 'utf8');
const dbContent = fs.readFileSync(path.join(__dirname, '../js/data/db.js'), 'utf8');
const stateContent = fs.readFileSync(path.join(__dirname, '../js/state.js'), 'utf8');
const appContent = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');

// DOM Stub
let lastToast = null;
let lastModal = null;
const elements = {};

function createStubElement(id, tag = 'div') {
  const el = {
    id: id,
    tagName: tag.toUpperCase(),
    value: '',
    checked: false,
    innerHTML: '',
    style: {},
    children: [],
    classList: {
      add: () => {},
      remove: () => {},
      contains: () => false,
      toggle: () => {}
    },
    remove: () => {},
    setAttribute: () => {},
    getAttribute: () => null,
    appendChild: () => {},
    focus: () => {},
    setSelectionRange: () => {},
    querySelector: (sel) => null,
    querySelectorAll: (sel) => []
  };
  elements[id] = el;
  return el;
}

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
  confirm: () => true,
  document: {
    addEventListener: () => {},
    documentElement: { setAttribute: () => {}, getAttribute: () => {} },
    getElementById: (id) => elements[id] || createStubElement(id),
    querySelector: (sel) => null,
    querySelectorAll: (sel) => []
  }
};
sandbox.window = sandbox;

vm.createContext(sandbox);
vm.runInContext(mockDataContent, sandbox);
vm.runInContext(dbContent, sandbox);
vm.runInContext(stateContent, sandbox);
vm.runInContext(storeModuleCode, sandbox);
vm.runInContext(appContent, sandbox);

const DB = sandbox.window.DB;
const State = sandbox.window.State;
const StoreInv = sandbox.window.StoreInventoryModule;

// Intercept toasts and modals
State.showToast = (msg, type = 'info') => {
  lastToast = { msg, type };
  // console.log(`[Toast ${type.toUpperCase()}]: ${msg}`);
};
State.showModal = (cfg) => {
  lastModal = cfg;
};
State.closeModal = () => {
  lastModal = null;
};

// Check DB items migration enrichment
const items = DB.getAll('items');
assert(items.length >= 10, 'Items catalog should have loaded seeded items');
const firstItem = items[0];
assert(firstItem.part_number, 'Items should have part_number populated');
assert(firstItem.mrp, 'Items should have mrp populated');
assert(firstItem.workshop_sale_price, 'Items should have workshop_sale_price populated');
assert(firstItem.stock_uom, 'Items should have stock_uom populated');
console.log(`✓ DB Migration: ${items.length} items enriched with BRD v1.0 schema.`);

// -------------------------------------------------------------
// STEP 4: Render Item Master Tab & Verify Output
// -------------------------------------------------------------
StoreInv.activeTab = 'ITEM_MASTER';
const renderedHtml = StoreInv.renderItemMasterTab();

assert(renderedHtml.includes('Search items...'), 'Must render search input');
assert(renderedHtml.includes('All Categories'), 'Must render Category filter');
assert(renderedHtml.includes('All Vehicles'), 'Must render Vehicle fitment filter');
assert(renderedHtml.includes('Vehicle Fitment'), 'Must render Vehicle Fitment column');
assert(renderedHtml.includes('Price (₹)'), 'Must render Price column');
assert(renderedHtml.includes('+ Register New Item'), 'Must render Register New Item button');
console.log('✓ Item Master Tab HTML: Simple toolbar and clean data table verified.');

// -------------------------------------------------------------
// STEP 5: Business Rule BR-001 (Unique Item Code)
// -------------------------------------------------------------
console.log('\n--- 4. Testing Business Rule BR-001: Item Code Uniqueness ---');
// Setup stub elements for submitAddItem
const existingCode = items[0].code;
createStubElement('new-item-code').value = existingCode; // Duplicate!
createStubElement('new-item-name').value = 'Test Duplicate Item';
createStubElement('new-item-short-name').value = 'Duplicate';
createStubElement('new-item-type').value = 'SPARE_PART';
createStubElement('new-item-category').value = 'CAT-01';
createStubElement('new-item-brand').value = 'Test';
createStubElement('new-item-mfg').value = 'Test Mfg';
createStubElement('new-item-part-no').value = 'TP-001';
createStubElement('new-item-oem-no').value = 'TP-OEM-001';
createStubElement('new-item-uom').value = 'NOS';
createStubElement('new-item-purchase-uom').value = 'BOX';
createStubElement('new-item-mrp').value = '500';
createStubElement('new-item-price').value = '400';
createStubElement('new-item-cost').value = '300';
createStubElement('new-item-gst').value = '18';
createStubElement('new-item-hsn').value = '87141090';
createStubElement('new-item-barcode').value = '890123999999';
createStubElement('new-item-rop').value = '10';
createStubElement('new-item-min-stock').value = '5';
createStubElement('new-item-warranty-months').value = '12';
createStubElement('new-item-serial').checked = false;
createStubElement('new-item-batch').checked = true;
createStubElement('new-item-expiry').checked = false;

StoreInv.submitAddItem();
assert(lastToast && lastToast.type === 'error' && lastToast.msg.includes('BR-001'), 
  'BR-001: Should show error toast for duplicate item code');
console.log('✓ BR-001 passed: Duplicate item code successfully blocked.');

// -------------------------------------------------------------
// STEP 6: Successful Item Creation & Fitment Linking
// -------------------------------------------------------------
console.log('\n--- 5. Testing Item Creation & Two-Wheeler Compatibility ---');
const uniqueCode = 'SP-TEST-999';
elements['new-item-code'].value = uniqueCode;
elements['new-item-name'].value = 'High Performance Ceramic Disc Pad';

// Mock selected vehicle models
sandbox.document.querySelectorAll = (sel) => {
  if (sel === 'input[name="new-item-models"]:checked') {
    return [{ value: 'MOD-01' }, { value: 'MOD-02' }];
  }
  return [];
};

StoreInv.submitAddItem();
assert(lastToast && lastToast.type !== 'error', 'Creation should succeed');
const createdItem = DB.getAll('items').find(i => i.code === uniqueCode);
assert(createdItem, 'Created item must exist in DB');
assert.strictEqual(createdItem.name, 'High Performance Ceramic Disc Pad');
assert.strictEqual(createdItem.mrp, 500);
assert.strictEqual(createdItem.workshop_sale_price, 400);
assert.strictEqual(createdItem.warranty_period_months, 12);
assert.strictEqual(createdItem.warranty_applicable_yn, 'Y');
assert(Array.isArray(createdItem.vehicle_model_ids) && createdItem.vehicle_model_ids.includes('MOD-01'), 
  'Vehicle models must be linked to item');
console.log('✓ Item Registration passed: Item registered with compatibility mappings.');

// -------------------------------------------------------------
// STEP 7: Business Rule BR-009 (Protected Deletion)
// -------------------------------------------------------------
console.log('\n--- 6. Testing Business Rule BR-009: Protected Deletion ---');
// Try to delete item ITEM-2W-001 which has stock balances
StoreInv.deleteItem('ITEM-2W-001');
assert(lastToast && lastToast.type === 'error' && lastToast.msg.includes('BR-009'), 
  'BR-009: Should show error toast preventing deletion of item with stock/transactions');
const stillThere = DB.getById('items', 'ITEM-2W-001');
assert(stillThere, 'Item with transactions must NOT be deleted');
console.log('✓ BR-009 passed: Deletion of item with stock balances was correctly blocked.');

// Deleting unreferenced newly created item should succeed
StoreInv.deleteItem(createdItem.id);
const deletedCheck = DB.getById('items', createdItem.id);
assert(!deletedCheck, 'Unreferenced item should be successfully deleted');
console.log('✓ Unreferenced item deletion passed.');

// -------------------------------------------------------------
// STEP 8: Status Toggle & Edit Operations
// -------------------------------------------------------------
console.log('\n--- 7. Testing Status Toggle & Edit Operations ---');
const targetItemId = 'ITEM-2W-001';
const initialStatus = DB.getById('items', targetItemId).status || 'Active';
StoreInv.toggleItemStatus(targetItemId);
assert.strictEqual(DB.getById('items', targetItemId).status, initialStatus === 'Active' ? 'Inactive' : 'Active');
StoreInv.toggleItemStatus(targetItemId);
assert.strictEqual(DB.getById('items', targetItemId).status, initialStatus);
console.log('✓ Toggle status passed.');

// Edit test
createStubElement('edit-item-name').value = 'Updated Brake Pad Name';
createStubElement('edit-item-short-name').value = 'Updated Pad';
createStubElement('edit-item-type').value = 'SPARE_PART';
createStubElement('edit-item-category').value = 'CAT-01';
createStubElement('edit-item-brand').value = 'Nissin Racing';
createStubElement('edit-item-mfg').value = 'Nissin Japan';
createStubElement('edit-item-part-no').value = '06455-KWP-UPD';
createStubElement('edit-item-oem-no').value = '06455-KWP-UPD';
createStubElement('edit-item-uom').value = 'SET';
createStubElement('edit-item-purchase-uom').value = 'BOX (10 Sets)';
createStubElement('edit-item-mrp').value = '550';
createStubElement('edit-item-price').value = '480';
createStubElement('edit-item-cost').value = '350';
createStubElement('edit-item-gst').value = '18';
createStubElement('edit-item-status').value = 'Active';
createStubElement('edit-item-hsn').value = '87141090';
createStubElement('edit-item-barcode').value = '890123456001';
createStubElement('edit-item-rop').value = '15';
createStubElement('edit-item-min-stock').value = '8';
createStubElement('edit-item-warranty-months').value = '8';
createStubElement('edit-item-serial').checked = false;
createStubElement('edit-item-batch').checked = true;
createStubElement('edit-item-expiry').checked = false;

sandbox.document.querySelectorAll = (sel) => {
  if (sel === 'input[name="edit-item-models"]:checked') {
    return [{ value: 'MOD-01' }, { value: 'MOD-03' }];
  }
  return [];
};

StoreInv.submitEditItem(targetItemId);
const editedItem = DB.getById('items', targetItemId);
assert.strictEqual(editedItem.name, 'Updated Brake Pad Name');
assert.strictEqual(editedItem.mrp, 550);
assert.strictEqual(editedItem.workshop_sale_price, 480);
assert.strictEqual(editedItem.reorder_level, 15);
assert.strictEqual(editedItem.warranty_period_months, 8);
assert(editedItem.vehicle_model_ids.includes('MOD-03'));
console.log('✓ Edit item master passed.');

// -------------------------------------------------------------
// STEP 9: Filtering & Search Testing
// -------------------------------------------------------------
console.log('\n--- 8. Testing Filters & Search Toolbar ---');
StoreInv.setItemSearch('activa');
assert.strictEqual(StoreInv.itemSearchTerm, 'activa');
let searchHtml = StoreInv.renderItemMasterTab();
assert(searchHtml.includes('Activa'), 'Search for "activa" should find Activa parts');

StoreInv.setItemTypeFilter('BATTERY');
assert.strictEqual(StoreInv.itemTypeFilter, 'BATTERY');
let batteryHtml = StoreInv.renderItemMasterTab();
assert(batteryHtml.includes('Battery') || batteryHtml.includes('VRLA') || batteryHtml.includes('Exide'), 
  'Filter by BATTERY should include battery items');

StoreInv.resetItemFilters();
assert.strictEqual(StoreInv.itemSearchTerm, '');
assert.strictEqual(StoreInv.itemCategoryFilter, 'ALL');
assert.strictEqual(StoreInv.itemTypeFilter, 'ALL');
assert.strictEqual(StoreInv.itemVehicleFilter, 'ALL');
assert.strictEqual(StoreInv.itemStatusFilter, 'ALL');
console.log('✓ Filters and search reset verified.');

// -------------------------------------------------------------
// STEP 10: Full Screen Modal Verification
// -------------------------------------------------------------
console.log('\n--- 9. Testing Full Screen Modal Configuration ---');
StoreInv.showAddItemModal();
assert(lastModal, 'Modal config must be set');
assert.strictEqual(lastModal.isFullScreen, true, 'Add Item Modal must have isFullScreen=true');
console.log('✓ showAddItemModal launches in full screen mode.');

StoreInv.showEditItemModal('ITEM-2W-001');
assert(lastModal, 'Modal config must be set');
assert.strictEqual(lastModal.isFullScreen, true, 'Edit Item Modal must have isFullScreen=true');
console.log('✓ showEditItemModal launches in full screen mode.');

console.log('\n=============================================================');
console.log('🎉 ALL ITEM MASTER & STORE MASTER TEST SUITES PASSED (100%)!');
console.log('=============================================================\n');
