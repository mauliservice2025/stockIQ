const fs = require('fs');
const assert = require('assert');

const billingJs = fs.readFileSync('d:/Projects/ISCM/js/modules/billing.js', 'utf8').replace(/\r\n/g, '\n');

// 1. Switch Estimate button removed
assert(!billingJs.includes('Switch Estimate'), 'Switch Estimate button must be removed from Estimate header');
assert(billingJs.includes('+ New Estimate'), '+ New Estimate button must remain in Estimate header');

// 2. Sync Parts from Job Card button only shown in Draft (before submission)
assert(billingJs.includes('(activeEst.job_card_id || activeEst.job_card_no) && isDraft'), 'Sync Parts button must have isDraft condition');

// 3. Guard in manualSyncActiveEstimateParts
assert(billingJs.includes("if (est.status !== 'DRAFT') {"), 'manualSyncActiveEstimateParts must check est.status !== DRAFT');

// 4. Revise Estimate creates DRAFT revision
assert(billingJs.includes("newRev.status = 'DRAFT';"), 'Revise Estimate must create clone in DRAFT status');

console.log('✓ All Estimate Switch and Sync rules tests passed successfully!');
