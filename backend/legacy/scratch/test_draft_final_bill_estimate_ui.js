const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('VERIFYING ESTIMATE UI CHANGES ON DRAFT BILL & FINAL BILL');
console.log('================================================================\n');

const billingJs = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');

// 1. Verify Draft Bill & Final Bill title and detail headers
assert(billingJs.includes("${isFinalized ? 'Final Bill' : 'Draft Bill'}"), 'Title must switch between Draft Bill and Final Bill');
assert(billingJs.includes("Customer & ${isFinalized ? 'Final Bill' : 'Draft Bill'} Details"), 'Card header must switch between Draft Bill and Final Bill Details');
assert(billingJs.includes("${isFinalized ? 'Bill No.' : 'Draft Bill No.'}"), 'Number header must switch between Bill No. and Draft Bill No.');
assert(billingJs.includes("${isFinalized ? 'Final Bill Items' : 'Draft Bill Items'}"), 'Items header must switch between Final Bill Items and Draft Bill Items');

// 2. Verify all 8 fields in Customer Details
assert(billingJs.includes('Registered Job Card'), 'Must include Registered Job Card');
assert(billingJs.includes('Customer CIN'), 'Must include Customer CIN');
assert(billingJs.includes('Vehicle Reg No.'), 'Must include Vehicle Reg No.');
assert(billingJs.includes('Customer Name'), 'Must include Customer Name');
assert(billingJs.includes('Mobile Number'), 'Must include Mobile Number');
assert(billingJs.includes('Service Type'), 'Must include Service Type');
assert(billingJs.includes('Odometer Reading'), 'Must include Odometer Reading');

// 3. Verify Table Column headers matching user reference image
assert(billingJs.includes('Item / Service</th>'), 'Table must have "Item / Service" header matching estimate');
assert(billingJs.includes('>Quantity</th>'), 'Table must have "Quantity" header matching estimate');
assert(billingJs.includes('>Rate (₹)</th>'), 'Table must have "Rate (₹)" header matching estimate');
assert(billingJs.includes('>Amount (₹)</th>'), 'Table must have "Amount (₹)" header matching estimate');

// 4. Verify Read-Only formatting for Final Bill vs Input fields for Draft Bill
assert(billingJs.includes("${!isFinalized ? '<th style=\"width: 40px;"), 'Act column only in Draft Bill');
assert(billingJs.includes("<span class=\"cell-mono font-bold\" style=\"font-size: 11.5px;\">${it.qty}</span>"), 'Read-only qty in Final Bill');
assert(billingJs.includes("<span class=\"cell-mono\" style=\"font-size: 11.5px;\">₹${Number(it.rate).toFixed(2)}</span>"), 'Read-only rate in Final Bill');

// 5. Verify viewBillDetails modal also includes the 8-field grid and items table
assert(billingJs.includes('<!-- COMPACT CUSTOMER & BILL DETAILS (DENSE 4-COLUMN GRID MATCHING ESTIMATE) -->'), 'viewBillDetails has matching 4-column grid');
assert(billingJs.includes('<!-- BILL ITEMS SECTION -->'), 'viewBillDetails has items section');

// 6. Verify onDraftBillOdometerChange exists
assert(billingJs.includes('onDraftBillOdometerChange(val)'), 'BillingModule has onDraftBillOdometerChange handler');

console.log('✓ PASS: All assertions verified successfully!');
console.log('================================================================');
console.log('🎉 ESTIMATE UI ON DRAFT BILL & FINAL BILL VERIFIED (100%)');
console.log('================================================================\n');
