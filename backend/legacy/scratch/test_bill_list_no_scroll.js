const fs = require('fs');
const assert = require('assert');

const billingJs = fs.readFileSync('d:/Projects/ISCM/js/modules/billing.js', 'utf8');

// 1. Check counter badge removed
assert(!billingJs.includes('${filtered.length} of ${allBills.length} Bills'), '4 of 4 Bills badge must be removed');
assert(billingJs.includes('<span>Bill List</span>'), 'Bill List title must remain');

// 2. Check toolbar spacing and border removed from Bill List toolbar
assert(!billingJs.includes('padding-bottom: 8px; border-bottom: 1px solid var(--border-subtle);'), 'Old Bill List toolbar border-bottom and padding-bottom must be removed');

// 3. Check table min-width 1380px removed
assert(!billingJs.includes('min-width: 1380px;'), 'min-width: 1380px must be removed to prevent horizontal scrolling');
assert(billingJs.includes('<!-- TABLE VIEW (COMPACT RESPONSIVE FIT-TO-SCREEN DATA TABLE) -->'), 'Compact table comment must be present');

// 4. Check compact headers
assert(billingJs.includes('>Sr.</th>'), 'Sr. header present');
assert(billingJs.includes('>Bill Number</th>'), 'Bill Number header present');
assert(billingJs.includes('>Bill Date</th>'), 'Bill Date header present');
assert(billingJs.includes('>Job Card No.</th>'), 'Job Card No. header present');
assert(billingJs.includes('>Estimate No.</th>'), 'Estimate No. header present');
assert(billingJs.includes('>CIN</th>'), 'CIN header present');
assert(billingJs.includes('>Customer Name</th>'), 'Customer Name header present');
assert(billingJs.includes('>Vehicle No.</th>'), 'Vehicle No. header present');
assert(billingJs.includes('>Bill Amt</th>'), 'Bill Amt header present');
assert(billingJs.includes('>Discount</th>'), 'Discount header present');
assert(billingJs.includes('>Tax Amt</th>'), 'Tax Amt header present');
assert(billingJs.includes('>Net Bill</th>'), 'Net Bill header present');
assert(billingJs.includes('>Paid</th>'), 'Paid header present');
assert(billingJs.includes('>Balance</th>'), 'Balance header present');
assert(billingJs.includes('>Status</th>'), 'Status header present');
assert(billingJs.includes('>Mode</th>'), 'Mode header present');
assert(billingJs.includes('>Action</th>'), 'Action header present');

console.log('✓ All Bill List fit-to-screen & UI clean-up tests passed successfully!');
