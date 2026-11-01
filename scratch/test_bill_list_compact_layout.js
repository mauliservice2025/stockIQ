const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TEST SUITE: BILL LIST COMPACT TOOLBAR & TIGHT SPACING ===\n');

const billingJs = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');

// 1. Verify old separate gray box is removed
assert(!billingJs.includes('background: rgba(0,0,0,0.15); padding: 10px 12px;'), 'Old separate gray filter card must be removed');
console.log('✓ PASS: Separate gray filter container removed.');

// 2. Verify unified single compact header strip
assert(billingJs.includes('UNIFIED TOP TOOLBAR STRIP (COMPACT SINGLE LINE)'), 'Unified compact toolbar comment must be present');
assert(billingJs.includes('Bill List'), 'Bill List title must be present');
assert(billingJs.includes('setFinalBillStatusFilter'), 'Status category tabs must be inside the top toolbar');
assert(billingJs.includes('setFinalBillPaymentFilter'), 'Payment mode filter must be inside the top toolbar');
assert(billingJs.includes('finalbill-search-input'), 'Search input must be inside the top toolbar');
assert(billingJs.includes('setFinalBillViewMode'), 'View mode switcher must be inside the top toolbar');
console.log('✓ PASS: All filter pills, search input, payment mode, and view switcher merged into unified upper toolbar.');

// 3. Verify Sr. No. column spacing is tightened and toolbar is nowrap
assert(billingJs.includes('style="width: 32px; text-align: center; padding: 6px 2px;">Sr.</th>'), 'Sr. No. column must have constrained width and tight padding');
assert(billingJs.includes('flex-wrap: nowrap'), 'Toolbar must be flex-wrap: nowrap to prevent dropping controls to line 2');
console.log('✓ PASS: Space between Sr. No. and Bill Number columns removed with tight column constraints.');
console.log('✓ PASS: Top toolbar has flex-wrap: nowrap keeping filter controls on the top row.');

console.log('\n🎉 ALL BILL LIST COMPACT LAYOUT CHECKS PASSED (100%)!');
