const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

console.log('=== TESTING NEXT SERVICE DATE & PRINT DESIGNER CHECKBOX ===\n');

// 1. Load files
const mockDataCode = fs.readFileSync(path.join(__dirname, '../js/data/mock-data.js'), 'utf8');
const dbCode = fs.readFileSync(path.join(__dirname, '../js/data/db.js'), 'utf8');
const billingCode = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');
const docPrintCode = fs.readFileSync(path.join(__dirname, '../js/modules/doc-print-config.js'), 'utf8');

const sandbox = {
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  navigator: {},
  document: {
    getElementById: (id) => {
      if (sandbox._domElements && sandbox._domElements[id]) {
        return sandbox._domElements[id];
      }
      return {
        value: '',
        innerText: '',
        checked: false,
        style: {},
        setAttribute: () => {},
        getAttribute: () => '',
        classList: { add: () => {}, remove: () => {} }
      };
    },
    querySelectorAll: (sel) => sandbox._domQueryList || []
  },
  window: {
    location: { hash: '#/doc-print-config' }
  },
  localStorage: {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; }
  }
};
sandbox.window.localStorage = sandbox.localStorage;
sandbox.window.document = sandbox.document;

vm.createContext(sandbox);

// Run scripts
vm.runInContext(mockDataCode, sandbox);
vm.runInContext(dbCode, sandbox);
assert(sandbox.window.DB, 'window.DB must be defined');

sandbox.window.State = {
  currentPlantId: 'PLANT-01',
  toasts: [],
  modals: [],
  showToast(msg, type) {
    this.toasts.push({ msg, type });
  },
  showModal(opts) {
    this.modals.push(opts);
  },
  closeModal() {
    this.modals.pop();
  }
};

vm.runInContext(billingCode, sandbox);
vm.runInContext(docPrintCode, sandbox);

const Billing = sandbox.window.BillingModule;
const DocPrint = sandbox.window.DocPrintConfigModule;
const DB = sandbox.window.DB;

console.log('--- 1. Testing Gate Pass Modal Next Service Date Label & Mandatory Schema ---');
// Setup test delivery
const testDel = {
  id: 'DEL-TEST-001',
  customer_name: 'Parag Gulve',
  customer_mobile: '9887737737',
  vehicle_reg_no: 'MG20TH9827',
  vehicle_model: 'Honda Activa 6G',
  job_card_no: 'JC/MSC1/2026/0015',
  invoice_no: 'INV/MSC1/2026/0009',
  status: 'READY_FOR_HANDOVER',
  branch_id: 'PLANT-01'
};
DB.upsert('vehicleDeliveries', testDel);

Billing.showNewGatePassModal(null, null, testDel.id);
assert(sandbox.window.State.modals.length > 0, 'Gate Pass modal should open');
const gpModal = sandbox.window.State.modals[sandbox.window.State.modals.length - 1];

// Verify label is "Next Service Date" and mandatory
assert(gpModal.contentHtml.includes('Next Service Date'), 'Label must be Next Service Date');
assert(!gpModal.contentHtml.includes('Next Servicing Date'), 'Label Next Servicing Date should be replaced');
assert(gpModal.contentHtml.includes('Next Service Date <span style="color: var(--color-danger)">*</span>'), 'Next Service Date must have red asterisk');
assert(gpModal.contentHtml.includes('id="new-gp-next-service-date" class="form-control" value="') && gpModal.contentHtml.includes('required'), 'Input must have required attribute');
console.log('✓ Gate Pass modal renders "Next Service Date" with mandatory red asterisk and required attribute.');

console.log('\n--- 2. Testing saveGatePass mandatory validation ---');
sandbox._domElements = {
  'new-gp-del-id': { value: testDel.id },
  'new-gp-date': { value: '2026-10-21T12:28' },
  'new-gp-remarks': { value: 'Vehicle delivered' },
  'new-gp-next-service-date': { value: '' }, // Empty to test validation!
  'chk-qc': { checked: true },
  'chk-bill': { checked: true },
  'chk-parts': { checked: true },
  'chk-ack': { checked: true }
};

sandbox.window.State.toasts = [];
Billing.saveGatePass();
assert(sandbox.window.State.toasts.some(t => t.msg.includes('Next Service Date is mandatory')), 'Must show mandatory warning toast when Next Service Date is blank');
console.log('✓ Empty Next Service Date is rejected with mandatory warning.');

// Now provide valid date
sandbox._domElements['new-gp-next-service-date'].value = '2027-01-19';
Billing.saveGatePass();

const savedDel = DB.getById('vehicleDeliveries', testDel.id);
assert(savedDel.status === 'DELIVERED', 'Status must be DELIVERED');
assert(savedDel.next_service_due_date === '2027-01-19', 'next_service_due_date must be saved');
assert(savedDel.next_service_date === '2027-01-19', 'next_service_date must be saved');
console.log('✓ Valid Next Service Date saved successfully to vehicleDelivery record.');

console.log('\n--- 3. Testing Document Print Configuration "Show Next Service Date" Checkbox ---');
const allConfigs = DocPrint.getAllConfigs();
const gpConfig = allConfigs.find(c => c.document_type === 'GP' || c.code === 'DPC-GP-001');
assert(gpConfig, 'GP Document Print Configuration must exist');

DocPrint.activeConfigId = gpConfig.id;
DocPrint.activeDesignerTab = 'header';

const designerControlsHtml = DocPrint.renderDesignerTabContent(gpConfig);

assert(designerControlsHtml.includes('Show Next Service Date'), 'Designer controls must have "Show Next Service Date" checkbox');
assert(designerControlsHtml.includes("updateSetting('header_config', 'show_next_service_date'"), 'Checkbox must call updateSetting');
console.log('✓ Designer controls Header & Branding tab includes "Show Next Service Date" checkbox.');

console.log('\n--- 4. Testing Document Header Preview with "Show Next Service Date" ON & OFF ---');
// Test ON
gpConfig.header_config.show_next_service_date = true;
const sampleData = DocPrint.getPreviewData(gpConfig);
const htmlWithDate = DocPrint.renderDocumentHtml(gpConfig, sampleData);

assert(htmlWithDate.includes('Next Service Date:'), 'Rendered HTML must contain Next Service Date when checkbox is ON');
assert(htmlWithDate.includes('19-Jan-2027'), 'Rendered HTML must show the Next Service Date value (e.g. 19-Jan-2027)');

// Verify position: Next Service Date must be right beneath Date
const datePos = htmlWithDate.indexOf('<b>Date:</b>');
const nextServicePos = htmlWithDate.indexOf('<b>Next Service Date:</b>');
assert(datePos !== -1 && nextServicePos !== -1, 'Both Date and Next Service Date must be present');
assert(nextServicePos > datePos, 'Next Service Date must be placed directly beneath Date');
console.log('✓ When checkbox is ON, Next Service Date is displayed beneath Date in document header.');

// Test OFF
gpConfig.header_config.show_next_service_date = false;
const htmlWithoutDate = DocPrint.renderDocumentHtml(gpConfig, sampleData);
assert(!htmlWithoutDate.includes('<b>Next Service Date:</b>'), 'Rendered HTML must NOT contain Next Service Date when checkbox is OFF');
console.log('✓ When checkbox is OFF, Next Service Date is hidden from document header.');

console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===');
