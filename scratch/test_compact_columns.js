const fs = require('fs');

console.log('--- Checking CSS in components.css ---');
const compCss = fs.readFileSync('./css/components.css', 'utf8');

const hasColOdoCss = compCss.includes('.data-table th.col-odo');
const hasColPartsCss = compCss.includes('.data-table th.col-parts');
const hasColStatusCss = compCss.includes('.data-table th.col-status');

console.log('PASS: Has .col-odo CSS rule:', hasColOdoCss);
console.log('PASS: Has .col-parts CSS rule:', hasColPartsCss);
console.log('PASS: Has .col-status CSS rule:', hasColStatusCss);

console.log('\n--- Checking billing.js table layout ---');
const billingJs = fs.readFileSync('./js/modules/billing.js', 'utf8');

const hasOdoTh = billingJs.includes('<th class="col-odo"');
const hasOdoTd = billingJs.includes('<td class="col-odo"');
const hasPartsTh = billingJs.includes('<th class="col-parts"');
const hasPartsTd = billingJs.includes('<td class="col-parts"');
const hasStatusTh = billingJs.includes('<th class="col-status"');
const hasStatusTd = billingJs.includes('<td class="col-status"');

console.log('PASS: Has <th class="col-odo">: ', hasOdoTh);
console.log('PASS: Has <td class="col-odo">: ', hasOdoTd);
console.log('PASS: Has <th class="col-parts">: ', hasPartsTh);
console.log('PASS: Has <td class="col-parts">: ', hasPartsTd);
console.log('PASS: Has <th class="col-status">: ', hasStatusTh);
console.log('PASS: Has <td class="col-status">: ', hasStatusTd);

if (!hasColOdoCss || !hasColPartsCss || !hasColStatusCss || !hasOdoTh || !hasOdoTd || !hasPartsTh || !hasPartsTd || !hasStatusTh || !hasStatusTd) {
  throw new Error('Verification failed!');
}

console.log('\nAll checks passed successfully!');
