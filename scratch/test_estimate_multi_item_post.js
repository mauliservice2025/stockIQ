// scratch/test_estimate_multi_item_post.js
// Verification of multi-item staging and posting to Estimate

const assert = require('assert');

// Setup mock DOM & Environment
global.window = global;
global.document = {
  elements: {},
  getElementById(id) {
    if (!this.elements[id]) {
      this.elements[id] = {
        id,
        value: '',
        innerText: '',
        textContent: '',
        innerHTML: '',
        style: {},
        className: '',
        checked: false,
        disabled: false,
        setAttribute(k, v) { this[k] = v; },
        getAttribute(k) { return this[k]; },
        removeAttribute(k) { delete this[k]; },
        querySelectorAll() { return []; }
      };
    }
    return this.elements[id];
  },
  querySelectorAll(sel) {
    if (sel.includes('.est-catalog-check:checked')) {
      return Object.values(this.elements).filter(e => e.className && e.className.includes('est-catalog-check') && e.checked);
    }
    if (sel.includes('.est-catalog-check')) {
      return Object.values(this.elements).filter(e => e.className && e.className.includes('est-catalog-check'));
    }
    return [];
  },
  querySelector() { return null; }
};

let modalPayload = null;
let toastLog = [];

global.State = {
  showModal(opts) { modalPayload = opts; },
  closeModal() { modalPayload = null; },
  showToast(msg, type) { toastLog.push({ msg, type }); console.log(`[Toast ${type}]: ${msg}`); }
};

const mockItems = [
  { id: 'PRT-001', code: 'PRT-001', name: 'Front Brake Pad Set', type: 'PART', rate: 350, stock: 10, inTransit: 0 },
  { id: 'PRT-002', code: 'PRT-002', name: 'Rear Brake Shoe', type: 'PART', rate: 280, stock: 5, inTransit: 0 },
  { id: 'LBR-001', code: 'LBR-001', name: 'Brake Overhaul & Cleaning', type: 'LABOUR', rate: 250, stock: 0 },
  { id: 'LBR-002', code: 'LBR-002', name: 'General Service Labour', type: 'LABOUR', rate: 450, stock: 0 },
  { id: 'CON-001', code: 'CON-001', name: 'Brake Fluid DOT 4 (250ml)', type: 'CONSUMABLE', rate: 120, stock: 8, inTransit: 0 }
];

let deductedStockCalls = [];

const mockDBData = {
  items: mockItems,
  jobCards: [
    {
      id: 'JC-1001',
      job_card_no: 'JC-1001',
      vehicle_reg_no: 'MH-12-AB-1234',
      vehicle_model: 'Activa 6G',
      parts_required: []
    }
  ],
  billingEstimates: [
    {
      id: 'EST-1001',
      estimate_no: 'EST-1001',
      job_card_id: 'JC-1001',
      job_card_no: 'JC-1001',
      vehicle_reg_no: 'MH-12-AB-1234',
      status: 'DRAFT',
      items: [],
      grand_total: 0
    }
  ],
  draftBills: [],
  finalBills: []
};

global.DB = {
  data: mockDBData,
  getAll(table) { return mockDBData[table] || []; },
  getById(table, id) { return (mockDBData[table] || []).find(x => x.id === id); },
  upsert(table, row) {
    const list = mockDBData[table] || [];
    const idx = list.findIndex(x => x.id === row.id);
    if (idx >= 0) list[idx] = row;
    else list.push(row);
  },
  emitChange() {},
  saveData() {},
  deductItemStock(call) {
    deductedStockCalls.push(call);
  },
  getItemStockDetails({ itemId }) {
    const item = mockItems.find(i => i.code === itemId || i.id === itemId || i.name === itemId);
    return { available: item ? item.stock : 10, inTransit: 0, uom: 'NOS' };
  }
};

// Load billing module
require('../js/modules/billing.js');
const billing = window.BillingModule;
billing.activeEstimateId = 'EST-1001';

console.log('====================================================');
console.log('TESTING ESTIMATE MULTI-ITEM STAGING AND POSTING');
console.log('====================================================\n');

// TEST 1: Modal opening has multi-item features
console.log('--- TEST 1: Open Add Item Modal & verify multi-item elements ---');
billing.showAddEstimateItemModal();
assert(modalPayload, 'Modal must open');
const html = modalPayload.contentHtml;

