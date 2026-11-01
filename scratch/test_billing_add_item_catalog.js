const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

console.log('================================================================');
console.log('TESTING BILLING SCREEN ADD ITEM MODAL: MULTI-SELECT CATALOG & FORM ENTRY');
console.log('================================================================\n');

const mockMasterItems = [
  { id: 'ITM-001', code: '2W-SPR-ENGINE-VALVE-SET-007', name: 'Engine Valve Set', type: 'PART', rate: 150, stock: 40, vehicle_models: ['Pulsar 150'] },
  { id: 'ITM-002', code: '2W-SPR-ENGINE-GASKET-KIT-006', name: 'Engine Gasket Kit', type: 'PART', rate: 150, stock: 505, vehicle_models: ['Pulsar 150'] },
  { id: 'LBR-001', code: '2W-LAB-ENGINE-TUNE', name: 'Engine General Tuning', type: 'LABOUR', rate: 350, stock: 0 },
  { id: 'CON-001', code: '2W-CON-ENG-OIL', name: 'Engine Oil 20W40', type: 'CONSUMABLE', rate: 420, stock: 25 }
];

let activeBillObj = {
  id: 'BILL-001',
  billNumber: 'BILL-001',
  status: 'DRAFT',
  job_card_id: 'JC-01',
  items: [],
  subtotal: 0,
  tax: 0,
  total: 0
};

let openedModal = null;
const domNodes = {};

function createMockElement(id, tag = 'div') {
  return {
    id: id,
    tagName: tag.toUpperCase(),
    value: '',
    checked: false,
    innerText: '',
    textContent: '',
    innerHTML: '',
    style: {},
    className: '',
    children: [],
    dataset: {},
    querySelector: function(sel) {
      return null;
    },
    querySelectorAll: function(sel) {
      return [];
    },
    setAttribute: function(k, v) { this[k] = v; },
    getAttribute: function(k) { return this[k]; },
    focus: function() {}
  };
}

const mockDocument = {
  getElementById: function(id) {
    if (!domNodes[id]) {
      domNodes[id] = createMockElement(id);
    }
    return domNodes[id];
  },
  querySelector: function(sel) {
    return null;
  },
  querySelectorAll: function(sel) {
    if (sel.includes('.bill-cat-item-cb')) {
      return Object.values(domNodes).filter(n => n.className && n.className.includes('bill-cat-item-cb'));
    }
    return [];
  }
};

const mockWindow = {
  DB: {
    data: {
      finalBills: [],
      draftBills: [activeBillObj],
      billingEstimates: [],
      jobCards: [{ id: 'JC-01', vehicle_model: 'Pulsar 150' }]
    },
    getAll: (table) => {
      if (table === 'items') return mockMasterItems;
      if (table === 'jobCards') return [{ id: 'JC-01', vehicle_model: 'Pulsar 150' }];
      if (table === 'estimates') return [];
      if (table === 'bills') return [activeBillObj];
      return [];
    },
    saveData: () => {},
    emitChange: () => {},
    getById: (table, id) => {
      if (table === 'jobCards') return { id: 'JC-01', vehicle_model: 'Pulsar 150' };
      if (table === 'bills') return activeBillObj;
      return null;
    },
    upsert: (table, obj) => {
      if (table === 'bills') {
        activeBillObj = obj;
      }
    }
  },
  State: {
    showModal: (config) => { 
      openedModal = config;
      // Pre-seed domNodes based on modal HTML
      const html = config.contentHtml || config.html || '';
      const matches = html.match(/id="([^"]+)"/g) || [];
      matches.forEach(m => {
        const id = m.replace('id="', '').replace('"', '');
        domNodes[id] = createMockElement(id);
      });
    },
    closeModal: () => { openedModal = null; },
    showToast: (msg, type) => console.log(`[Toast ${type}]: ${msg}`)
  },
  document: mockDocument
};

// Read billing.js
const billingCode = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');

