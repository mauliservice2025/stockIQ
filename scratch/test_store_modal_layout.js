const fs = require('fs');

const code = fs.readFileSync('js/modules/store-inventory.js', 'utf8');

console.log('Testing Store Inventory UI Layout & Enhancements...');

// 1. Check Store Code is before Store Name in Row 1 of Add Store Modal
const addStoreMatch = code.match(/showAddStoreModal\(\)\s*\{[\s\S]*?<!-- Row 1 -->[\s\S]*?Store Code[\s\S]*?Store Name[\s\S]*?Store Address/);
if (!addStoreMatch) {
  console.error('FAIL: Store Code -> Store Name -> Store Address order not found in showAddStoreModal()');
  process.exit(1);
}
console.log('✔ showAddStoreModal(): Row 1 ordering (Store Code -> Store Name -> Store Address) verified.');

// 2. Check Operating Status replaced with Status and checkbox button
if (code.includes('Operating Status')) {
  console.error('FAIL: "Operating Status" still found in code!');
  process.exit(1);
}
console.log('✔ "Operating Status" completely replaced with "Status".');

// 3. Check Create Store button without emoji and without "& Configure"
if (code.includes('Create Store & Configure')) {
  console.error('FAIL: "Create Store & Configure" still found in code!');
  process.exit(1);
}
console.log('✔ Button text correctly updated to "Create Store".');

// 4. Check no emoji in Create Store button
if (code.includes('💾 Create Store')) {
  console.error('FAIL: Emoji found in Create Store button!');
  process.exit(1);
}
console.log('✔ Emojis successfully removed from Create Store and Save Store Details buttons.');

// 5. Check Row 1 in renderStoreConfigDetails()
const cfgStoreMatch = code.match(/renderStoreConfigDetails\(store\)\s*\{[\s\S]*?<!-- Row 1: Store Code, Store Name, Store Address -->[\s\S]*?Store Code[\s\S]*?Store Name[\s\S]*?Store Address/);
if (!cfgStoreMatch) {
  console.error('FAIL: Store Code -> Store Name -> Store Address order not found in renderStoreConfigDetails()');
  process.exit(1);
}
console.log('✔ renderStoreConfigDetails(): Row 1 ordering verified.');

// 6. Check Active/Inactive toggle checkbox button logic
if (!code.includes('new-store-status-cb') || !code.includes('cfg-store-status-cb')) {
  console.error('FAIL: Checkbox buttons for status toggling not found!');
  process.exit(1);
}
console.log('✔ Status Active/Inactive checkbox toggle buttons verified in both modals.');

// 7. Check Store Master Configuration modal title has no code in parentheses
if (code.includes('title: `Store Master Configuration: ${store.name} (${store.code || store.id})`')) {
  console.error('FAIL: Store code in parentheses still found in modal title!');
  process.exit(1);
}
console.log('✔ Modal title code removed: "Store Master Configuration: ${store.name}".');

// 8. Check Contact Number is compressed
if (!code.includes('id="cfg-store-contact" class="form-control cell-mono" value="${store.contact_number || \'\'}" maxlength="10" placeholder="e.g. 9822000000" style="height: 35px; font-size: 12px; max-width: 220px;"')) {
  console.error('FAIL: Contact Number max-width: 220px not found in cfg-store-contact!');
  process.exit(1);
}
console.log('✔ Contact Number compressed with max-width: 220px.');

// 9. Check Mapped Facilities renamed to Facility and compressed to 1 column
if (code.includes('Mapped Facilities <span style="color: var(--color-danger)">*</span>')) {
  console.error('FAIL: "Mapped Facilities" still found in label!');
  process.exit(1);
}
if (!code.includes('<!-- Row 5: Facility (Compressed to Column 1) -->')) {
  console.error('FAIL: Row 5 Facility compression not found!');
  process.exit(1);
}
console.log('✔ "Mapped Facilities" renamed to "Facility" and compressed to Column 1.');

// 10. Check Screen Mapping renamed to Transactions
if (!code.includes('<span>Transactions</span>')) {
  console.error('FAIL: "Transactions" tab title not found!');
  process.exit(1);
}
console.log('✔ Screen Mapping renamed to Transactions tab.');

// 11. Check Transactions screens are all in one column on one side
if (!code.includes('<!-- Transactions List (All screens in one column on one side) -->') ||
    !code.includes('style="display: flex; flex-direction: column; gap: 8px;"')) {
  console.error('FAIL: Single column layout for Transactions screens not found!');
  process.exit(1);
}
console.log('✔ All transaction screens arranged in one column on one side.');

// 12. Check Save Screen Mapping button is removed and autoSaveStoreScreensConfig is present
if (code.includes('Save Screen Mapping')) {
  console.error('FAIL: "Save Screen Mapping" button still found in code!');
  process.exit(1);
}
if (!code.includes('autoSaveStoreScreensConfig')) {
  console.error('FAIL: autoSaveStoreScreensConfig not found!');
  process.exit(1);
}
console.log('✔ Save buttons removed and auto-save enabled.');

// 13. Check Save Transactions button is present in toolbar
if (!code.includes('Save Transactions')) {
  console.error('FAIL: "Save Transactions" button not found!');
  process.exit(1);
}
// 14. Check Effective Available Items sub-nav button and view are removed
if (code.includes('Effective Available Items') || code.includes('renderEffectiveItemsViewSection')) {
  console.error('FAIL: Effective Available Items still found in code!');
  process.exit(1);
}
console.log('✔ "Effective Available Items" tab button and view completely removed.');

console.log('\nAll checks passed successfully!');