assert(html.includes('id="est-view-tab-form"'), 'Form entry tab toggle must exist');
assert(html.includes('id="est-view-tab-catalog"'), 'Multi-select catalog tab toggle must exist');
assert.strictEqual(billing._estModalMode, 'catalog', 'Multi-select catalog must be default mode');
assert.strictEqual(document.getElementById('est-catalog-entry-view').style.display, 'flex', 'Catalog view must be visible by default');
assert.strictEqual(document.getElementById('est-form-entry-view').style.display, 'none', 'Form entry view must be hidden by default');
assert(html.includes('id="est-staged-items-container"'), 'Staged items container must exist');
assert(html.includes('➕ Add to List'), '+ Add to List button must exist');
assert(html.includes('Post to Estimate'), 'Post to Estimate button must exist');
assert(html.includes('+ Add Item to Estimate'), 'Hidden/visible text + Add Item to Estimate for compatibility');
console.log('✓ PASS: Multi-Select Catalog is the default mode on modal open and staging toggles exist!\n');

// TEST 2: Add multiple items sequentially to the staging list
console.log('--- TEST 2: Staging multiple items (Spare Part, Labour, Consumable) ---');
assert.strictEqual(billing._stagedEstimateItems.length, 0, 'Initially 0 staged items');

// Stage Item 1: Front Brake Pad Set (Spare Part)
document.getElementById('est-add-item-code').value = 'PRT-001';
document.getElementById('est-add-item-name').value = 'Front Brake Pad Set';
document.getElementById('est-add-item-type').value = 'PART';
document.getElementById('est-add-item-qty').value = '2';
document.getElementById('est-add-item-rate').value = '350';
billing.addCurrentItemToEstimateStage();

assert.strictEqual(billing._stagedEstimateItems.length, 1, '1 item should be staged');
assert.strictEqual(billing._stagedEstimateItems[0].code, 'PRT-001');
assert.strictEqual(billing._stagedEstimateItems[0].qty, 2);
assert.strictEqual(billing._stagedEstimateItems[0].amount, 700);
// Verify form fields reset for next item
assert.strictEqual(document.getElementById('est-add-item-name').value, '', 'Name input should be reset');
assert.strictEqual(document.getElementById('est-add-item-qty').value, '1', 'Qty should be reset to 1');
console.log('✓ PASS: Item 1 staged successfully and form inputs reset for next item');

// Stage Item 2: Brake Overhaul & Cleaning (Labour Service)
billing.setAddEstimateItemType('LABOUR');
document.getElementById('est-add-item-code').value = 'LBR-001';
document.getElementById('est-add-item-name').value = 'Brake Overhaul & Cleaning';
document.getElementById('est-add-item-qty').value = '1';
document.getElementById('est-add-item-rate').value = '250';
billing.addCurrentItemToEstimateStage();

assert.strictEqual(billing._stagedEstimateItems.length, 2, '2 items should be staged');
assert.strictEqual(billing._stagedEstimateItems[1].code, 'LBR-001');
assert.strictEqual(billing._stagedEstimateItems[1].type, 'LABOUR');
assert.strictEqual(billing._stagedEstimateItems[1].amount, 250);
console.log('✓ PASS: Item 2 (Labour Service) staged successfully');

// Stage Item 3: Brake Fluid DOT 4 (Consumable)
billing.setAddEstimateItemType('CONSUMABLE');
document.getElementById('est-add-item-code').value = 'CON-001';
document.getElementById('est-add-item-name').value = 'Brake Fluid DOT 4 (250ml)';
document.getElementById('est-add-item-qty').value = '1';
document.getElementById('est-add-item-rate').value = '120';
billing.addCurrentItemToEstimateStage();

assert.strictEqual(billing._stagedEstimateItems.length, 3, '3 items should be staged');
assert.strictEqual(billing._stagedEstimateItems[2].code, 'CON-001');
assert.strictEqual(billing._stagedEstimateItems[2].type, 'CONSUMABLE');
assert.strictEqual(billing._stagedEstimateItems[2].amount, 120);

const totalStaged = billing._stagedEstimateItems.reduce((s, i) => s + i.amount, 0);
assert.strictEqual(totalStaged, 700 + 250 + 120, 'Total staged amount should be 1070');
console.log(`✓ PASS: 3 items staged with correct total ₹${totalStaged}\n`);

