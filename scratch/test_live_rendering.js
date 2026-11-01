const fs = require('fs');
const path = require('path');

// Simulate basic browser globals
global.window = global;
global.document = {
  getElementById: (id) => null,
  activeElement: null
};

// Load PaginationHelper
const paginationCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'pagination.js'), 'utf8');
eval(paginationCode);

console.log('=== TESTING REAL-WORLD PAGINATION SCENARIOS ===\n');

// Test 1: 58 Subcategories in Item Setup Master
const subcategories = Array.from({ length: 58 }, (_, i) => ({
  id: `SUB-${i + 1}`,
  code: `SUB-CODE-${i + 1}`,
  name: `Sub Category ${i + 1}`
}));

let paged = window.PaginationHelper.paginate(subcategories, 'itemSubcategories');
console.log(`Test 1 (Default page size 10):`);
console.log(`  Total records: ${paged.totalRecords}`);
console.log(`  Total pages: ${paged.totalPages}`);
console.log(`  Current page: ${paged.currentPage}`);
console.log(`  Items on page 1: ${paged.items.length} (first: ${paged.items[0].name}, last: ${paged.items[paged.items.length - 1].name})`);
if (paged.items.length !== 10) throw new Error('Expected 10 items on page 1');

// Page 2
window.PaginationHelper.setPage('itemSubcategories', 2);
paged = window.PaginationHelper.paginate(subcategories, 'itemSubcategories');
console.log(`\nTest 2 (Page 2):`);
console.log(`  Current page: ${paged.currentPage}`);
console.log(`  Items on page 2: ${paged.items.length} (first: ${paged.items[0].name}, last: ${paged.items[paged.items.length - 1].name})`);
if (paged.items[0].name !== 'Sub Category 11') throw new Error('Expected item 11 on page 2');

// Change page size to 25
window.PaginationHelper.setPageSize('itemSubcategories', 25);
paged = window.PaginationHelper.paginate(subcategories, 'itemSubcategories');
console.log(`\nTest 3 (Page size 25):`);
console.log(`  Page size: ${paged.pageSize}`);
console.log(`  Total pages: ${paged.totalPages}`);
console.log(`  Current page: ${paged.currentPage}`);
console.log(`  Items on page 1: ${paged.items.length}`);
if (paged.items.length !== 25) throw new Error('Expected 25 items on page size 25');

// Render HTML pagination bar
const renderedHtml = window.PaginationHelper.render({
  totalRecords: paged.totalRecords,
  currentPage: paged.currentPage,
  pageSize: paged.pageSize,
  onPageChange: "window.ItemSetupModule.setPage(%p%, 'itemSubcategories')",
  onPageSizeChange: "window.ItemSetupModule.setPageSize(%s%, 'itemSubcategories')"
});

if (!renderedHtml.includes('user-pagination-bar')) throw new Error('Render output missing user-pagination-bar');
if (!renderedHtml.includes('Showing') || !renderedHtml.includes('entries')) throw new Error('Render output missing entry counts');
if (!renderedHtml.includes('>1<') || !renderedHtml.includes('>25<') || !renderedHtml.includes('>58<')) throw new Error('Render output missing count values');
if (!renderedHtml.includes('value="10"')) throw new Error('Missing page size option 10');
if (!renderedHtml.includes('value="25" selected')) throw new Error('Missing selected page size option 25');
if (!renderedHtml.includes('value="50"')) throw new Error('Missing page size option 50');
if (!renderedHtml.includes('value="100"')) throw new Error('Missing page size option 100');

console.log('\n✅ Rendered HTML Pagination Bar successfully generated:');
console.log(renderedHtml);

console.log('\n🎉 ALL INTEGRATION TESTS PASSED! 🎉');
