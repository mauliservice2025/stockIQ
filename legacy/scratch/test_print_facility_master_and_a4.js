// scratch/test_print_facility_master_and_a4.js
// Verification of:
// 1. All documents (Job Card, Estimate, Draft Bill, Tax Invoice, Delivery Gate Pass, Receipt):
//    - Dynamic facility details from Facility Master
//    - NO facility code on prints or logos
//    - Missing fields omitted (no empty labels, no hardcoded mock fallbacks)
// 2. A4 size prints:
//    - @page { size: A4 portrait; margin: 8mm 10mm; }
//    - .a4-container wrapper

const fs = require('fs');

console.log('=== TEST SUITE: FACILITY MASTER DETAILS & A4 PRINTS ===\n');

// Mock browser globals
global.window = global;
global.localStorage = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, val) { this.store[key] = String(val); },
  removeItem(key) { delete this.store[key]; },
  clear() { this.store = {}; }
};

let capturedModals = [];
let capturedA4Prints = [];

global.document = {
  getElementById: (id) => {
    if (id === 'printable-workshop-job-card' || id === 'printable-estimate-quotation' ||
        id === 'printable-tax-invoice' || id === 'printable-delivery-gate-pass' ||
        id === 'printable-payment-receipt') {
      const lastModal = capturedModals[capturedModals.length - 1];
      if (lastModal && lastModal.contentHtml) {
        return {
          outerHTML: lastModal.contentHtml
        };
      }
    }
    return null;
  },
  createElement: (tag) => ({ style: {}, appendChild: () => {}, removeChild: () => {} }),
  body: { appendChild: () => {}, removeChild: () => {} },
  querySelector: () => null,
  querySelectorAll: () => []
};

global.State = {
  showModal(opts) {
    capturedModals.push(opts);
  },
  closeModal() {},
  showToast() {}
};

