const assert = require('assert');
const PaginationHelper = require('../js/pagination.js');

console.log('Testing Universal PaginationHelper...');

// Test 1: Initialization & Defaults
const state = PaginationHelper.getState('testList');
assert.strictEqual(state.currentPage, 1);
assert.strictEqual(state.pageSize, 10);
console.log('✓ Default state initialization passed (page 1, size 10)');

// Test 2: Paginate array
const testData = Array.from({ length: 45 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }));
const paged1 = PaginationHelper.paginate(testData, 'testList');
assert.strictEqual(paged1.totalRecords, 45);
assert.strictEqual(paged1.totalPages, 5);
assert.strictEqual(paged1.currentPage, 1);
assert.strictEqual(paged1.items.length, 10);
assert.strictEqual(paged1.items[0].id, 1);
assert.strictEqual(paged1.items[9].id, 10);
console.log('✓ Paginate first page passed (10 items)');

// Test 3: Set page
PaginationHelper.setPage('testList', 3);
const paged3 = PaginationHelper.paginate(testData, 'testList');
assert.strictEqual(paged3.currentPage, 3);
assert.strictEqual(paged3.items.length, 10);
assert.strictEqual(paged3.items[0].id, 21);
console.log('✓ Navigate to page 3 passed (items 21-30)');

// Test 4: Set page size
PaginationHelper.setPageSize('testList', 25);
const pagedSize = PaginationHelper.paginate(testData, 'testList');
assert.strictEqual(pagedSize.pageSize, 25);
assert.strictEqual(pagedSize.currentPage, 1);
assert.strictEqual(pagedSize.totalPages, 2);
assert.strictEqual(pagedSize.items.length, 25);
console.log('✓ Page size change to 25 passed');

// Test 5: Render HTML
const html = PaginationHelper.render({
  totalRecords: 45,
  currentPage: 1,
  pageSize: 10,
  key: 'testList'
});
assert(html.includes('class="user-pagination-bar"'), 'Must contain user-pagination-bar');
assert(html.includes('Showing <strong'), 'Must contain showing text');
assert(html.includes('entries'), 'Must contain entries label');
assert(html.includes('pagination-buttons'), 'Must contain pagination buttons');
console.log('✓ Render HTML contains user-pagination-bar and controls');

console.log('\nALL PAGINATION HELPER TESTS PASSED! 🎉');
