const fs = require('fs');
const path = require('path');

console.log('=== VERIFYING MASTERS HIERARCHY WITH CONSOLIDATED ADDRESS MASTER ===\n');

// 1. Check index.html structure
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

// Level 1: Main module #group-masters
if (!indexHtml.includes('id="group-masters"')) {
  console.error('[FAIL] Missing #group-masters');
  process.exit(1);
}
console.log('✓ Level 1: Main Module "Masters" (#group-masters) verified.');

// Level 2: Sub-module 1 #subgroup-org-location
if (!indexHtml.includes('id="subgroup-org-location"')) {
  console.error('[FAIL] Missing #subgroup-org-location');
  process.exit(1);
}
console.log('✓ Level 2: Sub-Module "Organization & Facility Setup" (#subgroup-org-location) verified.');

// Level 2: Consolidated Master #nav-item-address-master
if (!indexHtml.includes('id="nav-item-address-master"') || !indexHtml.includes('href="#/address-master"')) {
  console.error('[FAIL] Missing consolidated #nav-item-address-master with href="#/address-master"');
  process.exit(1);
}
console.log('✓ Level 2: Consolidated Master "Address Master" (#nav-item-address-master) verified.');

// Verify Common Master sub-group was removed
if (indexHtml.includes('id="subgroup-common-master"')) {
  console.error('[FAIL] #subgroup-common-master should have been removed');
  process.exit(1);
}
console.log('✓ Verification: Redundant "Common Master" sub-group removed.');

// Level 3: Check Organisation Master & Facility Master under #subgroup-org-location
const orgMatch = indexHtml.match(/id="subgroup-org-location"[\s\S]*?<\/div>\s*<\/div>/);
if (!orgMatch) {
  console.error('[FAIL] Could not extract #subgroup-org-location content');
  process.exit(1);
}
const orgHtml = orgMatch[0];
const orgMasters = [
  '#/organizations',
  '#/branches',
  '#/financial-calendar',
  '#/doc-series'
];
for (const r of orgMasters) {
  if (!orgHtml.includes(`href="${r}"`)) {
    console.error(`[FAIL] ${r} missing from #subgroup-org-location`);
    process.exit(1);
  }
}
console.log('✓ Level 3: All 4 Organization & Facility Setup sub-sub-modules verified in #subgroup-org-location.');

// 2. Check that all 5 Address Masters exist as tabs inside CommonMasterModule
const cmJs = fs.readFileSync(path.join(__dirname, '../js/modules/common-master.js'), 'utf8');
const tabs = ['Country Master', 'State Master', 'District Master', 'City Master', 'Pin Code Master'];
for (const t of tabs) {
  if (!cmJs.includes(t)) {
    console.error(`[FAIL] Tab "${t}" missing from common-master.js`);
    process.exit(1);
  }
}
console.log('✓ All 5 Address Masters verified as tabs inside Address Master module (Country, State, District, City, Pin Code).');

// 3. Check app.js routes configuration
const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');

if (!appJs.includes("'#/address-master'")) {
  console.error("[FAIL] '#/address-master' route missing from app.js");
  process.exit(1);
}
console.log('✓ app.js routes: Configured with "#/address-master" mapping to CommonMasterModule.');

console.log('\n================================================================');
console.log('🎉 CONSOLIDATED ADDRESS MASTER STRUCTURE VERIFIED (100% PASS)!');
console.log('================================================================');
