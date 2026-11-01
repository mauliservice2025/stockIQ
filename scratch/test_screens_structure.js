const fs = require('fs');

const billingCode = fs.readFileSync('d:/Projects/ISCM/js/modules/billing.js', 'utf8');

const regexes = [
  /renderEstimatesTab\s*\(\)\s*\{/g,
  /renderCustomerBillingSingleScreen\s*\(\)\s*\{/g,
  /renderFinalBillsTab\s*\(\)\s*\{/g,
  /renderDeliveryTab\s*\(\)\s*\{/g
];

regexes.forEach(rx => {
  const match = rx.exec(billingCode);
  if (match) {
    const idx = match.index;
    const line = billingCode.substring(0, idx).split('\n').length;
    console.log(`Definition ${rx} at line ${line}`);
    // print next 40 lines
    const snippet = billingCode.substring(idx, idx + 1500);
    const tableMatches = snippet.match(/class=["'][^"']*(?:table-responsive|table-scroll-container|jobcard-table-scroll-container|content-card)[^"']*["']/g);
    console.log(`Classes used:`, tableMatches);
  }
});
