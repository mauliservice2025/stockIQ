const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('VERIFYING SIDEBAR MODULE ORDER IN INDEX.HTML');
console.log('================================================================\n');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

// 1. Extract sidebar module groups in DOM order
const groupMatches = [...html.matchAll(/id="(group-[^"]+)"/g)].map(m => m[1]);
console.log('Extracted Sidebar Module Groups in Order:');
groupMatches.forEach((groupId, idx) => {
  console.log(`  ${idx + 1}. ${groupId}`);
});

const expectedOrder = [
  'group-procurement',
  'group-quality',
  'group-inventory',
  'group-production',
  'group-dispatch',
  'group-control',
  'group-billing',
  'group-item-master-setup',
  'group-store-inventory',
  'group-masters'
];

assert.deepStrictEqual(groupMatches, expectedOrder, 'Sidebar module group order must match expected order precisely');
console.log('\n✓ PASS: Exact module group order matched!');

// 2. Explicitly test Store Master Setup position relative to Item Master Setup
const itemMasterIndex = groupMatches.indexOf('group-item-master-setup');
const storeMasterIndex = groupMatches.indexOf('group-store-inventory');
const mastersIndex = groupMatches.indexOf('group-masters');

assert(itemMasterIndex !== -1, 'group-item-master-setup must exist');
assert(storeMasterIndex !== -1, 'group-store-inventory must exist');
assert(mastersIndex !== -1, 'group-masters must exist');

assert.strictEqual(
  storeMasterIndex,
  itemMasterIndex + 1,
  'Store Master Setup (group-store-inventory) must be immediately below Item Master Setup (group-item-master-setup)'
);
console.log(`✓ PASS: Store Master Setup (index ${storeMasterIndex}) is immediately below Item Master Setup (index ${itemMasterIndex})`);

assert.strictEqual(
  mastersIndex,
  storeMasterIndex + 1,
  'Masters (group-masters) must be immediately below Store Master Setup (group-store-inventory)'
);
console.log(`✓ PASS: Masters (index ${mastersIndex}) is immediately below Store Master Setup (index ${storeMasterIndex})`);

// 3. Verify content of Store Master Setup block
const storeBlock = html.match(/<div class="module-group" id="group-store-inventory">([\s\S]*?)<\/div>\s*<!-- Masters/)[1];
assert(storeBlock.includes('Store Master Setup'), 'Header title must say Store Master Setup');
assert(storeBlock.includes('Store Master'), 'Must contain Store Master');
assert(storeBlock.includes('Category & Item Mapping'), 'Must contain Category & Item Mapping');
assert(storeBlock.includes('Storage Location Master'), 'Must contain Storage Location Master');
assert(storeBlock.includes('Rack Master'), 'Must contain Rack Master');
assert(storeBlock.includes('Shelf Master'), 'Must contain Shelf Master');
assert(storeBlock.includes('Bin Master'), 'Must contain Bin Master');

// Check that Category & Item Mapping appears after Store Master and before Storage Location Master
const storeMasterPos = storeBlock.indexOf('nav-item-store-master');
const mappingPos = storeBlock.indexOf('nav-item-store-mapping');
const storageLocPos = storeBlock.indexOf('nav-item-storage-locations');
assert(storeMasterPos !== -1 && mappingPos !== -1 && storageLocPos !== -1, 'Links must exist');
assert(storeMasterPos < mappingPos && mappingPos < storageLocPos, 'Category & Item Mapping must be positioned directly under Store Master');
console.log('✓ PASS: Store Master Setup contains Category & Item Mapping placed directly under Store Master!');

console.log('\n================================================================');
console.log('🎉 ALL SIDEBAR MODULE ORDER VERIFICATIONS PASSED (100%)!');
console.log('================================================================\n');
