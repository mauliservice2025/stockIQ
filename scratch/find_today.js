const fs = require('fs');
const billingCode = fs.readFileSync('d:/Projects/ISCM/js/modules/billing.js', 'utf8');

const rx = /getTodayDateStr\s*\(/g;
let match;
while ((match = rx.exec(billingCode)) !== null) {
  const line = billingCode.substring(0, match.index).split('\n').length;
  console.log('getTodayDateStr at line', line);
}
