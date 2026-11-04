// Test script to verify Full Screen GRN modal with small tabs, With PO / Direct GRN, and Approval Workflow
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('Testing GRN Full Screen Modal, Direct & With PO Tabs, and Approval Stock Inward Flow...');

const dbJs = fs.readFileSync(path.join(__dirname, '../js/data/db.js'), 'utf-8');
const goodsReceiptJs = fs.readFileSync(path.join(__dirname, '../js/modules/goods-receipt.js'), 'utf-8');

global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = v; },
  removeItem(k) { delete this._store[k]; }
};

let capturedModal = null;
let capturedToast = null;
global.confirm = () => true;

global.document = {
  getElementById: (id) => {
    if (id === 'grn-modal-container') return { querySelectorAll: () => [] };
    if (id === 'grn-modal-tab-body') return { innerHTML: '' };
    if (id === 'grn-po-select') return { value: 'PO-2026-101' };
    if (id === 'grn-po-wh-select') return { value: 'STORE-01' };
    if (id === 'grn-po-challan') return { value: 'DC-9922' };
    if (id === 'grn-po-invoice') return { value: 'INV-8812' };
    if (id === 'grn-po-vehicle') return { value: 'MH 12 RN 1122' };
    if (id === 'grn-po-date') return { value: '2026-10-20' };
    if (id === 'grn-po-receiver') return { value: 'Pravin Patil' };
    if (id === 'grn-po-remarks') return { value: 'Urgent inward delivery' };

    if (id === 'grn-dir-wh-select') return { value: 'STORE-02' };
    if (id === 'grn-dir-supplier-select') return { value: 'SUP-02' };
    if (id === 'grn-dir-challan') return { value: 'DC-DIR-001' };
    if (id === 'grn-dir-invoice') return { value: 'INV-DIR-001' };
    if (id === 'grn-dir-vehicle') return { value: 'MH 14 BB 3344' };
    if (id === 'grn-dir-date') return { value: '2026-10-20' };
    if (id === 'grn-dir-receiver') return { value: 'Pravin Patil' };
    if (id === 'grn-dir-purpose') return { value: 'DIRECT_PURCHASE' };
    if (id === 'grn-dir-remarks') return { value: 'Floor replacement parts' };
    if (id === 'view-container') return { innerHTML: '' };
    return null;
  },
  querySelectorAll: (sel) => {
    if (sel === '.grn-po-line-row') {
      return [
        {
          getAttribute: (attr) => {
            if (attr === 'data-item-id') return 'ITEM-01';
            if (attr === 'data-item-code') return 'BRK-PAD-01';
            if (attr === 'data-item-name') return 'Ceramic Brake Pads';
            if (attr === 'data-uom') return 'SET';
            if (attr === 'data-rate') return '450';
            return null;
          },
          querySelector: (subSel) => {
            if (subSel === '.grn-po-recv-qty') return { value: '30' };
            if (subSel === '.grn-po-batch') return { value: 'BATCH-2026-01' };
            if (subSel === '.grn-po-mfg') return { value: '2026-10-01' };
            if (subSel === '.grn-po-exp') return { value: '2028-10-01' };
            return null;
          }
        }
      ];
    }
    return [];
  },
  querySelector: (sel) => null
};

global.window = {
  State: {
    currentPlantId: 'ALL',
    currentUser: { id: 'USR-ADMIN', name: 'Authorized Store Manager', role: 'Store Manager', canApprove: true },
    hasPermission: () => true,
    showModal: (cfg) => { capturedModal = cfg; },
    closeModal: () => { capturedModal = null; },
    showToast: (msg, type) => { capturedToast = { msg, type }; }
  }
};

eval(dbJs);
eval(goodsReceiptJs);

console.log('✔ DB and GoodsReceiptModule loaded successfully.');

// Setup Mock Data in DB
window.DB.data.plants = [
  { id: 'PLANT-01', code: 'PUN-MAIN', name: 'Pune Central Plant', status: 'Active' }
];

window.DB.data.warehouses = [
  { id: 'STORE-01', plant_id: 'PLANT-01', code: 'MAIN_STORE', name: 'Mauli Store 1', status: 'Active' },
  { id: 'STORE-02', plant_id: 'PLANT-01', code: 'SUB_STORE', name: 'Pune Sub Store', status: 'Active' }
];