// TEST 3: Staged items table HTML rendering
console.log('--- TEST 3: Staged items table HTML rendering ---');
const stagedHtml = billing.renderStagedEstimateItemsHtml();
assert(stagedHtml.includes('Front Brake Pad Set'), 'Item 1 description present');
assert(stagedHtml.includes('Brake Overhaul & Cleaning'), 'Item 2 description present');
assert(stagedHtml.includes('Brake Fluid DOT 4'), 'Item 3 description present');
assert(stagedHtml.includes('1070.00'), 'Total queue amount present');
console.log('✓ PASS: Staged items table renders all items and totals accurately\n');

// TEST 4: Post all staged items to Estimate at once!
console.log('--- TEST 4: Post all staged items to Estimate ---');
billing.handleAddEstimateItemSubmit();

const est = billing.getActiveEstimate();
assert.strictEqual(est.items.length, 3, 'All 3 staged items must be posted into Estimate');
assert.strictEqual(est.items[0].code, 'PRT-001');
assert.strictEqual(est.items[0].qty, 2);
assert.strictEqual(est.items[1].code, 'LBR-001');
assert.strictEqual(est.items[1].qty, 1);
assert.strictEqual(est.items[2].code, 'CON-001');
assert.strictEqual(est.items[2].qty, 1);
console.log('✓ PASS: Estimate items array contains all 3 posted items');

// Verify stock deduction for PART and CONSUMABLE, but NOT LABOUR
assert(deductedStockCalls.some(c => c.itemCode === 'PRT-001' && c.qty === 2), 'Stock deducted for PRT-001');
assert(deductedStockCalls.some(c => c.itemCode === 'CON-001' && c.qty === 1), 'Stock deducted for CON-001');
assert(!deductedStockCalls.some(c => c.itemCode === 'LBR-001'), 'Labour service must not have stock deducted');
console.log('✓ PASS: Stock correctly deducted for physical parts and consumables only');

// Verify linked Job Card parts required
const jc = mockDBData.jobCards[0];
assert.strictEqual(jc.parts_required.length, 2, 'Job card should receive the 2 physical items');
assert(jc.parts_required.some(p => p.item_code === 'PRT-001' && p.qty === 2), 'Job Card has PRT-001');
assert(jc.parts_required.some(p => p.item_code === 'CON-001' && p.qty === 1), 'Job Card has CON-001');
console.log('✓ PASS: Linked Job Card parts are automatically synchronized in batch');

// Verify modal closed & staging queue emptied
assert.strictEqual(billing._stagedEstimateItems.length, 0, 'Staging queue should be cleared after posting');
assert.strictEqual(modalPayload, null, 'Modal should be closed after posting');
console.log('✓ PASS: Modal closed and staging queue cleared\n');

// TEST 5: Test Multi-Select Catalog Mode
console.log('--- TEST 5: Multi-Select Catalog Mode ---');
billing.showAddEstimateItemModal();
billing.setEstimateModalViewMode('catalog');
assert.strictEqual(billing._estModalMode, 'catalog');

// Check items in catalog
const chk1 = document.getElementById('est-cat-chk-PRT-002');
chk1.className = 'est-catalog-check';
chk1.checked = true;
chk1.setAttribute('data-code', 'PRT-002');
chk1.setAttribute('data-name', 'Rear Brake Shoe');
chk1.setAttribute('data-type', 'PART');
chk1.setAttribute('data-rate', '280');
chk1.setAttribute('data-stock', '5');
document.getElementById('est-cat-qty-PRT-002').value = '2';

billing.addSelectedCatalogItemsToStage();
assert.strictEqual(billing._stagedEstimateItems.length, 1, '1 item staged from catalog');
assert.strictEqual(billing._stagedEstimateItems[0].code, 'PRT-002');
assert.strictEqual(billing._stagedEstimateItems[0].qty, 2);
assert.strictEqual(billing._stagedEstimateItems[0].amount, 560);
console.log('✓ PASS: Items selected from Catalog successfully staged');

// Post catalog item to Estimate
billing.handleAddEstimateItemSubmit();
assert.strictEqual(est.items.length, 4, '4th item added to estimate from catalog batch');
assert(est.items.some(i => i.code === 'PRT-002' && i.qty === 2));
console.log('✓ PASS: Catalog staged item posted to estimate successfully');

console.log('\n====================================================');
console.log('ALL MULTI-ITEM ESTIMATE POST TESTS PASSED! ✅');
console.log('====================================================');
