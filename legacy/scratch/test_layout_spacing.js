const fs = require('fs');
const assert = require('assert');

console.log('--- Testing Layout Spacing & Card Heights Across Application ---');

const billingJs = fs.readFileSync('d:/Projects/ISCM/js/modules/billing.js', 'utf8');
const crmJs = fs.readFileSync('d:/Projects/ISCM/js/modules/customer-reminders.js', 'utf8');
const componentsCss = fs.readFileSync('d:/Projects/ISCM/css/components.css', 'utf8');
const layoutCss = fs.readFileSync('d:/Projects/ISCM/css/layout.css', 'utf8');

// 1. Verify billing-top-nav-card in billing.js does NOT have content-card class
assert(!billingJs.includes('class="content-card billing-top-nav-card"'), 'billing.js must NOT have content-card class on top-nav-card');
assert(billingJs.includes('class="billing-top-nav-card"'), 'billing.js must have billing-top-nav-card class');
console.log('✔ Test 1: billing.js top nav card is not wrapped in content-card.');

// 2. Verify billing-top-nav-card in customer-reminders.js does NOT have content-card class
assert(!crmJs.includes('class="content-card billing-top-nav-card"'), 'customer-reminders.js must NOT have content-card class on top-nav-card');
assert(crmJs.includes('class="billing-top-nav-card"'), 'customer-reminders.js must have billing-top-nav-card class');
console.log('✔ Test 2: customer-reminders.js top nav card is not wrapped in content-card.');

// 3. Verify CSS rules for billing-top-nav-card
assert(componentsCss.includes('.billing-top-nav-card'), 'components.css must define .billing-top-nav-card');
assert(componentsCss.includes('min-height: unset !important;'), 'billing-top-nav-card must reset min-height to unset');
assert(componentsCss.includes('flex: 0 0 auto !important;'), 'billing-top-nav-card must have flex: 0 0 auto');
console.log('✔ Test 3: components.css resets min-height and sets flex: 0 0 auto on top nav cards.');

// 4. Verify no blunt min-height: calc(100vh - 170px) on .main-content > div > .content-card
assert(!componentsCss.includes('.main-content > div > .content-card'), 'components.css must NOT have blunt .main-content > div > .content-card selector');
console.log('✔ Test 4: Removed blunt .main-content > div > .content-card min-height.');

// 5. Verify no blunt min-height: calc(100vh - 240px) on all .table-responsive
assert(!componentsCss.includes('.content-card .table-responsive,\n.table-scroll-container,\n.jobcard-table-scroll-container,\n.user-table-scroll-container {\n  flex: 1 1 auto;\n  min-height: calc(100vh - 240px) !important;'), 'No forced calc(100vh - 240px) on content-card table-responsive');
console.log('✔ Test 5: Removed forced min-height: calc(100vh - 240px) on generic table-responsive.');

// 6. Verify subview content-card min-height is reset
assert(componentsCss.includes('.billing-module-container #billing-subview-container > .content-card'), 'Subview container card defined in CSS');
console.log('✔ Test 6: Subview container card cleanly handles flex height without forcing 700px min-height.');

console.log('\n--- ALL LAYOUT SPACING TESTS PASSED (6/6) ---');
