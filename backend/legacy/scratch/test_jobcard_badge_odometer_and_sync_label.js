const fs = require('fs');
const assert = require('assert');

console.log('Testing updates: JC badge removal, Odometer size adjustment, and Sync Parts label change...\n');

const billingCode = fs.readFileSync('d:/Projects/ISCM/js/modules/billing.js', 'utf8');

// 1. Check Job Card badge removed from above Customer Complaints in Estimate tab
const inputIdx = billingCode.indexOf('id="estimate-customer-complaints"');
const headerIdx = billingCode.lastIndexOf('Customer Complaints & Instructions', inputIdx);
const complaintsHeaderSection = billingCode.slice(headerIdx, inputIdx);

assert(!complaintsHeaderSection.includes('📋'), 'Badge with 📋 must be removed from Customer Complaints header');
assert(!complaintsHeaderSection.includes('${activeEst.job_card_no}'), 'job_card_no badge must be removed from Customer Complaints header');
console.log('1. Job Card number badge (📋 JC/MSC1/2026/0029) removed from Customer Complaints header: ✓ PASS\n');

// 2. Check Odometer Reading size adjusted
const odoSection = billingCode.slice(
  billingCode.indexOf('<!-- 8. Odometer Reading -->'),
  billingCode.indexOf('<!-- ESTIMATE ITEMS -->')
);
assert(odoSection.includes('max-width: 135px') || odoSection.includes('max-width: 130px') || odoSection.includes('width: 130px'), 'Odometer input must have compact width');
assert(odoSection.includes('height: 24px') || odoSection.includes('height: 22px'), 'Odometer input must have compact height');
console.log('2. Odometer reading input size adjusted to compact width and height: ✓ PASS\n');

// 3. Check Sync Parts label on Estimate screen
const estSyncIdx = billingCode.lastIndexOf('manualSyncActiveEstimateParts');
const estSyncSection = billingCode.slice(estSyncIdx, estSyncIdx + 300);
assert(estSyncSection.includes('Sync Parts from JC'), 'Estimate screen button must read "Sync Parts from JC"');
assert(!estSyncSection.includes('Sync Parts from Job Card'), 'Old label "Sync Parts from Job Card" must not be present');
console.log('3. Label changed to "Sync Parts from JC" on Estimate screen: ✓ PASS\n');

// 4. Check Sync Parts label on Billing screen
const billSyncIdx = billingCode.lastIndexOf('manualSyncActiveBillParts');
const billSyncSection = billingCode.slice(billSyncIdx, billSyncIdx + 300);
assert(billSyncSection.includes('Sync Parts from JC'), 'Billing screen button must read "Sync Parts from JC"');
assert(!billSyncSection.includes('Sync Parts from Job Card'), 'Old label "Sync Parts from Job Card" must not be present on Billing screen');
console.log('4. Label changed to "Sync Parts from JC" on Billing screen: ✓ PASS\n');

console.log('🎉 ALL 4 TESTS PASSED SUCCESSFULLY!');
