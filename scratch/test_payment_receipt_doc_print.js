const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

console.log('--- TEST: Payment Receipt in Document Print Configuration Master ---');

const mockDataCode = fs.readFileSync('js/data/mock-data.js', 'utf8');
const docPrintConfigCode = fs.readFileSync('js/modules/doc-print-config.js', 'utf8');
const billingCode = fs.readFileSync('js/modules/billing.js', 'utf8');

const domModals = [];
const context = {
  console: console,
  setTimeout: (fn) => fn(),
  window: {},
  document: {
    getElementById: (id) => null,
    querySelector: () => null,
    createElement: (tag) => ({ style: {}, appendChild: () => {}, id: '' })
  }
};
context.window = context;
context.window.State = {
  showToast: (msg, type) => console.log(`[Toast ${type}]: ${msg}`),
  showModal: (opts) => {
    domModals.push(opts);
    console.log(`[Modal Opened]: ${opts.title}`);
  },
  closeModal: () => {}
};

vm.createContext(context);
vm.runInContext(mockDataCode, context);

// Mock DB
context.window.DB = {
  data: JSON.parse(JSON.stringify(context.window.INITIAL_DATA || {})),
  getAll(collection) {
    return this.data[collection] || [];
  },
  getById(collection, id) {
    return (this.data[collection] || []).find(x => x.id === id) || null;
  },
  upsert(collection, record) {
    if (!this.data[collection]) this.data[collection] = [];
    const idx = this.data[collection].findIndex(x => x.id === record.id);
    if (idx !== -1) {
      this.data[collection][idx] = record;
    } else {
      this.data[collection].push(record);
    }
  },
  getActivePlants() {
    return this.getAll('plants');
  },
  isPlantActive: () => true
};

vm.runInContext(docPrintConfigCode, context);
vm.runInContext(billingCode, context);

const DPC = context.window.DocPrintConfigModule;
assert(DPC, 'DocPrintConfigModule must be defined');

// 1. Verify DOC_TYPES has RCPT
const rcptType = DPC.DOC_TYPES.find(d => d.code === 'RCPT');
assert(rcptType, 'DOC_TYPES must contain code RCPT');
assert.strictEqual(rcptType.name, 'Payment Receipt');
assert.strictEqual(rcptType.icon, '🧾');
console.log('✓ 1. DOC_TYPES contains "Payment Receipt (RCPT)"');

// 2. Verify position directly following INV
const invIdx = DPC.DOC_TYPES.findIndex(d => d.code === 'INV');
const rcptIdx = DPC.DOC_TYPES.findIndex(d => d.code === 'RCPT');
assert.strictEqual(rcptIdx, invIdx + 1, 'RCPT must directly follow INV');
console.log('✓ 2. RCPT directly follows Final Bill (INV) in DOC_TYPES list');

// 3. Verify getAllConfigs returns published Payment Receipt template
const configs = DPC.getAllConfigs();
const rcptConfig = configs.find(c => c.document_type === 'RCPT');
assert(rcptConfig, 'Must have at least one Payment Receipt configuration');
assert.strictEqual(rcptConfig.status, 'Published');
assert.strictEqual(rcptConfig.facility_id, 'ALL');
console.log(`✓ 3. Published configuration found: ${rcptConfig.code} ("${rcptConfig.name}")`);

// 4. Verify getPublishedTemplate returns RCPT template
const published = DPC.getPublishedTemplate('RCPT', 'PLANT-01');
assert(published, 'getPublishedTemplate("RCPT", "PLANT-01") must return published template');
assert.strictEqual(published.document_type, 'RCPT');
console.log(`✓ 4. getPublishedTemplate resolved ${published.id} for facility PLANT-01`);

// 5. Test generatePrintHtml with sample payment receipt transaction
const sampleReceipt = {
  id: 'RCPT-2026-000001',
  receipt_no: 'RCPT/MSC1/2026/000001',
  payment_date: '2026-10-20',
  customer_name: 'Chandan Wani',
  customer_mobile: '9875467757',
  customer_cin: 'CIN/MSC/2026/000010',
  vehicle_reg_no: 'MH23KJ8657',
  vehicle_model: 'Honda Activa 6G',
  invoice_no: 'INV/MSC1/2026/000001',
  payment_mode: 'UPI',
  payment_ref: 'UPI-9876543210',
  total_bill_amount: 1210.00,
  previous_outstanding: 1210.00,
  amount_paid: 1210.00,
  remaining_outstanding: 0.00,
  collected_by: 'Santosh Shinde'
};

const printHtml = DPC.generatePrintHtml('RCPT', 'PLANT-01', sampleReceipt);
assert(printHtml, 'generatePrintHtml must return valid HTML string');
assert(printHtml.includes('PAYMENT RECEIPT'), 'Must include document title PAYMENT RECEIPT');
assert(printHtml.includes('RCPT/MSC1/2026/000001'), 'Must include receipt number');
assert(printHtml.includes('Chandan Wani'), 'Must include customer name');
assert(printHtml.includes('MH23KJ8657'), 'Must include vehicle reg');
assert(printHtml.includes('1,210.00'), 'Must include amount paid');
assert(printHtml.includes('UPI'), 'Must include payment mode');
console.log('✓ 5. generatePrintHtml successfully formatted Payment Receipt with all fields');

// 6. Test BillingModule.printPaymentReceipt uses DPC template
context.window.DB.data.paymentReceipts = [sampleReceipt];
context.window.BillingModule.printPaymentReceipt('RCPT/MSC1/2026/000001');

assert(domModals.length > 0, 'Modal must have opened');
const lastModal = domModals[domModals.length - 1];
assert(lastModal.title.includes('Payment Receipt: RCPT/MSC1/2026/000001'), 'Modal title must match receipt');
assert(lastModal.contentHtml.includes('configured-print-doc'), 'Must use configured-print-doc template from Document Print Configuration Master');
console.log('✓ 6. BillingModule.printPaymentReceipt fetched and rendered from Document Print Configuration Master!');

console.log('🎉 ALL PAYMENT RECEIPT DOCUMENT PRINT CONFIGURATION TESTS PASSED 100%!');
