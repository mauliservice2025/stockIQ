const fs = require('fs');
const assert = require('assert');

global.window = {
  location: { hash: '#/item-master' },
  DB: {
    data: { services: [] },
    getAll: () => [],
    saveData: () => {}
  },
  State: {
    hasPermission: () => true,
    currentPlantId: 'MSC-01',
    showToast: () => {}
  },
  PaginationHelper: {
    paginate: (items) => ({ items, totalRecords: items.length, totalPages: 1, currentPage: 1, pageSize: 10 }),
    render: () => ''
  }
};

const mockContainer = { innerHTML: '' };
global.document = {
  getElementById: (id) => {
    if (id === 'view-container') return mockContainer;
    if (id === 'page-top-bar') return { style: { setProperty: () => {}, removeProperty: () => {} }, classList: { add: () => {}, remove: () => {} } };
    return null;
  },
  querySelector: () => null
};

eval(fs.readFileSync('js/modules/store-inventory.js', 'utf8'));

window.StoreInventoryModule.render(mockContainer);

// Verify tabs in the tabs-header
const tabsHeader = mockContainer.innerHTML.substring(0, mockContainer.innerHTML.indexOf('store-inventory-subview-container'));

console.log('--- Rendered Tabs in Item Master Setup ---');
const regex = /<span>([^<]+)<\/span>/g;
let match;
const tabLabels = [];
while ((match = regex.exec(tabsHeader)) !== null) {
  tabLabels.push(match[1].trim());
}
console.log('Tabs:', tabLabels);

// Verify Stock Transfers is NOT in the Item Setup tabs!
assert(!tabLabels.includes('Stock Transfers'), 'Stock Transfers tab must NOT exist in Item Setup masters!');
assert(!tabLabels.includes('Stock Transfer'), 'Stock Transfer tab must NOT exist in Item Setup masters!');
console.log('✓ PASS: Stock Transfers tab successfully removed from Item Setup Masters list.');

// Verify index.html sidebar
const indexHtml = fs.readFileSync('index.html', 'utf8');
assert(!indexHtml.includes('href="#/stock-transfers"'), 'index.html must not contain link to #/stock-transfers');
console.log('✓ PASS: #/stock-transfers sidebar link removed from index.html.');

// Verify PostgreSQL
const { query } = require('../database/pg');
query("SELECT * FROM role_permissions WHERE perm_code = 'STORE_TX_STOCK_TRANSFER'").then(res => {
  assert(res.rows.length === 0, 'PostgreSQL role_permissions must have 0 rows for STORE_TX_STOCK_TRANSFER');
  console.log('✓ PASS: PostgreSQL role_permissions has 0 records for STORE_TX_STOCK_TRANSFER.');
  return query("SELECT * FROM permissions WHERE id = 'PERM-STORE-XFER' OR perm_code = 'STORE_TX_STOCK_TRANSFER'");
}).then(res => {
  assert(res.rows.length === 0, 'PostgreSQL permissions must have 0 rows for STORE_TX_STOCK_TRANSFER / PERM-STORE-XFER');
  console.log('✓ PASS: PostgreSQL permissions has 0 records for STORE_TX_STOCK_TRANSFER / PERM-STORE-XFER.');
  console.log('\n🎉 ALL REMOVAL VERIFICATIONS PASSED (100%)!');
  process.exit(0);
}).catch(err => {
  console.error('Error in PG check:', err);
  process.exit(1);
});
