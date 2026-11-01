const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Mock browser globals
global.window = global;
global.window.location = { hash: '#/transfers' };
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.window.dispatchEvent = () => {};
global.CustomEvent = class { constructor(type, init) { this.type = type; this.detail = init?.detail; } };
global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };

const createMockEl = (id = '') => ({
  id,
  innerHTML: '',
  value: '',
  style: {},
  classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
  getAttribute(name) { return this[name] || ''; },
  setAttribute() {},
  remove() {},
  querySelectorAll() { return []; }
});

global.document = {
  documentElement: createMockEl('html'),
  getElementById: (id) => createMockEl(id),
  querySelectorAll: () => [],
  addEventListener: () => {}
};

global.State = {
  currentPlantId: 'ALL',
  getCurrentUser: () => ({ name: 'Admin', username: 'admin', email: 'admin@stockiq.com', primary_role: 'ADMIN' }),
  hasPermission: () => true,
  subscribe: () => {},
  showModal: (config) => { global._lastModal = config; },
  showToast: () => {}
};

const mockPlants = [{ id: 'PLANT-01', name: 'Pune Plant', code: 'PUN' }, { id: 'PLANT-02', name: 'Chennai Plant', code: 'CHE' }];
const mockWarehouses = [{ id: 'WH-01', name: 'Main Store' }, { id: 'WH-02', name: 'Finished Goods' }];
const mockTransfers = [
  {
    id: 'TRF-001',
    transfer_number: 'TRF-2026-291',
    source_plant_id: 'PLANT-01',
    dest_plant_id: 'PLANT-02',
    source_warehouse_id: 'WH-01',
    dest_warehouse_id: 'WH-02',
    transporter: 'VRL Logistics Fleet',
    vehicle_no: 'MH-12-PQ-9081',
    dispatched_at: '2026-10-23',
    reason: 'Production schedule rebalancing between plants.',
    status: 'IN_TRANSIT'
  }
];

global.DB = {
  getAll: (table) => {
    if (table === 'stockTransfers') return mockTransfers;
    if (table === 'plants') return mockPlants;
    if (table === 'warehouses') return mockWarehouses;
    return [];
  },
  getActivePlants: () => mockPlants,
  getActiveWarehouses: () => mockWarehouses,
  isPlantActive: () => true,
  getById: (table, id) => {
    if (table === 'stockTransfers') return mockTransfers.find(t => t.id === id);
    if (table === 'plants') return mockPlants.find(p => p.id === id);
    if (table === 'warehouses') return mockWarehouses.find(w => w.id === id);
    return null;
  },
  subscribe: () => {},
  getItemsForFacility: () => []
};

// Load app.js
const appCode = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
eval(appCode);

// Load transfers.js
const trfCode = fs.readFileSync(path.join(__dirname, '../js/modules/transfers.js'), 'utf8');
eval(trfCode);

console.log('=== TEST SUITE: STOCK TRANSFER UI UPDATES ===\n');

const container = { innerHTML: '' };
window.TransfersModule.render(container);

const html = container.innerHTML;

// 1. Verify Card Title is renamed
assert(!html.includes('Inter-Plant & Inter-Warehouse Stock Transfers'), 'Old header text must be removed');
assert(html.includes('Stock Transfer'), 'Card title must be Stock Transfer');
console.log('✓ 1. Card title renamed from "Inter-Plant & Inter-Warehouse Stock Transfers" to "Stock Transfer".');

// 2. Verify sub-module navigation tab is renamed
assert(!html.includes('Inter-Facility Transfers'), 'Inter-Facility Transfers tab must be renamed');
assert(html.includes('Stock Transfer'), 'Tab must be Stock Transfer');
console.log('✓ 2. Navigation tab renamed to "Stock Transfer".');

// 3. Verify filters are on upper side (in card-header)
const headerSection = html.slice(html.indexOf('<div class="card-header"'), html.indexOf('<div class="table-responsive">'));
assert(headerSection.includes('id="trf-search"'), 'Search filter must be inside card-header (upper side)');
assert(headerSection.includes('id="trf-status-filter"'), 'Status dropdown filter must be inside card-header (upper side)');
assert(headerSection.includes('+ Initiate Transfer Request'), '+ Initiate Transfer Request button must be inside card-header');
console.log('✓ 3. Filters moved to upper side inside .card-header alongside + Initiate Transfer Request button.');

