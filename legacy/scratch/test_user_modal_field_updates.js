const fs = require('fs');
const path = require('path');

const userMgmtCode = fs.readFileSync(path.join(__dirname, '../js/modules/user-management.js'), 'utf8');

console.log('Testing User Modal UI Updates...');

// 1. Fields Count check
if (userMgmtCode.includes('Fields 1 - 7') || userMgmtCode.includes('Fields 8 - 13')) {
  console.error('FAIL: "Fields 1 - 7" or "Fields 8 - 13" still present!');
  process.exit(1);
} else {
  console.log('✓ 1. Field count badges ("Fields 1 - 7", "Fields 8 - 13") removed.');
}

// 2. All Facilities chip check in renderFacilityChipsHtml
if (userMgmtCode.includes('<span>All Facilities</span>')) {
  console.error('FAIL: "<span>All Facilities</span>" chip still present in facility chips renderer!');
  process.exit(1);
} else {
  console.log('✓ 2. "All Facilities" chip removed from facility selector preview.');
}

// 3. Display Name not mandatory
if (userMgmtCode.includes('id="new-user-displayname" class="form-control" placeholder="Name shown in application" required') ||
    userMgmtCode.includes('id="edit-user-displayname" class="form-control" value="${user.display_name || user.full_name || user.username}" required') ||
    userMgmtCode.includes("window.State.showToast('Display Name is mandatory.', 'error');")) {
  console.error('FAIL: Display Name is still marked mandatory / required!');
  process.exit(1);
} else {
  console.log('✓ 3. Display Name is now optional (not mandatory).');
}

// 4. Zero-scroll footer tip check
if (userMgmtCode.includes('💡 Full screen view active with zero-scroll dashboard layout')) {
  console.error('FAIL: Zero-scroll dashboard layout tip still present in footer!');
  process.exit(1);
} else {
  console.log('✓ 4. "💡 Full screen view active with zero-scroll dashboard layout" removed.');
}

// 5. Password placeholder check
if (userMgmtCode.includes('New password (blank = keep)') || userMgmtCode.includes('blank = key')) {
  console.error('FAIL: Old password placeholder still present!');
  process.exit(1);
} else if (userMgmtCode.includes('id="edit-user-password"') && userMgmtCode.includes('placeholder="New password"')) {
  console.log('✓ 5. Password placeholder updated to "New password".');
} else {
  console.error('FAIL: Password placeholder "New password" not found!');
  process.exit(1);
}

console.log('\n🎉 ALL 5 USER MODAL UPDATES VERIFIED SUCCESSFULLY!');
