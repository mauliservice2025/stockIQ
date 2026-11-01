const fs = require('fs');

const fileContent = fs.readFileSync('d:/Projects/ISCM/js/modules/user-management.js', 'utf8');

console.log('Testing User Management Modal updates for Auth badge & Compact Field Sizes...\n');

// 1. Right Column • Auth badge removed
const hasBadge = fileContent.includes('Right Column &bull; Auth') || fileContent.includes('Right Column • Auth');
console.log(`1. 'Right Column • Auth' badge completely removed: ${!hasBadge ? '✓ PASS' : '✗ FAIL'}`);

// 2. Facility trigger button minimized to 24px
const hasCompactFacilityTrigger = fileContent.includes('id="${prefix}-facility-trigger"') && 
  fileContent.includes('height: 24px; font-size: 11px; padding: 2px 6px;');
console.log(`2. Facility selector trigger button minimized (24px, 11px font): ${hasCompactFacilityTrigger ? '✓ PASS' : '✗ FAIL'}`);

// 3. Compact 24px inputs and selects in both showCreateUserModal & showEditUserModal
const count24px = (fileContent.match(/height:\s*24px;\s*font-size:\s*11px;/g) || []).length;
console.log(`3. Compact fields (height: 24px, font-size: 11px) occurrences: ${count24px} (${count24px >= 28 ? '✓ PASS' : '✗ FAIL'})`);

// 4. Compact 3-Column Zero-Scroll Dashboard Layout grid & containers
const hasCompactGrid = fileContent.includes('grid-template-columns: repeat(3, 1fr); gap: 10px;') &&
  fileContent.includes('padding: 8px 10px; display: flex; flex-direction: column; gap: 6px;');
console.log(`4. Zero-scroll dashboard 3-column layout compacted (gap 10px, padding 8px 10px): ${hasCompactGrid ? '✓ PASS' : '✗ FAIL'}`);

if (!hasBadge && hasCompactFacilityTrigger && count24px >= 28 && hasCompactGrid) {
  console.log('\n🎉 ALL CHECKS PASSED SUCCESSFULLY!');
  process.exit(0);
} else {
  console.error('\n❌ SOME CHECKS FAILED!');
  process.exit(1);
}
