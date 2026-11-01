const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TEST SUITE: REMOVE BILL LIST EXTRAS (SUBTITLE & BUTTONS) ===\n');

const billingJs = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');

// 1. Verify subtitle is removed
assert(!billingJs.includes('Automated settlement tracking'), 'Subtitle "Automated settlement tracking" must be removed');
assert(!billingJs.includes('16-point compliance view'), 'Text "16-point compliance view" must be removed');
console.log('✓ PASS: Automated settlement tracking subtitle completely removed.');

// 2. Verify Customer Billing Workspace button is removed from Bill List
assert(!billingJs.includes('← Customer Billing Workspace'), 'Button "← Customer Billing Workspace" must be removed');
console.log('✓ PASS: "← Customer Billing Workspace" button removed from Bill List.');

// 3. Verify + Generate New Bill button is removed from Bill List
assert(!billingJs.includes('+ Generate New Bill'), 'Button "+ Generate New Bill" must be removed from Bill List');
console.log('✓ PASS: "+ Generate New Bill" button removed from Bill List.');

// 4. Verify title is Bill List and View Mode Switcher remains
assert(billingJs.includes('<span>Bill List</span>'), 'Title should be cleanly formatted as "Bill List"');
assert(billingJs.includes('setFinalBillViewMode'), 'View mode switcher (Table / Card) must remain intact');
console.log('✓ PASS: Bill List title clean and view mode switcher preserved.');

console.log('\n🎉 ALL BILL LIST EXTRA REMOVAL CHECKS PASSED (100%)!');