// 4. Verify Active Transfers label is removed
assert(!html.includes('Active Transfers:'), 'Active Transfers counter label must be removed');
assert(!html.includes('<div class="toolbar">'), 'Secondary toolbar row must be removed');
console.log('✓ 4. Label "Active Transfers: X" and second toolbar row are removed.');

// 5. Verify modal title, full screen, labels and search button
window.TransfersModule.showCreateModal();
assert(global._lastModal, 'Modal must open');
assert(global._lastModal.title === 'Stock Transfer', 'Modal title must be Stock Transfer');
assert(!global._lastModal.title.includes('Initiate Inter-Facility'), 'Modal title must not have Initiate Inter-Facility');
console.log('✓ 5. Modal title updated to "Stock Transfer" (removed "Initiate Inter-Facility").');

assert(global._lastModal.isFullScreen === true, 'Modal must be full screen');
console.log('✓ 6. Modal configured with isFullScreen: true.');

const modalHtml = global._lastModal.contentHtml;
assert(modalHtml.includes('From Store'), 'Must have From Store label');
assert(modalHtml.includes('To Store'), 'Must have To Store label');
assert(!modalHtml.includes('Source Warehouse'), 'Must not have Source Warehouse label');
assert(!modalHtml.includes('Destination Warehouse'), 'Must not have Destination Warehouse label');
console.log('✓ 7. Labels renamed from Source Warehouse -> From Store and Destination Warehouse -> To Store.');

assert(!modalHtml.includes('trf-search-add-item-btn'), 'Search & Add Items button must be removed');
assert(modalHtml.includes('trf-item-search-query'), 'Must have direct item search input');
assert(modalHtml.includes('addItemToTransferList'), 'Must have add item action');
console.log('✓ 8. Search & Add Items button removed; direct search controls panel visible.');

// 9. Verify Remark field (renamed from Reason, blank default) and Save Stock Transfer button
const footerHtml = global._lastModal.footerHtml || '';
assert(footerHtml.includes('id="new-trf-reason"'), 'Remark input must be in the modal footer');
assert(footerHtml.includes('Remark:'), 'Footer label must be Remark:');
assert(!footerHtml.includes('Reason:'), 'Old Reason: label must be removed');
assert(footerHtml.includes('value=""'), 'Remark text box must be blank by default');
assert(footerHtml.includes('Save Stock Transfer'), 'Button must be named Save Stock Transfer');
assert(!footerHtml.includes('Dispatch Stock Transfer'), 'Dispatch Stock Transfer text must be removed');
console.log('✓ 9. Reason renamed to Remark, input is blank by default, and Save button is pinned downside.');

// 10. Verify spacing trimmed, form-grid margin removed, and table column alignment
assert(!modalHtml.includes('class="form-grid"'), 'Form grid margin-bottom must be removed to eliminate whitespace');
assert(modalHtml.includes('table-layout: fixed'), 'Items table must use table-layout: fixed for symmetric alignment');
assert(global._lastModal.compactHeader === true, 'Modal must use compactHeader');
assert.strictEqual(global._lastModal.bodyPadding, '8px 12px', 'Modal must use tight bodyPadding');
console.log('✓ 10. Unwanted whitespace removed and table columns symmetrically aligned with fixed layout.');

// 11. Verify From Facility and To Facility labels (and removal of Source/Destination Facility)
assert(modalHtml.includes('From Facility'), 'Modal must have From Facility label');
assert(modalHtml.includes('To Facility'), 'Modal must have To Facility label');
assert(!modalHtml.includes('Source Facility'), 'Source Facility label must be replaced');
assert(!modalHtml.includes('Destination Facility'), 'Destination Facility label must be replaced');
console.log('✓ 11. Facility labels renamed to "From Facility" and "To Facility" (removed "Source Facility" and "Destination Facility").');

// 12. Verify removal of clutter: Facility & Store Routing header, Material prefix, SKU in search
assert(!modalHtml.includes('Facility & Store Routing'), '"Facility & Store Routing" header must be removed');
assert(modalHtml.includes('Items to Transfer'), 'Header must be "Items to Transfer"');
assert(!modalHtml.includes('Material Items to Transfer'), '"Material Items to Transfer" must be replaced with "Items to Transfer"');
assert(modalHtml.includes('Item Search (Code / Name)'), 'Search label must be "Item Search (Code / Name)"');
assert(!modalHtml.includes('Item Search (Code / Name, SKU)'), 'SKU must be removed from search label');
console.log('✓ 12. Removed "Facility & Store Routing", "Material" prefix, and "/ SKU" label.');

