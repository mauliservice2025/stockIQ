const fs = require('fs');

global.window = {
  State: { currentPlantId: 'PLANT-01', currentUser: { role: 'Admin' } },
  DB: { getAll: () => [], getById: () => null }
};
global.document = { getElementById: () => null };
require('../js/modules/billing.js');
const bm = global.window.BillingModule;
const activeBill = { 
  id: 'BILL-1', 
  status: 'FINALIZED', 
  grand_total: 1512, 
  amount_paid: 1512, 
  balance_due: 0, 
  items: [],
  payment_history: [{ receipt_no: 'RCP-1', amount: 1512 }] 
};
bm.getActiveCustomerBillingBill = () => activeBill;
const html = bm.renderCustomerBillingSingleScreen();

console.log('1. Contains "Print Receipt":', html.includes('Print Receipt'));
console.log('2. Contains "Download PDF":', html.includes('Download PDF'));
console.log('3. Contains "Print Tax Invoice":', html.includes('Print Tax Invoice'));
console.log('4. Contains "WhatsApp Share":', html.includes('WhatsApp Share'));
console.log('5. Contains "Vehicle Delivery & Gate Pass":', html.includes('Vehicle Delivery & Gate Pass'));
console.log('6. Contains "Credit Note / Adjustment":', html.includes('Credit Note / Adjustment'));

// Test Draft bill view has "Create Final Bill"
const draftBill = { id: 'DBILL-99', status: 'DRAFT', grand_total: 1360, amount_paid: 0, balance_due: 1360, items: [] };
bm.getActiveCustomerBillingBill = () => draftBill;
const draftHtml = bm.renderCustomerBillingSingleScreen();
console.log('7. Draft view contains "Create Final Bill":', draftHtml.includes('Create Final Bill'));
console.log('8. Draft view does NOT contain "Review Final Bill":', !draftHtml.includes('Review Final Bill'));

if (!html.includes('Print Receipt') && !html.includes('Download PDF') && html.includes('Print Tax Invoice')) {
  console.log('\nSUCCESS: Both "Print Receipt" and "Download PDF" buttons have been successfully removed!');
} else {
  console.error('\nFAILURE: Unexpected buttons found.');
}
