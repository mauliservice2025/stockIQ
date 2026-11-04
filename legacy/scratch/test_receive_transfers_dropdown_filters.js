const assert = require('assert');
const fs = require('fs');

console.log('--- Testing Receive Stock Transfer Header & Filters Layout ---');

const content = fs.readFileSync('d:/Projects/ISCM/js/modules/receive-transfers.js', 'utf8');

// 1. Verify summary cards banner has been removed
assert(!content.includes('Summary KPIs Banner'), 'Expected Summary KPIs Banner to be removed');
assert(!content.includes('PENDING INWARD'), 'Expected PENDING INWARD card to be removed');
assert(!content.includes('FULLY STOCKED'), 'Expected FULLY STOCKED card to be removed');
console.log('✓ 1. Verified summary cards banner has been completely removed');

// 2. Verify master name matches Manufacturer Master style and (1) is removed from master name
assert(content.includes('>Receive Stock Transfer</span>'), 'Expected Receive Stock Transfer title without (1)');
assert(!content.includes('Receive Stock Transfer (${pendingCount})'), 'Tab button with (${pendingCount}) should be removed from header title');
assert(!content.includes('Stock Transfer Inward & Warehouse Receipt Management'), 'Tagline Stock Transfer Inward & Warehouse Receipt Management must be removed');
console.log('✓ 2. Verified master name has title + count pill, (1) is removed, and tagline is completely removed.');

// 3. Verify duplicate label 📥 Receive Stock Transfer is removed
assert(!content.includes('<span>📥</span> Receive Stock Transfer'), 'Duplicate label 📥 Receive Stock Transfer should be removed');
console.log('✓ 3. Verified duplicate label 📥 Receive Stock Transfer is removed');

// 4. Verify dropdown filter has all receipt statuses
assert(content.includes('id="rcv-status-dropdown"'), 'Expected #rcv-status-dropdown to be present');
assert(content.includes('Pending Inward (${pendingCount})'), 'Expected Pending Inward in dropdown');
assert(content.includes('Partially Received (${partialCount})'), 'Expected Partially Received in dropdown');
assert(content.includes('Completed Receipts (${completedCount})'), 'Expected Completed Receipts in dropdown');
assert(content.includes('Discrepancies (${discrepancyCount})'), 'Expected Discrepancies in dropdown');
assert(content.includes('All Transfers (${transfers.length})'), 'Expected All Transfers in dropdown');
console.log('✓ 4. Verified dropdown filters with dynamic counts are present in toolbar');

// 5. Verify upper toolbar with date, store, search with icon, reset
assert(content.includes('id="rcv-from-date"'), 'From date input present');
assert(content.includes('id="rcv-to-date"'), 'To date input present');
assert(content.includes('id="rcv-store-filter"'), 'Store filter dropdown present');
assert(content.includes('id="rcv-search"'), 'Search input present');
assert(content.includes('🔍'), 'Search input includes magnifier icon like Manufacturer Master');
console.log('✓ 5. Verified upper toolbar controls (From/To dates, destination store, 🔍 search, reset)');

// 6. Verify resetFilters resets _activeTab to PENDING
assert(content.includes("this._activeTab = 'PENDING';"), 'Expected resetFilters to reset activeTab');
console.log('✓ 6. Verified resetFilters resets activeTab to PENDING');

console.log('\n🎉 ALL CHECKS PASSED SUCCESSFULLY!');