// 13. Verify real-time batch input and datalist (no hardcoded LOT-STL-2601-A)
assert(!modalHtml.includes('LOT-STL-2601-A'), 'Hardcoded LOT-STL-2601-A batch must be removed');
assert(modalHtml.includes('list="trf-batch-datalist"'), 'Batch input must bind to datalist for real-time batches');
assert(modalHtml.includes('id="trf-batch-datalist"'), 'Datalist must exist for actual batch options');
console.log('✓ 13. Hardcoded LOT-STL-2601-A removed; dynamic batch datalist linked.');

// 14. Verify real-time batch fetching logic
global.DB.getAll = (table) => {
  if (table === 'inventoryBalances') return [
    { warehouse_id: 'WH-01', item_id: 'ITM-01', batch_number: 'BATCH-ACTUAL-2026', available: 50 }
  ];
  if (table === 'goodsReceiptNotes') return [
    { items: [{ item_id: 'ITM-01', batch_number: 'BATCH-GRN-9988', received_qty: 25 }] }
  ];
  return [];
};
const batches = window.TransfersModule.fetchItemBatches({ id: 'ITM-01', code: 'TEST-ITEM' }, 'WH-01');
assert.strictEqual(batches.length, 2, 'Must fetch actual store batch and GRN batch');
assert.strictEqual(batches[0].batch_number, 'BATCH-ACTUAL-2026', 'First batch must be actual store stock batch');
assert.strictEqual(batches[0].available, 50, 'Store batch available quantity must match balance');
assert.strictEqual(batches[1].batch_number, 'BATCH-GRN-9988', 'Second batch must be GRN batch');
// 15. Verify Table Columns: From Facility, From Store, To Facility, To Store, and removal of Transfer Reason
const tableHeadHtml = html.slice(html.indexOf('<thead>'), html.indexOf('</thead>'));
assert(tableHeadHtml.includes('<th>From Facility</th>'), 'Table header must have From Facility');
assert(tableHeadHtml.includes('<th>From Store</th>'), 'Table header must have From Store');
assert(tableHeadHtml.includes('<th>To Facility</th>'), 'Table header must have To Facility');
assert(tableHeadHtml.includes('<th>To Store</th>'), 'Table header must have To Store');
assert(!tableHeadHtml.includes('Source Facility'), 'Table header must not have Source Facility');
assert(!tableHeadHtml.includes('Destination Facility'), 'Table header must not have Destination Facility');
assert(!tableHeadHtml.includes('Transfer Reason'), 'Table header must not have Transfer Reason column');
console.log('✓ 15. Table headers replaced: From Facility, From Store, To Facility, To Store; Transfer Reason column removed.');

// 16. Verify Date filters: From Date & To Date beside Search filter and defaulted to today's date
assert(headerSection.includes('id="trf-from-date"'), 'Header must contain From Date filter input');
assert(headerSection.includes('id="trf-to-date"'), 'Header must contain To Date filter input');
const now = new Date();
const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
assert(headerSection.includes(`id="trf-from-date" class="filter-input" style="height: 32px; font-size: 12px; margin: 0; padding: 2px 8px; width: 130px;" onchange="window.TransfersModule.filterTable()" title="From Date" value="${todayStr}"`), 'From Date must default to today');
assert(headerSection.includes(`id="trf-to-date" class="filter-input" style="height: 32px; font-size: 12px; margin: 0; padding: 2px 8px; width: 130px;" onchange="window.TransfersModule.filterTable()" title="To Date" value="${todayStr}"`), 'To Date must default to today');
console.log(`✓ 16. Date filters (From Date, To Date) default to today's date (${todayStr}).`);

// 17. Verify filterTable date filtering behavior
const mockRows = [
  {
    getAttribute: (attr) => attr === 'data-date' ? '2026-10-23' : attr === 'data-status' ? 'IN_TRANSIT' : 'test',
    style: { display: 'none' }
  },
  {
    getAttribute: (attr) => attr === 'data-date' ? '2026-10-10' : attr === 'data-status' ? 'IN_TRANSIT' : 'test',
    style: { display: '' }
  }
];

