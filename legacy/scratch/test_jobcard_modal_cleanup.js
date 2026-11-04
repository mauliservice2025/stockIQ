const fs = require('fs');

const billingJs = fs.readFileSync('./js/modules/billing.js', 'utf8');

const hasSeriesPattern = billingJs.includes('Series Pattern:');
console.log('PASS: Series Pattern removed:', !hasSeriesPattern);

const hasCustomerFeedbackDiv = billingJs.includes('new-jc-customer-feedback');
console.log('PASS: new-jc-customer-feedback removed:', !hasCustomerFeedbackDiv);

const hasAutoFetchedMsg = billingJs.includes('Auto-Fetched Customer Profile');
console.log('PASS: Auto-Fetched Customer Profile message removed:', !hasAutoFetchedMsg);

const hasShortPlaceholder = billingJs.includes('placeholder="e.g. Brake shoe worn out, oil degraded."');
console.log('PASS: Short diagnosis placeholder present:', hasShortPlaceholder);

const hasOldLongPlaceholder = billingJs.includes('Brake shoes worn out past safety mark');
console.log('PASS: Old long placeholder removed:', !hasOldLongPlaceholder);

if (hasSeriesPattern || hasCustomerFeedbackDiv || hasAutoFetchedMsg || !hasShortPlaceholder || hasOldLongPlaceholder) {
  throw new Error('Verification failed!');
}

console.log('\nAll checks passed successfully!');
