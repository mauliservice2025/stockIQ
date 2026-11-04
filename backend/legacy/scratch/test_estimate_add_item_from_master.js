const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

console.log('=== TESTING "+ ITEM" & ITEM MASTER FETCH WORKFLOW ===\n');

// 1. Load mock data & DB
const dbCode = fs.readFileSync(path.join(__dirname, '../js/data/db.js'), 'utf8');
const billingCode = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');

// Set up sandbox environment
const sandbox = {
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  navigator: {},
  document: {
    getElementById: (id) => {
      if (sandbox._domElements && sandbox._domElements[id]) {
        return sandbox._domElements[id];
      }
      return {
        value: '',
        innerText: '',
        style: {},
        setAttribute: () => {},
        getAttribute: () => '',
        classList: { add: () => {}, remove: () => {} }
      };
    },
    querySelectorAll: (sel) => {
      return sandbox._domQueryList || [];
    }
  },
  window: {
    location: { hash: '#/billing' }
  },
  localStorage: {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; }
  }
};
sandbox.window.localStorage = sandbox.localStorage;
sandbox.window.document = sandbox.document;

vm.createContext(sandbox);

// Run DB code
vm.runInContext(dbCode, sandbox);
assert(sandbox.window.DB, 'window.DB must be defined');

// Add State mock
sandbox.window.State = {
  currentPlantId: 'PLANT-01',
  toasts: [],
  modals: [],
  showToast(msg, type) {
    this.toasts.push({ msg, type });
  },
  showModal(opts) {
    this.modals.push(opts);
  },
  closeModal() {
    this.modals.pop();
  }
};

// Run Billing Module code
vm.runInContext(billingCode, sandbox);
assert(sandbox.window.BillingModule, 'window.BillingModule must be defined');

const Billing = sandbox.window.BillingModule;
const DB = sandbox.window.DB;

console.log('--- 1. Testing DB item master fetch ---');
const fetchedItems = Billing.fetchAllMasterItems();
console.log(`Fetched ${fetchedItems.length} items from Item Master.`);
assert(fetchedItems.length >= 10, 'Must fetch items from master');
const hasBrakePad = fetchedItems.some(i => i.code === 'ITEM-2W-001' || i.name.includes('Brake Pad'));
assert(hasBrakePad, 'Must contain Front Brake Pad Set from master');
console.log('✓ Master items fetched successfully with codes, names, rates, and stock.');

console.log('\n--- 2. Testing Estimate Items Header with "+ Item" button ---');
// Create an estimate in READY_FOR_APPROVAL status (matching the user screenshot!)
const testEst = {
  id: 'EST-TEST-001',
  estimate_no: 'EST/MSC1/2026/0012',
  status: 'READY_FOR_APPROVAL',
  customer_name: 'Kiran Rane',
  customer_cin: 'CIN/MSC/2026/000013',
  vehicle_reg_no: 'MH12SC3737',
  job_card_no: 'JC/MSC1/2026/0017',
  job_card_id: 'JC-017',
  items: [
    { id: 'LBR-001', code: 'LBR-001', name: 'General Service Labour', type: 'LABOUR', qty: 2, rate: 250, amount: 500 }
  ],
  subtotal: 500,
  tax_amount: 0,
  discount_amount: 0,
  estimated_total: 500
};
DB.upsert('billingEstimates', testEst);
Billing.activeEstimateId = testEst.id;

// Render estimates tab HTML
const renderedHtml = Billing.renderEstimatesTab();

// Verify + Item button is present
assert(renderedHtml.includes('+ Item'), 'Rendered HTML must contain "+ Item" button');
assert(renderedHtml.includes('window.BillingModule.showAddEstimateItemModal()'), 'Rendered HTML must trigger showAddEstimateItemModal');
assert(renderedHtml.includes('🔄 Sync Parts from Job Card'), 'Must also have Sync Parts from Job Card');

// Verify + Item button is placed to the left of Sync Parts from Job Card
const posItemBtn = renderedHtml.indexOf('+ Item');
const posSyncBtn = renderedHtml.indexOf('Sync Parts from Job Card');
assert(posItemBtn !== -1 && posSyncBtn !== -1, 'Both buttons must exist');
assert(posItemBtn < posSyncBtn, '"+ Item" button must be positioned to the left of "Sync Parts from Job Card" as annotated in the screenshot');
console.log('✓ "+ Item" button is prominently visible in Estimate Items header to the left of Sync Parts.');

console.log('\n--- 3. Testing showAddEstimateItemModal() in READY_FOR_APPROVAL stage ---');
Billing.showAddEstimateItemModal();
assert(sandbox.window.State.modals.length > 0, 'Modal must open');
const modal = sandbox.window.State.modals[sandbox.window.State.modals.length - 1];
assert.strictEqual(modal.title, 'Add Item', 'Modal title must be "Add Item" without "from Item Master"');
assert(!modal.contentHtml.includes('from Item Master'), 'Modal must not contain "from Item Master"');
assert(!modal.contentHtml.includes('Estimate: Generated on Save'), 'Modal must not contain "Estimate: Generated on Save"');
assert(modal.contentHtml.includes('ITEM-2W-001'), 'Modal must display item ITEM-2W-001');
assert(modal.contentHtml.includes('Front Brake Pad Set'), 'Modal must display item name');
console.log('✓ showAddEstimateItemModal() opens as "Add Item" without extra banners in READY_FOR_APPROVAL stage.');

console.log('\n--- 4. Testing adding an item fetched from Item Master to the active estimate ---');
// Mock DOM elements for submit
sandbox._domElements = {
  'est-add-item-code': { value: 'ITEM-2W-001' },
  'est-add-item-name': { value: 'Front Brake Pad Set (Disc)' },
  'est-add-item-type': { value: 'PART' },
  'est-add-item-qty': { value: '2' },
  'est-add-item-rate': { value: '380' }
};

Billing.handleAddEstimateItemSubmit();

// Verify item was added to active estimate
const updatedEst = DB.getById('billingEstimates', testEst.id);
assert(updatedEst.items.length === 2, 'Estimate must now have 2 items');
const addedItem = updatedEst.items[1];
assert(addedItem.code === 'ITEM-2W-001', 'Added item code must be ITEM-2W-001');
assert(addedItem.name === 'Front Brake Pad Set (Disc)', 'Added item name must match');
assert(addedItem.qty === 2, 'Added item qty must be 2');
assert(addedItem.rate === 380, 'Added item rate must be 380');
assert(addedItem.amount === 760, 'Added item amount must be 760');

// Verify total recalculation (500 + 760 = 1260)
assert(updatedEst.subtotal === 1260, `Subtotal should be 1260, got ${updatedEst.subtotal}`);
assert(updatedEst.estimated_total === 1260, `Estimated total should be 1260, got ${updatedEst.estimated_total}`);
console.log(`✓ Item added and persisted to Estimate. New total: ₹${updatedEst.estimated_total}`);

console.log('\n=== ALL "+ ITEM" & ITEM MASTER FETCH TESTS PASSED! ===');
