/**
 * Automated Verification Script: Facility-Wise Item Mapping Requirement
 */
const fs = require('fs');
const path = require('path');

// Mock browser globals
global.window = {};
global.document = {
  activeElement: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  getElementById: (id) => null,
  querySelectorAll: (sel) => [],
  querySelector: (sel) => null
};
global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; }
};

// 1. Load mock-data.js
const mockDataCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'data', 'mock-data.js'), 'utf8');
eval(mockDataCode);

// 2. Load db.js
const dbCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'data', 'db.js'), 'utf8');
eval(dbCode);

// Mock State object
window.State = {
  currentPlantId: 'PLANT-01',
  currentUser: { full_name: 'Store Manager' },
  getCurrentUser() { return this.currentUser; },
  toasts: [],
  showToast(msg, type) { this.toasts.push({ msg, type }); },
  modal: null,
  showModal(opts) { this.modal = opts; },
  closeModal() { this.modal = null; }
};

// 3. Load item-setup-master.js
const itemSetupCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'modules', 'item-setup-master.js'), 'utf8');
eval(itemSetupCode);

console.log('--- RUNNING FACILITY-WISE ITEM MAPPING VERIFICATION ---');

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ FAIL: ${testName}`);
    failedTests++;
  }
}

// Ensure DB is initialized
// window.DB is already instantiated by new DatabaseLayer()

// Test 1: Verify facilities/plants exist
const plants = window.DB.getAll('plants');
assert(Array.isArray(plants) && plants.length >= 3, `Plants hydrated in DB (found ${plants.length})`);
const p1 = plants.find(p => p.id === 'PLANT-01');
const p2 = plants.find(p => p.id === 'PLANT-02');
const p3 = plants.find(p => p.id === 'PLANT-03');
assert(!!p1 && !!p2 && !!p3, 'PLANT-01, PLANT-02, PLANT-03 exist');

// Test 2: DatabaseLayer.isItemMappedToFacility logic
const multiFacilityItem = {
  id: 'ITM-TEST-001',
  code: '2W-TEST-PAD',
  name: 'Test Brake Pad',
  facility_ids: ['PLANT-01', 'PLANT-02']
};

assert(window.DB.isItemMappedToFacility(multiFacilityItem, 'PLANT-01') === true, 'Item mapped to PLANT-01 is detected');
assert(window.DB.isItemMappedToFacility(multiFacilityItem, 'PLANT-02') === true, 'Item mapped to PLANT-02 is detected');
assert(window.DB.isItemMappedToFacility(multiFacilityItem, 'PLANT-03') === false, 'Item not mapped to PLANT-03 returns false');
assert(window.DB.isItemMappedToFacility(multiFacilityItem, 'ALL') === true, 'Item returns true for filter ALL');

const unmappedItem = {
  id: 'ITM-TEST-002',
  code: '2W-UNMAPPED',
  name: 'Unmapped Part',
  facility_ids: []
};
assert(window.DB.isItemMappedToFacility(unmappedItem, 'PLANT-01') === false, 'Unmapped item returns false for PLANT-01');

// Test 3: getItemsForFacility returns only mapped items
window.DB.upsert('items', multiFacilityItem);
const itemsP1 = window.DB.getItemsForFacility('PLANT-01');
const itemsP2 = window.DB.getItemsForFacility('PLANT-02');
const itemsP3 = window.DB.getItemsForFacility('PLANT-03');

assert(itemsP1.some(i => i.id === 'ITM-TEST-001'), 'ITM-TEST-001 is present in getItemsForFacility(PLANT-01)');
assert(itemsP2.some(i => i.id === 'ITM-TEST-001'), 'ITM-TEST-001 is present in getItemsForFacility(PLANT-02)');
assert(!itemsP3.some(i => i.id === 'ITM-TEST-001'), 'ITM-TEST-001 is NOT present in getItemsForFacility(PLANT-03)');

// Test 4: Item Master Modal initialization and draft normalization
window.ItemSetupModule.showItemModal('ITM-TEST-001', 'BASIC');
assert(Array.isArray(window.ItemSetupModule.editingItemDraft.facility_ids), 'Draft facility_ids is an array');
assert(window.ItemSetupModule.editingItemDraft.facility_ids.includes('PLANT-01') && window.ItemSetupModule.editingItemDraft.facility_ids.includes('PLANT-02'), 'Draft preserved mapped facilities');

// Test 5: New Item Modal initialization defaults to facilities
window.ItemSetupModule.showItemModal(null, 'BASIC');
assert(Array.isArray(window.ItemSetupModule.editingItemDraft.facility_ids) && window.ItemSetupModule.editingItemDraft.facility_ids.length > 0, 'New item draft initializes with facilities');

// Test 6: Validation Error when saving with 0 facilities mapped
window.ItemSetupModule.editingItemDraft.facility_ids = [];
window.ItemSetupModule.editingItemDraft.name = 'Invalid Part';
window.ItemSetupModule.editingItemDraft.code = 'ITM-INV-001';
window.State.toasts = [];
window.ItemSetupModule.saveItem();
assert(window.State.toasts.some(t => t.type === 'error' && t.msg.includes('Facility')), 'saveItem() blocks saving item without facility mapping');

// Test 7: Item Master Table Facility Filter
window.ItemSetupModule.facilityFilter = 'PLANT-01';
const htmlP1 = window.ItemSetupModule.renderItemMasterTab();
assert(htmlP1.includes('2W-TEST-PAD'), 'renderItemMasterTab includes ITM-TEST-001 when facilityFilter is PLANT-01');

window.ItemSetupModule.facilityFilter = 'PLANT-03';
const htmlP3 = window.ItemSetupModule.renderItemMasterTab();
assert(!htmlP3.includes('2W-TEST-PAD'), 'renderItemMasterTab excludes ITM-TEST-001 when facilityFilter is PLANT-03');

// Test 8: CSV Import with Facilities parsing
const sampleCsv = `Item Code,Item Name,Category,Subcategory,Brand,Part Number,Stock UOM,MRP,Sale Price,Facilities,HSN Code,GST Rate (%)
2W-CSV-PAD-01,CSV Imported Brake Pad,Spare Parts,Brake Parts,Bosch,06455-KWP-D01,NOS,450,380,PLANT-01; PLANT-03,87141000,18`;

window.ItemSetupModule.processItemCsvText(sampleCsv);
const parsed = window.ItemSetupModule._parsedItemImportData;
assert(Array.isArray(parsed) && parsed.length === 1, 'CSV parsed successfully');
assert(parsed[0].facility_ids && parsed[0].facility_ids.includes('PLANT-01') && parsed[0].facility_ids.includes('PLANT-03'), 'Facilities parsed correctly from CSV into facility_ids array');

// Execute import
window.ItemSetupModule.executeItemImport();
const importedItem = window.DB.getById('items', '2W-CSV-PAD-01');
assert(!!importedItem, 'Imported item saved to DB');
assert(importedItem.facility_ids.includes('PLANT-01') && importedItem.facility_ids.includes('PLANT-03') && !importedItem.facility_ids.includes('PLANT-02'), 'Imported item has mapped facilities [PLANT-01, PLANT-03]');

// Test 9: Historical transactions intact
const histBal = { id: 'BAL-HIST-1', plant_id: 'PLANT-02', warehouse_id: 'WH-CHN-01', item_id: '2W-CSV-PAD-01', on_hand: 25 };
window.DB.upsert('inventoryBalances', histBal);
const resolvedItem = window.DB.getById('items', histBal.item_id);
assert(resolvedItem && resolvedItem.name === 'CSV Imported Brake Pad', 'Historical transaction successfully resolves item details without error');

// Clean up test items
window.DB.delete('items', 'ITM-TEST-001');
window.DB.delete('items', '2W-CSV-PAD-01');
window.DB.delete('inventoryBalances', 'BAL-HIST-1');

console.log('\n--- VERIFICATION SUMMARY ---');
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('ALL FACILITY MAPPING REQUIREMENTS VERIFIED SUCCESSFULLY!');
  process.exit(0);
}