window.DB.data.suppliers = [
  { id: 'SUP-01', name: 'Endurance Technologies Ltd.', code: 'ENDUR', status: 'Active' },
  { id: 'SUP-02', name: 'Bosch Automotive Parts', code: 'BOSCH', status: 'Active' }
];

window.DB.data.items = [
  { id: 'ITEM-01', code: 'BRK-PAD-01', name: 'Ceramic Brake Pads', unit_of_measure: 'SET', standard_cost: 450, category: 'SPARE', status: 'Active' },
  { id: 'ITEM-02', code: 'ENG-OIL-01', name: 'Engine Oil 15W40', unit_of_measure: 'LTR', standard_cost: 320, category: 'CONS', status: 'Active' }
];

window.DB.data.purchaseOrders = [
  {
    id: 'PO-2026-101',
    plant_id: 'PLANT-01',
    po_number: 'PO-2026-101',
    supplier_id: 'SUP-01',
    supplier_name: 'Endurance Technologies Ltd.',
    warehouse_id: 'STORE-01',
    status: 'APPROVED',
    items: [
      {
        item_id: 'ITEM-01',
        item_name: 'Ceramic Brake Pads',
        item_code: 'BRK-PAD-01',
        ordered_quantity: 100,
        received_quantity: 20,
        pending_quantity: 80,
        unit_price: 450,
        uom: 'SET'
      }
    ]
  }
];

window.DB.data.goodsReceipts = [];
window.DB.data.inventoryBalances = [
  { id: 'BAL-01', plant_id: 'PLANT-01', warehouse_id: 'STORE-01', item_id: 'ITEM-01', item_code: 'BRK-PAD-01', on_hand: 50, reserved: 0, allocated: 0, available: 50 }
];
window.DB.data.inventoryTransactions = [];

// TEST 1: Open Inward Modal - Check Full Screen & GRN Type Dropdown
console.log('\n--- Test 1: Inward Modal Configuration ---');
window.GoodsReceiptModule.showInwardModal();

assert(capturedModal !== null, 'Modal should be opened');
assert.strictEqual(capturedModal.isFullScreen, true, 'Modal must be full-screen');
assert.strictEqual(capturedModal.maxWidth, '96vw', 'Modal width should be 96vw');
assert(capturedModal.contentHtml.includes('id="grn-mode-select"'), 'Modal contentHtml must have GRN Type dropdown');
assert(capturedModal.contentHtml.includes('With PO'), 'Modal contentHtml should have With PO option');
assert(capturedModal.contentHtml.includes('Without PO'), 'Modal contentHtml should have Without PO option');
console.log('✔ Inward modal is full screen with GRN Type dropdown (With PO / Without PO).');

// TEST 2: Mode Switching (With PO <-> Without PO)
console.log('\n--- Test 2: Mode Switching ---');
window.GoodsReceiptModule.switchInwardMode('WITHOUT_PO');
assert.strictEqual(window.GoodsReceiptModule.currentInwardTab, 'DIRECT', 'Active mode should switch to DIRECT / Without PO');

window.GoodsReceiptModule.switchInwardMode('WITH_PO');
assert.strictEqual(window.GoodsReceiptModule.currentInwardTab, 'WITH_PO', 'Active mode should switch to WITH_PO');
console.log('✔ Dropdown mode switching functions correctly.');

// TEST 3: Submit With-PO GRN -> Generates PENDING_APPROVAL GRN (No premature stock addition)
console.log('\n--- Test 3: Submit With-PO GRN (Draft / Pending Approval) ---');
const fakeEvent = { preventDefault: () => {} };
window.GoodsReceiptModule.submitWithPOGRN(fakeEvent);

// Verify GRN record created
const grns = window.DB.data.goodsReceipts;
assert.strictEqual(grns.length, 1, 'One GRN should be recorded');
const createdGRN = grns[0];
assert.strictEqual(createdGRN.grn_type, 'WITH_PO', 'GRN type should be WITH_PO');
assert.strictEqual(createdGRN.status, 'PENDING_APPROVAL', 'GRN status must be PENDING_APPROVAL');
assert.strictEqual(createdGRN.inspection_status, 'PENDING_APPROVAL', 'Inspection status should be PENDING_APPROVAL');
assert.strictEqual(createdGRN.items.length, 1, 'Should have 1 item');
assert.strictEqual(createdGRN.items[0].received_qty, 30, 'Received qty should be 30');

