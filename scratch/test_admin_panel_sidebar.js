const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('VERIFYING ADMIN PANNEL HIERARCHY (ORG SETUP + USER SECURITY)');
console.log('================================================================\n');

const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');

// 1. Check module groups in index.html and their ordering
const moduleGroupMatches = [...indexHtml.matchAll(/id="(group-[^"]+)"/g)].map(m => m[1]);
console.log('Module groups in order:', moduleGroupMatches);

const mastersIndex = moduleGroupMatches.indexOf('group-masters');
const adminPanelIndex = moduleGroupMatches.indexOf('group-admin-panel');
const storeInventoryIndex = moduleGroupMatches.indexOf('group-store-inventory');

assert(mastersIndex !== -1, 'group-masters must exist in index.html');
assert(adminPanelIndex !== -1, 'group-admin-panel must exist in index.html');
assert(adminPanelIndex === mastersIndex + 1, 'group-admin-panel must be located immediately below group-masters');
console.log('✓ group-admin-panel is positioned immediately below group-masters');

// 2. Check Admin Pannel title
const adminPanelBlock = indexHtml.match(/<div class="module-group" id="group-admin-panel">([\s\S]*?)<\/div>\s*<!-- Sidebar Logout/);
assert(adminPanelBlock, 'Could not extract group-admin-panel HTML block');
const adminHtml = adminPanelBlock[1];

assert(adminHtml.includes('Admin Pannel'), 'Header must contain "Admin Pannel"');
console.log('✓ Header title is "Admin Pannel"');

// 3. Check Organization & Facility Setup sub-module group inside Admin Pannel
assert(adminHtml.includes('id="subgroup-org-location"'), 'subgroup-org-location must exist inside group-admin-panel');
assert(adminHtml.includes('Organization & Facility Setup'), 'Sub-module header must say "Organization & Facility Setup"');
console.log('✓ Sub-module "Organization & Facility Setup" is nested inside Admin Pannel');

const orgRoutes = [
  '#/organizations',
  '#/branches',
  '#/financial-calendar',
  '#/doc-series'
];

orgRoutes.forEach(route => {
  assert(adminHtml.includes(`href="${route}"`), `group-admin-panel must contain link to ${route}`);
});
console.log('✓ All 4 Organization & Facility Setup routes are present inside Admin Pannel');

// Verify js/app.js routes for org setup have section: 'Admin Pannel'
orgRoutes.forEach(route => {
  const routeLineMatch = appJs.match(new RegExp(`'${route}'\\s*:\\s*\\{[^}]*\\}`));
  assert(routeLineMatch, `Route definition for ${route} not found in app.js`);
  const def = routeLineMatch[0];
  assert(def.includes("section: 'Admin Pannel'"), `Route ${route} must have section: 'Admin Pannel'`);
  assert(def.includes("subSection: 'Organization & Facility Setup'"), `Route ${route} must have subSection: 'Organization & Facility Setup'`);
});
console.log('✓ All 4 Org Setup routes in app.js have section: "Admin Pannel" and subSection: "Organization & Facility Setup"');

// Verify moved storage routes in Store & Inventory Master
const storeRoutes = ['#/store-master', '#/storage-locations', '#/racks', '#/shelves', '#/bins'];
const storeInventoryHtml = indexHtml.match(/id="group-store-inventory"[\s\S]*?class="sidebar-logout-footer"/)[0];
storeRoutes.forEach(route => {
  assert(storeInventoryHtml.includes(`href="${route}"`), `group-store-inventory must contain link to ${route}`);
});
console.log('✓ Storage hierarchy masters correctly verified in Store & Inventory Master');

// 4. Check User Roles & Security sub-module group inside Admin Pannel
assert(adminHtml.includes('id="subgroup-user-roles-security"'), 'subgroup-user-roles-security must exist inside group-admin-panel');
assert(adminHtml.includes('User Roles & Security'), 'Sub-module header must say "User Roles & Security"');
console.log('✓ Sub-module "User Roles & Security" is nested inside Admin Pannel');

const expected17Routes = [
  '#/security-dashboard',
  '#/users',
  '#/roles',
  '#/permissions',
  '#/role-permissions',
  '#/user-roles',
  '#/warehouse-access',
  '#/sod-rules',
  '#/approval-authorities',
  '#/delegations',
  '#/access-requests',
  '#/password-policy',
  '#/login-security',
  '#/sessions',
  '#/login-history',
  '#/access-reports',
  '#/user-activity'
];

expected17Routes.forEach(route => {
  assert(adminHtml.includes(`href="${route}"`), `group-admin-panel must contain link to ${route}`);
});
console.log('✓ All 17 User Management & RBAC routes are present inside User Roles & Security under Admin Pannel');

// Verify js/app.js routes metadata for user roles
expected17Routes.forEach(route => {
  const routeLineMatch = appJs.match(new RegExp(`'${route}'\\s*:\\s*\\{[^}]*\\}`));
  assert(routeLineMatch, `Route definition for ${route} not found in app.js`);
  const def = routeLineMatch[0];
  assert(def.includes("section: 'Admin Pannel'"), `Route ${route} must have section: 'Admin Pannel'`);
  assert(def.includes("subSection: 'User Roles & Security'"), `Route ${route} must have subSection: 'User Roles & Security'`);
});
console.log('✓ All 17 routes in app.js have section: "Admin Pannel" and subSection: "User Roles & Security"');

// 5. Verify Masters group now houses Address Master, Common Master, and Tax Master
const mastersBlock = indexHtml.match(/<div class="module-group" id="group-masters">([\s\S]*?)<\/div>\s*<!-- Admin Pannel/);
assert(mastersBlock, 'Could not extract group-masters HTML block');
const mastersHtml = mastersBlock[1];
assert(!mastersHtml.includes('id="subgroup-org-location"'), 'subgroup-org-location must NOT be in group-masters anymore');
assert(mastersHtml.indexOf('id="nav-item-common-master"') < mastersHtml.indexOf('id="nav-item-address-master"'), 'Common Master must appear before Address Master in Masters');
assert(mastersHtml.indexOf('id="nav-item-address-master"') < mastersHtml.indexOf('id="nav-item-tax-master"'), 'Address Master must appear before Tax Master in Masters');
console.log('✓ Masters group order verified: 1. Common Master -> 2. Address Master -> 3. Tax Master');

console.log('\n================================================================');
console.log('🎉 ALL ADMIN PANNEL HIERARCHY TESTS PASSED (100%)!');
console.log('================================================================\n');
