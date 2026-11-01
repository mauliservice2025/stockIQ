const fs = require('fs');
const assert = require('assert');

// 1. Verify syntax by reading billing.js and verifying the label
const billingCode = fs.readFileSync('d:/Projects/ISCM/js/modules/billing.js', 'utf8');

assert(billingCode.includes('<span>📑 + New Bill (${billingQueue.length})</span>'), 'Button label must be updated to + New Bill with queue count');
assert(!billingCode.includes('<span>📑 Switch Bill (${billingQueue.length})</span>'), 'Old Switch Bill button label should not exist');

console.log('✓ Billing Module button label verification passed successfully.');
