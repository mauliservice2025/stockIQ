const fs = require('fs');
const assert = require('assert');

const mastersJs = fs.readFileSync('d:/Projects/ISCM/js/modules/masters.js', 'utf8').replace(/\r\n/g, '\n');

// 1. Verify new-sup-code-feedback is removed
assert(!mastersJs.includes('id="new-sup-code-feedback"'), 'new-sup-code-feedback element must be removed');

// 2. Verify Fetch from Address Master button is removed
assert(!mastersJs.includes('Fetch from Address Master'), 'Fetch from Address Master button must be removed');

// 3. Verify address feedback banners are removed
assert(!mastersJs.includes('id="new-sup-address-feedback"'), 'new-sup-address-feedback element must be removed');
assert(!mastersJs.includes('id="edit-sup-address-feedback"'), 'edit-sup-address-feedback element must be removed');

// 4. Verify checkVendorCodeUnique does not inject warning messages
assert(!mastersJs.includes('Duplicate Vendor Code! "${trimmed}"'), 'Inline duplicate vendor code message must not be in checkVendorCodeUnique');

console.log('✓ All Vendor UI clean-up tests passed successfully!');
