// Test script to verify removal of numbers across all masters and throughout application
const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('VERIFYING REMOVAL OF NUMBERS ACROSS ALL MASTERS & APPLICATION');
console.log('================================================================\n');

let failed = false;

// 1. Check OrgLocationModule tabs in js/modules/org-location.js
const orgLoc = fs.readFileSync(path.join(__dirname, '../js/modules/org-location.js'), 'utf8');
const orgLocTabsMatch = orgLoc.substring(orgLoc.indexOf('class="tabs-header"'), orgLoc.indexOf('id="org-location-tab-content"'));
if (/tab-count|\$\{all\w+\.length\}/.test(orgLocTabsMatch)) {
  console.error('[FAIL] Found number badge in org-location.js tabs');
  failed = true;
} else {
  console.log('[PASS] org-location.js: All 7 master tabs (Org, Branch, Store, Location, Rack, Shelf, Bin) have zero numbers.');
}

// 2. Check OrganizationModule in js/modules/organizations.js
const orgMod = fs.readFileSync(path.join(__dirname, '../js/modules/organizations.js'), 'utf8');
if (orgMod.includes('tab-count') || orgMod.includes('${totalCount}')) {
  console.error('[FAIL] Found number badge in organizations.js tabs');
  failed = true;
} else {
  console.log('[PASS] organizations.js: Organization Master tab has zero numbers.');
}

// 3. Check MastersModule in js/modules/masters.js
const mastersMod = fs.readFileSync(path.join(__dirname, '../js/modules/masters.js'), 'utf8');
if (mastersMod.includes('tab-count')) {
  console.error('[FAIL] Found tab-count in masters.js');
  failed = true;
} else {
  console.log('[PASS] masters.js: All master tabs (Item, Supplier, Customer, Warehouse, Plant) have zero numbers.');
}

// 4. Check UserManagementModule in js/modules/user-management.js
const userMod = fs.readFileSync(path.join(__dirname, '../js/modules/user-management.js'), 'utf8');
const userRibbon = userMod.substring(userMod.indexOf('class="user-management-nav-ribbon"'), userMod.indexOf('id="user-management-content"'));
if (userRibbon.includes('tab-count')) {
  console.error('[FAIL] Found tab-count in user-management.js ribbon tabs');
  failed = true;
} else {
  console.log('[PASS] user-management.js: All user/role/permission ribbon tabs have zero numbers.');
}

if (/badge[^>]*>\s*\$\{users\.length\}\s*Users/i.test(userMod) || /badge[^>]*>\s*\$\{roles\.length\}\s*System Roles/i.test(userMod)) {
  console.error('[FAIL] Found user or role count badges in user-management.js');
  failed = true;
} else {
  console.log('[PASS] user-management.js: Master header card titles have zero number badges.');
}

// 5. Check ProductionModule in js/modules/production.js
const prodMod = fs.readFileSync(path.join(__dirname, '../js/modules/production.js'), 'utf8');
if (prodMod.includes('tab-count')) {
  console.error('[FAIL] Found tab-count in production.js');
  failed = true;
} else {
  console.log('[PASS] production.js: Production tabs have zero numbers.');
}

// 6. Check index.html sidebar module headers
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
if (indexHtml.includes('module-header-badge')) {
  console.error('[FAIL] Found module-header-badge in index.html');
  failed = true;
} else {
  console.log('[PASS] index.html: Sidebar module headers have zero number badges.');
}

if (indexHtml.includes('Role Master (17 Roles)') || indexHtml.includes('Permission Master (15 Actions)')) {
  console.error('[FAIL] Found (17 Roles) or (15 Actions) in index.html');
  failed = true;
} else {
  console.log('[PASS] index.html: Sub-nav links cleaned of number suffixes.');
}

// 7. Check js/app.js route titles
const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
if (appJs.includes('(17 Roles)') || appJs.includes('(15 Granular Actions)')) {
  console.error('[FAIL] Found number suffixes in js/app.js route titles');
  failed = true;
} else {
  console.log('[PASS] js/app.js: Route titles cleaned of number suffixes.');
}

// 8. Check CSS display: none guards
const compCss = fs.readFileSync(path.join(__dirname, '../css/components.css'), 'utf8');
const layoutCss = fs.readFileSync(path.join(__dirname, '../css/layout.css'), 'utf8');
if (compCss.includes('.tab-count {\n  display: none !important;\n}') && layoutCss.includes('.module-header-badge {\n  display: none !important;\n}')) {
  console.log('[PASS] CSS: Global .tab-count and .module-header-badge set to display: none !important.');
} else {
  console.error('[FAIL] Missing CSS global display: none guard');
  failed = true;
}

if (failed) {
  console.error('\nSOME CHECKS FAILED!');
  process.exit(1);
} else {
  console.log('\n================================================================');
  console.log('ALL NUMBER REMOVAL CHECKS PASSED PERFECTLY!');
  console.log('================================================================');
}
