const fs = require('fs');
const assert = require('assert');

// Mock window and DB
const mockEstimate = {
  id: 'EST/MSC1/2026/0011',
  estimate_no: 'EST/MSC1/2026/0011',
  job_card_id: 'JC-001',
  job_card_no: 'JC/MSC1/2026/0016',
  customer_name: 'Ganesh Kale',
  mobile_number: '8765434567',
  vehicle_no: 'MH12GH5676',
  vehicle_model: 'Activa 6G',
  odometer_reading: '10,000 km',
  service_type: 'General Service',
  status: 'READY_FOR_APPROVAL',
  estimated_total: 650,
  taxable_amount: 650,
  tax_amount: 0,
  items: [
    { item_code: '2W-SPR-ENGINE-GASKET-KIT-006', description: 'Engine Gasket Kit', type: 'PART', quantity: 1, rate: 150, amount: 150 },
    { item_code: 'LBR-002', description: 'General Service Labour', type: 'LABOUR', quantity: 2, rate: 250, amount: 500 }
  ]
};

global.window = {
  DB: {
    getAll: (tbl) => {
      if (tbl === 'billingEstimates' || tbl === 'estimates') return [mockEstimate];
      if (tbl === 'jobCards') return [{ id: 'JC-001', job_card_no: 'JC/MSC1/2026/0016', complaints: '' }];
      if (tbl === 'users') return [];
      return [];
    },
    getById: (tbl, id) => (id === mockEstimate.id ? mockEstimate : null),
    getDefaultTax: () => ({ rate: 0 }),
    getTaxByRate: () => ({ rate: 0 })
  },
  State: {
    showToast: () => {},
    showModal: () => {}
  }
};

eval(fs.readFileSync('js/modules/billing.js', 'utf8'));

console.log('--- TESTING ESTIMATE READY FOR CUSTOMER APPROVAL SECTION F ---');
const html = window.BillingModule.renderEstimatesTab();

// 1. Verify wrapped notification
assert(html.includes('📢 Status: Ready for Customer Approval'), 'Status text must be present');
assert(html.includes('Awaiting customer confirmation'), 'Sub-text must be present');
assert(html.includes('background: rgba(59, 130, 246, 0.08)'), 'Notification should be wrapped with theme tinted background');
assert(html.includes('border: 1px solid rgba(59, 130, 246, 0.28)'), 'Notification should be wrapped with theme border');
assert(html.includes('flex-direction: column'), 'Notification should be stacked vertically (2 lines)');
assert(html.includes('max-width: 320px'), 'Notification should have compact max-width to avoid pushing buttons to second line');
assert(html.includes('padding: 6px 14px'), 'Notification should have compact padding');
assert(html.includes('border-radius: var(--radius-sm)'), 'Notification should have rounded corners');
console.log('✓ Status notification is properly wrapped in a two-line vertical container badge!');

// 2. Verify buttons moved to the right
assert(html.includes('justify-content: flex-end'), 'Buttons container must have justify-content: flex-end');
assert(html.includes('margin-left: auto'), 'Buttons container must have margin-left: auto to push it to the right');
assert(html.includes('Print Quotation'), 'Print Quotation button present');
assert(html.includes('WhatsApp Share'), 'WhatsApp Share button present');
assert(html.includes('Revise Estimate'), 'Revise Estimate button present');
assert(html.includes('Customer Rejected'), 'Customer Rejected button present');
assert(html.includes('Customer Approved'), 'Customer Approved button present');
console.log('✓ Action buttons have justify-content: flex-end and margin-left: auto (aligned to the right)!');

// 3. Test other statuses (isApproved, isSubmitted, isConverted)
mockEstimate.status = 'CUSTOMER_APPROVED';
const htmlApproved = window.BillingModule.renderEstimatesTab();
assert(htmlApproved.includes('🎉 Status: Customer Approved'), 'Approved status wrapped');
assert(htmlApproved.includes('justify-content: flex-end; margin-left: auto'), 'Approved buttons moved to right');
console.log('✓ Customer Approved status is wrapped and buttons aligned to right!');

mockEstimate.status = 'SUBMITTED';
const htmlSubmitted = window.BillingModule.renderEstimatesTab();
assert(htmlSubmitted.includes('📤 Status: Submitted'), 'Submitted status wrapped');
assert(htmlSubmitted.includes('justify-content: flex-end; margin-left: auto'), 'Submitted buttons moved to right');
console.log('✓ Submitted status is wrapped and buttons aligned to right!');

console.log('\nALL ESTIMATE NOTIFICATION WRAP & BUTTON POSITIONING TESTS PASSED! ✔');
