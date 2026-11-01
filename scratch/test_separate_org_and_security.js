const fs = require('fs');
const assert = require('assert');

const html = fs.readFileSync('index.html', 'utf8');
const appJs = fs.readFileSync('js/app.js', 'utf8');

// 1. group-masters must NOT exist in index.html
assert(!html.includes('id="group-masters"'), 'group-masters must be removed');
console.log('✓ PASS: group-masters is completely removed from index.html');

// 2. group-org-location and group-user-roles-security must exist
assert(html.includes('id="group-org-location"'), 'group-org-location must exist');
console.log('✓ PASS: group-org-location exists as a separate module in index.html');

assert(html.includes('id="group-user-roles-security"'), 'group-user-roles-security must exist');
console.log('✓ PASS: group-user-roles-security exists as a separate module in index.html');

// 3. No sub-module-group in either of them
const orgBlock = html.split('id="group-org-location"')[1].split('id="group-user-roles-security"')[0];
const secBlock = html.split('id="group-user-roles-security"')[1].split('sidebar-logout-footer')[0];

assert(!orgBlock.includes('sub-module-group'), 'Organization & Facility Setup should not have nested sub-module-group');
assert(!secBlock.includes('sub-module-group'), 'User Roles & Security should not have nested sub-module-group');
console.log('✓ PASS: Neither module has 3-tier nested sub-module-group, all are direct sub-nav-items');

// 4. Check routes in app.js
assert(!appJs.includes("section: 'Masters'"), 'No routes in app.js should have section: Masters');
console.log('✓ PASS: No routes in app.js have section: Masters');

console.log('\nAll checks passed successfully!');
