const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TEST SUITE: REMOVE NEXT SERVICING DUE PILL FROM FINAL BILL BOTTOM BAR ===\n');

const billingJs = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');

// 1. Verify bottom bar pill is removed
assert(!billingJs.includes('<span style="color: var(--text-muted); font-size: 9.5px; font-weight: 700; text-transform: uppercase;">Next Servicing Due:</span>'), 'Bottom bar Next Servicing Due pill must be removed');
assert(!billingJs.includes('<span style="color: var(--text-muted); font-size: 9.5px; font-weight: 700; text-transform: uppercase;">Next Servicing after:</span>'), 'Bottom bar Next Servicing after KM pill must be removed');
console.log('✓ PASS: Bottom bar Next Servicing Due & After KM pill successfully removed.');

// 2. Verify top details grid still has the Next Servicing fields
assert(billingJs.includes('NEXT SERVICING DUE DATE'), 'Top details grid must retain NEXT SERVICING DUE DATE');
assert(billingJs.includes('NEXT SERVICING AFTER KM'), 'Top details grid must retain NEXT SERVICING AFTER KM');
console.log('✓ PASS: Top Customer & Final Bill details grid retains servicing indicators.');

console.log('\n🎉 ALL TESTS PASSED (100%)!');
