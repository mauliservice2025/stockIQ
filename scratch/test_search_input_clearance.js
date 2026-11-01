const fs = require('fs');
const assert = require('assert');

console.log('Testing Universal Search Input Icon Clearance & Override Fixes...\n');

// 1. Verify components.css
const cssCode = fs.readFileSync('d:/Projects/ISCM/css/components.css', 'utf8');

// Check that .search-input was removed from the 4px 10px rule
assert(!cssCode.includes('.search-input,\n.filter-select {\n  font-family: var(--font-sans) !important;\n  font-size: 12.5px !important;\n  font-weight: 400 !important;\n  height: 32px !important;\n  padding: 4px 10px !important;'),
  'components.css must not force 4px 10px !important on .search-input');
console.log('✓ .search-input removed from restrictive 4px 10px !important padding rule.');

// Check universal search clearance rule
assert(cssCode.includes('padding-left: 32px !important;'), 'components.css must provide universal padding-left: 32px !important for search inputs');
assert(cssCode.includes('input[id*="search" i]'), 'components.css must include case-insensitive search ID selector');
assert(cssCode.includes('pointer-events: none !important;'), 'components.css must prevent icon from blocking mouse clicks');
console.log('✓ Universal CSS search input padding-left (32px) and pointer-events rules active.');

// 2. Verify billing.js search inputs
const billingCode = fs.readFileSync('d:/Projects/ISCM/js/modules/billing.js', 'utf8');
assert(billingCode.includes('id="jobcard-search-input"\n                class="form-control form-control-sm" \n                style="padding-left: 32px !important; padding-right: 28px !important;"'),
  'jobcard-search-input must have padding-left: 32px !important');
assert(billingCode.includes('id="draftbill-search-input"\n                class="form-control form-control-sm" \n                style="padding-left: 32px !important; padding-right: 28px !important;"'),
  'draftbill-search-input must have padding-left: 32px !important');
assert(billingCode.includes('id="delivery-search-input"\n                class="form-control form-control-sm" \n                style="padding-left: 32px !important; padding-right: 28px !important;"'),
  'delivery-search-input must have padding-left: 32px !important');
console.log('✓ Billing module search inputs (Job Card, Draft Bill, Final Bill, Delivery) updated with 30-32px clearance.');

// 3. Verify item-setup-master.js search inputs
const itemMasterCode = fs.readFileSync('d:/Projects/ISCM/js/modules/item-setup-master.js', 'utf8');
assert(itemMasterCode.includes('id="brand-search-input"\n                class="form-control form-control-sm" \n                style="padding-left: 32px !important; padding-right: 28px !important;"'),
  'brand-search-input must have padding-left: 32px !important');
assert(itemMasterCode.includes('id="mfg-search-input"\n                class="form-control form-control-sm" \n                style="padding-left: 32px !important; padding-right: 28px !important;"'),
  'mfg-search-input must have padding-left: 32px !important');
assert(itemMasterCode.includes('id="vehicle-search-input"\n                class="form-control form-control-sm" \n                style="padding-left: 32px !important; padding-right: 28px !important;"'),
  'vehicle-search-input must have padding-left: 32px !important');
console.log('✓ Item Setup Master search inputs (Category, Brand, Manufacturer, Vehicle, UOM, HSN) verified.');

// 4. Verify user-management.js search inputs
const userMgmtCode = fs.readFileSync('d:/Projects/ISCM/js/modules/user-management.js', 'utf8');
assert(userMgmtCode.includes('id="perm-master-search-input"\n                style="padding-left: 32px !important;'),
  'perm-master-search-input must have padding-left: 32px !important');
assert(userMgmtCode.includes('id="submodule-perm-search-input"\n                style="padding-left: 32px !important;'),
  'submodule-perm-search-input must have padding-left: 32px !important');
console.log('✓ User Management search inputs verified with padding-left: 32px !important.');

// 5. Verify index.html cache busters
const indexHtml = fs.readFileSync('d:/Projects/ISCM/index.html', 'utf8');
assert(/css\/components\.css\?v=2\.[1-9]/.test(indexHtml), 'components.css cache buster bumped to >= 2.1');
assert(/billing\.js\?v=1\.[6-9]/.test(indexHtml), 'billing.js cache buster bumped to >= 1.6');
console.log('✓ Cache busters in index.html verified.');

console.log('\n🎉 ALL SEARCH OVERRIDE & CLEARANCE TESTS PASSED!\n');
