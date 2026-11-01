const fs = require('fs');
const assert = require('assert');

console.log('--- Verifying Removal of Cards and Gaps/Spaces ---');

const billingCode = fs.readFileSync('d:/Projects/ISCM/js/modules/billing.js', 'utf8');
const cssCode = fs.readFileSync('d:/Projects/ISCM/css/components.css', 'utf8');

// 1. Verify Top-Right Buttons removed from Header Banner
assert(!billingCode.includes('onclick="window.BillingModule.showNewJobCardModal()" title="Create Job Card"'), 'Old top-right New Job Card button should be removed');
assert(!billingCode.includes('onclick="window.BillingModule.showCreateEstimateModal()" title="Create Estimate"'), 'Old top-right New Estimate button should be removed');
assert(!billingCode.includes('onclick="window.BillingModule.showGenerateDraftBillModal()" title="Generate Bill"'), 'Old top-right Quick Draft Bill button should be removed');
console.log('✔ Top-right buttons removed from Billing header banner.');

// 2. Verify Box 2: Billing Module Container and Top Card have zero gap and margin
assert(billingCode.includes('class="billing-module-container" style="display: flex; flex-direction: column; gap: 0;"'), 'Billing container must have gap: 0');
assert(billingCode.includes('billing-top-nav-card'), 'Top nav card class must be present');
assert(billingCode.includes('id="billing-subview-container" style="margin-top: 0;"'), 'Subview container must have margin-top: 0');
console.log('✔ Box 2 (Space below top tabs): Container gap set to 0 and top nav card connected flush.');

// 3. Verify Box 3: Space below sub-navigation pills removed
assert(billingCode.includes('margin: 0; align-items: center; border-bottom: 1px solid var(--border-subtle); padding: 8px 16px;'), 'subViewSwitcher must have margin 0 and compact padding');
assert(!billingCode.includes('margin-bottom: 14px; align-items: center; border-bottom: 1px solid var(--border-subtle); padding-bottom: 10px;'), 'Old subViewSwitcher spacer should not exist');
console.log('✔ Box 3 (Space below sub-navigation): subViewSwitcher spacing tightened with margin: 0 and compact padding.');

// 4. Verify Box 4: Space between toolbar and table removed
assert(billingCode.includes('<div class="table-responsive" style="margin-top: 0;">'), 'table-responsive must have margin-top: 0');
assert(!billingCode.includes('<div class="table-responsive" style="margin-top: 14px;">'), 'table-responsive margin-top: 14px must be removed');
console.log('✔ Box 4 (Space between toolbar & table): Table margin-top set to 0.');

// 5. Verify CSS rules in components.css
assert(cssCode.includes('.billing-module-container > .billing-top-nav-card'), 'CSS must include .billing-top-nav-card rule');
assert(cssCode.includes('.billing-module-container #billing-subview-container > .content-card'), 'CSS must include #billing-subview-container rule');
console.log('✔ Seamless layout CSS rules present in components.css.');

console.log('\nALL VERIFICATION CHECKS PASSED SUCCESSFULLY! 🎯');
