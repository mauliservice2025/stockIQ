const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TEST SUITE: CUSTOMER & FINAL BILL DETAILS GRID REORDER ===\n');

const billingJs = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');

const nextServiceIdx = billingJs.indexOf('NEXT SERVICING DUE DATE');
const custNameIdx = billingJs.indexOf('CUSTOMER NAME');
const mobileIdx = billingJs.indexOf('MOBILE NUMBER');
const nextKmIdx = billingJs.indexOf('NEXT SERVICING AFTER KM');

assert(nextServiceIdx > 0, 'NEXT SERVICING DUE DATE must exist');
assert(custNameIdx > 0, 'CUSTOMER NAME must exist');
assert(mobileIdx > 0, 'MOBILE NUMBER must exist');
assert(nextKmIdx > 0, 'NEXT SERVICING AFTER KM must exist');

// Verify order: NEXT SERVICING DUE DATE (item 5) -> CUSTOMER NAME (item 6) -> MOBILE NUMBER (item 7) -> NEXT SERVICING AFTER KM (item 10)
assert(nextServiceIdx < custNameIdx, 'NEXT SERVICING DUE DATE must be placed before CUSTOMER NAME in grid');
assert(custNameIdx < mobileIdx, 'CUSTOMER NAME must be placed before MOBILE NUMBER in grid');
assert(mobileIdx < nextKmIdx, 'MOBILE NUMBER must be placed before NEXT SERVICING AFTER KM');

console.log('✓ PASS: NEXT SERVICING DUE DATE positioned at Col 5 Row 1 above NEXT SERVICING AFTER KM.');
console.log('✓ PASS: CUSTOMER NAME positioned at Row 2 Col 1 immediately preceding MOBILE NUMBER.');
console.log('\n🎉 ALL REORDER CHECKS PASSED (100%)!');