const sandbox = {
  window: mockWindow,
  document: mockDocument,
  console: console,
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  Intl: Intl,
  Math: Math,
  Date: Date,
  parseInt: parseInt,
  parseFloat: parseFloat,
  isNaN: isNaN,
  Array: Array,
  Object: Object,
  String: String,
  Number: Number,
  Boolean: Boolean,
  JSON: JSON
};

vm.createContext(sandbox);
vm.runInContext(billingCode, sandbox);

// Provide active bill for testing
mockWindow.BillingModule.getActiveCustomerBillingBill = function() {
  return activeBillObj;
};
mockWindow.BillingModule.fetchAllMasterItems = function() {
  return mockMasterItems;
};

console.log('Step 1: Test showAddSingleScreenItemModal...');
mockWindow.BillingModule.showAddSingleScreenItemModal();

assert(openedModal, 'Modal should be opened');
console.log('✓ Modal opened with title:', openedModal.title);
assert.strictEqual(openedModal.title, 'Add Item / Service to Bill');

// Check that the HTML includes the key elements
const html = openedModal.contentHtml;
assert(html.includes('id="bill-view-tab-form"'), 'HTML must have Form Entry toggle button');
assert(html.includes('id="bill-view-tab-catalog"'), 'HTML must have Multi-Select Catalog toggle button');
assert(html.includes('id="bill-catalog-entry-view"'), 'HTML must have Catalog container');
assert(html.includes('id="bill-form-entry-view"'), 'HTML must have Form Entry container');
assert(html.includes('id="bill-staged-items-container"'), 'HTML must have Staged Queue container');
assert(html.includes('id="bill-post-to-bill-btn"'), 'HTML must have Post to Bill button');

console.log('✓ Modal HTML contains all required tab toggles, catalog, form entry, and staging queue');

// Step 2: Test Switching View Modes
console.log('\nStep 2: Test View Mode Switching (Form Entry vs Multi-Select Catalog)...');
mockWindow.BillingModule.setBillModalViewMode('form');
assert.strictEqual(domNodes['bill-catalog-entry-view'].style.display, 'none');
assert.strictEqual(domNodes['bill-form-entry-view'].style.display, 'flex');
console.log('✓ Switched to Form Entry mode successfully');

mockWindow.BillingModule.setBillModalViewMode('catalog');
assert.strictEqual(domNodes['bill-catalog-entry-view'].style.display, 'flex');
assert.strictEqual(domNodes['bill-form-entry-view'].style.display, 'none');
console.log('✓ Switched back to Multi-Select Catalog mode successfully');

// Step 3: Test Catalog Rendering
console.log('\nStep 3: Test Catalog Rendering...');
mockWindow.BillingModule.renderBillCatalogItemsContainer();
const catalogListHtml = domNodes['bill-catalog-items-list'].innerHTML;
assert(catalogListHtml.includes('2W-SPR-ENGINE-VALVE-SET-007'), 'Catalog must render Engine Valve Set');
assert(catalogListHtml.includes('2W-SPR-ENGINE-GASKET-KIT-006'), 'Catalog must render Engine Gasket Kit');
console.log('✓ Catalog rendered items with codes, rates, and stock');

// Step 4: Test Interactive Catalog Selection & Staging
console.log('\nStep 4: Test Interactive Catalog Selection & Staging...');
// Reset staged items
mockWindow.BillingModule._stagedBillItems = [];
mockWindow.BillingModule.setBillModalViewMode('catalog');

// Create mock checkboxes and qty inputs for catalog items
const cb1 = createMockElement('cb1', 'input');
cb1.className = 'bill-catalog-check';
cb1.dataset = {
  id: 'ITM-001',
  code: '2W-SPR-ENGINE-VALVE-SET-007',
  name: 'Engine Valve Set',
  type: 'PART',
  rate: '150',
  stock: '40'
};
cb1.checked = true;

const qty1 = createMockElement('bill-cat-qty-2W-SPR-ENGINE-VALVE-SET-007', 'input');
qty1.value = '3';
domNodes['bill-cat-qty-2W-SPR-ENGINE-VALVE-SET-007'] = qty1;

