const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

console.log('================================================================');
console.log('TESTING ITEM MASTER IMPORT & EXPORT FUNCTIONALITY');
console.log('================================================================\n');

// 1. Read files
const mockDataContent = fs.readFileSync(path.join(__dirname, '../js/data/mock-data.js'), 'utf8');
const dbContent = fs.readFileSync(path.join(__dirname, '../js/data/db.js'), 'utf8');
const stateContent = fs.readFileSync(path.join(__dirname, '../js/state.js'), 'utf8');
const itemSetupContent = fs.readFileSync(path.join(__dirname, '../js/modules/item-setup-master.js'), 'utf8');
const storeInvContent = fs.readFileSync(path.join(__dirname, '../js/modules/store-inventory.js'), 'utf8');

// 2. Setup mock environment
let lastModal = null;
let lastToast = null;
let downloadedBlob = null;
let downloadedFilename = null;

const domElements = {};
function getOrCreateElement(id) {
  if (!domElements[id]) {
    domElements[id] = {
      id,
      value: '',
      checked: true,
      style: {},
      innerHTML: '',
      innerText: '',
      className: '',
      disabled: false,
      focus: () => {},
      click: () => {}
    };
  }
  return domElements[id];
}

const sandbox = {
  window: {},
  document: {
    getElementById: (id) => getOrCreateElement(id),
    querySelector: (sel) => null,
    querySelectorAll: (sel) => [],
    addEventListener: () => {},
    createElement: (tag) => {
      const el = {
        tagName: tag,
        href: '',
        download: '',
        click: () => {},
        setAttribute: (k, v) => { el[k] = v; }
      };
      return el;
    },
    body: {
      appendChild: () => {},
      removeChild: () => {}
    }
  },
  FileReader: function() {
    this.readAsText = (file, enc) => {
      setTimeout(() => {
        if (this.onload) this.onload({ target: { result: file._mockContent } });
      }, 5);
    };
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

global.Blob = function(parts, options) {
  this.parts = parts;
  this.options = options;
  downloadedBlob = this;
};
global.URL = global.URL || {};
global.URL.createObjectURL = (blob) => {
  downloadedBlob = blob;
  return 'blob:mock-url';
};
global.URL.revokeObjectURL = () => {};

sandbox.Blob = global.Blob;
sandbox.URL = global.URL;

vm.createContext(sandbox);
vm.runInContext(mockDataContent, sandbox);
vm.runInContext(dbContent, sandbox);
vm.runInContext(stateContent, sandbox);
vm.runInContext(itemSetupContent, sandbox);
vm.runInContext(storeInvContent, sandbox);

const ItemSetup = sandbox.window.ItemSetupModule;
assert(ItemSetup, 'ItemSetupModule must be defined on window');

sandbox.window.DB.data.items = [
  { id: 'ITEM-2W-001', code: '2W-BRK-PAD-01', name: 'Front Disc Brake Pad Set - Activa / Jupiter / Access', part_number: '06455-KWP-D01', brand: 'Nissin / OEM', category_id: 'CAT-SPARE', subcategory_id: 'SUB-BRK', stock_uom: 'SET', base_uom: 'SET', mrp: 450, workshop_sale_price: 380, sale_price: 380, standard_cost: 280, status: 'Active' },
  { id: 'ITEM-2W-002', code: '2W-BRK-SHO-01', name: 'Rear Brake Shoe Set - Activa 6G / Splendor Plus', part_number: '43125-KRP-980', brand: 'Endurance', category_id: 'CAT-SPARE', subcategory_id: 'SUB-BRK', stock_uom: 'SET', base_uom: 'SET', mrp: 320, workshop_sale_price: 260, sale_price: 260, standard_cost: 180, status: 'Active' },
  { id: 'ITEM-2W-003', code: '2W-LUB-10W30-01', name: '4T 10W-30 Premium Engine Oil (1L Bottle)', part_number: 'CAS-10W30-1L', brand: 'Castrol Activ', category_id: 'CAT-LUB', subcategory_id: 'SUB-EOIL', stock_uom: 'BTL', base_uom: 'BTL', mrp: 460, workshop_sale_price: 395, sale_price: 395, standard_cost: 290, status: 'Active' },
  { id: 'ITEM-2W-004', code: '2W-FLT-AIR-01', name: 'Foam Air Filter Element - Activa 6G', part_number: '17210-KWP-D00', brand: 'Honda Genuine', category_id: 'CAT-SPARE', subcategory_id: 'SUB-FLT', stock_uom: 'NOS', base_uom: 'NOS', mrp: 210, workshop_sale_price: 165, sale_price: 165, standard_cost: 120, status: 'Active' },
  { id: 'ITEM-2W-005', code: '2W-TRN-BLT-01', name: 'CVT Variator Drive Belt - Activa 6G / Dio', part_number: '23100-KWP-D01', brand: 'Bando', category_id: 'CAT-SPARE', subcategory_id: 'SUB-TRN', stock_uom: 'NOS', base_uom: 'NOS', mrp: 590, workshop_sale_price: 480, sale_price: 480, standard_cost: 380, status: 'Active' }
];

ItemSetup.ensureSeedData();

// Mock State functions
sandbox.window.State.showModal = (cfg) => { lastModal = cfg; };
sandbox.window.State.closeModal = () => { lastModal = null; };
sandbox.window.State.showToast = (msg, type) => { lastToast = { msg, type }; };

// =============================================================================
// TEST 1: Render Item Master Tab contains Export and Import buttons
// =============================================================================
console.log('1. Checking renderItemMasterTab Toolbar...');
const html = ItemSetup.renderItemMasterTab();
assert(html.includes('window.ItemSetupModule.exportItemsCsv()'), 'Toolbar must have exportItemsCsv button');
assert(html.includes('window.ItemSetupModule.showImportItemsModal()'), 'Toolbar must have showImportItemsModal button');
assert(html.includes('📤 Export'), 'Must display Export button with icon');
assert(html.includes('📥 Import'), 'Must display Import button with icon');
assert(html.includes('+ Register New Item'), 'Must display Register New Item button');
console.log('✓ Toolbar rendering with Export & Import buttons verified.');

// =============================================================================
// TEST 2: Export Functionality
// =============================================================================
console.log('\n2. Testing exportItemsCsv()...');
downloadedBlob = null;
try {
  ItemSetup.exportItemsCsv();
} catch (err) {
  console.error('exportItemsCsv thrown:', err);
}
console.log('lastToast:', lastToast);
console.log('DB items count:', sandbox.window.DB.getAll('items').length);
assert(downloadedBlob, 'exportItemsCsv must create a Blob for download');
assert(downloadedBlob.options.type.includes('text/csv'), 'Blob must be CSV');
const exportedCsvText = downloadedBlob.parts.join('');
assert(exportedCsvText.includes('\uFEFF'), 'CSV must include UTF-8 BOM');
assert(exportedCsvText.includes('Item Code,Item Name'), 'CSV must include header row');
assert(!exportedCsvText.includes(',MRP,'), 'CSV must NOT include MRP column');
assert(!exportedCsvText.includes(',Standard Cost,'), 'CSV must NOT include Standard Cost column');
assert(!exportedCsvText.includes(',Sale Price,'), 'CSV must NOT include Sale Price column');
assert(!exportedCsvText.includes(',Min Stock,'), 'CSV must NOT include Min Stock column');
assert(!exportedCsvText.includes(',Reorder Level,'), 'CSV must NOT include Reorder Level column');
assert(lastToast && lastToast.type === 'success', 'Export must trigger success toast');
console.log(`✓ Export passed: Generated CSV (${exportedCsvText.split('\n').length} rows) with BOM (pricing/stock columns excluded).`);

// =============================================================================
// TEST 3: Download Sample CSV Template
// =============================================================================
console.log('\n3. Testing downloadItemSampleCsv()...');
downloadedBlob = null;
ItemSetup.downloadItemSampleCsv();
assert(downloadedBlob, 'downloadItemSampleCsv must generate sample template blob');
const sampleCsv = downloadedBlob.parts.join('');
assert(sampleCsv.includes('2W-BRK-PAD-01'), 'Sample CSV must contain realistic 2-wheeler part');
assert(sampleCsv.includes('Front Disc Brake Pad Set'), 'Sample CSV must include item name');
assert(!sampleCsv.includes(',MRP,'), 'Sample CSV must NOT include MRP column');
assert(!sampleCsv.includes(',Standard Cost,'), 'Sample CSV must NOT include Standard Cost column');
assert(!sampleCsv.includes(',Sale Price,'), 'Sample CSV must NOT include Sale Price column');
assert(!sampleCsv.includes(',Min Stock,'), 'Sample CSV must NOT include Min Stock column');
assert(!sampleCsv.includes(',Reorder Level,'), 'Sample CSV must NOT include Reorder Level column');
console.log('✓ Sample CSV template verified with automotive parts (pricing/stock columns excluded).');

// =============================================================================
// TEST 4: Import Modal UI & Mode Switching
// =============================================================================
console.log('\n4. Testing showImportItemsModal()...');
ItemSetup.showImportItemsModal();
assert(lastModal, 'showImportItemsModal must open modal');
assert(lastModal.title.includes('Bulk Import Item Master Records'), 'Modal title must match');
assert(lastModal.body.includes('item-tab-btn-file') && lastModal.body.includes('item-tab-btn-paste'), 'Modal must have dual tabs');
assert(lastModal.body.includes('item-import-upsert-chk'), 'Modal must have upsert checkbox');
assert(lastModal.body.includes('item-import-autocreate-chk'), 'Modal must have auto-create checkbox');

ItemSetup.switchItemImportMode('paste');
assert.strictEqual(domElements['item-tab-btn-paste'].className, 'btn btn-sm btn-primary');
ItemSetup.switchItemImportMode('file');
assert.strictEqual(domElements['item-tab-btn-file'].className, 'btn btn-sm btn-primary');
console.log('✓ Import modal and mode switching verified.');

// =============================================================================
// TEST 5: CSV Parsing, Header Auto-Detection & Preview Validation
// =============================================================================
console.log('\n5. Testing CSV Parsing and Preview Generation...');
const testCsv = `Item Code,Item Name,Category,Subcategory,Brand,Manufacturer,Part Number,Stock UOM,MRP,Standard Cost,Sale Price,HSN Code,GST Rate (%)
2W-NEW-001,Front Hydraulic Brake Hose 950mm,Spare Parts,Brake Parts,Endurance,Endurance Tech,END-BRK-HOS-01,NOS,380,210,320,87141000,18
2W-NEW-002,LED Headlamp Bulb H4 DC 12V 25W,Accessories,LED Accessories,Osram,Osram India,OSR-H4-LED-25W,NOS,650,380,550,85122010,28
2W-BRK-PAD-01,Front Brake Pad Set - Premium Ceramic,Spare Parts,Brake Parts,Nissin / OEM,Honda Motor Co.,06455-KWP-D01,SET,490,290,410,87141000,18`;

ItemSetup.processItemCsvText(testCsv);
assert(ItemSetup._parsedItemImportData, 'Must parse item data');
assert.strictEqual(ItemSetup._parsedItemImportData.length, 3, 'Must parse 3 records');

const rec1 = ItemSetup._parsedItemImportData[0];
assert.strictEqual(rec1.code, '2W-NEW-001');
assert.strictEqual(rec1.name, 'Front Hydraulic Brake Hose 950mm');
assert.strictEqual(rec1.isUpdate, false, '2W-NEW-001 is new');
assert.strictEqual(rec1.mrp, 380);
assert.strictEqual(rec1.workshop_sale_price, 320);

const rec3 = ItemSetup._parsedItemImportData[2];
assert.strictEqual(rec3.code, '2W-BRK-PAD-01');
assert.strictEqual(rec3.isUpdate, true, '2W-BRK-PAD-01 is existing record (upsert)');

assert(domElements['item-import-status-strip'].innerHTML.includes('3 items ready to import'), 'Status strip must display count');
assert.strictEqual(domElements['item-import-submit-btn'].disabled, false, 'Submit button must be enabled');
console.log('✓ CSV Parsing & Preview verified: 2 new items, 1 existing update correctly identified.');

// =============================================================================
// TEST 6: Execute Import (Adding new items & Upserting existing)
// =============================================================================
console.log('\n6. Testing executeItemImport()...');
getOrCreateElement('item-import-upsert-chk').checked = true;
getOrCreateElement('item-import-autocreate-chk').checked = true;

const initialCount = sandbox.window.DB.getAll('items').length;
ItemSetup.executeItemImport();

const allItemsAfter = sandbox.window.DB.getAll('items');
assert.strictEqual(allItemsAfter.length, initialCount + 2, 'Must add 2 new items');

// Verify new item 2W-NEW-001
const addedItem = allItemsAfter.find(i => i.code === '2W-NEW-001');
assert(addedItem, '2W-NEW-001 must exist in DB');
assert.strictEqual(addedItem.name, 'Front Hydraulic Brake Hose 950mm');
assert.strictEqual(addedItem.workshop_sale_price, 320);
assert.strictEqual(addedItem.mrp, 380);
assert.strictEqual(addedItem.stock_uom, 'NOS');

// Verify upserted item 2W-BRK-PAD-01
const updatedItem = allItemsAfter.find(i => i.code === '2W-BRK-PAD-01');
assert(updatedItem, '2W-BRK-PAD-01 must exist in DB');
assert.strictEqual(updatedItem.name, 'Front Brake Pad Set - Premium Ceramic', 'Item name must be updated');
assert.strictEqual(updatedItem.mrp, 490, 'MRP must be updated');
assert.strictEqual(updatedItem.workshop_sale_price, 410, 'Sale price must be updated');

assert(lastToast && lastToast.type === 'success' && lastToast.msg.includes('2 added, 1 updated'), 'Must show detailed success toast');
console.log('✓ Import execution passed: Items successfully created & updated in DB.');

console.log('\n================================================================');
console.log('ALL ITEM MASTER IMPORT & EXPORT TESTS PASSED SUCCESSFULLY! (6/6)');
console.log('================================================================\n');
