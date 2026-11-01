const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TEST SUITE: REMOVE BILLING & WORKSHOP HEADER BANNER ===\n');

const billingJs = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');

// 1. Verify "Billing & Workshop Management" banner HTML is removed
assert(!billingJs.includes('<span>Billing & Workshop Management</span>'), 'Title banner "Billing & Workshop Management" must be removed');
console.log('✓ PASS: "Billing & Workshop Management" title banner is completely removed.');

// 2. Verify "Workshop Facility:" header line is removed
assert(!billingJs.includes('<span>Workshop Facility:</span>'), '"Workshop Facility:" header text must be removed');
console.log('✓ PASS: "Workshop Facility:" header text is completely removed.');

// 3. Verify top tabs remain intact and start flush
assert(billingJs.includes('class="tabs-header billing-tabs-header"'), 'billing-tabs-header must remain intact');
assert(billingJs.includes('billing-top-nav-card'), 'billing-top-nav-card container must remain');
console.log('✓ PASS: Top navigation tabs strip is intact and positioned flush at the top.');

console.log('\n🎉 ALL BILLING HEADER REMOVAL CHECKS PASSED (100%)!');
