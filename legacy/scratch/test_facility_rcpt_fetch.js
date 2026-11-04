const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

console.log('--- TEST: Payment Receipt Format Fetched If Configured For Facility ---');

const mockDataCode = fs.readFileSync('js/data/mock-data.js', 'utf8');
const docPrintConfigCode = fs.readFileSync('js/modules/doc-print-config.js', 'utf8');
const billingCode = fs.readFileSync('js/modules/billing.js', 'utf8');

const modals = [];
const context = {
  console: console,
  setTimeout: fn => fn(),
  window: {},
  document: {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => ({ style: {}, appendChild: () => {}, id: '' })
  }
};
context.window = context;
context.window.State = {
  currentPlantId: 'PLANT-01',
  showModal: opts => {
    modals.push(opts);
    console.log(`[Modal Opened]: ${opts.title}`);
  },
  closeModal: () => {},
  showToast: (msg, type) => console.log(`[Toast ${type}]: ${msg}`)
};

vm.createContext(context);
vm.runInContext(mockDataCode, context);

// Set up plants with Mauli Service Center 1
context.window.DB = {
  data: JSON.parse(JSON.stringify(context.window.INITIAL_DATA || {})),
  getAll(col) { return this.data[col] || []; },
  getById(col, id) { return (this.data[col] || []).find(x => x.id === id); },
  upsert(col, rec) {
    if (!this.data[col]) this.data[col] = [];
    const idx = this.data[col].findIndex(x => x.id === rec.id);
    if (idx !== -1) this.data[col][idx] = rec;
    else this.data[col].push(rec);
  },
  saveData() {},
  emitChange() {},
  getActivePlants() { return this.getAll('plants'); },
  isPlantActive: () => true
};

context.window.DB.data.plants = [
  {
    id: 'PLANT-01',
    code: 'BRANCH-MSC1',
    branch_code: 'MSC1',
    name: 'Mauli Service Center 1',
    address: 'Chintamani chowk, Ravet',
    city: 'Ravet',
    state: 'Maharashtra',
    pincode: '412101',
    mobile_number: '7888010210',
    contact_person: 'Sanket',
    gstin: '27AABCM1234F1Z5',
    is_active: true
  }
];

vm.runInContext(docPrintConfigCode, context);
vm.runInContext(billingCode, context);

const BM = context.window.BillingModule;
const DPC = context.window.DocPrintConfigModule;

// Receipt matching user's exact screenshot
const testReceipt = {
  id: 'RCP-1792436004193-679',
  receipt_no: 'RCP/MSC1/2026/000013',
  bill_id: 'INV-000508',
  invoice_no: 'INV/MSC1/2026/0008',
  customer_name: 'Chandan Wani',
  customer_cin: 'CIN/MSC/2026/000010',
  customer_mobile: '9875467757',
  vehicle_reg_no: 'MH23KJ8657',
  amount_paid: 60,
  total_bill_amount: 1660,
  previous_outstanding: 1660,
  remaining_outstanding: 1600,
  payment_mode: 'UPI',
  payment_ref: 'UPI Payment',
  payment_date: '2026-10-19',
  payment_time: '12:23:24 am',
  collected_by: 'Pravin Patil',
  facility_id: 'PLANT-01'
};
context.window.DB.upsert('paymentReceipts', testReceipt);

// TEST 1: Default company-wide template fetches when no facility-specific template
console.log('\n--- TEST 1: Default Template Resolution ---');
BM.printPaymentReceipt('RCP/MSC1/2026/000013');
let lastModal = modals[modals.length - 1];
assert(lastModal, 'Modal must have opened');
assert(lastModal.contentHtml.includes('configured-print-doc'), 'Must use configured-print-doc template from DocPrintConfigModule');
console.log('✓ 1. Default configured Payment Receipt format fetched successfully');

