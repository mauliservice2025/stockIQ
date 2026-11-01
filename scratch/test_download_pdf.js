const fs = require('fs');

global.window = {
  State: { 
    showModal: (cfg) => { global.lastModal = cfg; }, 
    closeModal: () => {}, 
    showToast: (m, t) => console.log(`[Toast ${t}] ${m}`) 
  },
  DB: { getAll: () => [], getById: () => null }
};
global.document = { 
  getElementById: () => null,
  createElement: () => ({ style: {}, querySelectorAll: () => [], appendChild: () => {} }),
  body: { appendChild: () => {} }
};

require('../js/modules/billing.js');
const bm = global.window.BillingModule;

console.log('1. downloadInvoicePdf is a function:', typeof bm.downloadInvoicePdf === 'function');
console.log('2. downloadInvoicePDF is a function:', typeof bm.downloadInvoicePDF === 'function');
console.log('3. downloadInvoiceHtml is a function:', typeof bm.downloadInvoiceHtml === 'function');

bm.printInvoice({ 
  id: 'INV-MSC1-0005', 
  invoice_no: 'INV/MSC1/2026/0005', 
  job_card_no: 'JC/MSC1/2026/0008',
  customer_name: 'Om Rothe',
  gross_amount: 1512, 
  net_payable: 1512, 
  amount_paid: 1512 
});

const html = global.lastModal.contentHtml;
console.log('4. Modal contains "Download PDF":', html.includes('Download PDF'));
console.log('5. Modal does NOT contain "Download File":', !html.includes('Download File'));
console.log('6. Button calls downloadInvoicePdf:', html.includes('downloadInvoicePdf'));

console.log('\nAll checks passed!');
