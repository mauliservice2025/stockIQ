const fs = require('fs');
const path = require('path');
const assert = require('assert');

// 1. Check index.html
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

// Assert Active Branch is removed
assert(!indexHtml.includes('Active Branch:'), 'Active Branch label must be removed from index.html');
assert(!indexHtml.includes('id="profile-dropdown-plant"'), 'profile-dropdown-plant element must be removed from index.html');
console.log('✓ "Active Branch:" row is removed from index.html');

// Assert profile-active-plant-tag is removed
assert(!indexHtml.includes('id="profile-active-plant-tag"'), 'profile-active-plant-tag must be removed from index.html');
console.log('✓ "Active" / branch code badge next to "Switch Branch" is removed from index.html');

// Assert signout door emoji is removed from index.html
assert(!indexHtml.includes('<span class="signout-icon">🚪</span>'), 'signout-icon door emoji must be removed from profile logout button');
console.log('✓ Door emoji icon on logout button is removed from index.html');

// 2. Check js/app.js
const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');

// Assert no building emoji in renderProfileFacilityList
const renderFacilitySection = appJs.substring(appJs.indexOf('renderProfileFacilityList()'), appJs.indexOf('updateFacilityPills()'));
assert(!renderFacilitySection.includes('🏢'), '🏢 building emoji must be removed from renderProfileFacilityList in js/app.js');
console.log('✓ "🏢" building emoji is removed from renderProfileFacilityList in js/app.js');

// Assert no building emoji in initFacilityDropdown
const initFacilitySection = appJs.substring(appJs.indexOf('initFacilityDropdown()'), appJs.indexOf('initPersonaDropdown()'));
assert(!initFacilitySection.includes('🏢'), '🏢 building emoji must be removed from initFacilityDropdown in js/app.js');
console.log('✓ "🏢" building emoji is removed from initFacilityDropdown in js/app.js');

console.log('\nAll profile cleanup checks PASSED perfectly!');
