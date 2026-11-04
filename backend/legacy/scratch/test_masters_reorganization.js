const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('VERIFYING MASTERS REORGANIZATION & ADMIN PANEL REMOVAL');
console.log('================================================================\n');

const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');

// 1. group-admin-panel must NOT exist
assert(!indexHtml.includes('id="group-admin-panel"'), 'group-admin-panel must be completely removed from index.html');
console.log('✓ PASS: group-admin-panel is removed from index.html');

// 2. group-masters must exist and contain both subgroups
const mastersMatch = indexHtml.match(/<div class="module-group" id="group-masters">([\s\S]*?)<\/div>\s*<!-- Sidebar Logout Button -->/);
assert(mastersMatch, 'group-masters must exist and be closed before Sidebar Logout Button');
const mastersHtml = mastersMatch[1];

assert(mastersHtml.includes('id="subgroup-org-location"'), 'subgroup-org-location must exist inside group-masters');
console.log('✓ PASS: subgroup-org-location is inside group-masters');

assert(mastersHtml.includes('id="subgroup-user-roles-security"'), 'subgroup-user-roles-security must exist inside group-masters');
console.log('✓ PASS: subgroup-user-roles-security is inside group-masters');

assert(mastersHtml.includes('id="nav-item-common-master"'), 'nav-item-common-master must exist inside group-masters');
console.log('✓ PASS: nav-item-common-master is inside group-masters');

assert(mastersHtml.includes('id="nav-item-address-master"'), 'nav-item-address-master must exist inside group-masters');
console.log('✓ PASS: nav-item-address-master is inside group-masters');

assert(mastersHtml.includes('id="nav-item-tax-master"'), 'nav-item-tax-master must exist inside group-masters');
console.log('✓ PASS: nav-item-tax-master is inside group-masters');

// 3. Check routes in app.js
assert(!appJs.includes("section: 'Admin Pannel'"), 'No route in app.js should have section Admin Pannel');
assert(!appJs.includes("section: 'Admin Panel'"), 'No route in app.js should have section Admin Panel');
console.log('✓ PASS: No routes in app.js reference Admin Pannel or Admin Panel');

// Check Organization & Facility Setup routes
const orgRoutes = [
  '#/org-location',
  '#/organizations',
  '#/branches',
  '#/financial-calendar',
  '#/doc-series',
  '#/document-series',
  '#/holiday-master',
  '#/holidays',
  '#/registration-config',
  '#/registration-configuration'
];

orgRoutes.forEach(r => {
  const regex = new RegExp(`'${r}':\\s*{[^}]+section:\\s*'Masters'[^}]+subSection:\\s*'Organization & Facility Setup'[^}]*}`);
  assert(regex.test(appJs), `Route ${r} must be mapped to section Masters and subSection Organization & Facility Setup`);
});
console.log('✓ PASS: All 10 Organization & Facility Setup routes mapped under Masters');

// Check User Roles & Security routes
const secRoutes = [
  '#/security-dashboard',
  '#/users',
  '#/user-access-control',
  '#/roles',
  '#/permissions',
  '#/role-permissions',
  '#/user-roles',
  '#/warehouse-access',
  '#/department-access',
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

secRoutes.forEach(r => {
  const regex = new RegExp(`'${r}':\\s*{[^}]+section:\\s*'Masters'[^}]+subSection:\\s*'User Roles & Security'[^}]*}`);
  assert(regex.test(appJs), `Route ${r} must be mapped to section Masters and subSection User Roles & Security`);
});
console.log('✓ PASS: All 19 User Roles & Security routes mapped under Masters');

console.log('\n🎉 ALL REORGANIZATION VERIFICATIONS PASSED 100%!');
