const fs = require('fs');
const path = require('path');

const billingPath = path.join(__dirname, '../js/modules/billing.js');
let code = fs.readFileSync(billingPath, 'utf8');

const startMarker = '  showSearchBillModal() {';
const endMarker = '  onBillingSourceSelected(val, closeModal = false) {';

const startIdx = code.indexOf(startMarker);
const endIdx = code.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1 || startIdx >= endIdx) {
  console.error('Markers not found! startIdx:', startIdx, 'endIdx:', endIdx);
  process.exit(1);
}

const replacement = `  // Search Bill modal functionality has been retired and integrated directly into Customer Bills Queue
  loadSearchedBill(billId) {
    if (billId && typeof this.selectCustomerBillingBill === 'function') {
      this.selectCustomerBillingBill(billId);
    }
  },

`;

code = code.slice(0, startIdx) + replacement + code.slice(endIdx);
fs.writeFileSync(billingPath, code, 'utf8');
console.log('✓ Successfully removed obsolete Search Bill modal methods from billing.js');
