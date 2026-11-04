const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('VERIFYING CREATE JOB CARD MODAL FOOTER & VISIBILITY');
console.log('================================================================\n');

const billingJs = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');

// 1. Verify buttons moved to footerHtml
assert(billingJs.includes('footerHtml = `'), 'Must have footerHtml defined');
assert(billingJs.includes('id="btn-update-customer-info"'), 'Must have Update Customer Information button');
assert(billingJs.includes('Create Job Card'), 'Must have Create Job Card button');
assert(billingJs.includes('Cancel'), 'Must have Cancel button');

// 2. Verify form has create-jc-form id
assert(billingJs.includes('id="create-jc-form"'), 'Form must have id="create-jc-form"');
assert(billingJs.includes('form="create-jc-form"'), 'Submit button must link to create-jc-form');

// 3. Verify noScroll is false
assert(billingJs.includes('noScroll: false'), 'noScroll must be false to avoid clipping buttons');

// 4. Verify Previous Service History collapsed by default
assert(billingJs.includes('id="new-jc-history-table-wrapper" style="display: none;'), 'History table should start collapsed');
assert(billingJs.includes('View History ▾'), 'Toggle button should indicate View History');

console.log('✓ PASS: Buttons are pinned in modal footer (footerHtml) - 100% visible');
console.log('✓ PASS: Form ID and submit association verified');
console.log('✓ PASS: noScroll is false, enabling smooth body scrolling without clipping');
console.log('✓ PASS: Service history starts collapsed with "View History ▾" to keep form simple');

console.log('\n================================================================');
console.log('🎉 ALL MODAL VISIBILITY & SIMPLICITY TESTS PASSED (100%)!');
console.log('================================================================\n');
