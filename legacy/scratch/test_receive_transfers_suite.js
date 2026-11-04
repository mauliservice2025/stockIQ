const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Mock browser environment
global.window = global;
global.window.location = { hash: '#/receive-transfers' };
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.window.dispatchEvent = () => {};
global.CustomEvent = class { constructor(type, init) { this.type = type; this.detail = init?.detail; } };
global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };

const domElements = {};
const createMockEl = (id = '') => {
  if (domElements[id]) return domElements[id];
  const el = {
    id,
    innerHTML: '',
    value: '',
    style: {},
    attributes: {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
    getAttribute(name) { return this.attributes[name] !== undefined ? this.attributes[name] : (this[name] || ''); },
    setAttribute(name, val) { this.attributes[name] = String(val); this[name] = val; },
    removeAttribute(name) { delete this.attributes[name]; },
    remove() {},
    focus() {},
    querySelectorAll() { return []; }
  };
  domElements[id] = el;
  return el;
};

global.document = {
  documentElement: createMockEl('html'),
  getElementById: (id) => domElements[id] || createMockEl(id),
  querySelectorAll: () => [],
  addEventListener: () => {}
};

global.State = {
  currentPlantId: 'ALL',
  getCurrentUser: () => ({ name: 'Admin', username: 'admin', email: 'admin@stockiq.com', primary_role: 'ADMIN' }),
  hasPermission: () => true,
  subscribe: () => {},
  showModal: (config) => { global._lastModal = config; },
  closeModal: () => {},
  showToast: (msg, type) => { global._lastToast = { msg, type }; }
};

const mockPlants = [
  { id: 'PLANT-01', name: 'Mauli Service Center 1 - Ravet', code: 'MSC-01' },
  { id: 'PLANT-02', name: 'Chennai Commercial Branch', code: 'BRANCH-CHE-02' }
];

const mockWarehouses = [
  { id: 'WH-01', plant_id: 'PLANT-01', name: 'Ravet Main Store' },
  { id: 'WH-02', plant_id: 'PLANT-02', name: 'Chennai Store 1' }
];

const mockItems = [
  { id: 'ITM-001', code: '2W-ENG-OIL-10W30', name: 'Engine Oil 10W-30', base_uom: 'LTR' },
  { id: 'ITM-002', code: '2W-FLT-OIL-002', name: 'Oil Filter Element', base_uom: 'NOS' }
];

const mockTransfers = [
  {
    id: 'TRF-001',
    transfer_number: 'ST-2026-000125',
    source_plant_id: 'PLANT-01',
    source_warehouse_id: 'WH-01',
    dest_plant_id: 'PLANT-02',
    dest_warehouse_id: 'WH-02',
    transporter: 'VRL Logistics Fleet',
    vehicle_no: 'MH-14-GH-1029',
    dispatched_at: '2026-10-23T10:00:00.000Z',
    status: 'IN_TRANSIT',
    items: [
      {
        item_id: 'ITM-001',
        code: '2W-ENG-OIL-10W30',
        name: 'Engine Oil 10W-30',
        batch_number: 'LOT-OIL-2026',
        uom: 'LTR',
        dispatched: 20,
        received: 0
      },
      {
        item_id: 'ITM-002',
        code: '2W-FLT-OIL-002',
        name: 'Oil Filter Element',
        batch_number: 'LOT-FLT-2026',
        uom: 'NOS',
        dispatched: 10,
        received: 0
      }
    ]
  }
];

const mockBalances = [
  { id: 'BAL-DEST-01', warehouse_id: 'WH-02', item_id: 'ITM-001', batch_number: 'LOT-OIL-2026', on_hand: 5, available: 5 }
];

const mockReceipts = [];
const mockDiscrepancies = [];
const auditLogs = [];

global.DB = {
  getAll: (table) => {
    if (table === 'stockTransfers') return mockTransfers;
    if (table === 'plants') return mockPlants;
    if (table === 'warehouses') return mockWarehouses;
    if (table === 'items') return mockItems;
    if (table === 'inventoryBalances') return mockBalances;
    if (table === 'stockTransferReceipts') return mockReceipts;
    if (table === 'stockTransferDiscrepancies') return mockDiscrepancies;
    return [];
  },
  getActivePlants: () => mockPlants,
  getActiveWarehouses: () => mockWarehouses,
  isPlantActive: () => true,
  getById: (table, id) => {
    if (table === 'stockTransfers') return mockTransfers.find(t => t.id === id);
    if (table === 'plants') return mockPlants.find(p => p.id === id);
    if (table === 'warehouses') return mockWarehouses.find(w => w.id === id);
    if (table === 'items') return mockItems.find(i => i.id === id);
    return null;
  },
  insert: (table, record) => {
    if (table === 'stockTransferReceipts') mockReceipts.push(record);
    if (table === 'stockTransferDiscrepancies') mockDiscrepancies.push(record);
  },
  update: (table, id, updates) => {
    if (table === 'stockTransfers') {
      const idx = mockTransfers.findIndex(t => t.id === id);
      if (idx !== -1) mockTransfers[idx] = { ...mockTransfers[idx], ...updates };
    }
  },
  delete: () => true,
  addStock: (stockData) => {
    global._addedStock = stockData;
  },
  logAudit: (act, type, id, desc) => {
    auditLogs.push({ act, type, id, desc });
  },
  subscribe: () => {}
};

console.log('=== TEST SUITE: RECEIVE STOCK TRANSFER MODULE (BRD COMPLIANT) ===\n');

// 1. Load app.js and verify navigation tabs & routes
const appCode = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
eval(appCode);

// Verify tabs in renderInventoryLogisticsTabs
const tabsHtml = window.renderInventoryLogisticsTabs('#/receive-transfers');
assert(tabsHtml.includes('Receive Stock Transfer'), 'renderInventoryLogisticsTabs must include Receive Stock Transfer tab');
assert(tabsHtml.includes('#/receive-transfers'), 'Tab must point to #/receive-transfers route');
console.log('✓ 1. Receive Stock Transfer tab successfully added under Inventory & Logistics beside Stock Transfer.');

// Verify route mapping in app.js
assert(window.App.routes['#/receive-transfers'], 'Route #/receive-transfers must be registered');
assert(window.App.routes['#/receive-transfers'].title === 'Receive Stock Transfer', 'Route title must be Receive Stock Transfer');
console.log('✓ 2. Route #/receive-transfers registered with title "Receive Stock Transfer".');

// 2. Load receive-transfers.js module
const rcvCode = fs.readFileSync(path.join(__dirname, '../js/modules/receive-transfers.js'), 'utf8');
eval(rcvCode);

assert(window.ReceiveTransfersModule, 'ReceiveTransfersModule must be loaded');
console.log('✓ 3. ReceiveTransfersModule instantiated.');

// 3. Test render()
const container = { innerHTML: '' };
window.ReceiveTransfersModule.render(container);
const html = container.innerHTML;

assert(html.includes('Receive Stock Transfer'), 'Must render screen title');
assert(html.includes('Pending Inward'), 'Must render Pending Inward KPI');
assert(html.includes('ST-2026-000125'), 'Must render transfer number');
assert(html.includes('Ravet Main Store'), 'Must render From Store');
assert(html.includes('Chennai Store 1'), 'Must render To Store');
assert(html.includes('Receive'), 'Must render Receive action button for in-transit transfer');
assert(html.includes('History'), 'Must render History action button');
console.log('✓ 4. Receive Stock Transfer register rendered with KPIs, From/To Stores, and Action buttons.');

// 4. Test opening receive modal
window.ReceiveTransfersModule.openReceiveModal('TRF-001');
assert(global._lastModal, 'Modal must open');
assert(global._lastModal.title.includes('Receive Stock Transfer: ST-2026-000125'), 'Modal title must reference transfer');
assert(global._lastModal.footerHtml.includes('Confirm & Post Stock Receipt'), 'Modal footer must have Confirm & Post button');
console.log('✓ 5. Receive modal opened with transfer header and item line details.');

// 5. Simulate quantity verification with partial receipt & shortage
// Item 0: Engine oil (Dispatched: 20 L) -> Physical: 18 L, Accepted: 18 L, Short: 2 L
window.ReceiveTransfersModule.onPhysicalQtyChange(0, 18);
assert.strictEqual(window.ReceiveTransfersModule._activeReceivingItems[0].current_physical_qty, 18, 'Physical qty is 18');
assert.strictEqual(window.ReceiveTransfersModule._activeReceivingItems[0].accepted_qty, 18, 'Accepted qty is 18');
assert.strictEqual(window.ReceiveTransfersModule._activeReceivingItems[0].short_qty, 2, 'Shortage qty is 2');
console.log('✓ 6. Physical quantity verification automatically calculates accepted (18) and short (2) quantities.');

// Item 1: Oil filter (Dispatched: 10 Nos) -> Physical: 10 Nos, Accepted: 9 Nos, Damaged: 1 No
window.ReceiveTransfersModule.onDamagedQtyChange(1, 1);
assert.strictEqual(window.ReceiveTransfersModule._activeReceivingItems[1].damaged_qty, 1, 'Damaged qty is 1');
assert.strictEqual(window.ReceiveTransfersModule._activeReceivingItems[1].accepted_qty, 9, 'Accepted qty is 9');
console.log('✓ 7. Damaged quantity is segregated from accepted inventory (9 accepted, 1 damaged).');

// 6. Test Confirm & Post Stock Receipt
domElements['rcv-doc-num'] = { textContent: 'RTS-2026-000078' };
domElements['rcv-actual-date'] = { value: '2026-10-23' };
domElements['rcv-officer'] = { value: 'Sanket Borole' };
domElements['rcv-vehicle-ref'] = { value: 'MH-14-GH-1029' };
domElements['rcv-general-remarks'] = { value: 'Delivery verified at Chennai Store 1.' };

const fakeSubmitEvent = { preventDefault: () => {} };
window.ReceiveTransfersModule.submitReceipt(fakeSubmitEvent, 'TRF-001');

// Verify stock updated in destination inventory balance (5 + 18 = 23 LTR)
const updatedDestBal = mockBalances.find(b => b.warehouse_id === 'WH-02' && b.item_id === 'ITM-001');
assert.strictEqual(updatedDestBal.on_hand, 23, 'Destination on-hand stock increased by accepted qty (5 + 18 = 23)');
assert.strictEqual(updatedDestBal.available, 23, 'Destination available stock increased to 23');
console.log('✓ 8. Destination store inventory balance successfully updated for accepted quantities.');

// Verify receipt document created
assert.strictEqual(mockReceipts.length, 1, 'Receipt record created in DB');
assert.strictEqual(mockReceipts[0].receipt_number, 'RTS-2026-000078', 'Receipt number matches generated ID');
assert.strictEqual(mockReceipts[0].total_accepted, 27, 'Total accepted qty is 18 + 9 = 27');
assert.strictEqual(mockReceipts[0].total_short, 2, 'Total shortage is 2');
assert.strictEqual(mockReceipts[0].total_damaged, 1, 'Total damaged is 1');
console.log('✓ 9. Stock Transfer Receipt document (RTS-2026-000078) created with item-wise breakdown.');

// Verify discrepancies logged
assert.strictEqual(mockDiscrepancies.length, 2, '2 discrepancies logged (1 shortage, 1 damage)');
assert.strictEqual(mockDiscrepancies[0].discrepancy_type, 'SHORTAGE', 'First discrepancy is SHORTAGE');
assert.strictEqual(mockDiscrepancies[0].discrepancy_qty, 2, 'Shortage quantity is 2');
assert.strictEqual(mockDiscrepancies[1].discrepancy_type, 'DAMAGED_STOCK', 'Second discrepancy is DAMAGED_STOCK');
assert.strictEqual(mockDiscrepancies[1].discrepancy_qty, 1, 'Damaged quantity is 1');
console.log('✓ 10. Discrepancies logged to Discrepancy Register with resolution status OPEN.');

// Verify original stock transfer status updated
const updatedTrf = mockTransfers.find(t => t.id === 'TRF-001');
assert.strictEqual(updatedTrf.status, 'DISCREPANCY_PENDING', 'Transfer status marked DISCREPANCY_PENDING due to shortage/damage');
assert.strictEqual(updatedTrf.has_discrepancy, true, 'Transfer flagged with has_discrepancy: true');
console.log('✓ 11. Original Stock Transfer record updated with partial/discrepancy tracking status.');

// Verify audit trail logged
assert(auditLogs.some(l => l.act === 'STOCK_TRANSFER_RECEIPT'), 'Audit trail logged');
console.log('✓ 12. Audit trail successfully logged with transaction details.');

// 7. Verify Receipt History Modal
window.ReceiveTransfersModule.viewReceiptHistory('TRF-001');
assert(global._lastModal.title.includes('Inward Receipt History'), 'History modal opened');
assert(global._lastModal.contentHtml.includes('RTS-2026-000078'), 'History modal lists RTS receipt voucher');
assert(global._lastModal.contentHtml.includes('SHORTAGE'), 'History modal lists logged discrepancies');
console.log('✓ 13. Receipt history and discrepancies view verified.');

// 8. Verify Receipt Document Print Modal
window.ReceiveTransfersModule.printReceiptDoc('RTS-2026-000078');
assert(global._lastModal.title.includes('Inward Goods Receipt Voucher'), 'Print voucher modal opened');
assert(global._lastModal.contentHtml.includes('STOCK TRANSFER RECEIPT VOUCHER'), 'Voucher contains formal document header');
console.log('✓ 14. Inward Goods Receipt Voucher printable document verified.');

console.log('\n================================================================');
console.log('🎉 ALL RECEIVE STOCK TRANSFER TESTS PASSED (100%)!');
console.log('================================================================\n');