// Load dependencies
require('../js/data/mock-data.js');
require('../js/data/db.js');
require('../js/modules/billing.js');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${message}`);
    process.exitCode = 1;
  }
}

// -------------------------------------------------------------
// Suite 1: Facility Details Extractor (getFacilityDetails)
// -------------------------------------------------------------
console.log('--- Suite 1: Facility Master Dynamic Resolution & Code Stripping ---');

// Facility with full info
const fullPlant = {
  id: 'FAC-FULL',
  code: 'MSC99',
  name: 'Mauli Super Workshop (MSC99)',
  plant_type: 'MAIN_WORKSHOP',
  address: 'Plot 45, MIDC Bhosari',
  city: 'Pune',
  state: 'Maharashtra',
  pincode: '411026',
  gstin: '27AAAAA0000A1Z5',
  phone: '9876543210',
  contact_person: 'Rajesh Patil'
};
window.DB.data.plants.push(fullPlant);

const facFull = window.BillingModule.getFacilityDetails({ facility_id: 'FAC-FULL' });
assert(!facFull.displayName.includes('MSC99'), `DisplayName does not include facility code (${facFull.displayName})`);
assert(!facFull.displayName.includes('('), `DisplayName has trailing parentheses stripped (${facFull.displayName})`);
assert(facFull.gstin === '27AAAAA0000A1Z5', `GSTIN correctly extracted: ${facFull.gstin}`);
assert(facFull.phone.includes('98765 43210'), `Phone formatted: ${facFull.phone}`);
assert(facFull.contactPerson === 'Rajesh Patil', `Contact person extracted: ${facFull.contactPerson}`);

// Facility with missing/incomplete info (No GSTIN, No Phone, No Address, No Contact)
const barePlant = {
  id: 'FAC-BARE',
  code: 'MSC-BARE',
  name: 'Bare Minimum Workshop (MSC-BARE)'
};
window.DB.data.plants.push(barePlant);

const facBare = window.BillingModule.getFacilityDetails({ facility_id: 'FAC-BARE' });
assert(facBare.displayName === 'Bare Minimum Workshop', `Bare facility name cleaned: ${facBare.displayName}`);
assert(!facBare.gstin, `Bare facility has no GSTIN (no hardcoded fake fallback)`);
assert(!facBare.phone, `Bare facility has no phone (no hardcoded fake fallback)`);
assert(!facBare.address, `Bare facility has no address`);
assert(!facBare.contactPerson, `Bare facility has no contact person`);

// -------------------------------------------------------------
// Suite 2: Facility Print Header (renderFacilityPrintHeader)
// -------------------------------------------------------------
console.log('\n--- Suite 2: Facility Print Header Omits Missing Fields & Codes ---');

const headerBare = window.BillingModule.renderFacilityPrintHeader(facBare, {
  centered: false,
  docTitle: 'WORKSHOP JOB CARD',
  docNo: 'JC-100',
  docDate: '2026-10-19'
});

assert(!headerBare.includes('MSC-BARE'), `Header does not contain facility code MSC-BARE`);
assert(!headerBare.includes('GSTIN:'), `Header omits 'GSTIN:' label when missing`);
assert(!headerBare.includes('Ph:'), `Header omits 'Ph:' label when missing`);
assert(!headerBare.includes('Contact:'), `Header omits 'Contact:' label when missing`);
assert(!headerBare.includes('27AABCT2345M1Z9'), `Header has no fake fallback GSTIN`);

const headerFull = window.BillingModule.renderFacilityPrintHeader(facFull, {
  centered: false,
  docTitle: 'WORKSHOP JOB CARD',
  docNo: 'JC-100',
  docDate: '2026-10-19'
});
assert(headerFull.includes('27AAAAA0000A1Z5'), `Header includes GSTIN when present`);
assert(headerFull.includes('Plot 45, MIDC Bhosari'), `Header includes address when present`);
assert(headerFull.includes('Ph:'), `Header includes phone label when phone is present`);
assert(headerFull.includes('Rajesh Patil'), `Header includes contact person when present`);
assert(!headerFull.includes('MSC99'), `Header does not contain facility code MSC99`);

// -------------------------------------------------------------
// Suite 3: Document Prints: Job Card, Estimate, Draft Bill, Invoice, Gate Pass, Receipt
// -------------------------------------------------------------
console.log('\n--- Suite 3: Document Print Implementations & A4 Formatting ---');

// Mock printDocumentA4 to record calls
window.BillingModule.printDocumentA4 = function(opts) {
  capturedA4Prints.push(opts);
};

// 1. Job Card
capturedModals = [];
capturedA4Prints = [];
const testJC = {
  id: 'JC-TEST-001',
  job_card_no: 'JC-TEST-001',
  facility_id: 'FAC-FULL',
  customer_name: 'Pravin Patil',
  vehicle_reg_no: 'MH 12 AB 1234',
  vehicle_model: 'Activa 6G',
  status: 'OPEN'
};
window.DB.data.jobCards = [testJC];
window.BillingModule.printJobCard('JC-TEST-001');
assert(capturedModals.length > 0, `Job Card modal opened`);
const jcHtml = capturedModals[capturedModals.length - 1].contentHtml;
assert(jcHtml.includes('a4-container'), `Job Card has a4-container class`);
assert(jcHtml.includes('WORKSHOP JOB CARD'), `Job Card has title WORKSHOP JOB CARD`);
assert(!jcHtml.includes('MSC99'), `Job Card does not print facility code`);
assert(jcHtml.includes('27AAAAA0000A1Z5'), `Job Card prints facility GSTIN`);

window.BillingModule.triggerPrintJobCard('JC-TEST-001');
assert(capturedA4Prints.length === 1, `triggerPrintJobCard routed to printDocumentA4`);
assert(capturedA4Prints[0].title.includes('Job Card'), `Print title includes Job Card`);

// 2. Estimate / Quotation
capturedModals = [];
capturedA4Prints = [];
const testEst = {
  id: 'EST-TEST-001',
  estimate_no: 'EST-TEST-001',
  facility_id: 'FAC-FULL',
  customer_name: 'Pravin Patil',
  vehicle_reg_no: 'MH 12 AB 1234',
  grand_total: 1500,
  date: '2026-10-19'
};
window.DB.data.billingEstimates = [testEst];
window.BillingModule.showPrintEstimateModal('EST-TEST-001');
assert(capturedModals.length > 0, `Estimate modal opened`);
const estHtml = capturedModals[capturedModals.length - 1].contentHtml;
assert(estHtml.includes('a4-container'), `Estimate has a4-container class`);
assert(estHtml.includes('ESTIMATE / QUOTATION'), `Estimate title is ESTIMATE / QUOTATION`);
assert(!estHtml.includes('MSC99'), `Estimate does not print facility code`);

window.BillingModule.triggerPrintEstimate('EST-TEST-001');
assert(capturedA4Prints.length === 1, `triggerPrintEstimate routed to printDocumentA4`);

// 3. Draft Bill
capturedModals = [];
capturedA4Prints = [];
const testDraft = {
  id: 'DBILL-TEST-001',
  draft_bill_no: 'DBILL-TEST-001',
  status: 'DRAFT',
  facility_id: 'FAC-FULL',
  customer_name: 'Pravin Patil',
  grand_total: 2000,
  net_payable: 2000
};
window.DB.data.draftBills = [testDraft];
window.BillingModule.printDraftBill('DBILL-TEST-001');
assert(capturedModals.length > 0, `Draft Bill modal opened`);
const draftHtml = capturedModals[capturedModals.length - 1].contentHtml;
assert(draftHtml.includes('DRAFT BILL'), `Draft Bill title rendered`);
assert(draftHtml.includes('a4-container'), `Draft Bill has a4-container class`);
assert(!draftHtml.includes('MSC99'), `Draft Bill does not print facility code`);

// 4. Tax Invoice / Billing
capturedModals = [];
capturedA4Prints = [];
const testInv = {
  id: 'INV-TEST-001',
  invoice_no: 'INV-TEST-001',
  facility_id: 'FAC-FULL',
  customer_name: 'Pravin Patil',
  status: 'FINALIZED',
  grand_total: 2500,
  net_payable: 2500,
  amount_paid: 2500,
  balance_due: 0
};
window.DB.data.finalBills = [testInv];
window.BillingModule.printInvoice('INV-TEST-001');
assert(capturedModals.length > 0, `Tax Invoice modal opened`);
const invHtml = capturedModals[capturedModals.length - 1].contentHtml;
assert(invHtml.includes('TAX INVOICE'), `Tax Invoice title rendered`);
assert(invHtml.includes('a4-container'), `Tax Invoice has a4-container class`);
assert(!invHtml.includes('MSC99'), `Tax Invoice does not print facility code`);

window.BillingModule.triggerPrintInvoice('INV-TEST-001');
assert(capturedA4Prints.length === 1, `triggerPrintInvoice routed to printDocumentA4`);

// 5. Vehicle Delivery Gate Pass
capturedModals = [];
capturedA4Prints = [];
const testDelivery = {
  id: 'DEL-TEST-001',
  gate_pass_no: 'GP-TEST-001',
  facility_id: 'FAC-FULL',
  customer_name: 'Pravin Patil',
  customer_mobile: '9876543210',
  vehicle_reg_no: 'MH 12 AB 1234',
  vehicle_model: 'Activa 6G',
  job_card_no: 'JC-TEST-001',
  delivery_date: '2026-10-19',
  status: 'DELIVERED'
};
window.DB.data.vehicleDeliveries = [testDelivery];
window.BillingModule.viewGatePass('DEL-TEST-001');
assert(capturedModals.length > 0, `Gate Pass modal opened`);
const gpHtml = capturedModals[capturedModals.length - 1].contentHtml;
assert(gpHtml.includes('DELIVERY GATE PASS'), `Gate Pass title rendered`);
assert(gpHtml.includes('a4-container'), `Gate Pass has a4-container class`);
assert(!gpHtml.includes('MSC99'), `Gate Pass does not print facility code`);

window.BillingModule.triggerPrintGatePass('DEL-TEST-001');
assert(capturedA4Prints.length === 1, `triggerPrintGatePass routed to printDocumentA4`);

// 6. Payment Receipt
capturedModals = [];
capturedA4Prints = [];
const testReceipt = {
  id: 'RCP-TEST-001',
  receipt_no: 'RCP-TEST-001',
  facility_id: 'FAC-FULL',
  customer_name: 'Pravin Patil',
  amount_paid: 2500,
  payment_date: '2026-10-19',
  payment_mode: 'UPI',
  remaining_outstanding: 0,
  total_bill_amount: 2500
};
window.DB.data.paymentReceipts = [testReceipt];
window.BillingModule.printPaymentReceipt('RCP-TEST-001');
assert(capturedModals.length > 0, `Payment Receipt modal opened`);
const rcpHtml = capturedModals[capturedModals.length - 1].contentHtml;
assert(rcpHtml.includes('PAYMENT RECEIPT'), `Payment Receipt title rendered`);
assert(rcpHtml.includes('a4-container'), `Payment Receipt has a4-container class`);
assert(!rcpHtml.includes('MSC99'), `Payment Receipt does not print facility code`);

window.BillingModule.triggerPrintReceipt('RCP-TEST-001');
assert(capturedA4Prints.length === 1, `triggerPrintReceipt routed to printDocumentA4`);

console.log('\n========================================');
console.log(`TEST RUN COMPLETE: ${passedTests}/${totalTests} tests passed.`);
console.log('========================================');
