const fs = require('fs');
const assert = require('assert');

const billingJs = fs.readFileSync('d:/Projects/ISCM/js/modules/billing.js', 'utf8').replace(/\r\n/g, '\n');

// 1. Check duplicate button removed from header
assert(!billingJs.includes('title="Generate new bill from eligible Estimate"'), 'Old separate + New Bill button in header must be removed');

// 2. Check remaining + New Bill button has primary color code
assert(billingJs.includes('class="btn btn-primary btn-sm"'), 'Must have btn-primary');
assert(billingJs.includes('onclick="window.BillingModule.showSelectBillModal()"'), 'Must call showSelectBillModal');
assert(billingJs.includes('<span>📑 + New Bill (${billingQueue.length})</span>'), 'Must display + New Bill with queue count');

// 3. Ensure no second + New Bill button in header
const headerMatch = billingJs.match(/<!-- Right Header Actions -->[\s\S]*?<!-- COMPACT CUSTOMER/);
assert(headerMatch, 'Header actions section found');
const newBillMatches = headerMatch[0].match(/\+ New Bill/g);
assert.strictEqual(newBillMatches.length, 1, 'Only exactly one + New Bill button in header');

console.log('✓ Single primary + New Bill button verification passed successfully!');
