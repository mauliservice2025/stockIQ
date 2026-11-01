const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('VERIFYING WHATSAPP ESTIMATE SHARE FEATURE');
console.log('================================================================\n');

const billingJs = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');

// 1. Check shareEstimateWhatsApp definition
assert(billingJs.includes('shareEstimateWhatsApp(estId) {'), 'shareEstimateWhatsApp(estId) must be defined');
console.log('✓ PASS: shareEstimateWhatsApp method defined in billing.js');

// 2. Check WhatsApp URL generation
assert(billingJs.includes('https://wa.me/'), 'Must generate WhatsApp wa.me link');
assert(billingJs.includes('encodeURIComponent(message)'), 'Must encode message for WhatsApp URL');
console.log('✓ PASS: WhatsApp link generator formats message and phone number correctly');

// 3. Check WhatsApp Share button in isSubmitted status
const isSubmittedBlock = billingJs.match(/isSubmitted \? `([\s\S]*?)`\s*:\s*\(activeEst\.status === 'REJECTED'/);
assert(isSubmittedBlock, 'Could not locate isSubmitted block');
assert(isSubmittedBlock[1].includes('shareEstimateWhatsApp'), 'isSubmitted action bar must contain WhatsApp Share button');
assert(isSubmittedBlock[1].includes('📲 WhatsApp Share'), 'isSubmitted action bar must display "📲 WhatsApp Share"');
console.log('✓ PASS: "📲 WhatsApp Share" button present after estimate submission');

// 4. Check WhatsApp Share button in isReady and isApproved
const isReadyBlock = billingJs.match(/isReady \? `([\s\S]*?)`\s*:\s*\(isSubmitted/);
assert(isReadyBlock && isReadyBlock[1].includes('shareEstimateWhatsApp'), 'isReady block must contain WhatsApp Share button');
console.log('✓ PASS: WhatsApp Share button present in Ready for Customer Approval stage');

const isApprovedBlock = billingJs.match(/isApproved \? `([\s\S]*?)`\s*:\s*\(isReady/);
assert(isApprovedBlock && isApprovedBlock[1].includes('shareEstimateWhatsApp'), 'isApproved block must contain WhatsApp Share button');
console.log('✓ PASS: WhatsApp Share button present in Customer Approved stage');

// 5. Check WhatsApp Share button in showPrintEstimateModal
const printModalBlock = billingJs.match(/showPrintEstimateModal\(estId\) {([\s\S]*?)},[\s\r\n]+shareEstimateWhatsApp/);
assert(printModalBlock && printModalBlock[1].includes('shareEstimateWhatsApp'), 'Print quotation modal must contain WhatsApp Share button');
console.log('✓ PASS: WhatsApp Share button present in Print Quotation modal');

// 6. Test logic with simulated browser objects
let modalConfig = null;
global.window = {
  DB: {
    getById: (table, id) => {
      if (table === 'billingEstimates') {
        return {
          id: 'EST-TEST-001',
          estimate_no: 'EST/MSC1/2026/0002',
          customer_name: 'Pravin Patil',
          customer_cin: 'CIN-000126',
          customer_mobile: '9822119810',
          vehicle_reg_no: 'MH 12 AB 1234',
          vehicle_model: 'Honda Activa 6G',
          job_card_no: 'JC/MSC1/2026/0002',
          subtotal: 1030,
          discount_amount: 0,
          tax_amount: 0,
          estimated_total: 1030,
          items: [
            { name: 'Front Disc Brake Pad Set', qty: 1, rate: 380, amount: 380 },
            { name: 'General Service Labour', qty: 2, rate: 250, amount: 500 },
            { name: 'Break Check', qty: 1, rate: 150, amount: 150 }
          ],
          terms_and_remarks: 'Valid for 7 days.'
        };
      }
      return null;
    }
  },
  State: {
    showModal: (config) => {
      modalConfig = config;
    },
    closeModal: () => {}
  }
};

// Evaluate the method in VM context
const vm = require('vm');
const ctx = vm.createContext({
  window: global.window,
  console: console,
  encodeURIComponent: encodeURIComponent,
  Number: Number,
  Array: Array,
  Date: Date
});

const script = new vm.Script(`
  const BillingModule = {
    getActiveEstimate() { return null; },
    ${billingJs.slice(billingJs.indexOf('shareEstimateWhatsApp(estId) {'), billingJs.indexOf('showAddEstimateItemModal() {'))}
  };
  BillingModule.shareEstimateWhatsApp('EST-TEST-001');
`);

script.runInContext(ctx);

assert(modalConfig, 'Modal must have been opened by shareEstimateWhatsApp');
assert(modalConfig.title.includes('EST/MSC1/2026/0002'), 'Modal title must contain estimate number');
assert(modalConfig.contentHtml.includes('https://wa.me/919822119810'), 'Content must contain wa.me link for 9822119810');
assert(modalConfig.contentHtml.includes('Pravin Patil'), 'Content must show customer name');
assert(modalConfig.contentHtml.includes('Front Disc Brake Pad Set'), 'Content must include estimate items');
assert(modalConfig.contentHtml.includes('₹1,030.00'), 'Content must include formatted estimated total');

console.log('✓ PASS: Simulation successfully generated modal and WhatsApp URL:');
const urlMatch = modalConfig.contentHtml.match(/href="([^"]+)"/);
if (urlMatch) {
  console.log('  URL:', urlMatch[1].slice(0, 80) + '...');
}

console.log('\n================================================================');
console.log('🎉 ALL WHATSAPP ESTIMATE SHARE TESTS PASSED 100%!');
console.log('================================================================');