// Verify stock NOT increased yet
const balBeforeApproval = window.DB.data.inventoryBalances.find(b => b.warehouse_id === 'STORE-01' && b.item_id === 'ITEM-01');
assert.strictEqual(balBeforeApproval.on_hand, 50, 'Stock on hand must remain 50 before approval');
assert.strictEqual(balBeforeApproval.available, 50, 'Stock available must remain 50 before approval');
console.log('✔ With-PO GRN saved as PENDING_APPROVAL. Stock was NOT prematurely added to store.');

// TEST 4: Authorised User Approves GRN -> Stock Added to Store
console.log('\n--- Test 4: Approval Flow & Stock Addition to Store ---');
window.GoodsReceiptModule.approveGRN(createdGRN.id);

assert.strictEqual(createdGRN.status, 'APPROVED', 'GRN status should be APPROVED');
assert(createdGRN.approved_at, 'GRN approved_at should be recorded');
assert.strictEqual(createdGRN.approved_by, 'Authorized Store Manager', 'GRN approved_by should be recorded');

// Stock should now be updated: 50 + 30 = 80
const balAfterApproval = window.DB.data.inventoryBalances.find(b => b.warehouse_id === 'STORE-01' && b.item_id === 'ITEM-01');
assert.strictEqual(balAfterApproval.on_hand, 80, 'Stock on hand must now be 80');
assert.strictEqual(balAfterApproval.available, 80, 'Stock available must now be 80');

// Verify inventory transaction logged
const tx = window.DB.data.inventoryTransactions.find(t => t.ref_doc_no === createdGRN.grn_number || t.reference_number === createdGRN.grn_number);
assert(tx, 'Inventory transaction must be created for approved GRN');
assert.strictEqual(tx.transaction_type, 'GRN_INWARD', 'Transaction type must be GRN_INWARD');
assert.strictEqual(tx.quantity, 30, 'Transaction quantity must be 30');
console.log('✔ Authorized user approved GRN. Stock (30 units) successfully added to STORE-01 (Balance: 80).');

// TEST 5: Direct GRN Creation & Item Details
console.log('\n--- Test 5: Direct GRN Creation with Items ---');
window.GoodsReceiptModule.directGRNItems = [
  {
    id: 999,
    item_id: 'ITEM-02',
    item_code: 'ENG-OIL-01',
    item_name: 'Engine Oil 15W40',
    category: 'CONS',
    uom: 'LTR',
    received_qty: 15,
    unit_cost: 320,
    batch_number: 'DIR-LOT-99',
    mfg_date: '2026-10-10',
    expiry_date: '2027-10-10'
  }
];

window.GoodsReceiptModule.submitDirectGRN(fakeEvent);

const directGRN = window.DB.data.goodsReceipts.find(g => g.grn_type === 'DIRECT');
assert(directGRN, 'Direct GRN must be created');
assert.strictEqual(directGRN.status, 'PENDING_APPROVAL', 'Direct GRN must be in PENDING_APPROVAL');
assert.strictEqual(directGRN.items.length, 1, 'Direct GRN should have 1 item');
assert.strictEqual(directGRN.items[0].item_id, 'ITEM-02');
assert.strictEqual(directGRN.items[0].received_qty, 15);

// Verify Store-02 does not have ITEM-02 yet before approval
let store2Bal = window.DB.data.inventoryBalances.find(b => b.warehouse_id === 'STORE-02' && b.item_id === 'ITEM-02');
assert(!store2Bal, 'Stock for STORE-02 should not exist before approval');
console.log('✔ Direct GRN saved as PENDING_APPROVAL without premature stock.');

// TEST 6: Authorize Direct GRN and verify stock creation
console.log('\n--- Test 6: Approve Direct GRN & Verify Store Stock ---');
window.GoodsReceiptModule.approveGRN(directGRN.id);

assert.strictEqual(directGRN.status, 'APPROVED', 'Direct GRN should be APPROVED');
store2Bal = window.DB.data.inventoryBalances.find(b => b.warehouse_id === 'STORE-02' && b.item_id === 'ITEM-02');
assert(store2Bal, 'Stock balance for STORE-02 and ITEM-02 must be created after approval');
assert.strictEqual(store2Bal.on_hand, 15, 'Stock on hand should be 15');
assert.strictEqual(store2Bal.available, 15, 'Stock available should be 15');

console.log('✔ Direct GRN approved and 15 units of ITEM-02 added to STORE-02.');

console.log('\n=============================================');
console.log('ALL TESTS PASSED SUCCESSFULLY!');
console.log('=============================================');
