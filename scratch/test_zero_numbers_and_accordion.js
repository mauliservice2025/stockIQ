const fs = require('fs');
const assert = require('assert');

console.log('Testing zero numbers and accordion constraints...');

const indexHtml = fs.readFileSync('index.html', 'utf8');
const storeModule = fs.readFileSync('js/modules/store-inventory.js', 'utf8');
const userModule = fs.readFileSync('js/modules/user-management.js', 'utf8');

// 1. Check sidebar Store & Inventory group
const storeGroupMatch = indexHtml.match(/id="group-store-inventory"[\s\S]*?<\/div>\s*<\/div>/);
assert(storeGroupMatch, 'Sidebar must have group-store-inventory');
const storeGroupHtml = storeGroupMatch[0];

assert(!storeGroupHtml.includes('module-header-badge'), 'Store inventory sidebar group must NOT contain module-header-badge');
assert(!storeGroupHtml.includes('tab-count'), 'Store inventory sidebar group must NOT contain tab-count');
assert(!storeGroupHtml.includes('nav-item-badge'), 'Store inventory sidebar group must NOT contain nav-item-badge');

// 2. Check tab buttons in store-inventory.js
const tabMatches = storeModule.match(/<button class="tab-btn[\s\S]*?<\/button>/g) || [];
console.log('Found store tabs count:', tabMatches.length);
assert(tabMatches.length >= 9, 'Must have at least 9 master tab buttons');

tabMatches.forEach(t => {
  assert(!t.includes('tab-count'), `Tab must not contain tab-count: ${t}`);
  assert(!t.includes('badge'), `Tab button must not contain badge: ${t}`);
  assert(!/\(\d+\)/.test(t), `Tab title must not contain bracketed numbers like (12): ${t}`);
});

// 3. Check single-expand accordion implementation in index.html and app.js
const appJs = fs.readFileSync('js/app.js', 'utf8');
assert(appJs.includes('toggleModuleGroup(headerEl)'), 'app.js must define toggleModuleGroup');
assert(appJs.includes("document.querySelectorAll('.module-group').forEach"), 'toggleModuleGroup must close other module groups (single-expand)');

// 4. Check user management tab buttons have no badges or counts
const userTabMatches = userModule.match(/<button class="tab-btn[\s\S]*?<\/button>/g) || [];
console.log('Found user tabs count:', userTabMatches.length);
userTabMatches.forEach(t => {
  assert(!t.includes('tab-count'), `User tab must not contain tab-count: ${t}`);
  assert(!/\(\d+\)/.test(t), `User tab title must not contain bracketed numbers: ${t}`);
});

console.log('ALL ZERO NUMBERS & ACCORDION CONSTRAINTS VERIFIED 100%!');