const cb2 = createMockElement('cb2', 'input');
cb2.className = 'bill-catalog-check';
cb2.dataset = {
  id: 'ITM-002',
  code: '2W-SPR-ENGINE-GASKET-KIT-006',
  name: 'Engine Gasket Kit',
  type: 'PART',
  rate: '150',
  stock: '505'
};
cb2.checked = true;

const qty2 = createMockElement('bill-cat-qty-2W-SPR-ENGINE-GASKET-KIT-006', 'input');
qty2.value = '2';
domNodes['bill-cat-qty-2W-SPR-ENGINE-GASKET-KIT-006'] = qty2;

mockDocument.querySelectorAll = function(sel) {
  if (sel.includes('.bill-catalog-check:checked')) {
    return [cb1, cb2];
  }
  if (sel.includes('.bill-catalog-check')) {
    return [cb1, cb2];
  }
  return [];
};

mockWindow.BillingModule.onBillCatalogCheckChange(cb1);
mockWindow.BillingModule.onBillCatalogCheckChange(cb2);
assert.strictEqual(String(domNodes['bill-catalog-selected-count'].textContent), '2');
console.log('✓ Checkbox selection counter updated to 2');

mockWindow.BillingModule.addSelectedBillCatalogItemsToStage();
assert.strictEqual(mockWindow.BillingModule._stagedBillItems.length, 2, 'Should stage 2 items');
assert.strictEqual(mockWindow.BillingModule._stagedBillItems[0].qty, 3, 'First item qty should be 3');
assert.strictEqual(mockWindow.BillingModule._stagedBillItems[1].qty, 2, 'Second item qty should be 2');
console.log('✓ Successfully staged selected items from catalog with custom quantities');

// Step 5: Test Staging from Form Entry View
console.log('\nStep 5: Test Staging from Form Entry View...');
mockWindow.BillingModule.setBillModalViewMode('form');
domNodes['add-item-type'].value = 'LABOUR';
domNodes['add-item-code'].value = 'LBR-CUSTOM';
domNodes['add-item-name'].value = 'Custom Diagnostics';
domNodes['add-item-qty'].value = '1';
domNodes['add-item-rate'].value = '250';

mockWindow.BillingModule.addCurrentItemToBillStage();
assert.strictEqual(mockWindow.BillingModule._stagedBillItems.length, 3, 'Should now have 3 staged items');
assert.strictEqual(mockWindow.BillingModule._stagedBillItems[2].code, 'LBR-CUSTOM');
assert.strictEqual(mockWindow.BillingModule._stagedBillItems[2].name, 'Custom Diagnostics');
console.log('✓ Form Entry item successfully staged alongside catalog items');

// Step 6: Test Remove Item from Staged Queue
console.log('\nStep 6: Test Removing Item from Staging Queue...');
mockWindow.BillingModule.removeStagedBillItem(1); // remove index 1 (Gasket Kit)
assert.strictEqual(mockWindow.BillingModule._stagedBillItems.length, 2);
assert.strictEqual(mockWindow.BillingModule._stagedBillItems[0].code, '2W-SPR-ENGINE-VALVE-SET-007');
assert.strictEqual(mockWindow.BillingModule._stagedBillItems[1].code, 'LBR-CUSTOM');
console.log('✓ Staged item successfully removed from queue');

// Step 7: Test handleAddBillItemSubmit() posting batch items to active bill
console.log('\nStep 7: Test Submitting / Posting Batch Items to Bill...');
activeBillObj.items = [];
mockWindow.BillingModule.handleAddBillItemSubmit();

assert.strictEqual(activeBillObj.items.length, 2, 'Bill should now contain 2 items');
assert.strictEqual(activeBillObj.items[0].code, '2W-SPR-ENGINE-VALVE-SET-007');
assert.strictEqual(activeBillObj.items[0].qty, 3);
assert.strictEqual(activeBillObj.items[1].code, 'LBR-CUSTOM');
assert.strictEqual(activeBillObj.items[1].qty, 1);
console.log('✓ Successfully posted all staged items to active bill via handleAddBillItemSubmit()');

console.log('\n================================================================');
console.log('ALL TESTS PASSED SUCCESSFULLY!');
console.log('================================================================');