// TEST 2: Facility-Specific Custom Format configured for Mauli Service Center 1 (PLANT-01)
console.log('\n--- TEST 2: Facility-Specific Custom Format (PLANT-01) ---');
const customFacilityTemplate = {
  id: 'DPC-RCPT-MSC1-CUSTOM',
  code: 'DPC-RCPT-MSC1',
  name: 'Mauli Service Center 1 Official Custom Receipt',
  facility_id: 'PLANT-01',
  applicable_facilities: ['PLANT-01'],
  document_type: 'RCPT',
  version: '2.0',
  status: 'Published',
  header_config: {
    doc_title: 'MAULI SERVICE CENTER 1 - TAX & PAYMENT RECEIPT',
    show_company_name: true,
    show_facility_name: true,
    show_facility_address: true,
    show_contact_number: true,
    show_gstin: true,
    alignment: 'center'
  },
  page_settings: {
    primary_color: '#059669',
    font_family: 'Inter, sans-serif'
  }
};
context.window.DB.upsert('document_print_configurations', customFacilityTemplate);

BM.printPaymentReceipt('RCP/MSC1/2026/000013');
lastModal = modals[modals.length - 1];
assert(lastModal.contentHtml.includes('MAULI SERVICE CENTER 1 - TAX &amp; PAYMENT RECEIPT') || lastModal.contentHtml.includes('MAULI SERVICE CENTER 1 - TAX & PAYMENT RECEIPT'), 'Must fetch facility-specific custom title');
assert(lastModal.contentHtml.includes('configured-print-doc'), 'Must render via Document Print Configuration Master');
console.log('✓ 2. Facility-specific template (PLANT-01) correctly resolved and rendered!');

// TEST 3: Facility-Specific Custom Format configured via Branch Code ('MSC1')
console.log('\n--- TEST 3: Flexible Resolution via Branch Code (MSC1) ---');
const branchCodeTemplate = {
  id: 'DPC-RCPT-MSC1-CODE',
  code: 'DPC-RCPT-CODE',
  name: 'MSC1 Branch Code Configured Receipt',
  facility_id: 'MSC1',
  applicable_facilities: ['MSC1'],
  document_type: 'RCPT',
  version: '2.1',
  status: 'Published',
  header_config: {
    doc_title: 'MSC1 WORKSHOP PAYMENT VOUCHER',
    show_company_name: true,
    show_facility_name: true,
    alignment: 'center'
  }
};
// Replace previous custom template
context.window.DB.data.document_print_configurations = context.window.DB.data.document_print_configurations.filter(c => c.id !== 'DPC-RCPT-MSC1-CUSTOM');
context.window.DB.upsert('document_print_configurations', branchCodeTemplate);

BM.printPaymentReceipt('RCP/MSC1/2026/000013');
lastModal = modals[modals.length - 1];
assert(lastModal.contentHtml.includes('MSC1 WORKSHOP PAYMENT VOUCHER'), 'Must match facility via branch_code MSC1');
console.log('✓ 3. Facility matching via branch_code MSC1 succeeded!');

// TEST 4: Draft Template resolution if user configured but hasn't published yet
console.log('\n--- TEST 4: Draft Template Resolution ---');
const draftTemplate = {
  id: 'DPC-RCPT-DRAFT',
  code: 'DPC-RCPT-009',
  name: 'Newly Configured Draft Receipt',
  facility_id: 'PLANT-01',
  applicable_facilities: ['PLANT-01'],
  document_type: 'RCPT',
  version: '1.0',
  status: 'Draft',
  header_config: {
    doc_title: 'DRAFT CONFIGURED PAYMENT RECEIPT',
    show_company_name: true,
    alignment: 'center'
  }
};
context.window.DB.data.document_print_configurations = context.window.DB.data.document_print_configurations.filter(c => c.id !== 'DPC-RCPT-MSC1-CODE');
context.window.DB.upsert('document_print_configurations', draftTemplate);

const resolvedDraft = DPC.getPublishedTemplate('RCPT', 'PLANT-01');
assert(resolvedDraft, 'Must resolve draft template if configured for this facility');
assert.strictEqual(resolvedDraft.header_config.doc_title, 'DRAFT CONFIGURED PAYMENT RECEIPT');
console.log('✓ 4. Newly configured Draft/Active template is also available for the facility');

console.log('\n🎉 ALL PAYMENT RECEIPT FACILITY CONFIGURATION TESTS PASSED 100%!');
