const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- TESTING PROFILE & THEME SHORT OPTION CLEANUP ---');

const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const layoutCss = fs.readFileSync(path.join(__dirname, '../css/layout.css'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');

// 1. Verify profile-dropdown-badge is removed from index.html
assert(!indexHtml.includes('id="profile-dropdown-badge"'), 'FAIL: id="profile-dropdown-badge" must not exist in index.html');
console.log('PASS: profile-dropdown-badge removed from index.html');

// 2. Verify System Administrator / (ACTIVE) badge assignment removed in js/app.js
assert(!appJs.includes('${roleTitle} (${user.status'), 'FAIL: flyBadge.innerText assignment must not exist in js/app.js');
console.log('PASS: flyBadge role assignment removed from js/app.js');

// 3. Verify Theme section in index.html is shortened to Dark and Light
assert(indexHtml.includes('id="profile-opt-dark"'), 'FAIL: profile-opt-dark must exist');
assert(indexHtml.includes('id="profile-opt-light"'), 'FAIL: profile-opt-light must exist');
assert(!indexHtml.includes('id="profile-opt-system"'), 'FAIL: profile-opt-system (Auto) must NOT exist in index.html');
assert(!indexHtml.includes('profile-theme-options'), 'FAIL: old bulky profile-theme-options must NOT exist in index.html');
assert(indexHtml.includes('profile-theme-short-switch'), 'FAIL: profile-theme-short-switch must exist in index.html');
console.log('PASS: Short option for dark mode and light mode configured in index.html');

// 4. Verify CSS contains styles for short theme switch and badges
assert(layoutCss.includes('.profile-theme-short-row'), 'FAIL: .profile-theme-short-row must exist in layout.css');
assert(layoutCss.includes('.profile-theme-short-switch'), 'FAIL: .profile-theme-short-switch must exist in layout.css');
assert(layoutCss.includes('.profile-theme-short-btn'), 'FAIL: .profile-theme-short-btn must exist in layout.css');
console.log('PASS: layout.css contains styles for compact short theme switch');

console.log('\nAll checks passed successfully!');