document.querySelectorAll = (selector) => {
  if (selector === '#trf-table tbody tr') return mockRows;
  return [];
};
document.getElementById = (id) => {
  if (id === 'trf-search') return { value: '' };
  if (id === 'trf-status-filter') return { value: 'ALL' };
  if (id === 'trf-from-date') return { value: '2026-10-20' };
  if (id === 'trf-to-date') return { value: '2026-10-25' };
  return createMockEl(id);
};

window.TransfersModule.filterTable();
assert.strictEqual(mockRows[0].style.display, '', 'Row on 2026-10-23 is between 2026-10-20 and 2026-10-25 and must be visible');
assert.strictEqual(mockRows[1].style.display, 'none', 'Row on 2026-10-10 is before 2026-10-20 and must be hidden');
console.log('✓ 17. Date filter functionality verified: filters rows accurately by date range.');

// 18. Verify Table Actions: View, Edit, Print, Delete present, and Receive Stock removed
assert(html.includes("viewTransfer('TRF-001')"), 'Table must contain View action');
assert(html.includes("editTransfer('TRF-001')"), 'Table must contain Edit action');
assert(html.includes("printTransfer('TRF-001')"), 'Table must contain Print action');
assert(html.includes("deleteTransfer('TRF-001')"), 'Table must contain Delete action');
assert(!html.includes('Receive Stock →'), 'Receive Stock button must be removed from actions');
console.log('✓ 18. Action column updated: View, Edit, Print, Delete added; Receive Stock removed.');

// 19. Verify editTransfer functionality
window.TransfersModule.editTransfer('TRF-001');
assert(global._lastModal, 'Edit modal must open');
assert(global._lastModal.title.includes('Edit Stock Transfer: TRF-2026-291'), 'Modal title must reflect edit mode');
assert(global._lastModal.footerHtml.includes('Save Stock Transfer'), 'Save button must be present in edit mode');
console.log('✓ 19. editTransfer opens modal with transfer details and Save Stock Transfer button.');

// 20. Verify viewTransfer shows same layout as Edit but read-only (not able to edit)
window.TransfersModule.viewTransfer('TRF-001');
assert(global._lastModal, 'View modal must open');
assert(global._lastModal.title.includes('View Stock Transfer: TRF-2026-291'), 'View title must reflect view mode');
assert(global._lastModal.contentHtml.includes('disabled'), 'Form inputs must be disabled in view mode');
assert(!global._lastModal.contentHtml.includes('trf-search-panel'), 'Search & Add items panel must be hidden in view mode');
assert(!global._lastModal.footerHtml.includes('Save Stock Transfer'), 'Save button must not exist in view mode');
assert(global._lastModal.footerHtml.includes('Close'), 'Close button must be present in view mode');
assert(global._lastModal.footerHtml.includes('Print Pass'), 'Print Pass button must be present in view mode');
console.log('✓ 20. viewTransfer opens exact same modal layout as Edit with disabled inputs, hidden search panel, and Close/Print footer.');

// 21. Verify printTransfer displays print format as per Print Configuration Master
window.TransfersModule.printTransfer('TRF-001');
assert(global._lastModal, 'Print modal must open');
assert(global._lastModal.title.includes('Print Format: TRF-2026-291'), 'Print modal title must reflect Print Format');
assert(global._lastModal.contentHtml.includes('INTER-STORE TRANSFER PASS'), 'Must show document layout per print configuration master');
assert(global._lastModal.footerHtml.includes('Print Now'), 'Must provide Print Now button');
assert(global._lastModal.footerHtml.includes('Document Print Configuration Master'), 'Must indicate generation via Print Configuration Master');
console.log('✓ 21. printTransfer displays print format preview as per Print Configuration Master before printing.');

// 22. Verify deleteTransfer functionality
let deletedId = null;
global.window.confirm = () => true;
global.DB.delete = (table, id) => { deletedId = id; return true; };
window.TransfersModule.deleteTransfer('TRF-001');
assert.strictEqual(deletedId, 'TRF-001', 'deleteTransfer must delete the record via DB.delete');
console.log('✓ 22. deleteTransfer successfully deletes transfer record.');

console.log('\n================================================================');
console.log('🎉 ALL STOCK TRANSFER UI TESTS PASSED (100%)!');
console.log('================================================================\n');
