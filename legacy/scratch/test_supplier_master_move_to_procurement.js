const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TEST SUITE: SUPPLIER MASTER REMOVAL FROM ORG LOCATION & MOVE TO PROCUREMENT ===\n');

// 1. Verify index.html sidebar placement
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf-8');

const procurementStart = indexHtml.indexOf('id="group-procurement"');
const procurementEnd = indexHtml.indexOf('id="group-quality"');
assert(procurementStart !== -1 && procurementEnd !== -1, 'group-procurement and group-quality must exist');

const procurementHtml = indexHtml.substring(procurementStart, procurementEnd);
assert(procurementHtml.includes('id="nav-item-suppliers"'), 'nav-item-suppliers must be inside group-procurement');
assert(procurementHtml.includes('href="#/suppliers"'), 'href="#/suppliers" must be inside group-procurement');
console.log('✓ 1. Supplier & Vendor Master is now positioned under Procurement in sidebar navigation.');

const orgStart = indexHtml.indexOf('id="group-org-location"');
const orgEnd = indexHtml.indexOf('class="sidebar-logout-footer"');
const orgHtml = indexHtml.substring(orgStart, orgEnd !== -1 ? orgEnd : undefined);
assert(!orgHtml.includes('id="nav-item-suppliers"'), 'nav-item-suppliers must NOT be in group-org-location');
assert(!orgHtml.includes('href="#/suppliers"'), 'href="#/suppliers" must NOT be in group-org-location');
console.log('✓ 2. Supplier & Vendor Master is completely removed from Organization & Facility Setup in sidebar.');

// 2. Verify OrgLocationModule.tabConfig in js/modules/org-location.js
const orgLocationJs = fs.readFileSync(path.join(__dirname, '../js/modules/org-location.js'), 'utf-8');
assert(!orgLocationJs.includes("{ key: 'SUPPLIERS', perm: 'SUPPLIER_MASTER', label: 'Supplier & Vendor Master' }"), 'SUPPLIERS tab must be removed from OrgLocationModule.tabConfig');
assert(!orgLocationJs.includes("if (window.MastersModule && typeof window.MastersModule.render === 'function')"), 'Rogue MastersModule.render() calls must be removed from facility deletion methods');
console.log('✓ 3. OrgLocationModule no longer contains SUPPLIERS in its tabConfig.');
console.log('✓ 4. Rogue MastersModule.render() call on facility delete has been eliminated.');

// 3. Verify MastersModule in js/modules/masters.js
const mastersJs = fs.readFileSync(path.join(__dirname, '../js/modules/masters.js'), 'utf-8');
assert(!mastersJs.includes('<span>Organization Master</span>'), 'Organization Master tab button must be removed from masters.js');
assert(!mastersJs.includes('<span>Supplier Master</span>'), 'Supplier Master tab button must be removed from masters.js');
console.log('✓ 5. MastersModule no longer renders the misleading Organization Master / Supplier Master tab bar.');

// 4. Verify app.js routes and permissions
const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf-8');
assert(appJs.includes("'#/suppliers': { module: window.MastersModule, title: 'Supplier & Vendor Master', section: 'Procurement' }"), '#/suppliers route must point to MastersModule in Procurement');
assert(appJs.includes("'#/supplier-master': { module: window.MastersModule, title: 'Supplier & Vendor Master', section: 'Procurement' }"), '#/supplier-master route must point to MastersModule in Procurement');
console.log('✓ 6. app.js routes #/suppliers to MastersModule under section Procurement.');

// 5. Verify pinned-submodules.js and user-management.js
const pinnedJs = fs.readFileSync(path.join(__dirname, '../js/modules/pinned-submodules.js'), 'utf-8');
assert(pinnedJs.includes("{ id: 'suppliers', title: 'Supplier & Vendor Master', route: '#/suppliers', icon: '🚚', group: 'Procurement', permCode: 'SUPPLIER_MASTER' }"), 'pinned-submodules.js must categorize suppliers under Procurement');

const userMgmtJs = fs.readFileSync(path.join(__dirname, '../js/modules/user-management.js'), 'utf-8');
assert(userMgmtJs.includes("{ code: 'SUPPLIER_MASTER', name: 'Supplier & Vendor Master', category: 'Procurement', categoryIcon: '🛒', route: '#/suppliers'"), 'user-management.js must list SUPPLIER_MASTER under Procurement');
console.log('✓ 7. pinned-submodules.js and user-management.js classify SUPPLIER_MASTER under Procurement.');

console.log('\n🎉 ALL TESTS PASSED (100%)!');
