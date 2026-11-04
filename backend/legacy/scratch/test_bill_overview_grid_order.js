const assert = require('assert');

global.window = global;
global.window.DB = {
  finalBills: [
    {
      id: 'INV-001',
      invoice_no: 'INV/MSC1/2026/0016',
      job_card_no: 'JC/MSC1/2026/0023',
      customer_cin: 'CIN/MSC/2026/000018',
      vehicle_reg_no: 'MH25HK2342',
      vehicle_model: 'Activa 6G',
      customer_name: 'Sharad Bhujbal',
      customer_mobile: '7657676767',
      service_type: 'General Service',
      odometer_km: '—',
      next_service_due_date: '2026-11-30',
      next_service_after_km: 3000,
      items: [],
      grand_total: 500,
      amount_paid: 100
    }
  ],
  getAll(t) { return this[t] || []; },
  getById(t, id) { return (this[t] || []).find(r => r.id === id); }
};
let modalCaptured = null;
global.window.State = {
  showModal(opts) { modalCaptured = opts; },
  showToast() {}
};

require('../js/modules/billing.js');
window.BillingModule.viewBillDetails('INV-001');

const html = modalCaptured.contentHtml;
const fieldTitles = [];
const regex = /letter-spacing: 0\.4px;\">\s*([^<]+)\s*<\/div>/g;
let match;
while ((match = regex.exec(html)) !== null) {
  fieldTitles.push(match[1].trim());
}

console.log('Bill Overview Grid Field Order:');
fieldTitles.forEach((t, i) => {
  console.log(`  ${i + 1}. [Row ${Math.floor(i / 5) + 1}, Col ${(i % 5) + 1}]: ${t}`);
});

assert.strictEqual(fieldTitles[0], 'REGISTERED JOB CARD');
assert.strictEqual(fieldTitles[1], 'BILL NO.');
assert.strictEqual(fieldTitles[2], 'CUSTOMER CIN');
assert.strictEqual(fieldTitles[3], 'VEHICLE REG NO.');
assert.strictEqual(fieldTitles[4], 'NEXT SERVICING DUE'); // Col 5 Row 1
assert.strictEqual(fieldTitles[5], 'CUSTOMER NAME');      // Col 1 Row 2
assert.strictEqual(fieldTitles[6], 'MOBILE NUMBER');      // Col 2 Row 2
assert.strictEqual(fieldTitles[7], 'SERVICE TYPE');       // Col 3 Row 2
assert.strictEqual(fieldTitles[8], 'ODOMETER READING');   // Col 4 Row 2
assert.strictEqual(fieldTitles[9], 'NEXT SERVICING AFTER KM'); // Col 5 Row 2

console.log('\n✓ Verified: NEXT SERVICING DUE is at Col 5 Row 1, and CUSTOMER NAME is at Col 1 Row 2!');
