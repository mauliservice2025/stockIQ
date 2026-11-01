const fs = require('fs');
const billingCode = fs.readFileSync('d:/Projects/ISCM/js/modules/billing.js', 'utf8');

const matches = billingCode.match(/(?:plant_id|facility_id|branch_id)\s*[:=]\s*[^,\n\r]+/g);
console.log('Matches:', matches ? matches.slice(0, 20) : null);
