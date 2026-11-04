const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- VERIFYING NO SYMBOLS IN SUB-MODULES ---');

const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

// Check all sub-nav-title occurrences in index.html
const regex = /<span class="sub-nav-title">([\s\S]*?)<\/span>/g;
let match;
const allSubNavTitles = [];
while ((match = regex.exec(indexHtml)) !== null) {
  allSubNavTitles.push(match[1].trim());
}

console.log(`Found ${allSubNavTitles.length} sub-nav titles in index.html`);

const emojiPattern = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

let failedCount = 0;
allSubNavTitles.forEach(title => {
  if (emojiPattern.test(title)) {
    console.error(`FAIL: Found emoji in sub-nav title: "${title}"`);
    failedCount++;
  }
});

assert.strictEqual(failedCount, 0, `There are ${failedCount} sub-nav items with symbols in index.html!`);
console.log('PASS: All sub-nav titles in index.html are clean of symbols/emojis.');

// Check for no sub-nav-bullet or sub-module-icon in index.html
const bulletMatches = (indexHtml.match(/<span class="sub-nav-bullet"><\/span>/g) || []).length;
assert.strictEqual(bulletMatches, 0, `Found ${bulletMatches} sub-nav-bullet tags in index.html!`);
console.log('PASS: Zero sub-nav bullets found in index.html.');

const subModuleIconMatches = (indexHtml.match(/<span class="sub-module-icon">[\s\S]*?<\/span>/g) || []).length;
assert.strictEqual(subModuleIconMatches, 0, `Found ${subModuleIconMatches} sub-module-icon tags in index.html!`);
console.log('PASS: Zero sub-module icons found in index.html.');

// Check common-lookup-master.js
const commonLookupJs = fs.readFileSync(path.join(__dirname, '../js/modules/common-lookup-master.js'), 'utf8');
assert(!commonLookupJs.includes('⚙️'), 'FAIL: Found ⚙️ in common-lookup-master.js');
assert(!commonLookupJs.includes('📥 Export CSV'), 'FAIL: Found 📥 in common-lookup-master.js');
assert(!commonLookupJs.includes('📋'), 'FAIL: Found 📋 in common-lookup-master.js');
assert(!commonLookupJs.includes('${t.icon}'), 'FAIL: Found ${t.icon} rendered in common-lookup-master.js');
assert(!commonLookupJs.includes('${meta.icon}'), 'FAIL: Found ${meta.icon} rendered in common-lookup-master.js');
console.log('PASS: Common Lookup Master is clean of all symbols and emojis.');

// Check common-master.js
const commonMasterJs = fs.readFileSync(path.join(__dirname, '../js/modules/common-master.js'), 'utf8');
const tabMatches = [...commonMasterJs.matchAll(/<button class="tab-btn[^>]*>[\s\S]*?<span>([\s\S]*?)<\/span>/g)];
tabMatches.forEach(m => {
  const label = m[1].trim();
  assert(!emojiPattern.test(label), `FAIL: Emoji in CommonMaster tab: "${label}"`);
});
assert(!commonMasterJs.includes('📥 Export CSV'), 'FAIL: Found 📥 Export CSV in common-master.js');
assert(!commonMasterJs.includes('🌐'), 'FAIL: Found 🌐 in common-master.js');
assert(!commonMasterJs.includes('🗺️'), 'FAIL: Found 🗺️ in common-master.js');
assert(!commonMasterJs.includes('🏛️'), 'FAIL: Found 🏛️ in common-master.js');
assert(!commonMasterJs.includes('🏙️'), 'FAIL: Found 🏙️ in common-master.js');
assert(!commonMasterJs.includes('📮'), 'FAIL: Found 📮 in common-master.js');
assert(!commonMasterJs.includes('🏭 Yes'), 'FAIL: Found 🏭 Yes in common-master.js');
console.log('PASS: All CommonMaster module tabs and toolbars are clean.');

// Check user-management.js tabConfig
const userMgmtJs = fs.readFileSync(path.join(__dirname, '../js/modules/user-management.js'), 'utf8');
const tabConfigMatches = [...userMgmtJs.matchAll(/label:\s*'([^']+)'/g)];
tabConfigMatches.forEach(m => {
  const label = m[1].trim();
  assert(!emojiPattern.test(label), `FAIL: Emoji in UserMgmt tabConfig: "${label}"`);
});
assert(!userMgmtJs.includes('${sm.categoryIcon || \'📁\'}'), 'FAIL: Found categoryIcon in submodule perm row in user-management.js');
console.log('PASS: All UserManagement tabConfig labels and submodule rows are clean.');

// Check org-location.js tabConfig
const orgLocJs = fs.readFileSync(path.join(__dirname, '../js/modules/org-location.js'), 'utf8');
const orgTabs = [...orgLocJs.matchAll(/label:\s*'([^']+)'/g)];
orgTabs.forEach(m => {
  const label = m[1].trim();
  assert(!emojiPattern.test(label), `FAIL: Emoji in OrgLocation tabConfig: "${label}"`);
});
console.log('PASS: All OrgLocation tabConfig labels are clean.');

// Check store-inventory.js tabConfig
const storeInvJs = fs.readFileSync(path.join(__dirname, '../js/modules/store-inventory.js'), 'utf8');
const storeTabs = [...storeInvJs.matchAll(/label:\s*'([^']+)'/g)];
storeTabs.forEach(m => {
  const label = m[1].trim();
  assert(!emojiPattern.test(label), `FAIL: Emoji in StoreInventory tabConfig: "${label}"`);
});
console.log('PASS: All StoreInventory tabConfig labels are clean.');

console.log('\n✅ ALL SUB-MODULE CHECKS PASSED PERFECTLY!');
